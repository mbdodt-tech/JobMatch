/**
 * Jobmatch — Seed Script
 * Creates dummy organizations, students, stores, swipes, and matches
 * to test the full app flow end-to-end.
 * 
 * Run: node scripts/seed.mjs
 */

const SUPABASE_URL = 'https://nkurrrzqwgjwwtnjnluk.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5rdXJycnpxd2dqd3d0bmpubHVrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODExNjE2OTAsImV4cCI6MjA5NjczNzY5MH0.lc_aP-V5vxE6_00ft6SHYeFAqhCX6ck8Um6ljzlfYeA';

// Helper: Supabase REST API call
async function supabaseRest(table, method, body, params = '') {
  const url = `${SUPABASE_URL}/rest/v1/${table}${params}`;
  const headers = {
    'apikey': SUPABASE_ANON_KEY,
    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
    'Content-Type': 'application/json',
    'Prefer': method === 'POST' ? 'return=representation' : 'return=representation',
  };
  const res = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  if (!res.ok) {
    console.error(`❌ ${method} ${table} failed (${res.status}):`, text);
    return null;
  }
  try { return JSON.parse(text); } catch { return text; }
}

// Helper: Create auth user
async function createAuthUser(email, password, metadata) {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email,
      password,
      data: metadata,
    }),
  });
  const data = await res.json();
  if (!res.ok) {
    console.error(`❌ Auth signup failed for ${email}:`, data);
    return null;
  }
  return data;
}

// Helper: Sign in and get token
async function signIn(email, password) {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!res.ok) {
    console.error(`❌ Sign-in failed for ${email}:`, data);
    return null;
  }
  return data;
}

// Authenticated REST call
async function authRest(table, method, body, token, params = '') {
  const url = `${SUPABASE_URL}/rest/v1/${table}${params}`;
  const headers = {
    'apikey': SUPABASE_ANON_KEY,
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
    'Prefer': 'return=representation',
  };
  const res = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  if (!res.ok) {
    console.error(`❌ ${method} ${table} failed (${res.status}):`, text);
    return null;
  }
  try { return JSON.parse(text); } catch { return text; }
}

