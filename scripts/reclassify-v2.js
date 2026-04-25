#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://xtqhjyiyjhxfdzyypfqq.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh0cWhqeWl5amh4ZmR6eXlwZnFxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjUwNTU1OSwiZXhwIjoyMDkyMDgxNTU5fQ.6uW47M6vaxbWomXiUiplhHbzST0vxs0CAIWoL5FdchU'
);

const PPE_PRODUCT_CODES = {
  'MSH': { category: '呼吸防护装备', sub: 'Surgical Mask', risk: 'high' },
  'FXX': { category: '呼吸防护装备', sub: 'Surgical Mask', risk: 'high' },
  'FXS': { category: '呼吸防护装备', sub: 'Surgical Mask', risk: 'high' },
  'MSL': { category: '呼吸防护装备', sub: 'Surgical Mask', risk: 'high' },
  'LYU': { category: '呼吸防护装备', sub: 'N95 Respirator', risk: 'high' },
  'OEA': { category: '呼吸防护装备', sub: 'N95 Respirator', risk: 'high' },
  'KZE': { category: '呼吸防护装备', sub: 'Air-Purifying Respirator', risk: 'high' },
  'QKR': { category: '呼吸防护装备', sub: 'Powered Air-Purifying Respirator', risk: 'high' },
  'NHF': { category: '呼吸防护装备', sub: 'Filtering Facepiece', risk: 'high' },
  'NHL': { category: '呼吸防护装备', sub: 'Filtering Facepiece', risk: 'high' },
  'NHM': { category: '呼吸防护装备', sub: 'Filtering Facepiece', risk: 'high' },
  'NXF': { category: '呼吸防护装备', sub: 'Filtering Facepiece', risk: 'high' },
  'KCC': { category: '呼吸防护装备', sub: 'Respirator', risk: 'high' },
  'JKA': { category: '呼吸防护装备', sub: 'Respirator', risk: 'high' },
  'LIT': { category: '呼吸防护装备', sub: 'Respirator', risk: 'high' },
  'MFA': { category: '呼吸防护装备', sub: 'Respirator', risk: 'high' },
  'KIF': { category: '呼吸防护装备', sub: 'Respirator', risk: 'high' },
  'MSM': { category: '呼吸防护装备', sub: 'Respirator', risk: 'high' },
  'LZG': { category: '呼吸防护装备', sub: 'Respirator', risk: 'high' },
  'LZJ': { category: '呼吸防护装备', sub: 'Respirator', risk: 'high' },
  'LXG': { category: '呼吸防护装备', sub: 'Respirator', risk: 'high' },
  'LZS': { category: '呼吸防护装备', sub: 'Respirator', risk: 'high' },
  'LZU': { category: '呼吸防护装备', sub: 'Respirator', risk: 'high' },
  'LZV': { category: '呼吸防护装备', sub: 'Respirator', risk: 'high' },
  'KZE': { category: '呼吸防护装备', sub: 'Respirator', risk: 'high' },
  'LZG': { category: '呼吸防护装备', sub: 'Respirator', risk: 'high' },
  'QKR': { category: '呼吸防护装备', sub: 'PAPR', risk: 'high' },
  'OEM': { category: '手部防护装备', sub: 'Examination Glove', risk: 'low' },
  'OEN': { category: '手部防护装备', sub: 'Examination Glove', risk: 'low' },
  'KZT': { category: '手部防护装备', sub: 'Surgical Glove', risk: 'low' },
  'KZU': { category: '手部防护装备', sub: 'Surgical Glove', risk: 'low' },
  'KZV': { category: '手部防护装备', sub: 'Patient Examination Glove', risk: 'low' },
  'KZW': { category: '手部防护装备', sub: 'Patient Examination Glove', risk: 'low' },
  'LZC': { category: '手部防护装备', sub: 'Chemotherapy Glove', risk: 'low' },
  'LZD': { category: '手部防护装备', sub: 'Glove', risk: 'low' },
  'LZE': { category: '手部防护装备', sub: 'Glove', risk: 'low' },
  'LZF': { category: '手部防护装备', sub: 'Glove', risk: 'low' },
  'LZH': { category: '手部防护装备', sub: 'Glove', risk: 'low' },
  'LZI': { category: '手部防护装备', sub: 'Glove', risk: 'low' },
  'LZK': { category: '手部防护装备', sub: 'Glove', risk: 'low' },
  'LZL': { category: '手部防护装备', sub: 'Glove', risk: 'low' },
  'LZM': { category: '手部防护装备', sub: 'Glove', risk: 'low' },
  'LZN': { category: '手部防护装备', sub: 'Glove', risk: 'low' },
  'LZO': { category: '手部防护装备', sub: 'Glove', risk: 'low' },
  'LZP': { category: '手部防护装备', sub: 'Glove', risk: 'low' },
  'LZQ': { category: '手部防护装备', sub: 'Glove', risk: 'low' },
  'LZR': { category: '手部防护装备', sub: 'Glove', risk: 'low' },
  'FYA': { category: '身体防护装备', sub: 'Surgical Gown', risk: 'medium' },
  'FYB': { category: '身体防护装备', sub: 'Isolation Gown', risk: 'medium' },
  'FYC': { category: '身体防护装备', sub: 'Protective Garment', risk: 'medium' },
  'FYD': { category: '身体防护装备', sub: 'Protective Garment', risk: 'medium' },
  'FYE': { category: '身体防护装备', sub: 'Surgical Gown', risk: 'medium' },
  'FYF': { category: '身体防护装备', sub: 'Surgical Gown', risk: 'medium' },
  'FYG': { category: '身体防护装备', sub: 'Protective Garment', risk: 'medium' },
  'FYH': { category: '身体防护装备', sub: 'Protective Garment', risk: 'medium' },
  'FYI': { category: '身体防护装备', sub: 'Protective Garment', risk: 'medium' },
  'FYJ': { category: '身体防护装备', sub: 'Protective Garment', risk: 'medium' },
  'FYK': { category: '身体防护装备', sub: 'Protective Garment', risk: 'medium' },
  'FYL': { category: '身体防护装备', sub: 'Protective Garment', risk: 'medium' },
  'FYM': { category: '身体防护装备', sub: 'Protective Garment', risk: 'medium' },
  'FYN': { category: '身体防护装备', sub: 'Protective Garment', risk: 'medium' },
  'FZA': { category: '身体防护装备', sub: 'Surgical Gown', risk: 'medium' },
  'FZB': { category: '身体防护装备', sub: 'Surgical Gown', risk: 'medium' },
  'FZC': { category: '身体防护装备', sub: 'Surgical Gown', risk: 'medium' },
  'FZD': { category: '身体防护装备', sub: 'Surgical Gown', risk: 'medium' },
  'OEO': { category: '身体防护装备', sub: 'Protective Garment', risk: 'medium' },
  'OEP': { category: '身体防护装备', sub: 'Protective Garment', risk: 'medium' },
  'OEQ': { category: '身体防护装备', sub: 'Protective Garment', risk: 'medium' },
  'OER': { category: '身体防护装备', sub: 'Protective Garment', risk: 'medium' },
  'OES': { category: '身体防护装备', sub: 'Protective Garment', risk: 'medium' },
  'OET': { category: '身体防护装备', sub: 'Protective Garment', risk: 'medium' },
  'OEY': { category: '身体防护装备', sub: 'Protective Garment', risk: 'medium' },
  'OEZ': { category: '身体防护装备', sub: 'Protective Garment', risk: 'medium' },
  'OFA': { category: '身体防护装备', sub: 'Protective Garment', risk: 'medium' },
  'OFB': { category: '身体防护装备', sub: 'Protective Garment', risk: 'medium' },
  'OFC': { category: '身体防护装备', sub: 'Protective Garment', risk: 'medium' },
  'OFD': { category: '身体防护装备', sub: 'Protective Garment', risk: 'medium' },
  'OFE': { category: '身体防护装备', sub: 'Protective Garment', risk: 'medium' },
  'OFF': { category: '身体防护装备', sub: 'Protective Garment', risk: 'medium' },
  'OFG': { category: '身体防护装备', sub: 'Protective Garment', risk: 'medium' },
  'OFH': { category: '身体防护装备', sub: 'Protective Garment', risk: 'medium' },
  'OFI': { category: '身体防护装备', sub: 'Protective Garment', risk: 'medium' },
  'OFJ': { category: '身体防护装备', sub: 'Protective Garment', risk: 'medium' },
  'OFK': { category: '身体防护装备', sub: 'Protective Garment', risk: 'medium' },
  'OFL': { category: '身体防护装备', sub: 'Protective Garment', risk: 'medium' },
  'OFM': { category: '身体防护装备', sub: 'Protective Garment', risk: 'medium' },
  'OFN': { category: '身体防护装备', sub: 'Protective Garment', risk: 'medium' },
  'OFO': { category: '身体防护装备', sub: 'Protective Garment', risk: 'medium' },
  'OFP': { category: '身体防护装备', sub: 'Protective Garment', risk: 'medium' },
  'OFQ': { category: '身体防护装备', sub: 'Protective Garment', risk: 'medium' },
  'OFR': { category: '身体防护装备', sub: 'Protective Garment', risk: 'medium' },
  'OFS': { category: '身体防护装备', sub: 'Protective Garment', risk: 'medium' },
  'OFT': { category: '身体防护装备', sub: 'Protective Garment', risk: 'medium' },
  'OFU': { category: '身体防护装备', sub: 'Protective Garment', risk: 'medium' },
  'OFV': { category: '身体防护装备', sub: 'Protective Garment', risk: 'medium' },
  'OFW': { category: '身体防护装备', sub: 'Protective Garment', risk: 'medium' },
  'OFX': { category: '身体防护装备', sub: 'Protective Garment', risk: 'medium' },
  'OFY': { category: '身体防护装备', sub: 'Protective Garment', risk: 'medium' },
  'OFZ': { category: '身体防护装备', sub: 'Protective Garment', risk: 'medium' },
  'OGA': { category: '身体防护装备', sub: 'Protective Garment', risk: 'medium' },
  'OGB': { category: '身体防护装备', sub: 'Protective Garment', risk: 'medium' },
  'OGC': { category: '身体防护装备', sub: 'Protective Garment', risk: 'medium' },
  'OGD': { category: '身体防护装备', sub: 'Protective Garment', risk: 'medium' },
  'OGE': { category: '身体防护装备', sub: 'Protective Garment', risk: 'medium' },
  'OGF': { category: '身体防护装备', sub: 'Protective Garment', risk: 'medium' },
  'OGG': { category: '身体防护装备', sub: 'Protective Garment', risk: 'medium' },
  'OGH': { category: '身体防护装备', sub: 'Protective Garment', risk: 'medium' },
  'OGI': { category: '身体防护装备', sub: 'Protective Garment', risk: 'medium' },
  'OGJ': { category: '身体防护装备', sub: 'Protective Garment', risk: 'medium' },
  'OGK': { category: '身体防护装备', sub: 'Protective Garment', risk: 'medium' },
  'OGL': { category: '身体防护装备', sub: 'Protective Garment', risk: 'medium' },
  'OGM': { category: '身体防护装备', sub: 'Protective Garment', risk: 'medium' },
  'OGN': { category: '身体防护装备', sub: 'Protective Garment', risk: 'medium' },
  'OGO': { category: '身体防护装备', sub: 'Protective Garment', risk: 'medium' },
  'OGP': { category: '身体防护装备', sub: 'Protective Garment', risk: 'medium' },
  'OGQ': { category: '身体防护装备', sub: 'Protective Garment', risk: 'medium' },
  'OGR': { category: '身体防护装备', sub: 'Protective Garment', risk: 'medium' },
  'OGS': { category: '身体防护装备', sub: 'Protective Garment', risk: 'medium' },
  'OGT': { category: '身体防护装备', sub: 'Protective Garment', risk: 'medium' },
  'OGU': { category: '身体防护装备', sub: 'Protective Garment', risk: 'medium' },
  'OGV': { category: '身体防护装备', sub: 'Protective Garment', risk: 'medium' },
  'OGW': { category: '身体防护装备', sub: 'Protective Garment', risk: 'medium' },
  'OGX': { category: '身体防护装备', sub: 'Protective Garment', risk: 'medium' },
  'OGY': { category: '身体防护装备', sub: 'Protective Garment', risk: 'medium' },
  'OGZ': { category: '身体防护装备', sub: 'Protective Garment', risk: 'medium' },
  'OHA': { category: '身体防护装备', sub: 'Protective Garment', risk: 'medium' },
  'OHB': { category: '身体防护装备', sub: 'Protective Garment', risk: 'medium' },
  'OHC': { category: '身体防护装备', sub: 'Protective Garment', risk: 'medium' },
  'OHD': { category: '身体防护装备', sub: 'Protective Garment', risk: 'medium' },
  'OHE': { category: '身体防护装备', sub: 'Protective Garment', risk: 'medium' },
  'OHF': { category: '身体防护装备', sub: 'Protective Garment', risk: 'medium' },
  'OHG': { category: '身体防护装备', sub: 'Protective Garment', risk: 'medium' },
  'OHH': { category: '身体防护装备', sub: 'Protective Garment', risk: 'medium' },
  'OHI': { category: '身体防护装备', sub: 'Protective Garment', risk: 'medium' },
  'OHJ': { category: '身体防护装备', sub: 'Protective Garment', risk: 'medium' },
  'OHK': { category: '身体防护装备', sub: 'Protective Garment', risk: 'medium' },
  'OHL': { category: '身体防护装备', sub: 'Protective Garment', risk: 'medium' },
  'OHM': { category: '身体防护装备', sub: 'Protective Garment', risk: 'medium' },
  'OHN': { category: '身体防护装备', sub: 'Protective Garment', risk: 'medium' },
  'OHO': { category: '身体防护装备', sub: 'Protective Garment', risk: 'medium' },
  'OHP': { category: '身体防护装备', sub: 'Protective Garment', risk: 'medium' },
  'OHQ': { category: '身体防护装备', sub: 'Protective Garment', risk: 'medium' },
  'OHR': { category: '身体防护装备', sub: 'Protective Garment', risk: 'medium' },
  'OHS': { category: '身体防护装备', sub: 'Protective Garment', risk: 'medium' },
  'OHT': { category: '身体防护装备', sub: 'Protective Garment', risk: 'medium' },
  'OHU': { category: '身体防护装备', sub: 'Protective Garment', risk: 'medium' },
  'OHV': { category: '身体防护装备', sub: 'Protective Garment', risk: 'medium' },
  'OHW': { category: '身体防护装备', sub: 'Protective Garment', risk: 'medium' },
  'OHX': { category: '身体防护装备', sub: 'Protective Garment', risk: 'medium' },
  'OHY': { category: '身体防护装备', sub: 'Protective Garment', risk: 'medium' },
  'OHZ': { category: '身体防护装备', sub: 'Protective Garment', risk: 'medium' },
  'FXX': { category: '呼吸防护装备', sub: 'Surgical Mask', risk: 'high' },
  'FXS': { category: '呼吸防护装备', sub: 'Surgical Mask', risk: 'high' },
  'LZA': { category: '眼面部防护装备', sub: 'Protective Goggles', risk: 'low' },
  'LZB': { category: '眼面部防护装备', sub: 'Face Shield', risk: 'low' },
  'LXC': { category: '眼面部防护装备', sub: 'Protective Goggles', risk: 'low' },
  'LXD': { category: '眼面部防护装备', sub: 'Protective Goggles', risk: 'low' },
  'LXE': { category: '眼面部防护装备', sub: 'Face Shield', risk: 'low' },
  'LXF': { category: '眼面部防护装备', sub: 'Face Shield', risk: 'low' },
  'LXH': { category: '眼面部防护装备', sub: 'Face Shield', risk: 'low' },
  'LXI': { category: '眼面部防护装备', sub: 'Face Shield', risk: 'low' },
  'LXJ': { category: '眼面部防护装备', sub: 'Face Shield', risk: 'low' },
  'LXK': { category: '眼面部防护装备', sub: 'Face Shield', risk: 'low' },
  'LXL': { category: '眼面部防护装备', sub: 'Face Shield', risk: 'low' },
  'LXM': { category: '眼面部防护装备', sub: 'Face Shield', risk: 'low' },
  'LXN': { category: '眼面部防护装备', sub: 'Face Shield', risk: 'low' },
  'LXO': { category: '眼面部防护装备', sub: 'Face Shield', risk: 'low' },
  'LXP': { category: '眼面部防护装备', sub: 'Face Shield', risk: 'low' },
  'LXQ': { category: '眼面部防护装备', sub: 'Face Shield', risk: 'low' },
  'LXR': { category: '眼面部防护装备', sub: 'Face Shield', risk: 'low' },
  'LXS': { category: '眼面部防护装备', sub: 'Face Shield', risk: 'low' },
  'LXT': { category: '眼面部防护装备', sub: 'Face Shield', risk: 'low' },
  'LXU': { category: '眼面部防护装备', sub: 'Face Shield', risk: 'low' },
  'LXV': { category: '眼面部防护装备', sub: 'Face Shield', risk: 'low' },
  'LXW': { category: '眼面部防护装备', sub: 'Face Shield', risk: 'low' },
  'LXX': { category: '眼面部防护装备', sub: 'Face Shield', risk: 'low' },
  'LXY': { category: '眼面部防护装备', sub: 'Face Shield', risk: 'low' },
  'LXZ': { category: '眼面部防护装备', sub: 'Face Shield', risk: 'low' },
  'LZA': { category: '眼面部防护装备', sub: 'Protective Goggles', risk: 'low' },
  'LZB': { category: '眼面部防护装备', sub: 'Face Shield', risk: 'low' },
  'LZC': { category: '手部防护装备', sub: 'Glove', risk: 'low' },
  'LZD': { category: '手部防护装备', sub: 'Glove', risk: 'low' },
  'LZE': { category: '手部防护装备', sub: 'Glove', risk: 'low' },
  'LZF': { category: '手部防护装备', sub: 'Glove', risk: 'low' },
  'LZG': { category: '呼吸防护装备', sub: 'Respirator', risk: 'high' },
  'LZH': { category: '手部防护装备', sub: 'Glove', risk: 'low' },
  'LZI': { category: '手部防护装备', sub: 'Glove', risk: 'low' },
  'LZJ': { category: '呼吸防护装备', sub: 'Respirator', risk: 'high' },
  'LZK': { category: '手部防护装备', sub: 'Glove', risk: 'low' },
  'LZL': { category: '手部防护装备', sub: 'Glove', risk: 'low' },
  'LZM': { category: '手部防护装备', sub: 'Glove', risk: 'low' },
  'LZN': { category: '手部防护装备', sub: 'Glove', risk: 'low' },
  'LZO': { category: '手部防护装备', sub: 'Glove', risk: 'low' },
  'LZP': { category: '手部防护装备', sub: 'Glove', risk: 'low' },
  'LZQ': { category: '手部防护装备', sub: 'Glove', risk: 'low' },
  'LZR': { category: '手部防护装备', sub: 'Glove', risk: 'low' },
  'LZS': { category: '呼吸防护装备', sub: 'Respirator', risk: 'high' },
  'LZT': { category: '手部防护装备', sub: 'Glove', risk: 'low' },
  'LZU': { category: '呼吸防护装备', sub: 'Respirator', risk: 'high' },
  'LZV': { category: '呼吸防护装备', sub: 'Respirator', risk: 'high' },
  'LZW': { category: '手部防护装备', sub: 'Glove', risk: 'low' },
  'LZX': { category: '手部防护装备', sub: 'Glove', risk: 'low' },
  'LZY': { category: '手部防护装备', sub: 'Glove', risk: 'low' },
  'LZZ': { category: '手部防护装备', sub: 'Glove', risk: 'low' },
};

