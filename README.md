# 🐾 PlayFul Paws — Comes Animal Shelter

A React + Vite + Supabase website for the **Comes** shelter (Kainar, ~37.5 km from Almaty).
Visitors can browse rescued animals, ask questions on each animal's page, and submit a structured
adoption application that lands directly in the shelter's Supabase database.

## What's inside

```
.
├── index.html
├── package.json
├── vite.config.js
├── vercel.json              ← Vercel SPA routing config
├── .env                     ← your Supabase URL + anon key (NOT committed)
├── .env.example
├── public/
│   ├── qr.png               ← (optional) donation QR image; falls back automatically
│   └── about/               ← `team-photo.jpg` + `project-mockup.jpg` (About Us — two images)
├── supabase/
│   ├── schema.sql           ← run once: tables + RLS + secure question RPCs
│   └── security_questions.sql ← only if you deployed an older schema without `edit_token`
└── src/
    ├── main.jsx             ← router (/, /animal/:id, /apply/:id)
    ├── index.css            ← global reset; fixes the "two indents" background gap
    ├── supabaseClient.js
    ├── questionTokens.js    ← session-only tokens for edit/delete on own messages
    ├── App.jsx              ← home: sticky nav, hero, pets, charity, About (two design images)
    ├── AnimalPage.jsx       ← profile: requirements panel + animal card + questions (separate blocks)
    └── ApplyPage.jsx        ← adoption form with date/time + consent checkbox
```

## Real links wired in

| Where        | URL                                                          |
|--------------|--------------------------------------------------------------|
| Instagram    | https://www.instagram.com/comes.kz.almaty/                   |
| WhatsApp     | https://api.whatsapp.com/send?phone=7017230104               |
| Donate (QR)  | https://scan.page/zJh9WM                                     |
| inVision U   | https://www.invisionu.education/                             |

---

## 1. Run it locally

```bash
npm install
npm run dev
```

Open <http://localhost:5173>. Hot reload works.

The `.env` file in the repo already has your Supabase credentials, so the site loads data
straight away.

**Typography:** the UI uses two free Google Font families only — **Inter** (body and UI) and
**Plus Jakarta Sans** (headings), loaded in `index.html` and wired in `src/index.css`.

> The "two indents" background bug is fixed: `index.css` resets every default margin/padding
> on `html`, `body`, and `#root` and paints the brand cream `#FAF6F0` all the way to the edges.

---

## 2. Set up Supabase (one-time)

1. Open your Supabase project: <https://supabase.com/dashboard/project/tfucrmuiuarvchjhlgmj>
2. Go to **SQL Editor → New query**.
3. Paste the entire contents of [`supabase/schema.sql`](./supabase/schema.sql) and click **Run**.

That creates four tables and Row-Level-Security policies:

| Table             | Purpose                                                            |
|-------------------|--------------------------------------------------------------------|
| `animals`         | Catalogue: name, type, age, gender, status, photo, description, `arrival_story`, `special_characteristics` |
| `rescue_stories`  | The "Rescue Story" card on the hero (e.g. Victoria), + future news |
| `questions`       | Messages per animal; edit/delete via RPC + session token only       |
| `adoptions`       | Submitted adoption applications, sorted by `visit_at` (calendar)   |

To upload animal photos, use **Supabase → Storage → Create bucket `animals` (public)**, drop
in an image, copy its public URL, and paste it into the `photo_url` column for the matching
row in `animals`.

---

## 3. Deploy publicly to Vercel

This makes the site reachable from anywhere via a real `https://...vercel.app` link
(or your own domain) — not just your local hotspot.

### Option A — through the Vercel dashboard (recommended, no CLI)

1. Push this folder to a new GitHub repository (private is fine).
   - In GitHub: **New repo → playful-paws**, then locally:
     ```bash
     git init
     git add .
     git commit -m "Initial PlayFul Paws site"
     git branch -M main
     git remote add origin https://github.com/<your-username>/playful-paws.git
     git push -u origin main
     ```
   - The included `.gitignore` keeps your `.env` and `node_modules` out of the repo.
2. Go to <https://vercel.com/new> and **Import** the GitHub repo.
3. Vercel auto-detects **Vite** (the `vercel.json` confirms it).
   Build command: `npm run build`, output: `dist`.
4. Open **Environment Variables** and add **both** of these (Production + Preview + Development):
   ```
   VITE_SUPABASE_URL  = https://tfucrmuiuarvchjhlgmj.supabase.co
   VITE_SUPABASE_ANON_KEY = <paste the anon key from your local .env>
   ```
5. Click **Deploy**. After ~60 seconds you'll get a public URL like
   `https://playful-paws.vercel.app` — share that anywhere.

Every later `git push` to `main` will redeploy automatically.

