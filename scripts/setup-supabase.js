require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function setup() {
  // Create tables using Supabase REST API
  // We'll use the rpc function to execute SQL

  // Step 1: Try to create mdlooker_users table
  console.log('Creating tables...');

  // Since we can't run DDL via REST API, we'll create the admin user directly
  // by trying an insert (which will fail if table doesn't exist)
  
  // First check if table exists
  const { data: existingUsers, error: checkError } = await supabase
    .from('mdlooker_users')
    .select('id')
    .limit(1);

  if (checkError) {
    console.log('ERROR: Table mdlooker_users does not exist.');
    console.log('Please run supabase-schema.sql in the Supabase SQL Editor first.');
    console.log('');
    const projectRef = process.env.NEXT_PUBLIC_SUPABASE_URL.replace('https://', '').replace('.supabase.co', '');
    console.log('SQL Editor URL: https://supabase.com/dashboard/project/' + projectRef + '/sql');
    process.exit(1);
  }

  console.log('Table exists! Inserting admin user...');

  // Insert admin user
  const { data, error } = await supabase
    .from('mdlooker_users')
    .upsert({
      id: 'admin_freeman',
      email: 'freeman@h-guardian.com',
      password_hash: '$2b$12$Desa/pgMYKOwh8lmDk/mJeWDbB2bAPfZeAlDvnVTUHw9W1IUeHErm',
      name: 'Freeman',
      company: 'H-Guardian',
      role: 'admin',
      membership: 'enterprise',
    }, { onConflict: 'id' });

  if (error) {
    console.log('Insert error:', error.message);
  } else {
    console.log('Admin user inserted successfully!');
  }

  // Verify
  const { data: users } = await supabase.from('mdlooker_users').select('id, email, role');
  console.log('Users in database:', users);
}

setup().catch(console.error);
