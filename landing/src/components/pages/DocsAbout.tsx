import { DocCard, DocCardGroup } from "../docs/DocCard";

export const DocsAbout = () => (
  <>
    <h1 className="text-4xl font-bold mb-2 text-white">
      About Spark
    </h1>
    <p className="text-text-secondary text-lg mb-10">
      Meet Spark — a personality-first dating platform that prioritizes connection over appearance.
    </p>

    <section className="mb-10">
      <h2 className="text-2xl font-semibold mb-4 text-white">Getting started</h2>
      <DocCardGroup cols={2}>
        <DocCard title="Onboarding flow" href="/docs/about" icon="👤">
          Identity verification, hobby selection, personality questions and an optional AI-assisted bio to get you moving.
        </DocCard>
        <DocCard title="How matching works" href="/docs/about" icon="✨">
          Learn about our chat-first unlock system, rating feedback loop, and the hybrid recommendation engine.
        </DocCard>
      </DocCardGroup>
    </section>

    <section className="mb-10">
      <h2 className="text-2xl font-semibold mb-4 text-white">What is Spark?</h2>
      <p className="text-text-secondary leading-relaxed mb-4">
        Spark is a next-generation dating experience that flips the usual script: we ask people to meet each other first as personalities, not pictures. Profiles show hobbies, personality traits, values and short bios. Photos are hidden until a genuine connection has formed.
      </p>
      <p className="text-text-secondary leading-relaxed">
        This design reduces bias, rewards quality conversation, and encourages authentic interactions that stand a better chance of turning into something real.
      </p>
    </section>

    <section className="mb-10">
      <h2 className="text-2xl font-semibold mb-4 text-white">Core philosophy</h2>
      <ul className="space-y-4 text-text-secondary">
        <li>
          <h3 className="font-medium text-white">Person &gt; Picture</h3>
          <p>First impressions should be about character and compatibility — not a thumbnail.</p>
        </li>
        <li>
          <h3 className="font-medium text-white">Connection before looks</h3>
          <p>Photos are revealed only after mutual, meaningful engagement.</p>
        </li>
        <li>
          <h3 className="font-medium text-white">Authenticity &amp; safety</h3>
          <p>Strong identity verification, human review where needed, and transparent AI keep the product humane and trustworthy.</p>
        </li>
      </ul>
    </section>

    <section className="mb-10">
      <h2 className="text-2xl font-semibold mb-4 text-white">Quick tour — How Spark works</h2>
      <ol className="space-y-6 text-text-secondary">
        <li>
          <h3 className="font-medium text-white">1. Onboarding</h3>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>Verify identity (government ID + liveness check)</li>
            <li>Choose hobbies and interests</li>
            <li>Complete personality questions (Likert style)</li>
            <li>Write a bio (or generate one with AI)</li>
            <li>Upload photos (kept hidden by default)</li>
          </ul>
        </li>
        <li>
          <h3 className="font-medium text-white">2. Discovery</h3>
          <p>Browse profiles with non-identifying aesthetics. No swipe frenzy — intentional browsing and recommendations.</p>
        </li>
        <li>
          <h3 className="font-medium text-white">3. Match &amp; Chat</h3>
          <p>Mutual interest opens a chat. AI helpers (optional) suggest bios or reply drafts. The platform monitors conversation quality.</p>
        </li>
        <li>
          <h3 className="font-medium text-white">4. Unlock → Reveal</h3>
          <p>After a minimum threshold of meaningful messages, either user can request reveal. Both must accept to unlock photos. Photos are encrypted and only revealed under mutual consent.</p>
        </li>
        <li>
          <h3 className="font-medium text-white">5. Rating &amp; Feedback</h3>
          <p>After reveal, both users rate the interaction (0–10). A score ≥ 7 keeps the match alive; below 7 gracefully closes it. Ratings feed the recommendation engine.</p>
        </li>
      </ol>
    </section>

    <section className="mb-10">
      <h2 className="text-2xl font-semibold mb-4 text-white">AI — Helpful, labeled, optional</h2>
      <p className="text-text-secondary mb-4">
        Spark uses transparent AI tools to empower users — never to impersonate humans.
      </p>
      <ul className="list-disc list-inside space-y-1 text-text-secondary">
        <li><strong className="text-text-primary">AI Bio Generator</strong> — Tailored prompts to capture your voice.</li>
        <li><strong className="text-text-primary">AI Reply Suggestions</strong> — Contextual, editable reply suggestions to keep conversations flowing.</li>
        <li><strong className="text-text-primary">AI Conversation Coach</strong> — Tone and clarity suggestions to help you say what you mean.</li>
        <li><strong className="text-text-primary">Virtual AI Companion</strong> — A labeled assistant that learns your preferences and suggests matches.</li>
      </ul>
    </section>

    <section className="mb-10">
      <h2 className="text-2xl font-semibold mb-4 text-white">Matching algorithm (brief)</h2>
      <p className="text-text-secondary mb-4">
        Spark&apos;s hybrid recommendation engine blends:
      </p>
      <ul className="list-disc list-inside space-y-1 text-text-secondary">
        <li><strong className="text-text-primary">Semantic vectors</strong> — user hobbies, traits, message content encoded into embeddings</li>
        <li><strong className="text-text-primary">Conversation-quality signals</strong> — length, reciprocity, intent</li>
        <li><strong className="text-text-primary">Post-reveal ratings</strong> — private feedback that refines compatibility</li>
        <li><strong className="text-text-primary">Behavioral patterns</strong> — response times, engagement styles</li>
      </ul>
      <p className="text-text-secondary mt-4">
        This allows matches to evolve with you, improving quality over time.
      </p>
    </section>

    <section className="mb-10">
      <h2 className="text-2xl font-semibold mb-4 text-white">Social discovery</h2>
      <p className="text-text-secondary mb-4">
        A lightweight social layer lets users share ideas while remaining anonymous:
      </p>
      <ul className="list-disc list-inside space-y-1 text-text-secondary">
        <li>Hidden identity posts show hobby badge + personality headline</li>
        <li>Users can <strong className="text-text-primary">Poke</strong> authors — the author sees hobby + personality and can accept or decline</li>
        <li>If accepted, a temporary, photo-hidden chat opens</li>
      </ul>
    </section>

    <section className="mb-10">
      <h2 className="text-2xl font-semibold mb-4 text-white">Safety &amp; verification</h2>
      <ul className="list-disc list-inside space-y-1 text-text-secondary">
        <li>Government ID verification + liveness checks</li>
        <li>Encrypted photo storage and controlled reveal flow</li>
        <li>Bot and abuse detection models</li>
        <li>Human review for flagged activity</li>
        <li>Fast reporting, blocking, and escalation tools</li>
        <li>Verified accounts receive a trust boost in recommendations</li>
      </ul>
    </section>

    <section className="mb-10">
      <h2 className="text-2xl font-semibold mb-4 text-white">Privacy snapshot</h2>
      <ul className="list-disc list-inside space-y-1 text-text-secondary mb-4">
        <li>Photos remain encrypted and are only revealed under mutual consent.</li>
        <li>AI models may process content to offer features; all AI-assisted outputs are opt-in and labeled.</li>
        <li>Minimal required data is collected for core features (verification, matching, safety).</li>
        <li>Users control discoverability and can delete account data (see full policy).</li>
      </ul>
      <DocCardGroup cols={2}>
        <DocCard title="Privacy Policy" href="/docs/privacy" icon="🛡️">
          Read our full privacy policy.
        </DocCard>
        <DocCard title="Terms of Service" href="/docs/terms" icon="📄">
          View terms and user obligations.
        </DocCard>
      </DocCardGroup>
    </section>

    <section className="mb-10">
      <h2 className="text-2xl font-semibold mb-4 text-white">Why Spark works</h2>
      <p className="font-medium text-white mb-2">For users</p>
      <ul className="list-disc list-inside space-y-1 text-text-secondary mb-4">
        <li>Lowers appearance pressure and reduces impulsive rejections</li>
        <li>Encourages conversations that matter</li>
        <li>Matches are refined by both behavior and private feedback</li>
      </ul>
      <p className="font-medium text-white mb-2">For the product</p>
      <ul className="list-disc list-inside space-y-1 text-text-secondary">
        <li>Better signal-to-noise in recommendations</li>
        <li>Safer, verified community</li>
        <li>Community features promote retention and discovery</li>
      </ul>
    </section>

    <p className="text-text-muted italic">
      Beautifully minimal, human-first, and built for real connections.
    </p>
  </>
);