const nameRules = [
  { category: '呼吸防护装备', sub: 'Surgical Mask', risk: 'high', keywords: ['mask', 'surgical mask', 'procedure mask', 'face mask', 'isolation mask'] },
  { category: '呼吸防护装备', sub: 'N95 Respirator', risk: 'high', keywords: ['n95', 'respirator', 'kn95', 'ffp2', 'ffp3', 'filtering facepiece', 'papr'] },
  { category: '手部防护装备', sub: 'Glove', risk: 'low', keywords: ['glove', 'nitrile', 'latex', 'vinyl', 'examination', 'surgical glove'] },
  { category: '身体防护装备', sub: 'Protective Garment', risk: 'medium', keywords: ['gown', 'coverall', 'protective clothing', 'isolation', 'apron', 'cover suit', 'scrub'] },
  { category: '眼面部防护装备', sub: 'Face Shield', risk: 'low', keywords: ['shield', 'goggle', 'eyewear', 'face protection', 'visors'] },
  { category: '头部防护装备', sub: 'Surgical Cap', risk: 'low', keywords: ['cap', 'hood', 'bouffant', 'head cover', 'hair net'] },
  { category: '足部防护装备', sub: 'Shoe Cover', risk: 'low', keywords: ['shoe cover', 'boot cover', 'overshoe', 'foot cover'] },
];

