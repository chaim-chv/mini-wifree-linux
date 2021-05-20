const axios = require('axios').default
const withDNS = require('axios-with-dns')
const dns = require('node_dns_changer')

withDNS(axios)

let internetStatus = false

const disableInternet = async () => {
  await dns.setDNSservers({
    DNSservers: ['127.0.0.1', '127.0.0.2']
  })
  internetStatus = false
  console.log('Internet disabled.')
}

const enableInternet = async () => {
  await dns.setDNSservers({
    DNSservers: ['8.8.8.8', '8.8.4.4']
  })
  internetStatus = true
  console.log('Internet enabled.')
}

const detectNetfree = async () => {
  const res = await axios.get('http://api.internal.netfree.link/user/0', { dnsServer: '8.8.8.8' }).catch(async err => {
    if (err.message == 'Timeout in making request') {
      detectNetfree()
    } else if (err.response?.status == 404) {
      if (internetStatus) {
        console.log('Disconnected from NetFree.')
        await disableInternet()
      }
    } else {
      console.log('Error:', err.message)
    }
  })
  if (res?.status == 200) {
    if (!internetStatus) {
      console.log('Connected to NetFree.')
      await enableInternet()
    }
  }
}

detectNetfree()

setInterval(detectNetfree, 1000)