import { cloudinary, uploadToCloudinary } from './cloudinary.js';
import { supabase, testSupabaseConnection } from './supabase.js';
import fs from 'fs';
import path from 'path';

async function runVerification() {
  console.log('========================================================');
  console.log('🧪 VERIFYING SUPABASE & CLOUDINARY LIVE CONNECTIONS');
  console.log('========================================================\n');

  // --- 1. CLOUDINARY TEST ---
  console.log('1️⃣ TESTING CLOUDINARY CONNECTION & ASSET UPLOAD...');
  try {
    const pingRes = await cloudinary.api.ping();
    console.log('   ✅ Cloudinary API Ping:', JSON.stringify(pingRes));

    // Create a tiny temporary test file
    const tempFilePath = path.resolve('./temp_cloudinary_test.txt');
    fs.writeFileSync(tempFilePath, 'Charvik Fleet Management - Cloudinary live upload verification');

    console.log('   📤 Testing real-world file upload to Cloudinary...');
    const uploadRes = await uploadToCloudinary(tempFilePath, 'charvik_fleet/tests');
    console.log('   ✅ Cloudinary Upload Succeeded!');
    console.log('      - Secure URL:', uploadRes.url);
    console.log('      - Public ID:', uploadRes.publicId);
    console.log('      - Size (bytes):', uploadRes.bytes);

    // Clean up local temp file
    if (fs.existsSync(tempFilePath)) fs.unlinkSync(tempFilePath);

    // Clean up remote test asset from Cloudinary
    try {
      await cloudinary.uploader.destroy(uploadRes.publicId, { resource_type: 'raw' });
      console.log('   🧹 Test asset cleaned up successfully from Cloudinary.');
    } catch (e) {
      // non-fatal
    }
  } catch (err: any) {
    console.error('   ❌ Cloudinary Test Failed:', err.message);
  }

  console.log('\n--------------------------------------------------------\n');

  // --- 2. SUPABASE TEST ---
  console.log('2️⃣ TESTING SUPABASE PROJECT & DATABASE TABLES...');
  try {
    const status = await testSupabaseConnection();
    console.log('   📡 Project Connection Status:', status.connected ? 'CONNECTED' : 'DISCONNECTED');
    console.log('   📋 Message:', status.message);

    // Test specific tables
    const tablesToCheck = ['administrators', 'buses', 'employees', 'daily_kilometer_entries'];
    console.log('\n   🔍 Checking table schema cache in Supabase:');
    for (const tbl of tablesToCheck) {
      const { data, error } = await supabase.from(tbl).select('id').limit(1);
      if (error) {
        console.log(`      - [${tbl}]: ⏳ Table not created yet (${error.code}: ${error.message})`);
      } else {
        console.log(`      - [${tbl}]: ✅ Exists and Accessible`);
      }
    }
  } catch (err: any) {
    console.error('   ❌ Supabase Test Failed:', err.message);
  }

  console.log('\n========================================================');
  console.log('🏁 VERIFICATION COMPLETE');
  console.log('========================================================');
}

runVerification();
