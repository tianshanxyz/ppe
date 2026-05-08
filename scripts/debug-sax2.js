#!/usr/bin/env node
const AdmZip = require('adm-zip');
const sax = require('sax');

const zip = new AdmZip('/tmp/nmpa_full.zip');
const entry = zip.getEntry('UDID_FULL_DOWNLOAD_PART26_Of_1136_2026-05-01.xml');
const xmlData = entry.getData().toString('utf-8');

console.log('XML length:', xmlData.length);
console.log('First 500 chars:');
console.log(xmlData.substring(0, 500));
console.log('---');

const tagCounts = {};
const parser = sax.parser(true, { lowercase: false, trim: false }); // strict mode

parser.onopentag = (node) => {
  const name = node.name;
  tagCounts[name] = (tagCounts[name] || 0) + 1;
  if (tagCounts[name] <= 2) {
    console.log(`OPEN <${name}> attrs:`, JSON.stringify(node.attributes));
  }
};

parser.onend = () => {
  console.log('\nTag counts:');
  Object.entries(tagCounts).sort((a,b) => b[1]-a[1]).slice(0, 20).forEach(([k,v]) => console.log(`  <${k}>: ${v}`));
};

parser.write(xmlData).close();
