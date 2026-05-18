# Surviving Talamh — Setup Guide

A complete step-by-step guide to get the site live on `survivingtalamh.uk`.

Time required: **~30 minutes** for the first-time setup.

---

## Overview

The site is a plain HTML/CSS/JS project (no build step). It uses **Supabase** for fan art uploads and comments, and deploys as a static site to **Vercel** with your **GoDaddy** domain pointed at it.

The flow:
1. Set up Supabase (database + image storage)
2. Add your Supabase credentials to the project
3. Deploy to Vercel
4. Point the GoDaddy domain at Vercel
5. Create Matthew's admin login

---

## 1. Supabase Setup

### 1a. Create a Supabase project
1. Go to [supabase.com](https://supabase.com) and sign up (free).
2. Click **New Project**. Pick any name (e.g. `surviving-talamh`).
3. Set a strong database password (you won't usually need it, but save it).
4. Choose the region closest to the UK (e.g. **West EU (London)** or **West EU (Ireland)**).
5. Wait ~2 minutes for the project to provision.

### 1b. Create the storage bucket
1. In your Supabase project, go to **Storage** (left sidebar).
2. Click **New bucket**.
3. Name it exactly: `fan-art`
4. Toggle **Public bucket** to **ON** (so images can be displayed on the site).
5. Click **Save**.

### 1c. Run the SQL schema
1. Open **SQL Editor** in the left sidebar.
2. Click **New query**.
3. Open the file `supabase-schema.sql` from this project and **copy its entire contents**.
4. Paste into the SQL editor and click **Run** (bottom right).
5. You should see green "Success" messages. This creates the two tables and all security policies.

### 1d. Create Matthew's admin account
1. Go to **Authentication → Users** in the left sidebar.
2. Click **Add user → Create new user**.
3. Enter Matthew's email and a strong password.
4. Tick **Auto Confirm User** (so he doesn't need to verify by email).
5. Click **Create user**.

That's the only account that will exist — fans never log in.

### 1e. Get the project URL and anon key
1. Go to **Project Settings → API** (left sidebar, gear icon).
2. Copy two values:
   - **Project URL** (looks like `https://abcdefgh.supabase.co`)
   - **Project API keys → `anon` `public`** (a long string starting with `eyJ…`)

You'll paste these into `js/config.js` next.

---

## 2. Configure the project

1. Open `js/config.js` in any text editor.
2. Replace the two placeholder values:

```js
SUPABASE_URL: "https://YOUR-PROJECT.supabase.co",
SUPABASE_ANON_KEY: "eyJhbGciOiJIUzI1NiIs...your-key-here...",
```

3. Save the file.

The anon key is **safe to expose** in client code — Row-Level Security policies protect the data.

---

## 3. Deploy to Vercel

### 3a. Push the project to GitHub (recommended)
This makes future updates one-click. If Matthew doesn't have GitHub, skip to **3b**.

1. Create a free [GitHub](https://github.com) account.
2. Create a new repository named `surviving-talamh-site`.
3. Drag and drop **all files in this folder** into the repo's upload page, then commit.

### 3b. Deploy on Vercel
1. Go to [vercel.com](https://vercel.com) and sign up (free; sign in with GitHub for simplicity).
2. Click **Add New → Project**.
3. **If using GitHub:** select the `surviving-talamh-site` repo → **Import** → **Deploy**.
   **If not using GitHub:** Vercel CLI is the alternative — install [vercel CLI](https://vercel.com/docs/cli), run `vercel` inside this folder, follow prompts.
4. Wait ~30 seconds. You'll get a URL like `surviving-talamh.vercel.app`.
5. Visit it. The site should be fully working already.

---

## 4. Point the GoDaddy domain at Vercel

### 4a. Add the domain in Vercel
1. In your Vercel project: **Settings → Domains**.
2. Type `survivingtalamh.uk` and click **Add**.
3. Vercel will show you DNS records to add. Typically:
   - **A record**: name `@`, value `76.76.21.21`
   - **CNAME record**: name `www`, value `cname.vercel-dns.com`

(The exact values may differ — always use what Vercel shows you.)

### 4b. Update DNS in GoDaddy
1. Log into [GoDaddy](https://godaddy.com).
2. Go to **My Products → Domains → survivingtalamh.uk → DNS**.
3. Delete any existing **A record** with name `@` (the default parking page).
4. Delete any existing **CNAME record** with name `www`.
5. Click **Add** and create the **A record** Vercel gave you (host `@`, value `76.76.21.21`).
6. Click **Add** again and create the **CNAME record** (host `www`, value `cname.vercel-dns.com.`).
7. Save changes.

### 4c. Wait for DNS to propagate
- Usually 5–30 minutes.
- Vercel will automatically issue a free SSL certificate as soon as DNS resolves.
- Refresh Vercel's Domains page; you should see green ticks next to both `survivingtalamh.uk` and `www.survivingtalamh.uk`.
- Visit `https://survivingtalamh.uk` — the site is live.

---

## 5. Test the full flow

1. Visit the live site, scroll to **Fan Zone**.
2. Submit a piece of fan art and a comment using a friend's name.
3. Go to `https://survivingtalamh.uk/admin.html`.
4. Sign in with the email + password from step 1d.
5. You'll see one pending art submission and one pending comment. Click **Approve** on each.
6. Refresh the main site — both should now appear in the public gallery and comments.

---

## Updating the YouTube embed

The site currently shows a placeholder embed. To show a specific video:

1. Open `index.html` and find the line containing `youtube.com/embed/videoseries`.
2. Replace the entire `src` attribute with the embed URL of the chosen video, e.g.:
   ```html
   src="https://www.youtube.com/embed/dQw4w9WgXcQ"
   ```
3. Redeploy (or push to GitHub — Vercel auto-deploys).

You can find a video's embed URL by clicking **Share → Embed** on any YouTube video.

---

## Common issues

**"Fan Zone is offline"**
You haven't added your Supabase URL + anon key to `js/config.js`. Open it and paste them in.

**Upload fails with "permission denied"**
You either skipped creating the storage bucket, didn't set it to **Public**, or didn't run the SQL schema. Re-check section 1.

**Admin login says "Invalid login credentials"**
The email/password don't match a user in Supabase. Go to **Authentication → Users** and verify the account exists and is confirmed.

**Domain still shows GoDaddy parking page after 1 hour**
DNS hasn't propagated. Check at [dnschecker.org](https://dnschecker.org) by typing `survivingtalamh.uk` — you should see Vercel's IP listed globally. If not, double-check the records in GoDaddy.

**Images don't load in the gallery**
The storage bucket isn't set to Public. Go to Supabase → Storage → `fan-art` bucket → settings → toggle **Public bucket** on.

---

## Project structure

```
surviving-talamh/
├── index.html              # Main landing page
├── admin.html              # Moderator panel (matthew only)
├── css/
│   └── style.css           # Full stylesheet
├── js/
│   ├── config.js           # ← EDIT THIS with your Supabase credentials
│   ├── main.js             # Countdown + Supabase client setup
│   ├── fanzone.js          # Fan art uploads + comments
│   └── admin.js            # Moderation logic
├── assets/
│   └── cover.png           # Book cover
├── supabase-schema.sql     # Run once in Supabase SQL editor
├── SETUP.md                # This guide
└── README.md               # Quick reference
```

---

## What it costs

**£0/month** for normal traffic levels:
- Vercel free tier: 100GB bandwidth, unlimited sites
- Supabase free tier: 500MB database, 1GB file storage, 50K monthly active users
- GoDaddy: only the domain renewal (~£15/year)

If the site goes viral and exceeds the free tiers, Supabase Pro is $25/month.
