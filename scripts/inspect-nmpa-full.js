#!/usr/bin/env node
const AdmZip = require('adm-zip');
const fs = require('fs');

const filePath = '/tmp/nmpa_full_check.zip';

if (!fs.existsSync(filePath)) {
  console.log('File not found, downloading...');
  // Will download via curl separately
}

const zip = new AdmZip(filePath);
const entries = zip.getEntries();
console.log('Total entries:', entries.length);

if (entries.length === 0) {
  console.log('NO ENTRIES FOUND! Checking raw buffer...');
  const buf = fs.readFileSync(filePath);
  console.log('File size:', buf.length);
  console.log('First 20 bytes hex:', buf.slice(0, 20).toString('hex'));
  console.log('First 100 bytes string:', buf.slice(0, 100).toString('utf-8'));
  process.exit(0);
}

console.log('\nFirst 50 entries:');
entries.slice(0, 50).forEach(e => {
  const marker = e.isDirectory ? '[DIR]' : `[${e.header.size} bytes]`;
  console.log(`  ${marker} ${e.entryName}`);
});

console.log('\n--- Summary ---');
const types = {};
let dirCount = 0;
entries.forEach(e => {
  if (e.isDirectory) { dirCount++; return; }
  const parts = e.entryName.split('.');
  const ext = parts.length > 1 ? parts.pop().toLowerCase() : '(noext)';
  types[ext] = (types[ext] || 0) + 1;
});
console.log('Directories:', dirCount);
console.log('File types:', JSON.stringify(types, null, 2));

// Check if there are any ZIP entries inside
const zipEntries = entries.filter(e => e.entryName.toLowerCase().endsWith('.zip'));
console.log('\nZIP entries inside:', zipEntries.length);
if (zipEntries.length > 0) {
  console.log('First 5 ZIP entries:');
  zipEntries.slice(0, 5).forEach(e => console.log(' ', e.entryName));
}

// Check for XML entries
const xmlEntries = entries.filter(e => e.entryName.toLowerCase().endsWith('.xml'));
console.log('\nXML entries inside:', xmlEntries.length);
if (xmlEntries.length > 0) {
  console.log('First 5 XML entries:');
  xmlEntries.slice(0, 5).forEach(e => console.log(' ', e.entryName));
}
