# AI Earth Ultra

Private, top-down autonomous society simulator built for a $0 prototype.

## What is inside
- 5 countries × 20 citizens = 100 autonomous agents
- top-down zoom/pan world; click and follow any citizen
- homes, offices, cafes, hospitals, schools, markets, parks, factories
- autonomous schedules, hunger, energy, money, jobs, social needs, memories and moods
- AIogram encounters/messages, InstaAIgram posts, world event/news feed
- God Mode: clear/rain/heat/storm/flood/fire, boom/crisis
- optional Gemini brain pulses, with local fallback when quota/key is unavailable
- private password + httpOnly cookie
- localStorage persistence, so no database bill is required for this single-user prototype

## Deploy to Vercel
1. Upload this project to a **private GitHub repository**.
2. Import the repo into Vercel.
3. Add Environment Variables:
   - `GEMINI_API_KEY` = your Google AI Studio key
   - `GEMINI_MODEL` = `gemini-3.5-flash-lite`
   - `APP_PASSWORD` = your private site password
   - `SESSION_SECRET` = a long random secret string
4. Deploy.

Do not put your API key in GitHub or send it in chat.

## Run locally
```bash
npm install
cp .env.example .env.local
npm run dev
```
Open http://localhost:3000. If APP_PASSWORD is not set, local default is `earthai`.

## $0 architecture note
The world engine is deterministic/local and does not call Gemini for basic walking, eating, working, weather reactions or scheduling. Gemini is used only for periodic higher-level social/thought actions. This makes 100 visible agents practical on a free prototype.

## Important persistence note
Because this version uses browser localStorage, the world exists in the browser you use. Clearing browser storage resets it. A later version can move world persistence to a database without changing the visible simulator concept.
