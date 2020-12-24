const http = require('http')
const dns = require('node_dns_changer');

const options = {
    hostname: 'api.internal.netfree.link',
    port: 80,
    path: '/user/0',
    method: 'GET'
}

var internetStatus = true;

function detectNetFree() {
    const req = http.request(options, res => {
        if (res.statusCode == 200) {
            detectHandler(true);
        } else {
            detectHandler(false);
        }
    })
    req.on('error', error => {
        detectHandler(false);
    })
    req.end()
}

function detectHandler(result) {
    if (result && !internetStatus) {
        enableInternet()
    } else if (!result) {
        disableInternet()
    }
} 

function disableInternet() {
    dns.setDNSservers({
        DNSservers: ['127.0.0.1','127.0.0.2']
    })
    internetStatus = false
}

function enableInternet() {
    dns.setDNSservers({
        DNSservers: ['1.1.1.1','1.1.2.2']
    })
    internetStatus = true;
}

enableInternet()

setInterval(() => {
    detectNetFree()
}, 1000);