### Option B — Vercel CLI (no GitHub needed)

```bash
npm i -g vercel
vercel login
vercel            # first run: answers project setup, creates a preview URL
vercel --prod     # promotes to the production URL
```

When asked, set the same two environment variables.

### Option C — drag-and-drop the `dist/` folder

Run `npm run build`, then go to **vercel.com/new → "Import Other" → Deploy** and drop the
`dist` folder. This works for one-off uploads but doesn't auto-redeploy.

---

## 4. After deploying — connect Supabase to your live URL

In Supabase, open **Authentication → URL Configuration** and add your Vercel URL
(e.g. `https://playful-paws.vercel.app`) to the **Site URL** + **Redirect URLs** lists.
This isn't strictly required for the current read/write flow (you're using the public anon
key with RLS), but it's the right setup for any future login features.

---

## 5. About Us — two design images

Place **two** images in `public/about/` (same layout as the original mock-up: two columns on
tablet and up, stacked on small screens):

- `team-photo.jpg` — group photo of the team  
- `project-mockup.jpg` — project / site mock-up  

If the files are missing, labelled placeholders appear with the expected paths so you can
drop assets in without changing code.

---

## 6. Privacy & data handling

- **HTTPS everywhere** in production (Vercel). Adoption rows are **insert-only** from the
  browser; there is no public `select` policy on `adoptions`, so applicants cannot read each
  other's data via the anon key.
- **Questions:** the database stores a secret `edit_token` per row, but it is **never returned**
  on normal list queries. After you post a message, the app keeps your token in
  `sessionStorage` for that tab only. **Edit** and **Delete** in the ⋯ menu call Supabase RPCs
  (`update_own_question`, `delete_own_question`) that verify the token server-side.
- **HTTP headers** on Vercel (`vercel.json`): `X-Content-Type-Options`, `Referrer-Policy`,
  `Permissions-Policy` for baseline hardening.

If you created the project before `edit_token` existed, run
[`supabase/security_questions.sql`](./supabase/security_questions.sql) once (adds the column
and RPCs if missing). Fresh installs only need [`supabase/schema.sql`](./supabase/schema.sql).

---

## 7. Where the product spec is reflected

| Correction in the PDF                                                | Where it lives now                                                       |
|----------------------------------------------------------------------|--------------------------------------------------------------------------|
| Hero stays as is, rescue story stored in Supabase                    | `App.jsx` reads from `rescue_stories` (featured row)                     |
| **Find an Animal** / **Charity** / **About Us** in sticky nav        | `App.jsx` — dark bar vs beige; scroll anchors to pets, charity, About   |
| Filter works                                                         | `App.jsx` — Everything / Dogs / Cats                                       |
| Click a card → animal page                                           | Route `/animal/:id` → `AnimalPage.jsx`                                   |
| Charity scrolls to donation block                                    | `App.jsx` — `scrollTo(donateRef)`                                       |
| QR image opens https://scan.page/zJh9WM                              | `App.jsx` `<a href={DONATE_URL}>` wrapping `qr.png`                     |
| Instagram + WhatsApp buttons work                                    | `App.jsx` — real URLs                                                    |
| **inVision U** name links to invisionu.education                     | `App.jsx` "About Us" section                                             |
| "All data saved" indicator at the very end of page 1                 | `App.jsx` footer dot + label                                             |
| **Adoption Requirements** only on animal profile, outside animal card | `AnimalPage.jsx` — separate panel beside card (stacked on small screens) |
| Page 2 questions are saved + 3-dot menu (copy / edit / delete)       | `AnimalPage.jsx` + `questions` + RPCs + `questionTokens.js`              |
| **Go to Adoption Application** → page 3                              | `AnimalPage.jsx` `navigate('/apply/' + id)`                              |
| Page 3 sends data to Supabase                                        | `ApplyPage.jsx` `supabase.from('adoptions').insert(...)`                  |
| Calendar/visit time, sorted by nearest date                          | `visit_at` column + `adoptions_visit_at_idx` index in `schema.sql`       |
| Consent notification before sending                                  | `ApplyPage.jsx` consent checkbox + inline error if not checked           |

The original "Special Needs" filter and the second status-filter row were removed because
they aren't in the Figma prototype (per the rule: **only what's in the design**).

---

## 8. Useful queries for the shelter

Most upcoming adoption visits (used by the admin / Supabase Table Editor):

```sql
select id, full_name, phone, visit_at, animal_id
from adoptions
order by visit_at asc nulls last;
```

All questions for animal #1, newest first:

```sql
select id, animal_id, message, created_at, updated_at
from questions where animal_id = 1 order by created_at desc;
```

---

Built by Balaussa Satymbek, Milena Gukengeimer, Zarina Doszhanova, Aruzhan Yerkinova —
inVision U, 2026.
