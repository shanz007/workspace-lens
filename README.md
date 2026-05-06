# WorkspaceLens PWA

> Mobile-first Progressive Web Application for outdoor knowledge work environment photo collection.  
> Built for the [Hybrid Work Photo Analysis](https://crowdcomputing.net/hybrid-work-photo-analysis-mobile-app/) research project — CrowdComputing Research Group(UBICOMP).

---

## Table of Contents

- [Overview](#overview)
- [Tech Stack & Versions](#tech-stack--versions)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Environment Setup](#environment-setup)
- [Running Locally](#running-locally)
- [Testing on Mobile](#testing-on-mobile)
- [Build & Deploy](#build--deploy)
- [Viewing Results](#viewing-results)
---

## Overview

WorkspaceLens collects self-reported gaze-direction photographs from outdoor and semi-outdoor knowledge work environments.

Participants:
1. Log in with a researcher-assigned participant ID
2. Photograph their **gaze direction** (view, not desk) from an outdoor workspace
3. Censor sensitive content using black-box or pixelation blur tools
4. Complete a short ESM questionnaire (location type, thermal comfort, surroundings)
5. Submit — photo + metadata uploads directly to Supabase storage

Researchers receive structured data per submission:
- Censored JPEG photo
- Timestamp (for weather/environmental dataset cross-referencing)
- ESM survey responses as JSON
- Optional GPS coordinates

---

## Tech Stack & Versions

| Technology | Version | Purpose |
|---|---|---|
| React | 19.2.5 | UI framework |
| TypeScript | 6.0.3 | Type safety |
| Vite | 8.0.10 | Build tool + dev server |
| vite-plugin-pwa | 1.2.0 | PWA manifest + service worker |
| Workbox | 7.4.0 | Offline caching + background sync |
| @supabase/supabase-js | 2.105.1 | Storage upload client |
| @vitejs/plugin-basic-ssl | latest | Self-signed HTTPS for local mobile testing |
| Node.js | 20.x LTS | Runtime |
| npm | 10.x | Package manager |

**Hosting:**
| Service | Purpose |
|---|---|
| Netlify | Frontend hosting — auto-deploy from GitHub |
| Supabase | Storage bucket + PostgreSQL + Edge Functions |
| OpenRouter | Vision model API (post-processing(TBD)) |

---

## Project Structure

```
workspace-lens/
├── public/
│   ├── favicon.svg
│   ├── pwa-192x192.png       
│   └── pwa-512x512.png       
├── src/
│   ├── components/
│   │   ├── Home/
│   │   │   └── HomePage.tsx  
│   │   ├── Login/
│   │   │   └── Login.tsx     
│   │   ├── Camera/
│   │   │   └── Camera.tsx    
│   │   ├── PrivacyEditor/
│   │   │   └── PrivacyEditor.tsx  
│   │   ├── Questionnaire/    
│   │   └── UploadStatus/     
│   ├── hooks/
│   │   └── useUpload.ts      
│   ├── lib/
│   │   └── supabase.ts       
│   ├── App.tsx               
│   ├── main.tsx              
│   └── index.css             
├── .env.local                
├── .env.example              
├── vite.config.ts            
├── tsconfig.json
└── package.json
```

---

## Prerequisites

Ubuntu 24.04 with Node 20+:

```bash
# Check versions
node --version    # must be v18+
npm --version
git --version

# If Node not installed:
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
source ~/.bashrc
nvm install 20 && nvm use 20
```

---

## Installation

```bash
# Clone the repo
git clone https://github.com/YOUR_USERNAME/workspace-lens.git
cd workspace-lens

# Install dependencies
npm install --legacy-peer-deps

# Verify
npm ls --depth=0
```

---

## Environment Setup

### 1. Create Supabase project

1. Go to [supabase.com](https://supabase.com) → New project → name it `workspace-lens`
2. Region: E.g **West EU (Ireland)**
3. Storage → New bucket → name: `workspace-photos` → Private
4. Storage → Policies → New policy on `workspace-photos`:
   - Operation: **INSERT**
   - Role: **anon**
   - Definition: `true`
5. Settings → API → copy **Project URL** and **anon public key**

### 2. Configure environment

```bash
cp .env.example .env.local
code .env.local
```

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=eyJyour-anon-key-here
VITE_STUDY_ID=outdoor-work-study-2025
```

---

## Running Locally

### Standard dev server (laptop browser only)

```bash
npm run dev
# opens http://localhost:5173
```

### HTTPS dev server (required for mobile camera testing)

```bash
npm run dev
# opens https://localhost:443
```

## Testing on Mobile

Full test checklist on your phone:

```
□ Go to WorkspaceLens Home or landing page
□ Familiarize with Home / About Study / Your Task / Consent sections
□ Make use of provided participant ID in "Participate Now" link in Login screen
  E.g P007 
□ "Take Photo" → rear camera opens
□ Take photo as instructed
□ if photo captured successfully then the Privacy Editor loads with the image
□ Apply black box or blur features to sensor parts of the image by dragging on image
□ Can see number of Action counts in badge updates (e.g. "✓ 2 areas")
□ Review after sesoring if applied by ticking checkbox
□ Tap Confirm & Send before uploding
□ Can see Success screen if successfully uploaded to server
□ Can capture more images if needed or logout
```
---

## Build & Deploy

### Production build

```bash
npm run build
# output in dist/
```

### Deploy to Netlify

1. Push to GitHub (see Git Setup below)
2. Go to [netlify.com](https://netlify.com) → Add new site → Import from GitHub
3. Build settings:
   - **Build command:** `npm run build`
   - **Publish directory:** `dist`
4. Environment variables → add your three `VITE_*` vars
5. Deploy — Netlify gives you a public HTTPS URL immediately

Every push to `main` auto-deploys. No manual steps needed.

---

## Viewing Results

### Supabase dashboard (easiest)

1. Go to [supabase.com/dashboard](https://supabase.com/dashboard)
2. Your poject → Storage → workspace-photos
3. Browse by participant folder — preview photos, download JSON files


### JSON response format
> This section is under active development. The structure may be updated.

Each `.json` file contains:

```json
{
  "participantId": "P007",
  "studyId": "outdoor-work-study-2025",
  "timestamp": "2025-05-01T09:14:22.000Z",
  "gps": { "lat": 65.012, "lng": 25.471 },
  "responses": {
    "locationType": "outdoor",
    "thermalComfort": 3,
    "surroundings": "nature",
    "naturalLight": 4,
    "noiseLevel": "quiet",
    "activity": "deep_work"
  }
}
```
*WorkspaceLens · CrowdComputing Research Group 
