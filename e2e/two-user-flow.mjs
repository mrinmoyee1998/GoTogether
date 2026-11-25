// End-to-end test of the core GoTogether flow with real accounts.
// Requires the app running (npm run dev / npm start) against a Supabase
// project with email confirmation DISABLED (local Supabase default).
//
//   npm i -D playwright && npx playwright install chromium   (one-time)
//   BASE_URL=http://localhost:3000 node e2e/two-user-flow.mjs
//
// Screenshots are written to SCREENSHOT_DIR (default ./e2e/screenshots).
import { createRequire } from "node:module";
import fs from "node:fs";
import path from "node:path";

// Resolved via require so a globally installed Playwright (NODE_PATH) also works.
const { chromium } = createRequire(import.meta.url)("playwright");

const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const SHOTS = process.env.SCREENSHOT_DIR ?? path.join(process.cwd(), "e2e", "screenshots");
fs.mkdirSync(SHOTS, { recursive: true });
const run = Date.now().toString(36);
const TITLE = `E2E Badminton Doubles ${run}`;

let step = 0;
const ok = (msg) => console.log(`  ✔ ${++step}. ${msg}`);
function assert(cond, msg) {
  if (!cond) throw new Error(`ASSERTION FAILED: ${msg}`);
}

function istDate(offsetDays) {
  const d = new Date(Date.now() + 5.5 * 3600e3 + offsetDays * 86400e3);
  return d.toISOString().slice(0, 10);
}

async function signUpAndOnboard(browser, name, email) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(`${BASE}/signup`);
  await page.fill("#fullName", name);
  await page.fill("#email", email);
  await page.fill("#password", "password123");
  await page.click("main button[type=submit]");
  await page.waitForURL(/\/onboarding/);

  // Try to finish without the 18+ box: must be rejected
  await page.selectOption("#neighbourhood", "Bandra");
  await page.locator("label", { hasText: "Sports" }).first().click();
  await page.click("main button[type=submit]");
  await page.getByText("You must be 18 or older").waitFor();

  await page.check("input[name=age_confirmed]");
  await page.fill("#bio", `Hi, I'm ${name.split(" ")[0]} and I love weekend sport.`);
  await page.click("main button[type=submit]");
  await page.waitForURL(/\/discover/);
  return { ctx, page };
}

