#!/usr/bin/env node

const https = require('https');
const querystring = require('querystring');

const tokenUrl = 'https://api.medplum.com/oauth2/token';
const data = querystring.stringify({
  grant_type: 'client_credentials',
  client_id: '8e009a1e-d51f-44d2-b5a0-a852712255c3',
  client_secret: '205a1c68105113ad0ddaf921181d6a220fba3a80c6cc1ede06ca64f38d88f268'
});

function fetchJson(url, token) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { headers: { 'Authorization': 'Bearer ' + token } }, (res) => {
      let r = '';
      res.on('data', c => r += c);
      res.on('end', () => {
        if (res.statusCode !== 200) {
          reject(new Error(`HTTP ${res.statusCode}`));
        } else {
          try { resolve(JSON.parse(r)); } catch(e) { reject(e); }
        }
      });
    });
    req.on('error', reject);
  });
}

const req1 = https.request(tokenUrl, {
  method: 'POST',
  headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Content-Length': data.length }
}, (res1) => {
  let result1 = '';
  res1.on('data', c => result1 += c);
  res1.on('end', async () => {
    const token = JSON.parse(result1).access_token;
    console.log('Token OK\n');
    
    const resources = [
      { type: 'Device', params: '?_count=10' },
      { type: 'Organization', params: '?_count=10' },
      { type: 'Practitioner', params: '?_count=10' },
      { type: 'Location', params: '?_count=10' },
      { type: 'Patient', params: '?_count=10' },
      { type: 'Medication', params: '?_count=10' },
      { type: 'SupplyDelivery', params: '?_count=10' },
      { type: 'SupplyRequest', params: '?_count=10' },
    ];
    
    for (const r of resources) {
      const url = `https://api.medplum.com/fhir/R4/${r.type}${r.params}`;
      try {
        const result = await fetchJson(url, token);
        const total = result.total || (result.entry ? result.entry.length : 0);
        console.log(`✅ ${r.type}: ${total} records`);
      } catch (e) {
        console.log(`❌ ${r.type}: ${e.message}`);
      }
    }
  });
});

req1.on('error', e => console.log('Error:', e.message));
req1.write(data);
req1.end();
