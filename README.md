# Spark

**Your own personality-first dating app.** 
**Personality-first dating. Real conversations before photos.**

Spark is a next-generation dating platform that challenges the appearance-first culture of modern dating apps. Instead of swiping on photos, users connect through personality, hobbies, values, and meaningful conversations — with photos revealed only after mutual interest and genuine interaction.

🌐 Live: https://spark-frontend-tlcj.onrender.com  
📚 Docs: https://spark-frontend-tlcj.onrender.com/docs  

**After login on the web** you get the full dating app at **`/app`**: **Discover** (profiles, no photos first), **Maytri**, **Community**, **Chat**, and **Profile**. Complete onboarding (hobbies, personality, photos) then browse, match, and chat. To deploy the app at `/app`, build the frontend with `npm run build:with-app` and set `EXPO_PUBLIC_SPARK_API_URL` to your backend URL (see [Deploy on Render](docs/RENDER_DEPLOY.md)).

### Build and run locally (web app at `/app`)

1. **Backend** (from repo root): `cd services && go run ./cmd` (or use your deployed API URL in the app config).
2. **Expo web build** (so `/app` has the app): `cd expo && npm run build:web`
3. **Copy into landing**: `cd landing && node scripts/copy-expo-web.cjs`
4. **Run landing**: `cd landing && npm run dev`
5. Open **http://localhost:5173/** (or the port Vite prints), then go to **/login** and after login you’ll be at **/app** with the full dating app.

---

## ✨ What is Spark?

Spark flips the traditional dating model.

- No photos at first  
- No swipe fatigue  
- No appearance-based first impressions  

Users meet as people, not profiles.

Profiles highlight hobbies, personality traits, values, and short bios. Photos stay hidden until both users mutually decide to reveal them after meaningful conversation.

---

## 🧠 Core Philosophy

### Person > Picture  
First impressions should be about who someone is, not how they look.

### Connection Before Looks  
Photos unlock only after real engagement and mutual consent.

### Authenticity & Safety  
Strong verification, transparent AI, and privacy-first design keep the platform safe and human.

---

## 🔓 How It Works

1. **Onboarding**
   - Identity verification (ID + liveness)
   - Select hobbies and interests
   - Answer personality questions
   - Write a bio (AI-assisted, optional)
   - Upload photos (hidden by default)

2. **Discovery**
   - Browse profiles without photos
   - No swiping — intentional browsing and recommendations

3. **Match & Chat**
   - Mutual interest opens a chat
   - AI can assist replies (optional)
   - Conversation quality is prioritized over volume

4. **Unlock → Reveal**
   - After meaningful back-and-forth, either user can request reveal
   - Both must accept to unlock photos
   - Photos are encrypted and shown only to each other

5. **Rating & Feedback**
   - Private 0–10 rating after reveal
   - ≥7 continues the match
   - <7 closes the connection gracefully
   - Ratings improve future recommendations (never public)

---

## 🤖 AI — Transparent & Optional

Spark uses AI to **assist**, not impersonate.

- AI Bio Generator  
- AI Reply Suggestions (editable)  
- AI Conversation Coach  
- Virtual AI Companion for better recommendations  

All AI-assisted content is clearly labeled and fully optional.

---

## 🌀 Matching System (High Level)

Spark uses a hybrid recommendation engine powered by:

- Shared hobbies and interests  
- Personality compatibility  
- Conversation-quality signals  
- Post-reveal ratings  
- Behavioral patterns  

The system adapts continuously as users interact.

---

## 🌍 Social Discovery

Spark includes a lightweight social layer:

- Anonymous posts (no photos, no names)
- Like, comment, repost
- Discover people by personality and ideas
- “Poke” users to start a temporary, photo-hidden chat

Organic discovery without appearance pressure.

---

## 🛡️ Safety & Privacy

- Government ID verification
- Liveness checks
- Encrypted photo storage
- Controlled reveal system
- Bot & abuse detection
- Manual moderation for risky activity
- Fast reporting & blocking tools

Privacy is foundational, not optional.

---

## 📚 Documentation

Full product and technical documentation is available at:

👉 https://spark.example.com/docs

Includes:
- Product philosophy
- Matching & unlock flows
- AI usage principles
- Privacy & safety policies
- Terms of service

---

## 🚀 Status

Spark is actively being built and iterated on.  
Features, architecture, and documentation may evolve rapidly.

---

## 🤝 Contributing

At the moment, Spark is not open for public contributions.

If you’re interested in:
- Collaboration
- Research
- Early access
- Feedback

Reach out via the website.

---

## 📩 Contact

Website: https://spark-frontend-tlcj.onrender.com  
Documentation: https://spark-frontend-tlcj.onrender.com/docs  

---

**Spark isn’t just a dating app.**  
It’s a modern relationship engine built for deeper, smarter, safer connections.