const browser = await chromium.launch();
try {
  console.log(`GoTogether E2E against ${BASE}`);

  // Guest checks
  {
    const ctx = await browser.newContext();
    const p = await ctx.newPage();
    await p.goto(`${BASE}/dashboard`);
    assert(p.url().includes("/login?next="), "guest redirected from dashboard to login");
    await ctx.close();
    ok("Guests are redirected away from protected pages");
  }

  // 1–2. User A signs up and onboards
  const A = await signUpAndOnboard(browser, "Aditi Kulkarni", `aditi.${run}@example.com`);
  ok("User A signed up and completed onboarding (18+ checkbox enforced)");

  // 3. User A creates a badminton activity (first try a past date → validation error)
  await A.page.goto(`${BASE}/activities/new`);
  await A.page.fill("#title", TITLE);
  await A.page.locator("label", { hasText: "Sports" }).first().click();
  await A.page.fill("#description", "Friendly doubles, all levels welcome. Court cost split equally between players.");
  await A.page.fill("#activity_date", istDate(-2));
  await A.page.fill("#start_time", "07:00");
  await A.page.fill("#venue_name", "Bandra Gymkhana Courts");
  await A.page.selectOption("#neighbourhood", "Bandra");
  await A.page.fill("#max_participants", "2");
  await A.page.fill("#estimated_cost", "250");
  await A.page.fill("#maps_url", "https://maps.google.com/?q=Bandra+Gymkhana");
  await A.page.click("main button[type=submit]");
  await A.page.getByText("Activity must be scheduled in the future").waitFor();
  assert((await A.page.inputValue("#title")) === TITLE, "form keeps input after a validation error");
  ok("Past-dated activity rejected, form input preserved");

  await A.page.fill("#activity_date", istDate(3));
  await A.page.click("main button[type=submit]");
  await A.page.waitForURL(/\/activities\/[0-9a-f-]{36}/);
  const activityUrl = A.page.url().split("?")[0];
  await A.page.getByRole("heading", { name: TITLE }).waitFor();
  await A.page.getByText("You're organising this").waitFor();
  ok(`User A created the activity → ${activityUrl.replace(BASE, "")}`);

  // 4–5. User B signs up and onboards
  const B = await signUpAndOnboard(browser, "Bilal Khan", `bilal.${run}@example.com`);
  ok("User B signed up and completed onboarding");

  // 6. User B discovers the activity via search + filter
  await B.page.goto(`${BASE}/discover?category=sports&area=Bandra`, { waitUntil: "networkidle" });
  await B.page.fill("input[name=q]", run);
  await B.page.click("form[role=search] button[type=submit]");
  await B.page.waitForURL(/q=/);
  const card = B.page.locator("a", { hasText: TITLE });
  await card.first().waitFor();
  assert((await B.page.locator(`main a[href^="/activities/"]:not([href="/activities/new"])`).count()) === 1, "search narrows to the one activity");
  await B.page.screenshot({ path: path.join(SHOTS, "b-discover-search.png") });
  ok("User B found the activity using search + category + neighbourhood filters");

  // 7. B opens the details
  await card.first().click();
  await B.page.waitForURL(activityUrl);
  await B.page.getByRole("button", { name: "Request to join" }).waitFor();
  ok("User B opened the activity details");

  // B cannot access organiser-only edit page
  await B.page.goto(`${activityUrl}/edit`);
  await B.page.waitForURL(activityUrl);
  assert((await B.page.getByRole("button", { name: "Accept" }).count()) === 0, "B sees no accept buttons");
  ok("User B is blocked from the organiser-only edit page");

  // 8. B requests to join
  await B.page.getByRole("button", { name: "Request to join" }).click();
  await B.page.fill("#join-note", "Hey! I play every weekend, would love to join.");
  await B.page.getByRole("button", { name: "Send request" }).click();
  await B.page.getByText("Request pending").waitFor();
  await B.page.screenshot({ path: path.join(SHOTS, "b-request-pending.png") });
  ok("User B sent a join request → status shows 'Request pending'");

  // 9. A sees the pending request on the dashboard
  await A.page.goto(`${BASE}/dashboard`);
  const reqRow = A.page.locator("li", { hasText: "Bilal Khan" });
  await reqRow.first().waitFor();
  await A.page.getByText("would love to join").waitFor();
  await A.page.screenshot({ path: path.join(SHOTS, "a-dashboard-pending.png") });
  ok("User A sees B's pending request (with note) on the dashboard");

  // 10. A accepts B
  await reqRow.first().getByRole("button", { name: "Accept" }).click();
  await A.page.getByText("Accepted — they're in!").waitFor();
  ok("User A accepted User B");

  // 11. B sees accepted status
  await B.page.goto(activityUrl);
  await B.page.getByText("You're going!").waitFor();
  await B.page.goto(`${BASE}/dashboard?tab=going`);
  await B.page.locator("li", { hasText: TITLE }).getByText("Accepted").waitFor();
  ok("User B sees 'Accepted' on the activity page and dashboard");

  // 12. Activity page shows B as a confirmed participant
  await B.page.goto(activityUrl);
  await B.page.getByText("1 of 2 spots filled").waitFor();
  await B.page.locator("section", { hasText: "Who's going" }).getByText("Bilal K.").first().waitFor();
  await B.page.screenshot({ path: path.join(SHOTS, "b-activity-accepted.png"), fullPage: true });
  await A.page.goto(activityUrl);
  await A.page.locator("section", { hasText: "Who's going" }).getByText("Bilal Khan").first().waitFor();
  ok("Activity page lists User B as a confirmed participant (1/2)");

  // Extra: user C requests, A declines, C sees declined
  const C = await signUpAndOnboard(browser, "Chitra Nair", `chitra.${run}@example.com`);
  await C.page.goto(activityUrl);
  await C.page.getByRole("button", { name: "Request to join" }).click();
  await C.page.getByRole("button", { name: "Send request" }).click();
  await C.page.getByText("Request pending").waitFor();
  await A.page.goto(`${BASE}/dashboard?tab=review`);
  await A.page.locator("li", { hasText: "Chitra Nair" }).getByRole("button", { name: "Decline" }).click();
  await A.page.getByText("Request declined.").waitFor();
  await C.page.reload();
  await C.page.getByText("Request declined").first().waitFor();
  ok("Organiser declined User C → C sees 'Request declined'");

  // Extra: B requests a seeded activity then cancels from the dashboard
  await B.page.goto(`${BASE}/activities/b0000001-0000-4000-8000-000000000004`);
  await B.page.getByRole("button", { name: "Request to join" }).click();
  await B.page.getByRole("button", { name: "Send request" }).click();
  await B.page.getByText("Request pending").waitFor();
  await B.page.goto(`${BASE}/dashboard?tab=requests`);
  const pendingRow = B.page.locator("li", { hasText: "Board Games Evening" });
  await pendingRow.getByRole("button", { name: "Cancel request" }).click();
  await pendingRow.getByText("Cancelled").waitFor();
  ok("User B cancelled a pending request from the dashboard");

  // Mobile screenshots
  const m = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  await m.addCookies(await B.ctx.cookies());
  const mp = await m.newPage();
  for (const [name, url] of [["mobile-landing", "/"], ["mobile-discover", "/discover"], ["mobile-activity", activityUrl.replace(BASE, "")], ["mobile-dashboard", "/dashboard?tab=going"]]) {
    await mp.goto(BASE + url);
    await mp.waitForLoadState("networkidle");
    const overflow = await mp.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
    assert(!overflow, `${url} has no horizontal overflow on mobile`);
    await mp.screenshot({ path: path.join(SHOTS, `${name}.png`) });
  }
  ok("Mobile (390px) layouts render with no horizontal overflow");

  console.log(`\nALL E2E CHECKS PASSED (${step} steps). Screenshots: ${SHOTS}`);
} catch (err) {
  console.error("\nE2E FAILED:", err.message);
  process.exitCode = 1;
} finally {
  await browser.close();
}
