const {createClient}=require("@supabase/supabase-js");
const s=createClient("https://xtqhjyiyjhxfdzyypfqq.supabase.co","eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh0cWhqeWl5amh4ZmR6eXlwZnFxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjUwNTU1OSwiZXhwIjoyMDkyMDgxNTU5fQ.6uW47M6vaxbWomXiUiplhHbzST0vxs0CAIWoL5FdchU");
(async()=>{
  const {count:c}=await s.from("ppe_products").select("*",{count:"exact",head:true});
  console.log("产品:",c);
  const {count:m}=await s.from("ppe_manufacturers").select("*",{count:"exact",head:true});
  console.log("制造商:",m);
  const {data:all}=await s.from("ppe_products").select("data_source,category,country_of_origin").limit(10000);
  const cat={},src={},cty={};
  all.forEach(r=>{cat[r.category]=(cat[r.category]||0)+1;src[r.data_source]=(src[r.data_source]||0)+1;cty[r.country_of_origin]=(cty[r.country_of_origin]||0)+1});
  console.log("\n数据源:",JSON.stringify(Object.entries(src).sort((a,b)=>b[1]-a[1])));
  console.log("\n类别:",JSON.stringify(Object.entries(cat).sort((a,b)=>b[1]-a[1])));
  console.log("\n国家top15:",JSON.stringify(Object.entries(cty).sort((a,b)=>b[1]-a[1]).slice(0,15)));
})();
