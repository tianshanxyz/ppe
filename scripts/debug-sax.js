#!/usr/bin/env node
const AdmZip = require('adm-zip');
const sax = require('sax');

const zip = new AdmZip('/tmp/nmpa_full.zip');
const entry = zip.getEntry('UDID_FULL_DOWNLOAD_PART26_Of_1136_2026-05-01.xml');
const xmlData = entry.getData().toString('utf-8');

let inDevice = false, currentTag = '', textBuffer = '';
let currentDevice = {};
let deviceCount = 0;
const sampleDevices = [];

const parser = sax.parser(false, { lowercase: false, trim: false });

parser.onopentag = (node) => {
  if (node.name === 'device') {
    inDevice = true;
    currentDevice = {};
    deviceCount++;
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
    if (deviceCount <= 5) sampleDevices.push({ ...currentDevice });
    // Check for PPE in all devices
    const name = currentDevice.cpmctymc || currentDevice.spmc || '';
    const re = /口罩|防护|手套|护目|隔离|手术|面罩|呼吸|鞋|帽|耳塞|耳罩|面具|衣|镜|靴|面屏|围裙/i;
    if (re.test(name)) {
      console.log(`PPE FOUND [#${deviceCount}]: "${name}" | mfr: ${currentDevice.ylqxzcrbarmc} | reg: ${currentDevice.zczbhhzbapzbh}`);
    }
    return;
  }
  if (inDevice && tagName === currentTag) {
    currentDevice[tagName] = textBuffer.trim();
    currentTag = '';
    textBuffer = '';
  }
};

parser.onend = () => {
  console.log('\nTotal devices:', deviceCount);
  console.log('\nFirst 5 devices:');
  sampleDevices.forEach((d, i) => {
    console.log(`  [${i}] cpmctymc: "${d.cpmctymc}"`);
    console.log(`      spmc: "${d.spmc}"`);
    console.log(`      ylqxzcrbarmc: "${d.ylqxzcrbarmc}"`);
    console.log(`      zczbhhzbapzbh: "${d.zczbhhzbapzbh}"`);
    console.log('---');
  });
};

parser.write(xmlData).close();
