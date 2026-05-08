#!/usr/bin/env node
const AdmZip = require('adm-zip');
const sax = require('sax');

const zip = new AdmZip('/tmp/nmpa_full.zip');
const entry = zip.getEntry('UDID_FULL_DOWNLOAD_PART26_Of_1136_2026-05-01.xml');
const xmlData = entry.getData().toString('utf-8');

let inDevice = false, currentTag = '', textBuffer = '';
let currentDevice = {};
let devIdx = 0;

const parser = sax.parser(false, { lowercase: false, trim: false });

parser.onopentag = (node) => {
  if (node.name === 'device') {
    inDevice = true;
    currentDevice = {};
    devIdx++;
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
    if (devIdx <= 3) {
      console.log(`Device #${devIdx} keys:`, Object.keys(currentDevice));
      console.log(`  cpmctymc="${currentDevice.cpmctymc}"`);
      console.log(`  ylqxzcrbarmc="${currentDevice.ylqxzcrbarmc}"`);
      console.log(`  zczbhhzbapzbh="${currentDevice.zczbhhzbapzbh}"`);
    }
    return;
  }
  if (inDevice && tagName === currentTag) {
    currentDevice[currentTag] = textBuffer.trim();
    if (devIdx <= 3) console.log(`  FIELD ${currentTag} = "${textBuffer.trim().substring(0, 80)}"`);
    currentTag = '';
    textBuffer = '';
  }
};

parser.onend = () => {
  console.log(`\nTotal devices: ${devIdx}`);
};

parser.write(xmlData).close();
