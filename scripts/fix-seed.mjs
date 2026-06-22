/**
 * Jobmatch — Fix Seed Script
 * 
 * Links existing stores to newly created managers,
 * and creates swipes so both sides have cards to see.
 * 
 * Run: node scripts/fix-seed.mjs
 */

const SUPABASE_URL = 'https://nkurrrzqwgjwwtnjnluk.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5rdXJycnpxd2dqd3d0bmpubHVrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODExNjE2OTAsImV4cCI6MjA5NjczNzY5MH0.lc_aP-V5vxE6_00ft6SHYeFAqhCX6ck8Um6ljzlfYeA';

const PASSWORD = 'Test1234!';

// Manager email -> store name mapping
const MANAGER_STORE_MAP = {
  'lars@magasin.dk': 'Magasin du Nord',
  'anne@matas.dk': 'Matas Strøget',
  'peter@ikea.dk': 'IKEA Gentofte',
};

const STUDENT_EMAILS = [
  'emil@test.jobmatch.dk',
  'sofia@test.jobmatch.dk',
  'oliver@test.jobmatch.dk',
  'ida@test.jobmatch.dk',
  'freja@test.jobmatch.dk',
];

async function signIn(email) {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: { 'apikey': SUPABASE_ANON_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: PASSWORD }),
  });
  const data = await res.json();
  if (!res.ok) {
    console.error(`  ❌ Sign-in failed for ${email}:`, data.msg || data.error);
    return null;
  }
  return data;
}

async function authRest(table, method, body, token, params = '') {
  const url = `${SUPABASE_URL}/rest/v1/${table}${params}`;
  const res = await fetch(url, {
    method,
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  if (!res.ok) {
    console.error(`  ❌ ${method} ${table} failed (${res.status}):`, text);
    return null;
  }
  try { return JSON.parse(text); } catch { return text; }
}

async function main() {
  console.log('🔧 Jobmatch — Fix Seed Script\n');

  // ─── Step 1: Sign in all managers and update stores ─────────────────
  console.log('🏪 Step 1: Linking stores to new managers...\n');

  const stores = [];
  for (const [email, storeName] of Object.entries(MANAGER_STORE_MAP)) {
    const session = await signIn(email);
    if (!session) continue;

    const userId = session.user.id;
    const token = session.access_token;
    console.log(`  ✅ ${email} → user ${userId}`);

    // Check if this manager already has a store
    const existing = await authRest('stores', 'GET', null, token, `?manager_id=eq.${userId}&select=id,name`);
    if (existing && existing.length > 0) {
      console.log(`     Already has store: ${existing[0].name}`);
      stores.push({ id: existing[0].id, name: existing[0].name, managerId: userId, email, token });
      continue;
    }

    // Try to create store for this manager
    const storeConfigs = {
      'Magasin du Nord': { description: 'Danmarks ældste stormagasin med fokus på mode, skønhed og livsstil. Vi tilbyder en dynamisk praktikoplevelse med fokus på kundeservice og salg.', address: 'Kongens Nytorv 13', city: 'København', postal_code: '1095', education_lines: ['detail', 'handel_salg'], internship_slots: 3, phone: '+45 33 11 44 33', email: 'praktik@magasin.dk', website: 'https://magasin.dk' },
      'Matas Strøget': { description: 'Nordens førende skønhedsbutik. Bliv en del af vores team og lær alt om kundeservice og produktrådgivning i en travl butik.', address: 'Strøget 24', city: 'København', postal_code: '1160', education_lines: ['detail'], internship_slots: 2, phone: '+45 33 12 55 66', email: 'praktik@matas.dk', website: 'https://matas.dk' },
      'IKEA Gentofte': { description: 'Verdens største møbelkæde. Her får du en alsidig praktik med fokus på logistik, kundeservice og salg i et internationalt miljø.', address: 'Ørnegårdsvej 6', city: 'Gentofte', postal_code: '2820', education_lines: ['detail', 'handel_logistik', 'handel_salg'], internship_slots: 5, phone: '+45 38 17 60 00', email: 'jobs@ikea.dk', website: 'https://ikea.dk' },
    };

    const cfg = storeConfigs[storeName];
    const result = await authRest('stores', 'POST', {
      ...cfg,
      name: storeName,
      manager_id: userId,
      is_active: true,
    }, token);

    if (result && result.length > 0) {
      console.log(`     ✅ Created store: ${storeName} (${result[0].id})`);
      stores.push({ id: result[0].id, name: storeName, managerId: userId, email, token });
    } else {
      console.log(`     ⚠️ Could not create store ${storeName}`);
    }
  }

  if (stores.length === 0) {
    console.log('\n❌ No stores available. Cannot create swipes.');
    return;
  }

  // ─── Step 2: Sign in students ───────────────────────────────────────
  console.log('\n👤 Step 2: Signing in students...\n');

  const students = [];
  for (const email of STUDENT_EMAILS) {
    const session = await signIn(email);
    if (!session) continue;
    console.log(`  ✅ ${email} → ${session.user.id}`);
    students.push({ id: session.user.id, email, token: session.access_token });
  }

  // ─── Step 3: Students swipe RIGHT on all stores ─────────────────────
  // This ensures stores appear as "interested students" in manager feed
  console.log('\n💫 Step 3: Students swiping RIGHT on stores...\n');

  for (const student of students) {
    for (const store of stores) {
      // Check if already swiped
      const existing = await authRest('swipes', 'GET', null, student.token,
        `?profile_id=eq.${student.id}&store_id=eq.${store.id}&swiper_role=eq.student&select=id`);
      
      if (existing && existing.length > 0) {
        console.log(`  ⏭️  ${student.email} → ${store.name}: already swiped`);
        continue;
      }

      const result = await authRest('swipes', 'POST', {
        profile_id: student.id,
        store_id: store.id,
        swiper_role: 'student',
        direction: 'right',
      }, student.token);

      if (result) {
        console.log(`  💚 ${student.email} → ${store.name}: RIGHT`);
      }
    }
  }

  // ─── Step 4: Summary ───────────────────────────────────────────────
  console.log('\n' + '═'.repeat(55));
  console.log('✅ Fix complete!');
  console.log('═'.repeat(55));
  console.log('\nFlowet er nu klar til test:');
  console.log('');
  console.log('📱 ELEV-FLOW (swipe virksomheder):');
  console.log('   Log ind som en elev — butikkerne vises i feedet');
  console.log('   (eleverne har allerede swiped RIGHT, så du kan');
  console.log('    teste med en ny elev eller nulstille swipes)');
  console.log('');
  console.log('🏪 MANAGER-FLOW (swipe elever):');
  console.log('   Log ind som en butikschef — interesserede elever vises');
  stores.forEach(s => {
    console.log(`   📧 ${s.email} → ${s.name}`);
  });
  console.log('');
  console.log(`Password for alle: ${PASSWORD}`);
  console.log('');
  console.log('🌐 App: http://localhost:3000');
}

main().catch(console.error);
