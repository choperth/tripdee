/**
 * REGRESSION LOOP: driver signs in with Google, fills vehicle data in the
 * Driver Portal, saves — the data must reach the database, and must NOT
 * appear on the public site until an administrator approves it.
 *
 * The session cookie is minted the same way the real OAuth callback does it,
 * so this exercises the genuine server-side authorisation path.
 *
 * Run:  node repro-driver-vehicle.js
 */
const PW = 'C:/Users/ChopperCNX/AppData/Local/npm-cache/_npx/0b9ff77863cb6e9f/node_modules/playwright';
const { chromium } = require(PW);
const fs = require('fs');
const crypto = require('crypto');

const BASE = process.env.TD_BASE || 'http://localhost:3000';
const PLATE = 'ทดสอบ-ABC-1234';
const TITLE = 'รถทดสอบ REPRO 12345';
const ADMIN = 'tripdee2026';

const env = {};
for (const line of fs.readFileSync('.env.local', 'utf8').split(/\r?\n/)) {
  const m = line.match(/^\s*([\w.-]+)\s*=\s*(.*)$/);
  if (m) env[m[1]] = m[2].trim();
}
const SESSION_SECRET = env.SESSION_SECRET || env.SUPABASE_SERVICE_ROLE_KEY || env.ADMIN_SECRET_KEY;

/** Replicate createSessionToken() from src/lib/authGuard.ts exactly. */
function mintSession(userId, role, email) {
  const now = Math.floor(Date.now() / 1000);
  const session = { userId, role, email, issuedAt: now, expiresAt: now + 60 * 60 * 24 * 30 };
  const body = Buffer.from(JSON.stringify(session)).toString('base64')
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  const sig = crypto.createHmac('sha256', SESSION_SECRET).update(body).digest('base64')
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  return `${body}.${sig}`;
}

let failures = 0;
let skipped = 0;
function assert(cond, msg) {
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${msg}`);
  if (!cond) failures++;
}
function skip(msg) {
  console.log(`SKIP  ${msg}`);
  skipped++;
}

/**
 * Migration 06 must be applied before the ownership/approval path can work.
 * Probe for it and stop early rather than reporting a wall of false failures.
 */
async function migrationApplied(page) {
  const probe = await page.request.post(`${BASE}/api/vehicles`, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Session ${mintSession('probe_driver', 'driver', 'p@example.com')}`,
    },
    data: { title: 'migration probe', driverName: 'probe', driverPhone: '0899999999' },
  });
  if (probe.status() === 503) return false;
  // Clean up the probe row if it did go through.
  const listed = await (await page.request.get(`${BASE}/api/vehicles?scope=admin`, {
    headers: { 'x-admin-pin': ADMIN },
  })).json().catch(() => ({ vehicles: [] }));
  for (const v of listed.vehicles || []) {
    if (v.title === 'migration probe') {
      await page.request.delete(`${BASE}/api/vehicles?id=${v.id}`, {
        headers: { 'x-admin-pin': ADMIN },
      });
    }
  }
  return true;
}