async function main() {
  console.log('🌱 Jobmatch Seed Script\n');

  // ─── Step 1: Check existing tables ─────────────────────────────────────────
  console.log('📋 Step 1: Checking existing data...');
  
  const existingOrgs = await supabaseRest('organizations', 'GET', null, '?select=id,name');
  console.log('  Organizations:', existingOrgs?.length || 0);
  
  const existingProfiles = await supabaseRest('profiles', 'GET', null, '?select=id,full_name,role');
  console.log('  Profiles:', existingProfiles?.length || 0);
  
  const existingStores = await supabaseRest('stores', 'GET', null, '?select=id,name');
  console.log('  Stores:', existingStores?.length || 0);

  // ─── Step 2: Create Organization ───────────────────────────────────────────
  console.log('\n🏫 Step 2: Creating organization...');
  
  let orgId;
  if (existingOrgs && existingOrgs.length > 0) {
    orgId = existingOrgs[0].id;
    console.log(`  ✅ Using existing org: "${existingOrgs[0].name}" (${orgId})`);
  } else {
    const org = await supabaseRest('organizations', 'POST', {
      name: 'Copenhagen Business Academy',
      slug: 'cphbusiness',
      address: 'Landemærket 11',
      city: 'København',
      postal_code: '1119',
      phone: '+45 36 15 45 00',
      email: 'info@cphbusiness.dk',
    });
    if (org && org.length > 0) {
      orgId = org[0].id;
      console.log(`  ✅ Created org: ${orgId}`);
    } else {
      console.log('  ⚠️ Could not create org via REST (RLS). Trying auth approach...');
    }
  }

  // ─── Step 3: Create test users via Auth ────────────────────────────────────
  console.log('\n👤 Step 3: Creating test users...');

  const testUsers = [
    // Students
    { email: 'emil@test.jobmatch.dk', password: 'Test1234!', meta: { full_name: 'Emil Andersen', role: 'student' } },
    { email: 'sofia@test.jobmatch.dk', password: 'Test1234!', meta: { full_name: 'Sofia Nielsen', role: 'student' } },
    { email: 'oliver@test.jobmatch.dk', password: 'Test1234!', meta: { full_name: 'Oliver Petersen', role: 'student' } },
    { email: 'ida@test.jobmatch.dk', password: 'Test1234!', meta: { full_name: 'Ida Christensen', role: 'student' } },
    { email: 'freja@test.jobmatch.dk', password: 'Test1234!', meta: { full_name: 'Freja Larsen', role: 'student' } },
    // Store managers
    { email: 'lars@magasin.dk', password: 'Test1234!', meta: { full_name: 'Lars Eriksen', role: 'store_manager' } },
    { email: 'anne@matas.dk', password: 'Test1234!', meta: { full_name: 'Anne Sørensen', role: 'store_manager' } },
    { email: 'peter@ikea.dk', password: 'Test1234!', meta: { full_name: 'Peter Olsen', role: 'store_manager' } },
    // School admin
    { email: 'admin@cphbusiness.dk', password: 'Test1234!', meta: { full_name: 'Maria Hansen', role: 'school_admin' } },
  ];

  const createdUsers = [];

  for (const user of testUsers) {
    console.log(`  Creating ${user.meta.role}: ${user.meta.full_name} (${user.email})...`);
    const result = await createAuthUser(user.email, user.password, user.meta);
    
    if (result && result.user) {
      console.log(`    ✅ Created user: ${result.user.id}`);
      createdUsers.push({ ...user, id: result.user.id });
    } else if (result && result.id) {
      console.log(`    ✅ Created user: ${result.id}`);
      createdUsers.push({ ...user, id: result.id });
    } else {
      console.log(`    ⚠️ User may already exist, trying sign-in...`);
      const signInResult = await signIn(user.email, user.password);
      if (signInResult && signInResult.user) {
        console.log(`    ✅ Signed in as: ${signInResult.user.id}`);
        createdUsers.push({ ...user, id: signInResult.user.id, token: signInResult.access_token });
      } else {
        console.log(`    ❌ Could not create or sign in`);
      }
    }
  }

  // ─── Step 4: Sign in all users and update profiles ─────────────────────────
  console.log('\n📝 Step 4: Signing in and updating profiles...');

  const studentProfiles = [
    { email: 'emil@test.jobmatch.dk', profile: { education_line: 'detail', youth_education: 'hhx', youth_education_school: 'Niels Brock', primary_style: 'action_oriented', secondary_style: 'social', work_experience: 'Deltidsjob hos H&M i 6 mdr. Stærk i kundeservice.', gdpr_consent: true, onboarding_completed: true, date_of_birth: '2005-03-15' } },
    { email: 'sofia@test.jobmatch.dk', profile: { education_line: 'kontoradministration', youth_education: 'stx', youth_education_school: 'Frederiksberg Gymnasium', primary_style: 'analytical', secondary_style: 'stabilizing', work_experience: 'Kontorpraktik hos revisor i 3 mdr.', gdpr_consent: true, onboarding_completed: true, date_of_birth: '2004-09-22' } },
    { email: 'oliver@test.jobmatch.dk', profile: { education_line: 'handel_salg', youth_education: 'eux', youth_education_school: 'TEC Ballerup', primary_style: 'social', secondary_style: 'action_oriented', work_experience: 'Sælger hos Elgiganten weekender.', gdpr_consent: true, onboarding_completed: true, date_of_birth: '2005-06-01' } },
    { email: 'ida@test.jobmatch.dk', profile: { education_line: 'detail', youth_education: 'hf', youth_education_school: 'VUC København', primary_style: 'stabilizing', secondary_style: 'analytical', work_experience: 'Ingen erfaring endnu - ivrig efter at lære!', gdpr_consent: true, onboarding_completed: true, date_of_birth: '2006-01-10' } },
    { email: 'freja@test.jobmatch.dk', profile: { education_line: 'handel_logistik', youth_education: 'htx', youth_education_school: 'Roskilde HTX', primary_style: 'analytical', secondary_style: 'action_oriented', work_experience: 'Lagermedhjælper hos PostNord 4 mdr.', gdpr_consent: false, onboarding_completed: true, date_of_birth: '2005-11-05' } },
  ];

  for (const sp of studentProfiles) {
    const user = createdUsers.find(u => u.email === sp.email);
    if (!user) continue;

    // Sign in to get token
    let token = user.token;
    if (!token) {
      const signInResult = await signIn(sp.email, 'Test1234!');
      if (signInResult) token = signInResult.access_token;
    }
    if (!token) { console.log(`  ❌ Could not get token for ${sp.email}`); continue; }

    const updateData = {
      ...sp.profile,
      organization_id: orgId || null,
    };

    const result = await authRest('profiles', 'PATCH', updateData, token, `?id=eq.${user.id}`);
    console.log(`  ✅ Updated profile: ${user.meta.full_name}`);
  }

  // ─── Step 5: Create stores ─────────────────────────────────────────────────
  console.log('\n🏪 Step 5: Creating stores...');

  const storeData = [
    { managerEmail: 'lars@magasin.dk', store: { name: 'Magasin du Nord', description: 'Danmarks ældste stormagasin med fokus på mode, skønhed og livsstil. Vi tilbyder en dynamisk praktikoplevelse.', address: 'Kongens Nytorv 13', city: 'København', postal_code: '1095', education_lines: ['detail', 'handel_salg'], internship_slots: 3, phone: '+45 33 11 44 33', email: 'praktik@magasin.dk', website: 'https://magasin.dk' } },
    { managerEmail: 'anne@matas.dk', store: { name: 'Matas Strøget', description: 'Nordens førende skønhedsbutik. Bliv en del af vores team og lær alt om kundeservice og produktrådgivning.', address: 'Strøget 24', city: 'København', postal_code: '1160', education_lines: ['detail'], internship_slots: 2, phone: '+45 33 12 55 66', email: 'praktik@matas.dk', website: 'https://matas.dk' } },
    { managerEmail: 'peter@ikea.dk', store: { name: 'IKEA Gentofte', description: 'Verdens største møbelkæde. Her får du en alsidig praktik med fokus på logistik, kundeservice og salg.', address: 'Ørnegårdsvej 6', city: 'Gentofte', postal_code: '2820', education_lines: ['detail', 'handel_logistik', 'handel_salg'], internship_slots: 5, phone: '+45 38 17 60 00', email: 'jobs@ikea.dk', website: 'https://ikea.dk' } },
  ];

  const createdStores = [];

  for (const sd of storeData) {
    const manager = createdUsers.find(u => u.email === sd.managerEmail);
    if (!manager) { console.log(`  ❌ Manager ${sd.managerEmail} not found`); continue; }

    let token = manager.token;
    if (!token) {
      const signInResult = await signIn(sd.managerEmail, 'Test1234!');
      if (signInResult) token = signInResult.access_token;
    }
    if (!token) { console.log(`  ❌ Could not get token for ${sd.managerEmail}`); continue; }

    const storePayload = {
      ...sd.store,
      manager_id: manager.id,
      organization_id: orgId || null,
      is_active: true,
    };

    const result = await authRest('stores', 'POST', storePayload, token);
    if (result && result.length > 0) {
      console.log(`  ✅ Created store: ${sd.store.name} (${result[0].id})`);
      createdStores.push({ ...result[0], managerEmail: sd.managerEmail });
    } else {
      // Check if store already exists
      const existing = await authRest('stores', 'GET', null, token, `?manager_id=eq.${manager.id}&select=id,name`);
      if (existing && existing.length > 0) {
        console.log(`  ✅ Store already exists: ${existing[0].name}`);
        createdStores.push({ ...existing[0], managerEmail: sd.managerEmail });
      }
    }
  }

  // ─── Step 6: Create swipes ─────────────────────────────────────────────────
  console.log('\n💫 Step 6: Creating swipes...');

  const students = createdUsers.filter(u => u.meta.role === 'student');
  
  if (createdStores.length > 0 && students.length > 0) {
    for (const student of students) {
      let token = student.token;
      if (!token) {
        const signInResult = await signIn(student.email, 'Test1234!');
        if (signInResult) token = signInResult.access_token;
      }
      if (!token) continue;

      for (const store of createdStores) {
        // Most students swipe right on most stores
        const direction = Math.random() > 0.2 ? 'right' : 'left';
        
        const swipe = await authRest('swipes', 'POST', {
          profile_id: student.id,
          store_id: store.id,
          swiper_role: 'student',
          direction,
        }, token);

        if (swipe) {
          console.log(`  ${direction === 'right' ? '💚' : '❌'} ${student.meta.full_name} → ${store.name}: ${direction}`);
        }
      }
    }

    // Store managers swipe on students who swiped right on them
    console.log('\n🏪 Step 7: Store managers swiping on students...');
    
    for (const store of createdStores) {
      const manager = createdUsers.find(u => u.email === store.managerEmail);
      if (!manager) continue;

      let token = manager.token;
      if (!token) {
        const signInResult = await signIn(manager.email, 'Test1234!');
        if (signInResult) token = signInResult.access_token;
      }
      if (!token) continue;

      // Get students who swiped right on this store
      const rightSwipes = await authRest('swipes', 'GET', null, token, 
        `?store_id=eq.${store.id}&swiper_role=eq.student&direction=eq.right&select=profile_id`);
      
      if (rightSwipes) {
        for (const swipe of rightSwipes) {
          // Manager swipes right on ~60% of interested students
          const direction = Math.random() > 0.4 ? 'right' : 'left';
          const studentUser = students.find(s => s.id === swipe.profile_id);
          
          const managerSwipe = await authRest('swipes', 'POST', {
            profile_id: swipe.profile_id,
            store_id: store.id,
            swiper_role: 'store_manager',
            direction,
          }, token);

          if (managerSwipe) {
            console.log(`  ${direction === 'right' ? '💚' : '❌'} ${store.name} → ${studentUser?.meta?.full_name || swipe.profile_id}: ${direction}`);
          }
        }
      }
    }
  }

  // ─── Step 8: Check results ─────────────────────────────────────────────────
  console.log('\n📊 Step 8: Checking results...');
  
  // Try to read matches (might fail due to RLS)
  for (const student of students) {
    let token = student.token;
    if (!token) {
      const signInResult = await signIn(student.email, 'Test1234!');
      if (signInResult) token = signInResult.access_token;
    }
    if (!token) continue;

    const matches = await authRest('matches', 'GET', null, token, 
      `?student_id=eq.${student.id}&select=id,store_id,status,matched_at`);
    
    if (matches && matches.length > 0) {
      console.log(`  🎉 ${student.meta.full_name}: ${matches.length} match(es)!`);
    } else {
      console.log(`  ⏳ ${student.meta.full_name}: ${matches?.length || 0} matches`);
    }
  }

  // Summary
  console.log('\n' + '═'.repeat(50));
  console.log('✅ Seed complete!');
  console.log('═'.repeat(50));
  console.log(`\nTest credentials (password: Test1234!):`);
  console.log('─'.repeat(50));
  console.log('Students:');
  students.forEach(s => console.log(`  📧 ${s.email}`));
  console.log('Store Managers:');
  createdUsers.filter(u => u.meta.role === 'store_manager').forEach(s => console.log(`  📧 ${s.email}`));
  console.log('School Admin:');
  createdUsers.filter(u => u.meta.role === 'school_admin').forEach(s => console.log(`  📧 ${s.email}`));
  console.log(`\n🌐 App: http://localhost:3000`);
}

main().catch(console.error);
