// Cleanup test data seeded for demo purposes
// Usage: npm run cleanup:test
// Requires: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load .env file manually
const envPath = join(dirname(fileURLToPath(import.meta.url)), '../.env');
if (!fs.existsSync(envPath)) {
  console.error('❌ .env file not found at:', envPath);
  process.exit(1);
}

const envContent = fs.readFileSync(envPath, 'utf8');

// Improved .env parsing: handle comments, empty lines, quotes, and whitespace
envContent.split('\n').forEach((line) => {
  // Remove comments (everything after #)
  const cleanLine = line.split('#')[0].trim();
  if (!cleanLine) return; // Skip empty lines
  
  const match = cleanLine.match(/^([^=]+)=(.*)$/);
  if (match) {
    const key = match[1].trim();
    let value = match[2].trim();
    
    // Remove surrounding quotes if present
    if ((value.startsWith('"') && value.endsWith('"')) || 
        (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    
    process.env[key] = value;
  }
});

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing Supabase credentials in .env file');
  console.error('Required: SUPABASE_URL (or VITE_SUPABASE_URL) and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const TEST_EMAIL_PREFIX = 'test+';
const TEST_BATCH_PREFIX = 'demo-seed-';

async function listAllUsers() {
  const users = [];
  let page = 1;
  const perPage = 200;
  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage });
    if (error) throw error;
    users.push(...(data?.users || []));
    if (!data?.users || data.users.length < perPage) break;
    page += 1;
  }
  return users;
}

