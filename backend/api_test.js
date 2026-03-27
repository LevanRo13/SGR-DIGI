const http = require('http');
const payload = JSON.stringify({ guaranteeId: 2, amount: 100, pricePerToken: 10 });
const req = http.request({
  host: '127.0.0.1',
  port: 3000,
  path: '/marketplace/offer',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': payload.length
  }
}, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => console.log('HTTP RESPONSE:', data));
});
req.on('error', e => console.error('ERROR:', e.message));
req.write(payload);
req.end();
