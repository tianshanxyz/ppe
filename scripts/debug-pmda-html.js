#!/usr/bin/env node
const axios = require('axios');
const fs = require('fs');

async function main() {
  const pmda = axios.create({
    baseURL: 'https://www.pmda.go.jp',
    timeout: 30000,
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  });

  const formData = new URLSearchParams();
  formData.append('targetBothWithItemRadioValue', '1');
  formData.append('nameWord', 'マスク');
  formData.append('kikiXmlHowtoNameSearchRadioValue', '1_0');
  formData.append('howtoMatchRadioValue', '1');
  formData.append('ListRows', '100');
  formData.append('tglOpFlg', '');
  formData.append('btnA.x', '1');
  formData.append('btnA.y', '1');

  const resp = await pmda.post('/PmdaSearch/kikiSearch', formData.toString());
  const html = resp.data;

  fs.writeFileSync('/tmp/pmda-response.html', html);
  console.log('HTML saved to /tmp/pmda-response.html');
  console.log('Length:', html.length);

  const resultSection = html.match(/検索結果[\s\S]{0,5000}/);
  if (resultSection) {
    console.log('\n=== 検索結果 section ===');
    console.log(resultSection[0].substring(0, 3000));
  }

  const listSection = html.match(/class="[^"]*result[^"]*"[\s\S]{0,3000}/i);
  if (listSection) {
    console.log('\n=== result class section ===');
    console.log(listSection[0].substring(0, 2000));
  }

  const dlSections = html.match(/<dl[\s\S]{0,500}<\/dl>/g);
  if (dlSections && dlSections.length > 0) {
    console.log(`\n=== DL sections (${dlSections.length}) ===`);
    dlSections.slice(0, 5).forEach((dl, i) => {
      console.log(`\nDL ${i}: ${dl.substring(0, 500)}`);
    });
  }

  const divSections = html.match(/<div[^>]*class="[^"]*(?:list|item|detail|info|search)[^"]*"[^>]*>[\s\S]{0,300}<\/div>/gi);
  if (divSections && divSections.length > 0) {
    console.log(`\n=== Relevant div sections (${divSections.length}) ===`);
    divSections.slice(0, 10).forEach((div, i) => {
      console.log(`\nDiv ${i}: ${div.substring(0, 300)}`);
    });
  }

  const anchorLinks = html.match(/<a[^>]*href="[^"]*kikiDetail[^"]*"[^>]*>[\s\S]{0,200}<\/a>/gi);
  if (anchorLinks && anchorLinks.length > 0) {
    console.log(`\n=== Detail links (${anchorLinks.length}) ===`);
    anchorLinks.slice(0, 10).forEach((link, i) => {
      console.log(`Link ${i}: ${link.substring(0, 200)}`);
    });
  }
}

main().catch(console.error);