async function cleanupTestData() {
  console.log('🧹 Starting test data cleanup...\n');

  try {
    // Step 1: Find all test users by email prefix
    console.log('🔍 Finding test users...');
    const allUsers = await listAllUsers();

    const testUsers = allUsers.filter(u => {
      const batchId = typeof u.user_metadata?.test_batch_id === 'string'
        ? u.user_metadata.test_batch_id
        : '';
      return u.email?.startsWith(TEST_EMAIL_PREFIX) || batchId.startsWith(TEST_BATCH_PREFIX);
    });

    if (testUsers.length === 0) {
      console.log('✓ No test users found. Nothing to clean up.\n');
      return;
    }

    console.log(`  Found ${testUsers.length} test user(s)\n`);

    const testUserIds = testUsers.map(u => u.id);

    // Step 2: Delete in order to respect foreign key constraints
    console.log('🗑️  Deleting test data (in order)...\n');

    // Delete consultations first
    console.log('  Deleting consultations...');
    // Delete consultations where client is test user
    const { error: consError1 } = await supabase
      .from('consultations')
      .delete()
      .in('client_id', testUserIds);
    
    // Delete consultations where lawyer is test user
    const { error: consError2 } = await supabase
      .from('consultations')
      .delete()
      .in('lawyer_id', testUserIds);

    if (consError1 && !consError1.message.includes('does not exist')) console.error('  ⚠️  Error deleting client consultations:', consError1.message);
    if (consError2 && !consError2.message.includes('does not exist')) console.error('  ⚠️  Error deleting lawyer consultations:', consError2.message);
    console.log('  ✓ Consultations deleted');

    // Get lawyer profile IDs before deleting
    const { data: lawyerProfiles } = await supabase
      .from('lawyer_profiles')
      .select('id')
      .in('user_id', testUserIds);

    const lawyerProfileIds = lawyerProfiles?.map(lp => lp.id) || [];

    // Delete messages and conversations
    if (lawyerProfileIds.length > 0 || testUserIds.length > 0) {
      console.log('  Deleting conversations and messages...');
      const { data: convByLawyer, error: convLawyerError } = await supabase
        .from('conversations')
        .select('id')
        .in('lawyer_id', lawyerProfileIds);
      if (convLawyerError && !convLawyerError.message.includes('does not exist')) {
        console.error('  ⚠️  Error fetching conversations by lawyer:', convLawyerError.message);
      }

      const { data: convByClient, error: convClientError } = await supabase
        .from('conversations')
        .select('id')
        .in('client_id', testUserIds);
      if (convClientError && !convClientError.message.includes('does not exist')) {
        console.error('  ⚠️  Error fetching conversations by client:', convClientError.message);
      }

      const conversationIds = Array.from(
        new Set([...(convByLawyer || []), ...(convByClient || [])].map(c => c.id))
      );

      if (conversationIds.length > 0) {
        const { error: msgError } = await supabase
          .from('messages')
          .delete()
          .in('conversation_id', conversationIds);
        if (msgError && !msgError.message.includes('does not exist')) {
          console.error('  ⚠️  Error deleting messages:', msgError.message);
        }

        const { error: convDeleteError } = await supabase
          .from('conversations')
          .delete()
          .in('id', conversationIds);
        if (convDeleteError && !convDeleteError.message.includes('does not exist')) {
          console.error('  ⚠️  Error deleting conversations:', convDeleteError.message);
        }
      }
      console.log('  ✓ Conversations and messages deleted');
    }

    // Delete availability data
    if (lawyerProfileIds.length > 0) {
      console.log('  Deleting availability blocks...');
      await supabase
        .from('lawyer_availability_exceptions')
        .delete()
        .in('lawyer_id', lawyerProfileIds);
      await supabase
        .from('lawyer_weekly_availability')
        .delete()
        .in('lawyer_id', lawyerProfileIds);
      await supabase
        .from('lawyer_date_availability')
        .delete()
        .in('lawyer_id', lawyerProfileIds);
      console.log('  ✓ Availability data deleted');
    }

    // Delete profile views
    if (lawyerProfileIds.length > 0) {
      console.log('  Deleting profile views...');
      const { error: viewsError } = await supabase
        .from('profile_views')
        .delete()
        .in('lawyer_id', lawyerProfileIds);
      if (viewsError && !viewsError.message.includes('does not exist')) {
        console.error('  ⚠️  Error deleting profile views:', viewsError.message);
      } else {
        console.log('  ✓ Profile views deleted');
      }
    }

    // Delete lawyer reviews
    console.log('  Deleting lawyer reviews...');
    const { error: reviewsLawyerError } = await supabase
      .from('lawyer_reviews')
      .delete()
      .in('lawyer_id', lawyerProfileIds);
    if (reviewsLawyerError && !reviewsLawyerError.message.includes('does not exist')) {
      console.error('  ⚠️  Error deleting lawyer reviews (lawyer):', reviewsLawyerError.message);
    }
    const { error: reviewsClientError } = await supabase
      .from('lawyer_reviews')
      .delete()
      .in('client_id', testUserIds);
    if (reviewsClientError && !reviewsClientError.message.includes('does not exist')) {
      console.error('  ⚠️  Error deleting lawyer reviews (client):', reviewsClientError.message);
    }
    console.log('  ✓ Lawyer reviews deleted');

    // Delete consultations that reference time slots from test lawyers
    // This must happen before deleting time slots due to foreign key constraint
    if (lawyerProfileIds.length > 0) {
      console.log('  Deleting consultations referencing test lawyer time slots...');
      // Get time slot IDs from test lawyers
      const { data: timeSlots } = await supabase
        .from('time_slots')
        .select('id')
        .in('lawyer_id', lawyerProfileIds);
      
      const timeSlotIds = timeSlots?.map(ts => ts.id) || [];
      
      if (timeSlotIds.length > 0) {
        const { error: consTimeSlotError } = await supabase
          .from('consultations')
          .delete()
          .in('time_slot_id', timeSlotIds);
        
        if (consTimeSlotError && !consTimeSlotError.message.includes('does not exist')) {
          console.error('  ⚠️  Error deleting consultations by time_slot:', consTimeSlotError.message);
        } else {
          console.log('  ✓ Consultations referencing test time slots deleted');
        }
      }
    }

    // Delete time slots (now safe since consultations are deleted)
    if (lawyerProfileIds.length > 0) {
      console.log('  Deleting time slots...');
      const { error: slotsError } = await supabase
        .from('time_slots')
        .delete()
        .in('lawyer_id', lawyerProfileIds);
      if (slotsError) throw slotsError;
      console.log('  ✓ Time slots deleted');
    }

    // Delete lawyer specializations
    if (lawyerProfileIds.length > 0) {
      console.log('  Deleting lawyer specializations...');
      const { error: specError } = await supabase
        .from('lawyer_specializations')
        .delete()
        .in('lawyer_id', lawyerProfileIds);
      if (specError) throw specError;
      console.log('  ✓ Lawyer specializations deleted');
    }

    // Delete lawyer expertise
    if (lawyerProfileIds.length > 0) {
      console.log('  Deleting lawyer expertise...');
      const { error: expError } = await supabase
        .from('lawyer_expertise')
        .delete()
        .in('lawyer_id', lawyerProfileIds);
      if (expError) throw expError;
      console.log('  ✓ Lawyer expertise deleted');
    }

    // Delete lawyer profiles
    if (lawyerProfileIds.length > 0) {
      console.log('  Deleting lawyer profiles...');
      const { error: lpError } = await supabase
        .from('lawyer_profiles')
        .delete()
        .in('user_id', testUserIds);
      if (lpError) throw lpError;
      console.log('  ✓ Lawyer profiles deleted');
    }

    // Delete client_search entries
    console.log('  Deleting client search entries...');
    const { error: searchError } = await supabase
      .from('client_search')
      .delete()
      .in('user_id', testUserIds);
    if (searchError && !searchError.message.includes('does not exist')) {
      console.log('  ⚠️  Could not delete client_search (table may not exist)');
    } else {
      console.log('  ✓ Client search entries deleted');
    }

    // Delete profiles
    console.log('  Deleting profiles...');
    const { error: profError } = await supabase
      .from('profiles')
      .delete()
      .in('user_id', testUserIds);
    if (profError) throw profError;
    console.log('  ✓ Profiles deleted');

    // Delete user roles
    console.log('  Deleting user roles...');
    const { error: rolesError } = await supabase
      .from('user_roles')
      .delete()
      .in('user_id', testUserIds);
    if (rolesError) throw rolesError;
    console.log('  ✓ User roles deleted');

    // Delete auth users (last, as it cascades)
    console.log('  Deleting auth users...');
    for (const user of testUsers) {
      const { error: deleteError } = await supabase.auth.admin.deleteUser(user.id);
      if (deleteError) {
        console.error(`  ⚠️  Error deleting user ${user.email}: ${deleteError.message}`);
      } else {
        console.log(`  ✓ Deleted user: ${user.email}`);
      }
    }

    console.log('\n✅ Test data cleanup completed successfully!');
    console.log(`   Removed ${testUsers.length} test user(s) and all associated data\n`);

  } catch (error: any) {
    console.error('\n❌ Error cleaning up test data:');
    console.error(error.message);
    if (error.details) console.error(error.details);
    process.exit(1);
  }
}

cleanupTestData();
