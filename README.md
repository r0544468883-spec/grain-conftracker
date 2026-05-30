# Grain ConfTracker

Conference intelligence and lead capture tool for Grain's sales team.

**Live URL:** https://grain-conftracker.vercel.app

---

## What It Does

A mobile-first app that helps sales reps capture leads at conferences, track relationships across events, and push everything to HubSpot — without losing a single business card to the washing machine.

### Core Features

| Feature | What It Does |
|---------|-------------|
| **Quick Capture** | 3 fields, 5 seconds. Name, company, temperature. Done. |
| **Smart Search** | Type a name — if they exist from a previous conference, add an interaction instead of a duplicate |
| **Business Card OCR** | Scan a card with your phone camera. AI extracts name, company, email, phone automatically |
| **Calendar View** | Monthly calendar like Google Calendar. Tap a day to see full event details |
| **ICP Scoring** | Every conference scored 0-100 based on vertical fit + audience size |
| **Annual Planning** | 12-month coverage grid. Gaps flagged. Trip clusters detected (save on flights) |
| **Cross-Conference Timeline** | See every interaction with a person across all conferences, including job changes |
| **LinkedIn Connect** | After saving a lead, one tap opens their LinkedIn profile for a connection request |
| **HubSpot Push** | Push contacts directly to HubSpot via API. Connection status indicator included |
| **HubSpot CSV Export** | Download contacts in HubSpot-compatible CSV format |
| **Meeting Prep** | Schedule meetings, generate AI briefings before each one |
| **Offline Mode** | No WiFi at the venue? Leads save locally and sync later |
| **Tour Guide** | Built-in interactive walkthrough for every tab |

### AI Features (5 total, powered by Claude Haiku)

| Feature | What It Does |
|---------|-------------|
| **Relationship Summarizer** | Analyzes all interactions and returns: relationship arc, current status, next step |
| **Lead Score (0-100)** | Scores leads by engagement, temperature trend, seniority, vertical fit, buying signals. Saved to DB |
| **Follow-Up Email Draft** | Generates a personalized email referencing actual conversation notes. Copy and paste into Gmail |
| **Smart OCR Enrichment** | After scanning a card, AI fuzzy-matches against existing contacts (Dave = David, Bob = Robert) and detects job changes |
| **Meeting Briefing** | 30-second pre-meeting prep: Context, Key Intel, Approach, Avoid |

---

## Tech Stack

- **Framework:** Next.js 16 (App Router, TypeScript)
- **Styling:** Tailwind CSS + shadcn/ui
- **Database:** PostgreSQL (Neon) + Prisma ORM
- **AI:** Anthropic Claude Haiku (server-side, zero user config)
- **OCR:** Tesseract.js (client-side)
- **CRM:** HubSpot API integration
- **Hosting:** Vercel
- **Tour:** driver.js

---

## ICP Scoring Methodology

Conferences are scored based on two factors:

**Vertical weight (max 50 points):**
- Payments / Treasury = 50 (Grain's core ICP)
- Fintech = 40
- Travel = 30
- SaaS = 20

**Audience size bonus (max 30 points):**
- 10,000+ attendees = 30
- 5,000+ = 20
- 1,000+ = 10
- Below 1,000 = 5

Raw score normalized to 0-100. Simple on purpose — if a salesperson can't understand why one conference outranks another, they won't trust the system.

---

## Cross-Conference Intelligence

The system tracks contacts across conferences with:

- **Role + company at time of each interaction** (not just current)
- **Job change detection** — "Was at TransferHub, now at PayFlow"
- **Previous companies** stored as history
- **AI fuzzy matching** on business card scans (name variations, email domain, company name)
- **Temperature timeline** — Cold to Warm to Hot progression visible at a glance

---

## Running Locally

```bash
git clone https://github.com/r0544468883-spec/grain-conftracker.git
cd grain-conftracker
npm install
```

Create `.env` with:
```
DATABASE_URL="your-neon-postgres-url"
DIRECT_URL="your-neon-postgres-url"
ANTHROPIC_API_KEY="sk-ant-..."
HUBSPOT_API_KEY="pat-..."  # optional
```

```bash
npx prisma migrate dev
npx tsx prisma/seed.ts
npm run dev
```

Open http://localhost:3000

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | Neon PostgreSQL connection string (pooled) |
| `DIRECT_URL` | Yes | Neon PostgreSQL direct connection |
| `ANTHROPIC_API_KEY` | Yes | Claude API key for AI features |
| `HUBSPOT_API_KEY` | No | HubSpot Service Key for CRM push |

---

## Deployment

Deployed on Vercel. Every push to `main` triggers a new deployment.

```bash
vercel --prod
```

---

## What I'd Build Next

1. **AI Conference Discovery** — describe your ideal audience, AI suggests events you don't know about
2. **Auto Lead Scoring** — trigger after every interaction instead of on-demand
3. **Two-way HubSpot Sync** — pull deal updates back into the conference tool

---

Built with Claude Code.