(async () => {
  const browser = await chromium.launch({
    executablePath: 'C:/Users/ChopperCNX/AppData/Local/ms-playwright/chromium-1234/chrome-win64/chrome.exe',
  });
  const context = await browser.newContext();
  const sessionToken = mintSession('google_repro_sub_123', 'driver', 'repro.driver@example.com');

  // Seed the session exactly like the OAuth callback does: localStorage profile
  // + signed httpOnly cookie.
  await context.addCookies([{
    name: 'td-session', value: sessionToken,
    domain: 'localhost', path: '/', httpOnly: true, sameSite: 'Lax',
  }]);

  const page = await context.newPage();
  const apiCalls = [];
  page.on('request', (r) => {
    if (r.url().includes('/api/')) apiCalls.push(`${r.method()} ${r.url().replace(BASE, '')}`);
  });
  const pageErrors = [];
  page.on('pageerror', (e) => pageErrors.push(String(e)));

  // --- 1. Session reaches the server ---
  await page.goto(BASE, { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => {
    localStorage.setItem('td-auth-user', JSON.stringify({
      id: 'google_repro_sub_123', role: 'driver', name: 'Repro Driver',
      driverNickname: 'Repro', emailOrPhone: 'repro.driver@example.com',
      isAvailable: true, verificationStatus: 'pending',
    }));
  });
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1200);

  const who = await (await page.request.get(`${BASE}/api/auth/session`)).json();
  assert(who.authenticated && who.userId === 'google_repro_sub_123',
    `server recognises the signed driver session (got ${JSON.stringify(who)})`);

  if (!(await migrationApplied(page))) {
    skip('migration 06_vehicle_ownership_and_approval.sql is not applied yet');
    skip('run it in the Supabase SQL Editor, then re-run this script');
    await browser.close();
    console.log('\nBLOCKED ON MIGRATION (no code defects measured)');
    process.exit(2);
  }
  console.log('INFO  migration 06 detected: ownership + approval columns present');

  // --- 2. A brand-new driver sees a BLANK form, not another driver's data ---
  await page.locator('button', { hasText: /Repro/ }).first().click();
  await page.waitForSelector('#driver-plate', { timeout: 15000 });

  const prefill = await page.evaluate(() => ({
    plate: document.querySelector('#driver-plate')?.value,
    headline: document.querySelector('#driver-headline')?.value,
    line: document.querySelector('#driver-line')?.value,
    whatsapp: document.querySelector('#driver-whatsapp')?.value,
    wechat: document.querySelector('#driver-wechat')?.value,
    kakao: document.querySelector('#driver-kakao')?.value,
  }));
  assert(prefill.plate === '' && prefill.headline === '' && prefill.line === ''
    && prefill.whatsapp === '' && prefill.wechat === '' && prefill.kakao === '',
    `new driver form is blank, no demo prefill (got ${JSON.stringify(prefill)})`);

  // --- 3. Fill in real data and save ---
  await page.fill('#driver-plate', PLATE);
  await page.fill('#driver-headline', TITLE);
  await page.fill('#driver-title', 'ReproNick');
  await page.fill('#driver-phone', '0812345678');
  apiCalls.length = 0;
  await page.locator('button', { hasText: 'บันทึกการแก้ไขทั้งหมด' }).first().click();
  await page.waitForTimeout(2000);

  assert(apiCalls.some((c) => c.startsWith('POST /api/vehicles') || c.startsWith('PUT /api/vehicles')),
    `save issues a real API call (saw ${JSON.stringify(apiCalls)})`);

  // --- 4. Data is in the server catalog, as PENDING ---
  const mine = await (await page.request.get(`${BASE}/api/vehicles?scope=mine`)).json();
  const mineVeh = (mine.vehicles || [])[0];
  assert(Boolean(mineVeh), 'driver can read back their own vehicle via scope=mine');
  assert(mineVeh && mineVeh.plateNumber === PLATE,
    `vehicle plate persisted to the server (got ${mineVeh && mineVeh.plateNumber})`);
  assert(mineVeh && mineVeh.approvalStatus === 'pending',
    `vehicle is pending admin approval (got ${mineVeh && mineVeh.approvalStatus})`);

  // --- 5. NOT visible to the public ---
  const pub = await (await page.request.get(`${BASE}/api/vehicles`)).json();
  assert(!(pub.vehicles || []).some((v) => (v.plateNumber || '') === PLATE),
    'pending vehicle is hidden from the public catalogue');

  // Assert on the rendered fleet listing, which shows title + driver but not
  // the plate number (the card has no plate row).
  const anon = await browser.newContext();
  const anonPage = await anon.newPage();
  await anonPage.goto(BASE, { waitUntil: 'networkidle' });
  await anonPage.waitForTimeout(1500);
  const anonText = await anonPage.evaluate(() => document.body.innerText);
  assert(!anonText.includes(TITLE), 'pending vehicle is invisible to an anonymous visitor');

  // --- 6. Data survives a fresh browser (i.e. it is really in the DB) ---
  // Seed localStorage BEFORE React mounts, then reload, so AuthContext's
  // restore effect actually sees it.
  const other = await browser.newContext();
  await other.addCookies([{
    name: 'td-session', value: sessionToken,
    domain: 'localhost', path: '/', httpOnly: true, sameSite: 'Lax',
  }]);
  const otherPage = await other.newPage();
  await otherPage.goto(BASE, { waitUntil: 'domcontentloaded' });
  await otherPage.evaluate(() => {
    localStorage.setItem('td-auth-user', JSON.stringify({
      id: 'google_repro_sub_123', role: 'driver', name: 'Repro Driver',
      driverNickname: 'ReproNick', emailOrPhone: '0812345678',
    }));
  });
  await otherPage.reload({ waitUntil: 'networkidle' });
  await otherPage.waitForSelector('button:has-text("Repro")', { timeout: 15000 });
  await otherPage.locator('button', { hasText: /Repro/ }).first().click();
  await otherPage.waitForSelector('#driver-plate', { timeout: 15000 });
  // The portal hydrates from the server after mount; poll rather than assume.
  await otherPage.waitForFunction(
    (expected) => document.querySelector('#driver-plate')?.value === expected,
    PLATE,
    { timeout: 10000 }
  ).catch(() => {});
  const rehydrated = await otherPage.inputValue('#driver-plate');
  assert(rehydrated === PLATE, `fresh browser rehydrates the saved plate from the DB (got "${rehydrated}")`);

  // --- 7. Admin approves -> it goes live ---
  const adminList = await (await page.request.get(`${BASE}/api/vehicles?scope=admin`, {
    headers: { 'x-admin-pin': ADMIN },
  })).json();
  assert(adminList.pending >= 1, `admin sees the pending vehicle (pending=${adminList.pending})`);

  const approve = await page.request.put(`${BASE}/api/vehicles`, {
    headers: { 'Content-Type': 'application/json', 'x-admin-pin': ADMIN },
    data: { id: mineVeh.id, approvalStatus: 'approved' },
  });
  assert(approve.ok(), `admin approve call succeeds (HTTP ${approve.status()})`);

  // Poll briefly: the public catalogue read goes through Supabase and the
  // approval write has just landed, so allow one retry.
  let pubAfter = { vehicles: [] };
  for (let i = 0; i < 5; i++) {
    pubAfter = await (await page.request.get(`${BASE}/api/vehicles`)).json();
    if ((pubAfter.vehicles || []).some((v) => v.plateNumber === PLATE)) break;
    await page.waitForTimeout(400);
  }
  assert((pubAfter.vehicles || []).some((v) => (v.plateNumber || '') === PLATE),
    'approved vehicle appears in the public catalogue');

  await anonPage.reload({ waitUntil: 'networkidle' });
  await anonPage.waitForTimeout(1800);
  const anonText2 = await anonPage.evaluate(() => document.body.innerText);
  assert(anonText2.includes(TITLE), 'approved vehicle is visible to an anonymous visitor');

  // --- 8. A driver cannot edit someone else's vehicle ---
  // Must use a context with NO session cookie: getDriverSession() prefers the
  // cookie, so sending a different bearer token alongside the owner's cookie
  // would still authenticate as the owner.
  const attacker = await browser.newContext();
  const attackerToken = mintSession('google_someone_else', 'driver', 'other@example.com');
  const forbidden = await attacker.request.put(`${BASE}/api/vehicles`, {
    headers: { 'Content-Type': 'application/json', Authorization: `Session ${attackerToken}` },
    data: { id: mineVeh.id, title: 'hijacked' },
  });
  assert(forbidden.status() === 403,
    `another driver cannot edit this vehicle (HTTP ${forbidden.status()})`);

  // --- 9. A driver cannot approve their own vehicle ---
  const selfApprove = await attacker.request.put(`${BASE}/api/vehicles`, {
    headers: { 'Content-Type': 'application/json', Authorization: `Session ${attackerToken}` },
    data: { id: mineVeh.id, approvalStatus: 'approved' },
  });
  assert(selfApprove.status() === 403,
    `a driver cannot self-approve (HTTP ${selfApprove.status()})`);

  // --- 10. An anonymous visitor cannot write at all ---
  const anonWrite = await anon.request.post(`${BASE}/api/vehicles`, {
    headers: { 'Content-Type': 'application/json' },
    data: { title: 'anon', driverName: 'a', driverPhone: '0800000000' },
  });
  assert(anonWrite.status() === 401,
    `anonymous write is rejected (HTTP ${anonWrite.status()})`);

  // --- cleanup ---
  await page.request.delete(`${BASE}/api/vehicles?id=${mineVeh.id}`, {
    headers: { 'x-admin-pin': ADMIN },
  });

  console.log(`INFO  page errors: ${JSON.stringify(pageErrors)}`);
  await browser.close();
  if (failures === 0) {
    console.log(`\nALL GREEN${skipped ? ` (${skipped} skipped)` : ''}`);
  } else {
    console.log(`\n${failures} FAILURE(S)`);
  }
  process.exit(failures === 0 ? 0 : 1);
})();
