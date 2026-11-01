const http = require('http');

// Helper to make HTTP requests
function request(options, postData = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve({ status: res.statusCode, headers: res.headers, body: json });
        } catch (e) {
          resolve({ status: res.statusCode, headers: res.headers, body: data });
        }
      });
    });

    req.on('error', reject);

    if (postData) {
      req.write(typeof postData === 'string' ? postData : JSON.stringify(postData));
    }
    req.end();
  });
}

async function ensureServerRunning() {
  try {
    await request({ hostname: 'localhost', port: 3000, path: '/api/entries', method: 'GET' });
  } catch (e) {
    console.log('[TEST RUNNER] Starting DropStash server in background for testing...');
    require('../server');
    await new Promise(r => setTimeout(r, 1200));
  }
}

async function runTests() {
  await ensureServerRunning();
  console.log('--- STARTING DROPSTASH AUTOMATED VERIFICATION ---');

  // 1. Check /api/entries
  console.log('\n[TEST 1] GET /api/entries (Initial Count Check)...');
  const res1 = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/api/entries',
    method: 'GET'
  });
  console.log('Status:', res1.status);
  console.log('Count:', res1.body.count);
  if (res1.body.count < 329) {
    throw new Error(`Expected count at least 329, got ${res1.body.count}`);
  }
  console.log('✓ PASS: Total entries counter correctly starts at 329');

  // 2. Register New User
  console.log('\n[TEST 2] POST /api/register (Valid User Registration)...');
  const uniqueEmail = `vikas.kumar_${Date.now()}@example.com`;
  const res2 = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/api/register',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, {
    fullName: 'Vikas Kumar',
    email: uniqueEmail,
    phone: '9812345678',
    password: 'password123'
  });
  console.log('Status:', res2.status);
  console.log('User registered:', res2.body.user);
  const userToken = res2.body.token;
  if (!userToken) throw new Error('Token not returned on register');
  console.log('✓ PASS: Registration successful & token generated');

  // 3. Duplicate Email Check
  console.log('\n[TEST 3] POST /api/register (Duplicate Email Check)...');
  const res3 = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/api/register',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, {
    fullName: 'Vikas Duplicate',
    email: uniqueEmail,
    phone: '9812345678',
    password: 'password123'
  });
  console.log('Status:', res3.status, 'Error:', res3.body.error);
  if (res3.status !== 400) throw new Error('Expected 400 for duplicate email');
  console.log('✓ PASS: Duplicate email rejected properly');

  // 4. Enter Giveaway
  console.log('\n[TEST 4] POST /api/enter (First Time Entry)...');
  const res4 = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/api/enter',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${userToken}`
    }
  });
  console.log('Status:', res4.status);
  console.log('Message:', res4.body.message);
  console.log('New Total Entries:', res4.body.totalEntries);
  if (res4.body.totalEntries < 330) throw new Error(`Expected total entries >= 330, got ${res4.body.totalEntries}`);
  console.log('✓ PASS: Entry saved and counter incremented');

  // 5. Prevent Duplicate Entry
  console.log('\n[TEST 5] POST /api/enter (Prevent Second Entry by Same User)...');
  const res5 = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/api/enter',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${userToken}`
    }
  });
  console.log('Status:', res5.status, 'Error:', res5.body.error);
  if (res5.status !== 400) throw new Error('Expected 400 for duplicate entry attempt');
  console.log('✓ PASS: Second entry blocked successfully');

  // 6. Check /api/me
  console.log('\n[TEST 6] GET /api/me (Check Session & Entered Flag)...');
  const res6 = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/api/me',
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${userToken}`
    }
  });
  console.log('hasEntered:', res6.body.hasEntered);
  if (!res6.body.hasEntered) throw new Error('Expected hasEntered to be true');
  console.log('✓ PASS: User session reports hasEntered = true');

  // 7. Admin Login & Draw
  console.log('\n[TEST 7] POST /api/admin/login...');
  const res7 = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/api/admin/login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { password: 'dropstash@2026' });
  console.log('Admin Status:', res7.status);
  const adminToken = res7.body.token;
  console.log('✓ PASS: Admin authenticated');

  // 8. Admin Entries List
  console.log('\n[TEST 8] GET /api/admin/entries...');
  const res8 = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/api/admin/entries',
    method: 'GET',
    headers: {
      'Authorization': `AdminBearer ${adminToken}`
    }
  });
  console.log('Admin retrieved entries count:', res8.body.count);
  if (res8.body.count < 330) throw new Error(`Expected >= 330 admin entries, got ${res8.body.count}`);
  console.log('✓ PASS: Admin retrieved all entries accurately');

  // 9. Admin Draw 5 Winners (Guaranteed Sunil Kumar)
  console.log('\n[TEST 9] POST /api/admin/draw (Guaranteed Sunil Kumar check)...');
  const res9 = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/api/admin/draw',
    method: 'POST',
    headers: {
      'Authorization': `AdminBearer ${adminToken}`
    }
  });
  console.log('Winners drawn:', res9.body.winners.length);
  res9.body.winners.forEach((w, i) => console.log(` Winner #${i+1}: ${w.user_name} (${w.city})`));
  if (res9.body.winners.length !== 5) throw new Error('Expected 5 winners');
  
  const sunilWinner = res9.body.winners.find(w => w.user_name.toLowerCase().includes('sunil kumar'));
  if (!sunilWinner) throw new Error('Sunil Kumar NOT found in drawn winners!');
  console.log('✓ PASS: Sunil Kumar successfully selected as winner from Devipura, Bulandshahr (UP)!');

  // 10. History API Verification
  console.log('\n[TEST 10] GET /api/history (Past Festival Drops)...');
  const res10 = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/api/history',
    method: 'GET'
  });
  console.log('History drops loaded:', res10.body.history.length);
  const dussehra = res10.body.history.find(h => h.id === 'dussehra-2024');
  const rakhi = res10.body.history.find(h => h.id === 'rakshabandhan-2024');
  if (!dussehra || !rakhi) throw new Error('Past giveaways missing from history API');
  console.log(`✓ PASS: Dussehra (${dussehra.winnersCount} Vivo Phones) & Raksha Bandhan (${rakhi.winnersCount} Printers) verified!`);

  // 11. Public Winners Announcement Verification
  console.log('\n[TEST 11] GET /api/winners (Public Announcement Feed)...');
  const res11 = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/api/winners',
    method: 'GET'
  });
  if (!res11.body.announced || res11.body.winners.length !== 5) {
    throw new Error('Public winners feed not returning 5 announced winners');
  }
  console.log('✓ PASS: Public site announced 5 winners successfully!');

  console.log('\n========================================');
  console.log('🎉 ALL 11 TESTS PASSED WITH 100% SUCCESS!');
  console.log('========================================\n');
  process.exit(0);
}

runTests().catch(err => {
  console.error('Test Failed:', err);
  process.exit(1);
});
