// Seed test data for demo purposes
// Usage: npm run seed:test
// Requires: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load .env file manually
const envPath = join(dirname(fileURLToPath(import.meta.url)), '../.env');
if (!fs.existsSync(envPath)) {
  console.error('❌ .env file not found at:', envPath);
  console.error('Please create a .env file in the project root with:');
  console.error('SUPABASE_URL=https://your-project.supabase.co');
  console.error('SUPABASE_SERVICE_ROLE_KEY=your-service-role-key');
  process.exit(1);
}

const envContent = fs.readFileSync(envPath, 'utf8');

// Improved .env parsing: handle comments, empty lines, quotes, and whitespace
envContent.split('\n').forEach((line, index) => {
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
  console.error('\nFound in .env:');
  console.error(`  SUPABASE_URL: ${SUPABASE_URL ? '✓ Set' : '✗ Missing'}`);
  console.error(`  VITE_SUPABASE_URL: ${process.env.VITE_SUPABASE_URL ? '✓ Set' : '✗ Missing'}`);
  console.error(`  SUPABASE_SERVICE_ROLE_KEY: ${SUPABASE_SERVICE_ROLE_KEY ? '✓ Set (length: ' + SUPABASE_SERVICE_ROLE_KEY.length + ')' : '✗ Missing'}`);
  console.error('\nRequired: SUPABASE_URL (or VITE_SUPABASE_URL) and SUPABASE_SERVICE_ROLE_KEY');
  console.error('\nExample .env entry:');
  console.error('SUPABASE_URL=https://your-project.supabase.co');
  console.error('SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...');
  console.error('\n💡 Tip: Get your service role key from Supabase Dashboard > Settings > API');
  process.exit(1);
}

// Validate URL format
if (!SUPABASE_URL.startsWith('http://') && !SUPABASE_URL.startsWith('https://')) {
  console.error('❌ Invalid SUPABASE_URL format');
  console.error(`   Found: ${SUPABASE_URL}`);
  console.error('   Expected: https://your-project.supabase.co');
  process.exit(1);
}

// Validate service role key format (should be a JWT token)
if (SUPABASE_SERVICE_ROLE_KEY.length < 100) {
  console.warn('⚠️  Warning: SUPABASE_SERVICE_ROLE_KEY seems too short');
  console.warn('   Service role keys are typically JWT tokens (100+ characters)');
  console.warn('   Make sure you\'re using the SERVICE ROLE key, not the anon key');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

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

// Test connection before proceeding
async function testConnection() {
  try {
    const { data, error } = await supabase.from('practice_areas').select('id').limit(1);
    if (error) {
      if (error.message.includes('Invalid API key') || error.message.includes('JWT')) {
        console.error('❌ Invalid API key error');
        console.error('\n💡 Common issues:');
        console.error('   1. You might be using the ANON key instead of SERVICE ROLE key');
        console.error('   2. The key might be truncated or have extra spaces');
        console.error('   3. The key might be from a different project');
        console.error('\n📋 How to get your Service Role Key:');
        console.error('   1. Go to Supabase Dashboard: https://supabase.com/dashboard');
        console.error('   2. Select your project');
        console.error('   3. Go to Settings > API');
        console.error('   4. Copy the "service_role" key (NOT the "anon" key)');
        console.error('   5. It should start with "eyJ..." and be 100+ characters long');
        throw error;
      }
      throw error;
    }
    return true;
  } catch (error: any) {
    console.error('\n❌ Failed to connect to Supabase');
    console.error(`   Error: ${error.message}`);
    throw error;
  }
}

async function cleanupExistingTestData() {
  const allUsers = await listAllUsers();
  const testUsers = allUsers.filter((user) => {
    const batchId = typeof user.user_metadata?.test_batch_id === 'string'
      ? user.user_metadata.test_batch_id
      : '';
    return user.email?.startsWith(TEST_EMAIL_PREFIX) || batchId.startsWith('demo-seed-');
  });

  if (testUsers.length === 0) {
    console.log('  ✓ No existing test users found');
    return;
  }

  const testUserIds = testUsers.map((user) => user.id);

  const { data: lawyerProfiles } = await supabase
    .from('lawyer_profiles')
    .select('id')
    .in('user_id', testUserIds);

  const lawyerProfileIds = lawyerProfiles?.map((lp) => lp.id) || [];

  const { data: convByLawyer } = await supabase
    .from('conversations')
    .select('id')
    .in('lawyer_id', lawyerProfileIds);
  const { data: convByClient } = await supabase
    .from('conversations')
    .select('id')
    .in('client_id', testUserIds);

  const conversationIds = Array.from(
    new Set([...(convByLawyer || []), ...(convByClient || [])].map((c) => c.id))
  );

  if (conversationIds.length > 0) {
    await supabase.from('messages').delete().in('conversation_id', conversationIds);
    await supabase.from('conversations').delete().in('id', conversationIds);
  }

  await supabase.from('consultations').delete().in('client_id', testUserIds);
  await supabase.from('consultations').delete().in('lawyer_id', lawyerProfileIds);

  if (lawyerProfileIds.length > 0) {
    const { data: timeSlots } = await supabase
      .from('time_slots')
      .select('id')
      .in('lawyer_id', lawyerProfileIds);
    const timeSlotIds = timeSlots?.map((ts) => ts.id) || [];
    if (timeSlotIds.length > 0) {
      await supabase.from('consultations').delete().in('time_slot_id', timeSlotIds);
    }

    await supabase.from('time_slots').delete().in('lawyer_id', lawyerProfileIds);
    await supabase.from('lawyer_specializations').delete().in('lawyer_id', lawyerProfileIds);
    await supabase.from('lawyer_expertise').delete().in('lawyer_id', lawyerProfileIds);
    await supabase.from('lawyer_reviews').delete().in('lawyer_id', lawyerProfileIds);
    await supabase.from('profile_views').delete().in('lawyer_id', lawyerProfileIds);
    await supabase.from('lawyer_availability_exceptions').delete().in('lawyer_id', lawyerProfileIds);
    await supabase.from('lawyer_weekly_availability').delete().in('lawyer_id', lawyerProfileIds);
    await supabase.from('lawyer_date_availability').delete().in('lawyer_id', lawyerProfileIds);
    await supabase.from('lawyer_profiles').delete().in('user_id', testUserIds);
  }

  await supabase.from('lawyer_reviews').delete().in('client_id', testUserIds);
  await supabase.from('client_search').delete().in('user_id', testUserIds);
  await supabase.from('profiles').delete().in('user_id', testUserIds);
  await supabase.from('user_roles').delete().in('user_id', testUserIds);

  for (const user of testUsers) {
    await supabase.auth.admin.deleteUser(user.id);
  }
}

const TEST_BATCH_ID = process.env.SEED_BATCH_ID || 'demo-seed-002';
const TEST_EMAIL_PREFIX = 'test+';
const CLEANUP_BEFORE_SEED = process.env.SEED_CLEANUP !== 'false';

const LAWYER_COUNT = Number(process.env.SEED_LAWYER_COUNT || 120);
const CLIENT_COUNT = Number(process.env.SEED_CLIENT_COUNT || 240);
const CONSULTATIONS_PER_LAWYER = Number(process.env.SEED_CONSULTATIONS_PER_LAWYER || 8);
const CONVERSATIONS_PER_LAWYER = Number(process.env.SEED_CONVERSATIONS_PER_LAWYER || 4);
const MESSAGES_PER_CONVERSATION = Number(process.env.SEED_MESSAGES_PER_CONVERSATION || 8);
const PROFILE_VIEWS_PER_LAWYER = Number(process.env.SEED_PROFILE_VIEWS_PER_LAWYER || 20);
const AVAILABILITY_WEEKS = Number(process.env.SEED_AVAILABILITY_WEEKS || 6);

interface TestUser {
  email: string;
  password: string;
  fullName: string;
  userId?: string;
  profileId?: string;
  lawyerProfileId?: string;
}

// Generate 50 test lawyers with varied data
const firstNames = [
  'Sarah', 'Michael', 'Emily', 'David', 'Jessica', 'James', 'Amanda', 'Robert', 'Jennifer', 'Christopher',
  'Michelle', 'Daniel', 'Ashley', 'Matthew', 'Melissa', 'Andrew', 'Nicole', 'Joshua', 'Stephanie', 'Ryan',
  'Lauren', 'Justin', 'Rachel', 'Brandon', 'Samantha', 'Tyler', 'Megan', 'Kevin', 'Lisa', 'Eric',
  'Kimberly', 'Jacob', 'Angela', 'Nathan', 'Brittany', 'Jonathan', 'Christina', 'Benjamin', 'Amanda', 'Nicholas',
  'Rebecca', 'Alexander', 'Heather', 'William', 'Elizabeth', 'Anthony', 'Patricia', 'Mark', 'Laura', 'Steven'
];

const lastNames = [
  'Johnson', 'Chen', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez',
  'Hernandez', 'Lopez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee',
  'Thompson', 'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson', 'Walker', 'Young',
  'Allen', 'King', 'Wright', 'Scott', 'Torres', 'Nguyen', 'Hill', 'Flores', 'Green', 'Adams',
  'Nelson', 'Baker', 'Hall', 'Rivera', 'Campbell', 'Mitchell', 'Carter', 'Roberts', 'Gomez', 'Phillips'
];

const locations = [
  'Manhattan', 'Brooklyn', 'Queens', 'Bronx', 'Staten Island', 'Long Island', 'Westchester', 'Nassau County'
];

const languageOptions = ['English', 'Spanish', 'French', 'Mandarin', 'Arabic', 'Hindi', 'Portuguese'];
const meetingTypeOptions = ['In-person', 'Video call', 'Phone call'];
const feeModelOptions = ['Hourly', 'Flat Fee', 'Contingency', 'Retainer'];
const timezoneOptions = [
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles'
];

const pickOne = <T,>(items: T[]) => items[Math.floor(Math.random() * items.length)];

const pickMany = <T,>(items: T[], count: number) => {
  const copy = [...items];
  const picked: T[] = [];
  for (let i = 0; i < Math.min(count, copy.length); i += 1) {
    const idx = Math.floor(Math.random() * copy.length);
    picked.push(copy.splice(idx, 1)[0]);
  }
  return picked;
};

const randomBetween = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

// Generate lawyers and clients
const testLawyers: TestUser[] = Array.from({ length: LAWYER_COUNT }, (_, i) => {
  const firstName = firstNames[i % firstNames.length];
  const lastName = lastNames[Math.floor(i / firstNames.length) % lastNames.length];
  const num = i + 1;

  return {
    email: `${TEST_EMAIL_PREFIX}lawyer${num}@example.com`,
    password: 'TestLawyer123!',
    fullName: `${firstName} ${lastName}`
  };
});

const testClients: TestUser[] = Array.from({ length: CLIENT_COUNT }, (_, i) => {
  const firstName = firstNames[(i + 7) % firstNames.length];
  const lastName = lastNames[(i + 13) % lastNames.length];
  const num = i + 1;

  return {
    email: `${TEST_EMAIL_PREFIX}client${num}@example.com`,
    password: 'TestClient123!',
    fullName: `${firstName} ${lastName}`
  };
});

async function seedTestData() {
  console.log('🌱 Starting test data seeding...\n');
  console.log('🔗 Testing Supabase connection...');
  console.log(`   URL: ${SUPABASE_URL}`);
  console.log(`   Key: ${SUPABASE_SERVICE_ROLE_KEY.substring(0, 20)}...${SUPABASE_SERVICE_ROLE_KEY.substring(SUPABASE_SERVICE_ROLE_KEY.length - 10)}\n`);

  try {
    // Test connection first
    await testConnection();
    console.log('✓ Connection successful!\n');

    // Step 1: Get or create practice areas
    console.log('📋 Checking practice areas...');
    const { data: practiceAreas, error: paError } = await supabase
      .from('practice_areas')
      .select('id, name')
      .limit(5);

    if (paError) throw paError;

    if (!practiceAreas || practiceAreas.length === 0) {
      console.log('⚠️  No practice areas found. Please seed practice areas first.');
      return;
    }

    const familyLawArea = practiceAreas.find(pa => pa.name.includes('Family') || pa.name.includes('Divorce'));
    const criminalArea = practiceAreas.find(pa => pa.name.includes('Criminal'));
    const businessArea = practiceAreas.find(pa => pa.name.includes('Business') || pa.name.includes('Corporate'));

    const selectedAreas = [familyLawArea, criminalArea, businessArea].filter(Boolean);
    console.log(`✓ Found ${practiceAreas.length} practice areas\n`);

    if (CLEANUP_BEFORE_SEED) {
      console.log('🧹 Cleaning up existing test data...');
      await cleanupExistingTestData();
      console.log('✓ Cleanup completed\n');
    }

    // Step 2: Create test users (lawyers and clients)
    console.log('👥 Creating test users...');
    const allUsers = [...testLawyers, ...testClients];

    // First, get list of existing users to check for duplicates
    const existingUsers = await listAllUsers();
    const existingUserMap = new Map(
      existingUsers
        .filter((user) => user.email)
        .map((user) => [user.email as string, user])
    );

    for (const user of allUsers) {
      // Check if user already exists by email
      const existingUser = existingUserMap.get(user.email);
      
      if (existingUser) {
        console.log(`  ⏭️  User ${user.email} already exists, skipping creation`);
        user.userId = existingUser.id;
      } else {
        // Create auth user
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
          email: user.email,
          password: user.password,
          email_confirm: true,
          user_metadata: {
            full_name: user.fullName,
            test_batch_id: TEST_BATCH_ID
          }
        });

        if (authError) throw authError;
        if (!authData.user) throw new Error(`Failed to create user ${user.email}`);
        
        user.userId = authData.user.id;
        console.log(`  ✓ Created user: ${user.email} (${user.userId})`);
      }

      // Update or create profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .upsert({
          user_id: user.userId,
          email: user.email,
          full_name: user.fullName
        }, {
          onConflict: 'user_id'
        })
        .select()
        .single();

      if (profileError) throw profileError;
      user.profileId = profile.id;
      console.log(`  ✓ Profile created/updated for ${user.email}`);
    }

    console.log('');

    // Step 3: Create lawyer profiles and expertise
    console.log('⚖️  Creating lawyer profiles...');
    
    for (let i = 0; i < testLawyers.length; i++) {
      const lawyer = testLawyers[i];
      const selectedPracticeAreas = pickMany(practiceAreas, randomBetween(1, 3));
      const primaryPracticeArea = selectedPracticeAreas[0] || selectedAreas[0];
      const locationIndex = i % locations.length;
      const selectedLocation = locations[locationIndex];
      
      if (!lawyer.userId) throw new Error(`Lawyer ${lawyer.email} missing userId`);

      // Vary experience (3-25 years) and hourly rate ($150-$600)
      const experienceYears = 3 + (i % 23); // 3 to 25 years
      const hourlyRate = 150 + Math.floor((i % 18) * 25); // $150 to $600 in $25 increments
      const meetingTypes = pickMany(meetingTypeOptions, randomBetween(1, meetingTypeOptions.length));
      const feeModels = pickMany(feeModelOptions, randomBetween(1, 2));
      const languages = pickMany(languageOptions, randomBetween(1, 3));
      const timezone = pickOne(timezoneOptions);
      const slotDurationMinutes = Math.random() > 0.7 ? 60 : 30;
      
      // Create lawyer profile
      // Note: get_lawyers_list() requires status='active' and verified=true
      const { data: lawyerProfile, error: lpError } = await supabase
        .from('lawyer_profiles')
        .upsert({
          user_id: lawyer.userId,
          specialty: primaryPracticeArea?.name || 'Family & Divorce',
          experience_years: experienceYears,
          hourly_rate: hourlyRate,
          bio: `Experienced ${primaryPracticeArea?.name || 'family law'} attorney with ${experienceYears} years of practice. Specializing in ${primaryPracticeArea?.name || 'family law'} matters throughout ${selectedLocation}.`,
          location: `${selectedLocation}, NY`,
          ny_locations: [selectedLocation],
          practice_areas: selectedPracticeAreas.map((area) => area.name),
          languages,
          meeting_types: meetingTypes,
          fee_models: feeModels,
          fee_model_rates: feeModels.reduce((acc, model) => {
            if (model === 'Hourly') acc[model] = hourlyRate;
            if (model === 'Flat Fee') acc[model] = hourlyRate * 2;
            if (model === 'Retainer') acc[model] = hourlyRate * 4;
            if (model === 'Contingency') acc[model] = 0.25;
            return acc;
          }, {} as Record<string, number>),
          timezone,
          slot_duration_minutes: slotDurationMinutes,
          status: 'active', // Must be 'active' to appear in get_lawyers_list()
          verified: true    // Must be true to appear in get_lawyers_list()
        }, {
          onConflict: 'user_id'
        })
        .select()
        .single();

      if (lpError) throw lpError;
      lawyer.lawyerProfileId = lawyerProfile.id;
      
      // Show progress for every 10th lawyer
      if ((i + 1) % 10 === 0 || i === testLawyers.length - 1) {
        console.log(`  ✓ Created ${i + 1}/${testLawyers.length} lawyer profiles...`);
      }

      // Add lawyer role
      const { error: roleError } = await supabase
        .from('user_roles')
        .upsert({
          user_id: lawyer.userId,
          role: 'lawyer'
        }, {
          onConflict: 'user_id,role'
        });

      if (roleError) throw roleError;

      // Add lawyer expertise
      for (const area of selectedPracticeAreas) {
        const { error: expertiseError } = await supabase
          .from('lawyer_expertise')
          .upsert(
            {
              lawyer_id: lawyerProfile.id,
              practice_area_id: area.id,
              years_experience: experienceYears
            },
            {
              onConflict: 'lawyer_id,practice_area_id'
            }
          );

        if (expertiseError && !expertiseError.message.includes('duplicate')) {
          throw expertiseError;
        }
      }
    }
    
    console.log(`  ✓ All ${testLawyers.length} lawyer profiles created successfully`);

    console.log('');

    // Add client roles
    console.log('👤 Assigning client roles...');
    for (const client of testClients) {
      if (!client.userId) continue;
      const { error: roleError } = await supabase
        .from('user_roles')
        .upsert(
          {
            user_id: client.userId,
            role: 'client'
          },
          { onConflict: 'user_id,role' }
        );
      if (roleError) throw roleError;
    }
    console.log(`  ✓ Assigned roles to ${testClients.length} clients`);

    console.log('');

    // Step 4: Create weekly availability + apply to dates
    console.log('📅 Creating availability templates...');

    const availabilityStart = new Date();
    const availabilityEnd = new Date();
    availabilityEnd.setDate(availabilityStart.getDate() + AVAILABILITY_WEEKS * 7);
    const startDateStr = availabilityStart.toISOString().split('T')[0];
    const endDateStr = availabilityEnd.toISOString().split('T')[0];

    for (let i = 0; i < testLawyers.length; i++) {
      const lawyer = testLawyers[i];
      if (!lawyer.lawyerProfileId) continue;

      const weekdayBlock = {
        lawyer_id: lawyer.lawyerProfileId,
        start_time: '09:00:00',
        end_time: '17:00:00'
      };

      const weeklyPayload = [1, 2, 3, 4, 5].map((day) => ({
        ...weekdayBlock,
        day_of_week: day
      }));

      // Give some lawyers a shorter Friday
      if (i % 4 === 0) {
        weeklyPayload.push({
          lawyer_id: lawyer.lawyerProfileId,
          day_of_week: 5,
          start_time: '09:00:00',
          end_time: '14:00:00'
        });
      }

      // Some weekend availability
      if (i % 6 === 0) {
        weeklyPayload.push({
          lawyer_id: lawyer.lawyerProfileId,
          day_of_week: 6,
          start_time: '10:00:00',
          end_time: '14:00:00'
        });
      }

      const { error: weeklyError } = await supabase
        .from('lawyer_weekly_availability')
        .insert(weeklyPayload);

      if (weeklyError && !weeklyError.message.includes('duplicate')) {
        throw weeklyError;
      }

      // Add a couple of days off
      if (i % 3 === 0) {
        const dayOffs = [
          new Date(availabilityStart.getTime() + (3 + (i % 5)) * 24 * 60 * 60 * 1000),
          new Date(availabilityStart.getTime() + (12 + (i % 7)) * 24 * 60 * 60 * 1000),
        ];
        const exceptionRows = dayOffs.map((date) => ({
          lawyer_id: lawyer.lawyerProfileId,
          exception_date: date.toISOString().split('T')[0],
          reason: i % 2 === 0 ? 'Vacation' : 'Court appearance'
        }));
        await supabase.from('lawyer_availability_exceptions').insert(exceptionRows);
      }

      await supabase.rpc('apply_weekly_availability', {
        p_lawyer_id: lawyer.lawyerProfileId,
        p_start_date: startDateStr,
        p_end_date: endDateStr
      });

      // Add a manual one-off slot for variety
      if (i % 5 === 0) {
        const oneOffDate = new Date(availabilityStart.getTime() + 5 * 24 * 60 * 60 * 1000);
        await supabase.from('lawyer_date_availability').insert({
          lawyer_id: lawyer.lawyerProfileId,
          availability_date: oneOffDate.toISOString().split('T')[0],
          start_time: '18:00:00',
          end_time: '19:00:00',
          source: 'manual'
        });
      }

      if ((i + 1) % 20 === 0 || i === testLawyers.length - 1) {
        console.log(`  ✓ Processed ${i + 1}/${testLawyers.length} availability templates...`);
      }
    }

    console.log('');

    // Step 5: Create consultations
    console.log('📞 Creating consultations...');

    const consultationRows = [];
    const now = new Date();
    for (const lawyer of testLawyers) {
      if (!lawyer.lawyerProfileId) continue;
      for (let i = 0; i < CONSULTATIONS_PER_LAWYER; i += 1) {
        const client = pickOne(testClients);
        if (!client?.userId) continue;
        const practiceArea = pickOne(practiceAreas);
        const offsetDays = randomBetween(-30, 30);
        const consultationDate = new Date(now.getTime() + offsetDays * 24 * 60 * 60 * 1000);
        consultationDate.setHours(9 + (i % 8), 0, 0, 0);
        const isPast = consultationDate < now;
        const status = isPast
          ? pickOne(['completed', 'cancelled'])
          : pickOne(['pending', 'confirmed']);

        consultationRows.push({
          client_id: client.userId,
          lawyer_id: lawyer.lawyerProfileId,
          practice_area_id: practiceArea?.id || null,
          scheduled_at: consultationDate.toISOString(),
          duration_minutes: 30,
          status,
          notes: 'Seeded consultation for testing'
        });
      }
    }

    if (consultationRows.length > 0) {
      const { error: consError } = await supabase
        .from('consultations')
        .insert(consultationRows);
      if (consError) throw consError;
      console.log(`  ✓ Created ${consultationRows.length} consultations`);
    }

    console.log('');

    // Step 6: Create conversations + messages
    console.log('💬 Creating conversations and messages...');
    const lawyerProfileIds = testLawyers.map((lawyer) => lawyer.lawyerProfileId).filter(Boolean) as string[];
    const clientIds = testClients.map((client) => client.userId).filter(Boolean) as string[];
    const lawyerUserByProfile = new Map(
      testLawyers
        .filter((lawyer) => lawyer.lawyerProfileId && lawyer.userId)
        .map((lawyer) => [lawyer.lawyerProfileId as string, lawyer.userId as string])
    );

    const conversationPayload: Array<{ lawyer_id: string; client_id: string }> = [];
    const conversationKey = new Set<string>();
    for (const lawyer of testLawyers) {
      if (!lawyer.lawyerProfileId) continue;
      const clientsForLawyer = pickMany(testClients, CONVERSATIONS_PER_LAWYER);
      for (const client of clientsForLawyer) {
        if (!client.userId) continue;
        const key = `${lawyer.lawyerProfileId}_${client.userId}`;
        if (conversationKey.has(key)) continue;
        conversationKey.add(key);
        conversationPayload.push({
          lawyer_id: lawyer.lawyerProfileId,
          client_id: client.userId
        });
      }
    }

    let conversationsInserted: Array<{ id: string; lawyer_id: string; client_id: string }> = [];
    if (conversationPayload.length > 0) {
      const { data, error: convError } = await supabase
        .from('conversations')
        .insert(conversationPayload)
        .select('id, lawyer_id, client_id');
      if (convError) throw convError;
      conversationsInserted = data || [];
      console.log(`  ✓ Created ${conversationsInserted.length} conversations`);
    }

    if (conversationsInserted.length > 0) {
      const messageRows = [];
      for (const convo of conversationsInserted) {
        const messagesCount = randomBetween(3, MESSAGES_PER_CONVERSATION);
        const lawyerUserId = lawyerUserByProfile.get(convo.lawyer_id);
        const clientUserId = convo.client_id;
        if (!lawyerUserId || !clientUserId) continue;
        for (let i = 0; i < messagesCount; i += 1) {
          const senderId = i % 2 === 0 ? lawyerUserId : clientUserId;
          const createdAt = new Date(Date.now() - randomBetween(1, 20) * 86400000);
          messageRows.push({
            conversation_id: convo.id,
            sender_id: senderId,
            content: i % 2 === 0
              ? 'Thanks for reaching out — happy to help.'
              : 'Thank you! I have a quick question about my case.',
            created_at: createdAt.toISOString(),
            status: 'delivered'
          });
        }
      }

      if (messageRows.length > 0) {
        const chunkSize = 500;
        for (let i = 0; i < messageRows.length; i += chunkSize) {
          const chunk = messageRows.slice(i, i + chunkSize);
          const { error: msgError } = await supabase.from('messages').insert(chunk);
          if (msgError) throw msgError;
        }
        console.log(`  ✓ Created ${messageRows.length} messages`);
      }
    }

    console.log('');

    // Step 7: Create profile views
    console.log('👀 Creating profile views...');
    const profileViewRows = [];
    for (const lawyerProfileId of lawyerProfileIds) {
      for (let i = 0; i < PROFILE_VIEWS_PER_LAWYER; i += 1) {
        const viewerId = Math.random() > 0.4 ? pickOne(clientIds) : null;
        const viewedAt = new Date(Date.now() - randomBetween(1, 45) * 86400000);
        profileViewRows.push({
          lawyer_id: lawyerProfileId,
          viewer_id: viewerId,
          viewed_at: viewedAt.toISOString()
        });
      }
    }
    if (profileViewRows.length > 0) {
      const chunkSize = 500;
      for (let i = 0; i < profileViewRows.length; i += chunkSize) {
        const chunk = profileViewRows.slice(i, i + chunkSize);
        const { error: viewError } = await supabase.from('profile_views').insert(chunk);
        if (viewError) throw viewError;
      }
      console.log(`  ✓ Created ${profileViewRows.length} profile views`);
    }

    console.log('');

    // Step 8: Create reviews for completed consultations
    console.log('⭐ Creating lawyer reviews...');
    const { data: completedConsultations } = await supabase
      .from('consultations')
      .select('id, lawyer_id, client_id')
      .in('lawyer_id', lawyerProfileIds)
      .eq('status', 'completed');

    const reviewRows = (completedConsultations || [])
      .filter(() => Math.random() > 0.5)
      .map((consultation) => ({
        consultation_id: consultation.id,
        lawyer_id: consultation.lawyer_id,
        client_id: consultation.client_id,
        rating: randomBetween(3, 5),
        review_text: 'Great experience. Clear communication and helpful advice.'
      }));

    if (reviewRows.length > 0) {
      const { error: reviewError } = await supabase.from('lawyer_reviews').insert(reviewRows);
      if (reviewError) throw reviewError;
      console.log(`  ✓ Created ${reviewRows.length} reviews`);
    }

    console.log('\n✅ Test data seeding completed successfully!');
    console.log(`\n📝 Test batch ID: ${TEST_BATCH_ID}`);
    console.log(`👩‍⚖️ Lawyers seeded: ${testLawyers.length}`);
    console.log(`👤 Clients seeded: ${testClients.length}`);
    console.log(`📞 Consultations seeded: ${consultationRows.length}`);
    console.log(`💬 Conversations seeded: ${CONVERSATIONS_PER_LAWYER * testLawyers.length}`);
    console.log('\n📧 Sample logins:');
    testLawyers.slice(0, 5).forEach(l => console.log(`   - ${l.email} / ${l.password}`));
    testClients.slice(0, 5).forEach(c => console.log(`   - ${c.email} / ${c.password}`));
    console.log('\n💡 Run "npm run cleanup:test" to remove all test data\n');

  } catch (error: any) {
    console.error('\n❌ Error seeding test data:');
    console.error(error.message);
    if (error.details) console.error(error.details);
    process.exit(1);
  }
}

seedTestData();