async function reclassifyByProductCode() {
  console.log('\n=== Reclassify by Product Code ===\n');
  let total = 0;

  for (const [code, info] of Object.entries(PPE_PRODUCT_CODES)) {
    const { count } = await supabase
      .from('ppe_products')
      .select('*', { count: 'exact', head: true })
      .eq('category', '其他')
      .eq('product_code', code);

    if (count > 0) {
      const { error } = await supabase
        .from('ppe_products')
        .update({ category: info.category, subcategory: info.sub, risk_level: info.risk })
        .eq('category', '其他')
        .eq('product_code', code);

      if (!error) {
        total += count;
        console.log(`  ${code} → ${info.category}/${info.sub}: ${count} records`);
      }
    }
  }

  console.log(`\n  ✅ Reclassified by product code: ${total}`);
  return total;
}

async function reclassifyByModel() {
  console.log('\n=== Reclassify by Model (product_code field from model) ===\n');
  let total = 0;

  for (const [code, info] of Object.entries(PPE_PRODUCT_CODES)) {
    const { count } = await supabase
      .from('ppe_products')
      .select('*', { count: 'exact', head: true })
      .eq('category', '其他')
      .eq('model', code);

    if (count > 0) {
      const { error } = await supabase
        .from('ppe_products')
        .update({ category: info.category, subcategory: info.sub, risk_level: info.risk, product_code: code })
        .eq('category', '其他')
        .eq('model', code);

      if (!error) {
        total += count;
        console.log(`  ${code} (model) → ${info.category}/${info.sub}: ${count} records`);
      }
    }
  }

  console.log(`\n  ✅ Reclassified by model: ${total}`);
  return total;
}

