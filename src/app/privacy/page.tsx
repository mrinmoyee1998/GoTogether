import type { Metadata } from "next";

export const metadata: Metadata = { title: "Privacy policy" };

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
      <h1 className="text-3xl font-extrabold sm:text-4xl">Privacy policy</h1>
      <p className="mt-2 text-sm text-muted-foreground">Plain-language summary for the GoTogether early-access MVP.</p>

      <div className="mt-8 space-y-8 leading-relaxed [&_h2]:text-xl [&_h2]:font-bold [&_p]:mt-2 [&_p]:text-foreground/85 [&_ul]:mt-2 [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-5 [&_ul]:text-foreground/85">
        <section>
          <h2>What we collect</h2>
          <ul>
            <li><strong>Account:</strong> your email address and a securely hashed password (handled by our authentication provider, Supabase).</li>
            <li><strong>Profile:</strong> name, optional photo, city, neighbourhood, optional bio, interests, and your confirmation that you are 18+.</li>
            <li><strong>Activity data:</strong> plans you create, join requests you send or receive (including optional notes), and reports you file.</li>
          </ul>
        </section>
        <section>
          <h2>Who can see what</h2>
          <ul>
            <li>Anyone can see public activity details (title, description, date, public venue, neighbourhood) and the organiser&apos;s name and photo.</li>
            <li>Signed-in members can see profiles (name, photo, neighbourhood, bio, interests) and confirmed participants of an activity.</li>
            <li>Only the organiser sees the join requests and notes sent for their activity.</li>
            <li>Your <strong>email address is never shown</strong> to other members. We don&apos;t collect phone numbers.</li>
            <li>We <strong>never track or share your live location</strong>.</li>
          </ul>
        </section>
        <section>
          <h2>How we use it</h2>
          <p>Only to run GoTogether: showing activities, handling join requests, keeping the community safe and reviewing reports. We don&apos;t sell your data or show ads.</p>
        </section>
        <section>
          <h2>Storage & security</h2>
          <p>Data is stored with Supabase (PostgreSQL). Access is restricted with row-level security rules so members can only change their own data.</p>
        </section>
        <section>
          <h2>Your choices</h2>
          <p>You can edit your profile at any time. To delete your account and data, contact the GoTogether team and we&apos;ll remove it.</p>
        </section>
      </div>
    </div>
  );
}
