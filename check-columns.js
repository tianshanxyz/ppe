const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://xtqhjyiyjhxfdzyypfqq.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh0cWhqeWl5amh4ZmR6eXlwZnFxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY1MDU1NTksImV4cCI6MjA5MjA4MTU1OX0.2uWuP-DZQ3nGqan8Bw9Sa8v7eZI49dvgUgRU8Jgdy4w'
);

(async () => {
  // Try to get column info by attempting different column names
  const columns = ['id', 'name', 'company_name', 'name_zh', 'company_name_zh', 'company_name_en',
    'country', 'city', 'address', 'website', 'email', 'phone', 'contact_person',
    'business_type', 'product_categories', 'certifications', 'credit_score',
    'risk_level', 'registration_number', 'year_established', 'employee_count',
    'annual_revenue', 'main_markets', 'description', 'logo_url', 'status',
    'verified', 'verified_at', 'created_at', 'updated_at', 'metadata',
    'verification_status', 'products_count', 'source', 'certification_number'];

  const existingColumns = [];

  for (const col of columns) {
    const { data, error } = await supabase
      .from('ppe_manufacturers')
      .select(col)
      .limit(1);
    if (!error) {
      existingColumns.push(col);
    }
  }

  console.log('EXISTING_COLUMNS:', existingColumns.join(', '));
})();
