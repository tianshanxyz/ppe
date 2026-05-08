const {createClient}=require("@supabase/supabase-js");
const s=createClient("https://xtqhjyiyjhxfdzyypfqq.supabase.co","eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh0cWhqeWl5amh4ZmR6eXlwZnFxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjUwNTU1OSwiZXhwIjoyMDkyMDgxNTU5fQ.6uW47M6vaxbWomXiUiplhHbzST0vxs0CAIWoL5FdchU");
(async()=>{
  const all=[];
  for(let p=0;;p++) {
    const {data}=await s.from("ppe_products").select("data_source,category,country_of_origin,risk_level,registration_authority").range(p*1000,(p+1)*1000-1);
    if(!data||!data.length)break;
    all.push(...data);
    if(data.length<1000)break;
  }
  console.log("总获取:",all.length);
  
  const ds={};all.forEach(r=>{const k=r.data_source||"NULL";ds[k]=(ds[k]||0)+1});
  console.log("\n=== 数据源分布 ===");
  Object.entries(ds).sort((a,b)=>b[1]-a[1]).slice(0,30).forEach(([k,v])=>console.log(`  ${k}: ${v}`));
  
  const ra={};all.forEach(r=>{const k=r.registration_authority||"NULL";ra[k]=(ra[k]||0)+1});
  console.log("\n=== 监管机构 ===");
  Object.entries(ra).sort((a,b)=>b[1]-a[1]).slice(0,15).forEach(([k,v])=>console.log(`  ${k}: ${v}`));
  
  const ca={};all.forEach(r=>{const k=r.category||"NULL";ca[k]=(ca[k]||0)+1});
  console.log("\n=== 类别分布 ===");
  Object.entries(ca).sort((a,b)=>b[1]-a[1]).forEach(([k,v])=>console.log(`  ${k}: ${v}`));
  
  const co={};all.forEach(r=>{const k=r.country_of_origin||"NULL";co[k]=(co[k]||0)+1});
  console.log("\n=== 国家分布(top20) ===");
  Object.entries(co).sort((a,b)=>b[1]-a[1]).slice(0,20).forEach(([k,v])=>console.log(`  ${k}: ${v}`));
  
  const rl={};all.forEach(r=>{const k=r.risk_level||"NULL";rl[k]=(rl[k]||0)+1});
  console.log("\n=== 风险等级 ===");
  Object.entries(rl).sort((a,b)=>b[1]-a[1]).forEach(([k,v])=>console.log(`  ${k}: ${v}`));
  
  console.log("\n总计:",all.length,"产品");
  const {count:m}=await s.from("ppe_manufacturers").select("*",{count:"exact",head:true});
  console.log("制造商:",m);
})();
