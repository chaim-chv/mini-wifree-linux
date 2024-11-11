const axios = require('axios').default;
const withDNS = require('axios-with-dns');
const dns = require('node_dns_changer');

withDNS(axios);

// local DNS server package
const dns2 = require('dns2');
const { Packet } = dns2;

// for netfree adresess we will resolve DNS with google
const googleDNS = new dns2({ nameServers: ['8.8.4.4', '8.8.8.8', '1.1.1.1'], port: 53, recursive: true });

const allowedNamesRegexes = [
  /netfree.link$/,
];

const log = (message) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${message}`);
};

// local DNS server
const server = dns2.createServer({
  udp: true,
  tcp: true,
  recursive: true,
  handle: async (request, send) => {
    const response = Packet.createResponseFromRequest(request);
    const [ question ] = request.questions;
    const { name } = question;
    if (allowedNamesRegexes.some(regex => regex.test(name))) {
      const DNSresult = await googleDNS.resolveA(name);
      response.answers = DNSresult.answers;
    } else {
      response.answers = [];
    }
    send(response);
  }
});

let internetStatus = true;

const disableInternet = async () => {
  await dns.setDNSservers({
    DNSservers: ['127.0.0.1']
  });
  internetStatus = false;
  log('Internet disabled (except netfree URLs).');
};

const enableInternet = async () => {
  await dns.setDNSservers({
    DNSservers: ['8.8.8.8', '8.8.4.4', '1.1.1.1']
  });
  internetStatus = true;
  log('Internet enabled.');
};

const detectNetfree = async () => {
  const res = await axios.get('http://api.internal.netfree.link/user/0', { dnsServer: '8.8.8.8' }).catch(async err => {
    if (internetStatus) {
      log('Error:', err.message);
      log('Maybe you are not connected to NetFree. disabling internet.');
      return disableInternet();
    }
    return null;
  });
  if (res?.status === 200 && !internetStatus) {
    log('Connected to NetFree.');
    return enableInternet();
  }
  if ((res?.status !== 200 || !res?.status) && internetStatus) {
    log('Disconnected from NetFree.');
    return disableInternet();
  }
};

const init = () => {
  try {
    server.listen({ udp: 53, tcp: 53 });
  } catch (err) {
    console.error('Failed to start local DNS server:', err.message);
    process.exit(1);
  }
  
  detectNetfree();
};
init();

const checkNetfreeInterval = setInterval(detectNetfree, 1000);

server.on('listening', () => { log('local DNS server lauched 🚀') });

server.on('close', () => { log('local DNS server DOWN') });

process.on('SIGINT', async () => {
  clearInterval(checkNetfreeInterval);
  await server.close();
  process.exit(0);
});
