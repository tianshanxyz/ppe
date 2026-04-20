const https = require('https');

const apiKey = 'GWvNICRXtNxXFoEL6dnbGRXJlmOHZdurEmAuSZtQ';
const url = `https://api.fda.gov/device/510k.json?api_key=${apiKey}&limit=2`;

console.log('Testing FDA API...');
console.log('URL:', url);

const req = https.get(url, { timeout: 30000 }, (res) => {
  console.log('Status:', res.statusCode);
  
  let data = '';
  res.on('data', chunk => {
    data += chunk;
    process.stdout.write('.');
  });
  res.on('end', () => {
    console.log('\nData received, length:', data.length);
    try {
      const parsed = JSON.parse(data);
      console.log('Total results:', parsed.meta?.results?.total);
      console.log('First record device_name:', parsed.results?.[0]?.device_name);
    } catch(e) {
      console.log('Parse error:', e.message);
    }
  });
});

req.on('error', (e) => {
  console.error('Request error:', e.message);
});

req.on('timeout', () => {
  console.error('Timeout');
  req.destroy();
});

setTimeout(() => {
  console.log('\nScript timeout after 30s');
  process.exit(1);
}, 30000);
