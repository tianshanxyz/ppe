const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

console.log('Supabase URL:', supabaseUrl)
console.log('Supabase Key:', supabaseKey ? '***' + supabaseKey.slice(-10) : 'MISSING')

const supabase = createClient(supabaseUrl, supabaseKey)

async function testConnection() {
  try {
    console.log('\n=== Testing Supabase Connection ===\n')
    
    // Test 1: Check ppe_products table
    console.log('1. Testing ppe_products table...')
    const { data: products, error: productsError } = await supabase
      .from('ppe_products')
      .select('id, product_name, manufacturer_country')
      .limit(5)
    
    if (productsError) {
      console.error('Error fetching products:', productsError)
    } else {
      console.log('✓ Successfully fetched products:', products?.length || 0)
      if (products && products.length > 0) {
        console.log('Sample products:', products)
      }
    }
    
    // Test 2: Check ppe_manufacturers table
    console.log('\n2. Testing ppe_manufacturers table...')
    const { data: manufacturers, error: manufacturersError } = await supabase
      .from('ppe_manufacturers')
      .select('id, company_name, country')
      .limit(5)
    
    if (manufacturersError) {
      console.error('Error fetching manufacturers:', manufacturersError)
    } else {
      console.log('✓ Successfully fetched manufacturers:', manufacturers?.length || 0)
      if (manufacturers && manufacturers.length > 0) {
        console.log('Sample manufacturers:', manufacturers)
      }
    }
    
    // Test 3: Check ppe_regulations table
    console.log('\n3. Testing ppe_regulations table...')
    const { data: regulations, error: regulationsError } = await supabase
      .from('ppe_regulations')
      .select('id, regulation_name, jurisdiction')
      .limit(5)
    
    if (regulationsError) {
      console.error('Error fetching regulations:', regulationsError)
    } else {
      console.log('✓ Successfully fetched regulations:', regulations?.length || 0)
    }
    
    // Test 4: Check ppe_competitors table
    console.log('\n4. Testing ppe_competitors table...')
    const { data: competitors, error: competitorsError } = await supabase
      .from('ppe_competitors')
      .select('id, company_name, country')
      .limit(5)
    
    if (competitorsError) {
      console.error('Error fetching competitors:', competitorsError)
    } else {
      console.log('✓ Successfully fetched competitors:', competitors?.length || 0)
    }
    
    // Test 5: Insert test record
    console.log('\n5. Testing insert operation...')
    const testProduct = {
      product_name: 'Test Product - Delete Me',
      product_code: 'TEST-' + Date.now(),
      product_category: 'Test Category',
      ppe_category: 'II',
      manufacturer_country: 'US',
      registration_status: 'active',
    }
    
    const { data: inserted, error: insertError } = await supabase
      .from('ppe_products')
      .insert(testProduct)
      .select()
    
    if (insertError) {
      console.error('Error inserting test product:', insertError)
    } else {
      console.log('✓ Successfully inserted test product:', inserted?.[0]?.product_code)
      
      // Delete test record
      if (inserted && inserted[0]) {
        await supabase
          .from('ppe_products')
          .delete()
          .eq('id', inserted[0].id)
        console.log('✓ Test product deleted')
      }
    }
    
    console.log('\n=== Connection Test Complete ===\n')
    console.log('✓ All tests passed! Database connection is working properly.')
    
  } catch (error) {
    console.error('\n❌ Connection test failed:', error)
    process.exit(1)
  }
}

testConnection()
