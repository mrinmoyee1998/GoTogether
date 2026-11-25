// Records the two-user demo flow as a sequence of screenshots for presenting.
// Organiser (Aditi) uses a desktop browser; participant (Bilal) uses a phone.
//
//   BASE_URL=http://localhost:3000 DEMO_DIR=./e2e/demo node e2e/demo-walkthrough.mjs
//
// Uses fixed demo emails; delete those users first if re-running
// (see README → "Recording the demo").
import { createRequire } from "node:module";
import fs from "node:fs";
import path from "node:path";

const { chromium, devices } = createRequire(import.meta.url)("playwright");
const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const OUT = process.env.DEMO_DIR ?? path.join(process.cwd(), "e2e", "demo");
fs.mkdirSync(OUT, { recursive: true });

const TITLE = "Sunday Badminton Doubles";
const steps = [];
let n = 0;

async function shot(page, slug, caption, opts = {}) {
  await page.waitForTimeout(opts.settle ?? 400);
  const file = `${String(++n).padStart(2, "0")}-${slug}.jpg`;
  await page.screenshot({ path: path.join(OUT, file), type: "jpeg", quality: 82, fullPage: !!opts.fullPage });
  steps.push({ file, caption, who: opts.who });
  console.log(`  📸 ${file} — ${caption}`);
}

function nextSundayIST() {
  const ist = new Date(Date.now() + 5.5 * 3600e3);
  const dow = ist.getUTCDay();
  const add = dow === 0 ? 7 : 7 - dow;
  return new Date(ist.getTime() + add * 86400e3).toISOString().slice(0, 10);
}

async function signup(page, name, email) {
  await page.goto(`${BASE}/signup`, { waitUntil: "networkidle" });
  await page.fill("#fullName", name);
  await page.fill("#email", email);
  await page.fill("#password", "demo-password-123");
}

async function onboard(page, bio, interests, area) {
  await page.selectOption("#neighbourhood", area);
  for (const i of interests) await page.locator("main label", { hasText: i }).first().click();
  await page.fill("#bio", bio);
  await page.check("input[name=age_confirmed]");
}

