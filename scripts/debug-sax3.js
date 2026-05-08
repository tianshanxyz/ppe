#!/usr/bin/env node
const AdmZip = require('adm-zip');
const sax = require('sax');

const zip = new AdmZip('/tmp/nmpa_full.zip');
const entry = zip.getEntry('UDID_FULL_DOWNLOAD_PART26_Of_1136_2026-05-01.xml');
const xmlData = entry.getData().toString('utf-8');

let inDevice = false, currentTag = '', textBuffer = '';
let currentDevice = {};
let names = [];
let ppeCount = 0;

const parser = sax.parser(false, { lowercase: false, trim: false });

parser.onopentag = (node) => {
  if (node.name === 'device') {
    inDevice = true;
    currentDevice = {};
    return;
  }
  if (inDevice) {
    currentTag = node.name;
    textBuffer = '';
  }
};

parser.ontext = (text) => {
  if (inDevice && currentTag) textBuffer += text;
};

parser.onclosetag = (tagName) => {
  if (tagName === 'device') {
    inDevice = false;
    const name = currentDevice.cpmctymc || currentDevice.spmc || '';
    const re = /口罩|防护|手套|护目|隔离|手术|面罩|呼吸|鞋|帽|耳塞|耳罩|面具|衣|镜|靴|面屏|围裙/i;
    if (re.test(name)) {
      ppeCount++;
      if (ppeCount <= 5) console.log(`PPE: "${name}" | ${currentDevice.ylqxzcrbarmc}`);
    }
    if (names.length < 20) names.push(name);
    return;
  }
  if (inDevice && tagName === currentTag) {
    currentDevice[tagName] = textBuffer.trim();
    currentTag = '';
    textBuffer = '';
  }
};

parser.onend = () => {
  console.log('First 20 device names:');
  names.forEach((n, i) => console.log(`  ${i}: "${n}"`));
  console.log(`\nPPE count in this file: ${ppeCount}`);
};

parser.write(xmlData).close();
