# Surviving Talamh — Holding Site

Pre-release website for **Surviving Talamh**, the debut novel by **Matthew Lockett**.

🟢 **Status:** Holding page with countdown to 1 February 2027
🌐 **Domain:** survivingtalamh.uk

## Features

- **Hero** with the book cover, tagline, and a live countdown to launch day
- **Synopsis section** with inspirations (FF7, The Matrix, LOTR)
- **YouTube embed** to feature Matthew's video updates
- **Connect grid** linking out to Mailchimp, Substack, YouTube, TikTok
- **Fan Zone** — anonymous fan art uploads + reader comments
- **Admin panel** at `/admin.html` for moderating submissions before they go live
- Custom design: electric green / void black, Cinzel × Cormorant × JetBrains Mono typography, atmospheric scanlines and lightning

## Stack

- Plain HTML/CSS/JS (no build step)
- Supabase (Postgres + Storage + Auth)
- Deploys as static site to Vercel

## Getting it live

See **[SETUP.md](./SETUP.md)** for the full step-by-step deployment guide.

The short version:
1. Create a Supabase project, run `supabase-schema.sql`, create the `fan-art` storage bucket
2. Paste your Supabase URL + anon key into `js/config.js`
3. Deploy to Vercel, point `survivingtalamh.uk` at it via GoDaddy DNS

## Credits

- Cover illustration by **Lea Courtney**
- Site built for Matthew Lockett

- <!-- Test commit to verify auto-deploy -->
- <!-- Testing auto-deploy on fresh project -->