const browser = await chromium.launch();
let A, B;
try {
  const desk = await browser.newContext({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 2 });
  const phone = await browser.newContext({ ...devices["iPhone 13"] });
  A = await desk.newPage();
  if (process.env.DEBUG_NAV) A.on("framenavigated", (f) => f === A.mainFrame() && console.log("    [A nav]", f.url()));
  B = await phone.newPage();

  // --- Landing
  await A.goto(BASE, { waitUntil: "networkidle" });
  await shot(A, "landing", "The landing page explains GoTogether in a few seconds.", { who: "Visitor" });

  // --- A signs up + onboards
  await signup(A, "Aditi Kulkarni", "aditi.demo@example.com");
  await shot(A, "a-signup", "Aditi creates an account with her email and a password.", { who: "Aditi · organiser" });
  await A.click("main button[type=submit]");
  await A.waitForURL(/onboarding/);
  await onboard(A, "Moved to Bandra last year. Love badminton and Sunday breakfasts.", ["Sports", "Food & Cafes"], "Bandra");
  await shot(A, "a-onboarding", "Onboarding: neighbourhood, interests, a short bio, and the required 18+ confirmation.", { who: "Aditi · organiser", fullPage: true });
  await A.click("main button[type=submit]");
  await A.waitForURL(/discover/);

  // --- A creates the activity
  await A.goto(`${BASE}/activities/new`, { waitUntil: "networkidle" });
  await A.fill("#title", TITLE);
  await A.locator("main label", { hasText: "Sports" }).first().click();
  await A.fill("#description", "Casual doubles for all levels — if you can hold a racquet, you're welcome. Two courts booked for 2 hours; we rotate partners so everyone plays. Shuttles covered, court cost split equally.");
  await A.fill("#activity_date", nextSundayIST());
  await A.fill("#start_time", "07:00");
  await A.fill("#venue_name", "Bandra Gymkhana Courts");
  await A.selectOption("#neighbourhood", "Bandra");
  await A.fill("#max_participants", "4");
  await A.fill("#estimated_cost", "250");
  await A.fill("#maps_url", "https://maps.google.com/?q=Bandra+Gymkhana+Mumbai");
  await shot(A, "a-create", "Aditi posts a plan: title, category, date & time, a public venue, group size and cost.", { who: "Aditi · organiser", fullPage: true });
  await A.click("main button[type=submit]");
  await A.waitForURL(/\/activities\/[0-9a-f-]{36}/);
  const activityUrl = A.url().split("?")[0];
  await A.getByText("Your activity is live").waitFor();
  await shot(A, "a-created", "The plan is live. Aditi is shown as the organiser and nobody has joined yet.", { who: "Aditi · organiser" });

  // --- B signs up + onboards on a phone
  await signup(B, "Bilal Khan", "bilal.demo@example.com");
  await B.click("main button[type=submit]");
  await B.waitForURL(/onboarding/);
  await onboard(B, "New to Mumbai, looking for people to play sports with on weekends.", ["Sports", "Fitness"], "Khar");
  await shot(B, "b-onboarding", "Bilal signs up on his phone and completes the same short onboarding.", { who: "Bilal · participant" });
  await B.click("main button[type=submit]");
  await B.waitForURL(/discover/);

  // --- B discovers
  await B.goto(`${BASE}/discover?category=sports`, { waitUntil: "networkidle" });
  await B.fill("input[name=q]", "badminton");
  await B.click("form[role=search] button[type=submit]");
  await B.waitForURL(/q=badminton/);
  await B.locator("main a", { hasText: TITLE }).first().waitFor();
  await B.locator("main a", { hasText: TITLE }).first().scrollIntoViewIfNeeded();
  await shot(B, "b-discover", "Bilal searches “badminton” with the Sports filter on and finds Aditi’s plan.", { who: "Bilal · participant" });

  // --- B opens details
  await B.locator("main a", { hasText: TITLE }).first().click();
  await B.waitForURL(activityUrl);
  await B.getByRole("button", { name: "Request to join" }).waitFor();
  await shot(B, "b-details", "The details page shows the date, venue, Maps link, cost and spots left.", { who: "Bilal · participant" });
  await B.getByRole("button", { name: "Request to join" }).scrollIntoViewIfNeeded();
  await shot(B, "b-join-panel", "Further down: the organiser’s profile, a safety note, and the Request to join button.", { who: "Bilal · participant" });

  // --- B requests
  await B.getByRole("button", { name: "Request to join" }).click();
  await B.fill("#join-note", "Hi Aditi! I play casually most weekends — would love to join.");
  await shot(B, "b-request", "Bilal sends a request with a short note. The organiser approves every request.", { who: "Bilal · participant" });
  await B.getByRole("button", { name: "Send request" }).click();
  await B.getByText("Request pending").waitFor();
  await B.getByText("Request pending").scrollIntoViewIfNeeded();
  await shot(B, "b-pending", "Request sent. The page now shows the request as pending.", { who: "Bilal · participant", settle: 900 });

  // --- A reviews on dashboard
  await A.goto(`${BASE}/dashboard`, { waitUntil: "networkidle" });
  await A.getByText("would love to join").waitFor();
  await shot(A, "a-review", "On her dashboard, Aditi sees Bilal’s request, his note and his interests.", { who: "Aditi · organiser" });
  await A.locator("li", { hasText: "Bilal Khan" }).first().getByRole("button", { name: "Accept" }).click();
  await A.getByText("Accepted — they're in!").waitFor();
  await A.getByText("No requests to review").waitFor();
  await shot(A, "a-accepted", "Aditi accepts and her review queue is now empty. The capacity check runs inside the database, so the group can never be overfilled.", { who: "Aditi · organiser", settle: 300 });

  // --- B sees accepted
  await B.goto(activityUrl, { waitUntil: "networkidle" });
  await B.getByText("You're going!").scrollIntoViewIfNeeded();
  await shot(B, "b-going", "Bilal reopens the plan: “You’re going!” His request has been accepted.", { who: "Bilal · participant" });
  await B.goto(`${BASE}/dashboard?tab=going`, { waitUntil: "networkidle" });
  await shot(B, "b-dashboard", "Bilal’s dashboard lists the plan under “I’ve joined” as Accepted.", { who: "Bilal · participant" });

  // --- Confirmed participant visible
  await B.goto(activityUrl, { waitUntil: "networkidle" });
  await B.locator("section", { hasText: "Who's going" }).first().scrollIntoViewIfNeeded();
  await shot(B, "b-whos-going", "Bilal is now listed under “Who’s going” (first name and last initial only).", { who: "Bilal · participant" });
  await A.goto(activityUrl, { waitUntil: "networkidle" });
  await A.getByText("1 of 4 spots filled").waitFor();
  await A.locator("section", { hasText: "Who's going" }).first().scrollIntoViewIfNeeded();
  await shot(A, "a-final", "Aditi’s view: 1 of 4 spots filled, with Bilal confirmed. She can still remove participants if needed.", { who: "Aditi · organiser" });

  fs.writeFileSync(path.join(OUT, "steps.json"), JSON.stringify({ activityUrl: activityUrl.replace(BASE, ""), steps }, null, 2));
  console.log(`\nDemo recorded: ${steps.length} screenshots in ${OUT}`);
} catch (err) {
  console.error("Demo recording failed:", err.message);
  await B?.screenshot({ path: path.join(OUT, "failure-b.png") }).catch(() => {});
  await A?.screenshot({ path: path.join(OUT, "failure-a.png") }).catch(() => {});
  process.exitCode = 1;
} finally {
  await browser.close();
}