async function reclassifyByName() {
  console.log('\n=== Reclassify by Name Keywords ===\n');
  let total = 0;
  const batchSize = 2000;
  let offset = 0;

  const { count } = await supabase
    .from('ppe_products')
    .select('*', { count: 'exact', head: true })
    .eq('category', '其他');

  console.log(`Remaining "其他": ${count}`);

  while (offset < count + batchSize) {
    const { data } = await supabase
      .from('ppe_products')
      .select('id, name, description, subcategory')
      .eq('category', '其他')
      .range(offset, offset + batchSize - 1);

    if (!data || data.length === 0) break;

    for (const p of data) {
      const text = [(p.name || ''), (p.description || ''), (p.subcategory || '')].join(' ').toLowerCase();

      for (const rule of nameRules) {
        if (rule.keywords.some(kw => text.includes(kw))) {
          const { error } = await supabase
            .from('ppe_products')
            .update({ category: rule.category, subcategory: rule.sub, risk_level: rule.risk })
            .eq('id', p.id);
          if (!error) total++;
          break;
        }
      }
    }

    offset += batchSize;
    if (offset % 10000 === 0) {
      console.log(`  Offset ${offset}: reclassified ${total}`);
    }
  }

  console.log(`\n  ✅ Reclassified by name: ${total}`);
  return total;
}

async function main() {
  console.log('\n' + '='.repeat(60));
  console.log('  PPE Product Reclassification');
  console.log('='.repeat(60));

  const t1 = await reclassifyByProductCode();
  const t2 = await reclassifyByModel();
  const t3 = await reclassifyByName();

  const { count: total } = await supabase.from('ppe_products').select('*', { count: 'exact', head: true });
  const { count: other } = await supabase.from('ppe_products').select('*', { count: 'exact', head: true }).eq('category', '其他');

  console.log('\n' + '='.repeat(60));
  console.log(`  Total reclassified: ${t1 + t2 + t3}`);
  console.log(`  Total products: ${total.toLocaleString()}`);
  console.log(`  Remaining "其他": ${other.toLocaleString()} (${(other / total * 100).toFixed(1)}%)`);
  console.log('='.repeat(60) + '\n');

  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
