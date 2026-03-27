const http = require('http');

const data = JSON.stringify({
  guaranteeId: 2,
  amount: 100,
  pricePerToken: 10
});

const req = http.request({
  hostname: 'localhost',
  port: 3000,
  path: '/marketplace/offer',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
}, res => {
  let resData = '';
  res.on('data', chunk => resData += chunk);
  res.on('end', () => console.log('RESPONSE:', resData));
});

req.on('error', console.error);
req.write(data);
req.end();
