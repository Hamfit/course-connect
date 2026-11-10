# CourseConnect — Launch Readiness Plan

**Prepared:** 10 November 2026
**Scope:** Full review of the repository (22 SQL migrations, 12 pages, 1 Edge Function, storage policies) plus a decision on database and file storage.
**Status:** The app is well built. It is not blocked on "which database". It is blocked on **where 1,789 files live**, **four security holes**, and **eight launch blockers**. Details below.

---

## TL;DR — the six things to do

| # | Action | Why | Cost | Effort |
|---|--------|-----|------|--------|
| 1 | **Keep Supabase Postgres.** Do not build your own database. | It is already built, secured with RLS, and migrated. | $0 | 0 |
| 2 | **Move all file storage to Cloudflare R2** (private bucket + short-lived signed URLs). | Supabase free gives 1 GB; your 1,789-file library is an estimated 4–9 GB. R2 gives 10 GB free with **zero egress fees**. | $0 → ~$2/mo | 2–3 days |
| 3 | **Upgrade Supabase to Pro ($25/mo) before public traffic.** | Free projects **pause after 7 days of inactivity** and have **no backups**. For KYC data, that is a launch risk you cannot accept. | $25/mo | 10 min |
| 4 | **Close the four security holes** (service key in repo, self-approval, public profiles, public material files). | One is a full database compromise; one lets any student approve their own uploads; one leaks student emails and ID document paths. | $0 | 1–2 days |
| 5 | **Fix the launch blockers** (dead waitlist button, no password reset, non-working search, 1 MB upload cap, and four more in Section 5). | These are the first things a real student hits. | $0 | 2 days |
| 6 | **Ship three differentiators** (instant `.edu.ng` verification, public course pages for SEO, one-tap Exam Packs). | This is what makes students choose you over a WhatsApp group. | $0 | 1–2 weeks |

**Month-1 running cost: ~$25/month.** Not a reason to delay launch.

---

## 1. The important correction: you already have a database

You already run **PostgreSQL on Supabase** with:

- 22 versioned migrations, including enums, foreign keys, triggers, and indexes.
- Row Level Security on every table.
- Supabase Auth (email + Google OAuth), with a profile/role trigger on signup.
- Three storage buckets (`materials`, `identifications`, `avatars`).
- Aggregation views and RPCs (`get_admin_stats`, `university_course_counts`).

That is a real, production-shaped architecture. Building your own database now would mean re-implementing authentication, password hashing, session handling, row-level permissions, file storage, backups, and TLS — months of work, with worse security than what you already have. **Do not do it.**

The actual blocker is different, and it is worth naming precisely:

> **Where do the files live, and who pays to deliver them?**

Right now the answer is **Google Drive links pasted into `materials.file_url`** — 1,789 distinct Drive file IDs across the seed migrations. That is not a database problem. It is a storage and ownership problem, and it is the one that should be solved this week.

### What the review found

| Area | State | Verdict |
|------|-------|---------|
| Postgres schema, RLS, migrations | Present and reasonably designed | ✅ Keep |
| Auth (email + Google) | Working, with agreement tracking | ✅ Keep |
| File storage | Mixed: 1,789 Drive links, two public buckets, one private | ❌ Replace |
| Free-tier operations | Auto-pause after 7 days, no backups, 1 GB storage | ❌ Upgrade |
| Access control on writes | Users can approve their own materials | ❌ Fix |
| Secrets | A `service_role` JWT is committed in `supabase/config.toml` | ❌ Rotate now |

---

## 2. Database decision

### Option A — Build our own database ❌

| Factor | Reality |
|--------|---------|
| Time | 2–4 months to reach parity with what you already have |
| Auth | You would rebuild password reset, OAuth, sessions, token refresh |
| Security | You would hand-roll row-level permissions — the most common source of data leaks |
| Backups | You become responsible for PITR, restore drills, and retention |
| Compliance | KYC documents are sensitive personal data; the burden shifts fully onto you |
| Cost | A VPS is $20–40/mo **plus** your engineering time **plus** on-call |

You would spend the launch window rebuilding a worse version of Supabase. No.

### Option B — Switch to a different free database platform ⚠️

The free tiers you will find (Neon, Turso, MongoDB Atlas, PlanetScale, Railway, Render) are all either:

- **Not Postgres** (so RLS, your SQL, and your migrations do not transfer), or
- **Scale-to-zero / cold-start** (first request after idle takes seconds), or
- **Capped harder than Supabase** (0.5 GB storage, limited compute hours), or
- **Missing the pieces you actually use** (Auth, Storage, Realtime, Edge Functions).

Migrating would cost you a week or two, break your RLS policies, and land you on another free tier with the same class of limits. It does not solve the actual problem.

### Option C — Keep Supabase, upgrade at launch ✅ **Recommended**

Supabase's current free tier (verified against their pricing page, November 2026):

| Free tier limit | Value | Impact on CourseConnect |
|-----------------|-------|-------------------------|
| File storage | **1 GB** | Your seeded library alone is an estimated 4–9 GB |
| Egress | 5 GB/mo (+5 GB cached) | ~1,700 downloads/month exhausts it |
| Database size | 500 MB | Fine for now |
| Active projects | 2 | Use the second one as staging |
| Inactivity pause | **After 7 days** | A quiet week takes the whole product offline |
| Backups | **None** | No recovery if KYC data is lost |
| Point-in-time recovery | **Not included** | Same |

Supabase **Pro at $25/mo** gives: no inactivity pausing, daily backups retained 7 days, 100 GB file storage, 250 GB egress, 8 GB database, 100,000 MAU, email support.

**$25/month is the single highest-value purchase you can make before launch.** It buys you the thing a launch cannot survive without: the site staying up, and data you can restore.

### If cash is genuinely the constraint this month

You can survive on the free tier for a short private beta, but only with all of these:

1. **Keep-alive.** A scheduled GitHub Action hitting a lightweight endpoint (e.g. `/rest/v1/universities?select=id&limit=1`) with the anon key, once a day. This prevents the 7-day pause. It is a workaround, not a guarantee — Supabase explicitly says a pause is possible even with light traffic.
2. **Your own backups.** Nightly `pg_dump` to R2, kept 30 days. Free tier has none, so you must own this.
3. **Move files to R2 immediately** (Section 3). This removes the 1 GB storage ceiling and the 5 GB egress ceiling in one move.
4. **A second free Supabase project as staging.** Never test migrations against the project students are using.
5. **Upgrade the moment you have more than ~100 real users.** Do not launch publicly on free.

### Recommended setup

```
Production project (Supabase Pro, $25/mo)
├── Postgres  ─── all metadata, users, permissions, KYC paths
├── Auth      ─── email + Google, sessions, JWT
├── RLS       ─── source of truth for who can do what
└── no files  ─── see Section 3

Staging project (Supabase Free)
└── same migrations, fake data, used for every schema change

Cloudflare R2 (free tier)
├── materials-private/    ← course PDFs, videos, images
├── kyc-private/          ← student IDs (admin-only access)
└── avatars-public/       ← profile pictures only
```

---

## 3. File storage: the real fix

### 3.1 Current state (and why it will fail at launch)

| Problem | Evidence in the repo | Consequence |
|---------|----------------------|-------------|
| The library is not yours | 1,789 Google Drive links in 4 seed migrations | Drive can throttle, change, or remove access; shared-link files break the moment the owner reorganises |
| Client limit is 1 MB | `Upload.tsx`: `if (selectedFile.size > 1 * 1024 * 1024)` | A normal lecture PDF or slide deck often exceeds this. **Video uploads are effectively impossible.** |
| Server limit is 10 MB | `20260614154500_secure_materials_avatars_storage.sql` | Two different limits; the README says 10 MB, the UI says 1 MB |
| Storage ceiling | Supabase free = 1 GB | Library is already several GB |
| Files are public | `materials` bucket `public = true` | Anyone with a URL can hotlink or bulk-download, with no login and no analytics |
| Seed data is manual | `course_materials_upload_guide.md` | You are uploading files by hand, one by one, from Drive |
| Drive links bypass the app | `getGoogleDriveDownloadUrl()` | Downloads and views happen outside your product; you cannot measure or protect them |

### 3.2 Recommended architecture

**Postgres stores metadata. R2 stores bytes. Supabase Auth decides who gets a URL.**

```
Student clicks "Download"
        ↓
React  ──► Supabase Edge Function  `get-file-url`
                ├── verifies the Supabase JWT (who is this?)
                ├── checks the material is `status = 'approved'`
                ├── checks the student is verified (if you gate uploads/downloads)
                └── returns a presigned R2 URL valid for 5 minutes
        ↓
Browser downloads directly from R2 (zero egress cost)
```

Store only this in Postgres:

```sql
ALTER TABLE public.materials
  ADD COLUMN storage_key TEXT,                 -- e.g. materials-private/2026/csc313/notes.pdf
  ADD COLUMN storage_provider TEXT DEFAULT 'r2',
  ADD COLUMN file_size_bytes BIGINT,
  ADD COLUMN file_hash TEXT;                   -- for duplicate detection later
```

Keep `file_url` for backwards compatibility during migration, then stop writing to it.

### 3.3 Why Cloudflare R2 (and the math)

Verified free tier (November 2026): **10 GB-month storage, 1M Class A writes, 10M Class B reads, and zero egress fees, forever.** Beyond that: $0.015/GB-month storage, $4.50/million writes, $0.36/million reads, egress still free.

Your numbers:

| Item | Estimate | On Supabase free | On R2 |
|------|----------|------------------|-------|
| 1,789 seeded files @ ~2 MB avg | ~3.6 GB | ❌ over 1 GB | ✅ within 10 GB |
| Same @ ~5 MB avg (slides + video) | ~8.9 GB | ❌ over 1 GB | ✅ just within 10 GB |
| 5,000 downloads/month @ 3 MB | 15 GB egress | ❌ 3× over 5 GB | ✅ $0 |
| 10,000 KYC documents @ ~1 MB | ~10 GB | ❌ | ⚠️ ~$0.15/mo overage |
| Requests | well under 1M writes / 10M reads | — | ✅ $0 |

**Why not stay on Google Drive:** shared-link Drive files are not a storage layer you control. You get no SLA, no per-user access control, no download analytics, no virus scanning, and Drive actively throttles high-volume downloads. You also cannot promise students "your KYC document is private" while hosting material on a personal Drive folder. It is fine as a *temporary* import source, not as your backend.

**Why not S3 straight away:** egress at ~$0.09/GB makes a download-heavy student app expensive fast. R2 is S3-compatible, so if you ever outgrow it, the code barely changes.

### 3.4 Migration plan for the existing 1,789 files

1. **Get the bytes back.** Use `rclone` with a Google Drive remote to copy the whole library into an R2 bucket. Do this once, unattended, overnight:
   ```bash
   rclone copy gdrive:CourseConnect r2:courseconnect-materials --progress --transfers 8
   ```
2. **Map filenames to rows.** Export `id, title, file_url` from `materials`, extract the Drive file ID from each URL, and match it to the file you copied. Write a one-off script to set `storage_key` per row.
3. **Verify.** Every row with `type !== 'text'` must have a `storage_key` whose object exists and a non-zero `file_size_bytes`. Fail loudly on any mismatch.
4. **Switch reads.** Deploy `get-file-url`, change the frontend to call it, then stop using `getPublicUrl` and `getGoogleDriveDownloadUrl`.
5. **Delete the Drive dependency.** Remove the Drive helpers from `src/lib/utils.ts` once zero rows reference Drive.
6. **Cut the client limit.** Raise it to **50 MB** for PDFs/images and **200 MB** for video, and enforce the same ceiling in R2 with a bucket rule.

> **Before doing this, check the Drive files' licence.** If the notes were collected from lecturers or other students without permission, bulk re-hosting them is a copyright exposure. Have a takedown/report path ready (Section 6) and prefer content you have permission to redistribute.

### 3.5 KYC documents (the sensitive part)

- **Separate bucket, private, no public URL ever.** `kyc-private/` is not the same bucket as course materials.
- **Store the object path, not a URL.** Today `Profile.tsx` saves `getPublicUrl(...)` for the `identifications` bucket, but that bucket was made private in `20260614132200_secure_identifications_bucket.sql`. The saved URL is therefore dead — admins currently work around it by string-parsing `/identifications/` out of the URL in `Admin.tsx`. That is fragile and will break the first time the URL format changes.
- **Issue signed URLs on demand** (60-second expiry) only to admins, via the same Edge Function pattern.
- **Retention:** delete the ID document 30 days after approval, or immediately on account deletion. You do not need to keep it forever, and keeping it increases your liability.
- **Nigeria:** KYC documents are personal data under the **Nigeria Data Protection Act 2023**. If you are processing them at scale you are a data controller and should register with the **Nigeria Data Protection Commission (NDPC)** and publish a lawful basis, retention period, and deletion process. Your `/privacy` page needs to say specifically what ID data you collect, why, where it is stored, and how a student requests deletion. This is a launch requirement, not a nice-to-have.

---

## 4. P0 — Security fixes before any public traffic

These are ordered by severity. All are small changes; none require a rewrite.

### S1. `service_role` key committed to the repository — **critical**

`supabase/config.toml` is tracked by git and contains a JWT whose decoded payload is `"role": "service_role"`. That key bypasses **all** Row Level Security: full read/write on every table, every bucket, and the Auth admin API. Anyone with repo access — or anyone who ever forks or scrapes it — owns your database.

> The key's project ref (`acoalfub…x…`) does not match the `project_id` in the same file (`acoalfub…v…`), which suggests it may be a placeholder or a typo. **Treat it as live regardless.** You cannot prove it was never valid.

Do this today, in order:

1. **Rotate first.** Supabase Dashboard → Project Settings → API → *Rotate* the `service_role` / secret key. Then rotate the database password too.
2. **Confirm which project it belongs to** and rotate there as well if it is a different one.
3. **Stop tracking the file:**
   ```bash
   git rm --cached supabase/config.toml
   printf '\n# never commit Supabase local config with secrets\nsupabase/config.toml\n.env\n.env.*\n!.env.example\n' >> .gitignore
   ```
4. **Commit a safe template** (`supabase/config.toml.example`) with placeholders only.
5. **Purge it from history** (optional but recommended; `git filter-repo` rewrites history, so coordinate with collaborators):
   ```bash
   git filter-repo --path supabase/config.toml --invert-paths
   ```
6. **Add a pre-commit secret scan** so this cannot recur: `gitleaks` or `trufflehog` in a pre-commit hook.
7. **Audit for abuse:** check Auth users, recent table writes, and storage objects for anything you did not create.

Rotation is the fix. History purging is cleanup. Do not do them in the reverse order.

### S2. Any verified student can approve their own material — **critical**

The update policy only checks ownership:

```sql
CREATE POLICY "Users can update own materials"
  ON public.materials FOR UPDATE USING (auth.uid() = uploaded_by);
```

There is no `WITH CHECK` on `status`, and the only trigger on `materials` is `BEFORE INSERT` auto-approval for admins. So a verified student can send:

```js
await supabase.from('materials').update({ status: 'approved' }).eq('id', myId)
```

…and publish anything they like, bypassing moderation entirely. On a platform whose promise is "verified content", this defeats the core feature.

```sql
-- Replace the policy, don't just add another one
DROP POLICY IF EXISTS "Users can update own materials" ON public.materials;

CREATE POLICY "Owners can edit unpublished materials"
  ON public.materials FOR UPDATE TO authenticated
  USING (auth.uid() = uploaded_by AND status <> 'approved')
  WITH CHECK (auth.uid() = uploaded_by AND status = 'pending');
```

Admins keep their existing `"Admins can update all materials"` policy. Add a test that a normal user cannot set `status = 'approved'`.

### S3. Every profile is world-readable, including emails and ID paths — **high**

`profiles` still has `FOR SELECT USING (true)` from the first migration, and it was never replaced. Because `handle_new_user()` defaults `display_name` to the user's **email address**, an unauthenticated visitor can call:

```
GET /rest/v1/profiles?select=display_name,identification_url
```

…and receive student emails plus the storage paths of their uploaded ID documents. The bucket is private, so the path alone does not grant access — but this is still a personal-data leak under NDPA, and it is trivially scrapable.

RLS cannot hide individual columns, so fix it with column-safe access:

```sql
-- 1. Lock the base table to owners and admins
DROP POLICY IF EXISTS "Profiles are publicly readable" ON public.profiles;

CREATE POLICY "Users can read own profile" ON public.profiles
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Admins can read all profiles" ON public.profiles
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

REVOKE SELECT ON public.profiles FROM anon;

-- 2. Expose only safe columns to the world through a view
CREATE OR REPLACE VIEW public.public_profiles AS
SELECT id, user_id, display_name, avatar_url,
       university_id, department_id, level_id,
       verification_status, created_at
FROM public.profiles;

GRANT SELECT ON public.public_profiles TO anon, authenticated;
```

Then update the three call sites that read other users' profiles (`Profile.tsx`, `HeroSection`'s student count, `Admin.tsx` uses the base table as an admin) to use the view. Also stop defaulting `display_name` to email:

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user() ...  -- change to:
COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1), 'Student')
```

Backfill existing rows once, with a service-role script.

### S4. Material files are publicly readable — **medium**

The `materials` bucket is `public = true`, and `Upload.tsx` saves `getPublicUrl(...)`. Anyone with a URL downloads without an account. If unrestricted download is *intentional* (a growth decision), write that down and accept it. If it is not, make the bucket private and issue signed URLs through the Edge Function in Section 3.2.

**My recommendation:** keep downloads open for now — it helps adoption and SEO — but move the files to R2 so you at least control access, measure downloads, and can turn on gating later without a migration.

### S5. Download counter can be inflated by anyone — **low**

`increment_material_downloads(uuid)` is `SECURITY DEFINER` and granted to `anon`. Anyone can loop it and fake popularity, which is the sort order on your Explore page.

Fix: require authentication and throttle per user, or (better) increment from the Edge Function that issues the signed URL, so one download equals one call.

### S6. No rate limiting — **medium**

Nothing stops a user from creating 10,000 rows or hammering `user_agreements`. Add a simple trigger-level throttle now, and a proper one later:

```sql
CREATE OR REPLACE FUNCTION public.enforce_upload_rate()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF (SELECT count(*) FROM public.materials
      WHERE uploaded_by = NEW.uploaded_by
        AND created_at > now() - interval '1 hour') >= 10 THEN
    RAISE EXCEPTION 'Upload limit reached. Please try again later.';
  END IF;
  RETURN NEW;
END; $$;

CREATE TRIGGER tr_enforce_upload_rate
  BEFORE INSERT ON public.materials
  FOR EACH ROW EXECUTE FUNCTION public.enforce_upload_rate();
```

Supabase Auth already rate-limits signups and OTPs.

### S7. Duplicate migration version — **operational**

`20260623200001_seed_math_materials_part1.sql` and `20260623200001_seed_math_materials_part2.sql` share the same version number. The Supabase CLI keys migrations by the numeric prefix, so one of them will be skipped or collide on a fresh environment — meaning **staging and production will drift silently.** Rename one to `20260623200002_…` before the next deploy.

While you are there: `20260604112600_update_unilag_departments_levels.sql` **deletes all UNILAG departments** and cascades to courses. That is correct as a one-off, but it must never run again on a live database. Guard destructive migrations with a check, or mark them as already-applied.

---

## 5. P0 — Launch blockers (what a real student hits in the first five minutes)

| # | Problem | Where | Why it matters | Fix |
|---|---------|-------|----------------|-----|
| B1 | **"Join the Waitlist" is a dead button** | `WaitlistSection.tsx`: `const GOOGLE_FORM_URL = "#"` | A visible CTA that does nothing tells a first-time visitor the product is abandoned | Point it at a real form (Tally/Google Form) **or delete the section** — you are not pre-launch anymore, the app is live |
| B2 | **No password reset** | `Auth.tsx` has no "Forgot password" | Any student who forgets their password is permanently locked out; you have no support desk | Add `resetPasswordForEmail`, a `/reset-password` page, and `updateUser({ password })` |
| B3 | **The hero search does nothing** | `HeroSection.tsx`: `navigate("/explore")` — `search` is discarded | The most prominent input on your homepage is decorative. Users type, land on a university list, and conclude search is broken | Pass the query (`/explore?q=...`) and filter across all materials, not just the current step |
| B4 | **1 MB upload limit** | `Upload.tsx` | Contradicts your own README (10 MB), your own bucket policy (10 MB), and reality (lecture PDFs are bigger). Video is advertised but unusable | Raise to 50 MB documents / 200 MB video and move to R2 |
| B5 | **"Reject & notify" never notifies** | `Admin.tsx` button copy | Admins believe students are told why they were rejected. They are not — there is no email integration anywhere in the repo | Either add email (Section 7) or change the copy to "Reject". Do not ship a false promise to your own moderators |
| B6 | **No error boundary** | `App.tsx` | One thrown render error = a blank white screen with no way out | Add a top-level `<ErrorBoundary>` with a reload action |
| B7 | **Landing page contradicts itself** | Hero says "Now live at UNILAG"; waitlist says "Expanding to more schools soon / get notified on launch" | Mixed messaging makes it unclear whether the product is usable today | Pick one story: "Live at UNILAG. Request your school." |
| B8 | **The signup funnel is heavy** | Sign up → email verify → complete profile → upload ID → wait for a human to approve → upload | At launch volume, every uploader costs you manual review time; students wait hours or days to contribute | See differentiator D1 (instant verification) |

---

## 6. What will make it stand out

Ranked by impact on adoption, not by how impressive the engineering is. The first three are the ones I would build before launch.

### D1. Instant verification via university email ⭐ highest leverage

Right now verification is manual: the student uploads an ID, an admin opens it and clicks approve. That does not scale past a few hundred users, and it blocks your most valuable users (people who want to *contribute*) at the exact moment they are motivated.

Change it to:

- Email domains like `@student.unilag.edu.ng`, `@unilag.edu.ng` → **auto-approve instantly** via a domain-to-university mapping table.
- Other students → still allowed to browse and download, but uploads go to manual review.
- Keep photo ID as a fallback for people without institutional email, not as the default path.

**Why it matters:** it removes your biggest operational bottleneck and turns signup into seconds. Keep the ID step only where you genuinely need identity assurance.

### D2. Public course pages that Google can index ⭐ highest growth leverage

Students do not search "CourseConnect". They search **"CSC 313 past questions UNILAG"** and **"COS 102 lecture notes"**. Right now every material sits behind a five-step click path and a client-side filter, invisible to search engines.

Build `/unilag/computer-science/300-level/csc-313` pages that server-render (or pre-render) the course code, title, semester, and the list of available materials, with proper `<title>`, description, and Open Graph tags. Add a `sitemap.xml` and `robots.txt`.

**Why it matters:** this is free, compounding acquisition from the exact intent your product satisfies. It is probably the single highest-ROI thing on this list after storage.

### D3. Exam Packs — one tap, whole semester

Group materials into a downloadable bundle: *"CSC 313 Exam Pack — 4 past questions, 2 note sets, 1 slide deck (18 MB)"*. One click, one ZIP, everything a student needs for that paper.

**Why it matters:** it converts your scattered library into an outcome ("pass this exam"), it is trivially shareable, and it gives you something concrete to promote during exam season. It also naturally increases downloads per session.

### D4. Offline / low-data mode

Nigerian students are on expensive, unreliable data. Add a service worker (PWA) so recently opened PDFs and notes are available offline, show file size before download, and compress images aggressively.

**Why it matters:** "works when your data finishes" is a real, felt differentiator that a well-funded competitor will not bother with. It also makes the app installable on Android without an app store.

### D5. WhatsApp as a distribution channel

WhatsApp is how Nigerian students already share materials. Add:

- A **share button** on every material that produces a rich preview link.
- A **study-group share** flow ("share this course library with your class group").
- Optionally, a WhatsApp bot that answers "CSC 313 past questions" with a link.

**Why it matters:** your growth loop is classmates forwarding links. Make that one tap, and make the link preview look credible.

### D6. A trust layer beyond admin approval

Moderation is binary right now: approved or not. Students cannot tell a good upload from a bad one. Add:

- 👍 "Helpful" votes and a 1–5 quality rating.
- "Downloaded by 42 students this week" — social proof beats a badge.
- Contributor reputation: uploads approved, average rating → levels/badges ("Top contributor, CSC 300L").
- A visible "verified student" indicator tied to D1.

**Why it matters:** trust is your entire value proposition versus a random WhatsApp file. Ratings also give you free quality data for ranking search results.

### D7. Real search

Today search only filters the 20 rows already loaded on the current screen. Add Postgres full-text search across `materials.title`, `description`, and course code/title, with `pg_trgm` for typo tolerance ("data structurs"), exposed as one RPC. Then the hero search becomes real and useful.

### D8. Notifications that actually exist

Email on: verification approved/rejected, material approved/rejected, new material in a course you follow. This also makes B5 honest. At launch volume a free transactional email tier is plenty. If you want templates and multi-channel later, [Knock](https://index.trygravity.com/go/ad9f704b-7c8f-45b6-81b9-5832d2355d52) has a $0 tier for 10,000 messages/month — but note it orchestrates rather than delivers, so you still connect an email provider (SendGrid/Postmark/Twilio) underneath. For launch, a direct provider is simpler.

### D9. Admin tooling that scales

The dashboard is well designed but one-row-at-a-time. Add: bulk approve, search/filter by title/user/course, a duplicate detector (`file_hash` from Section 3), an SLA timer on pending items, and an audit log of who approved what. Your moderator's time is the scarcest resource you have.

### D10. Observability

Right now a production error is invisible: there is no error boundary, no error tracker, and no analytics (the only mention of analytics is a line in the Privacy page). Add Sentry for errors and PostHog for product analytics (both have free tiers; verify current limits when you sign up). Track the funnel: visit → signup → profile complete → verified → upload → download. Without this you are guessing.

---

## 7. Engineering hygiene (P2, but cheap)

| Item | Current state | Recommendation |
|------|---------------|----------------|
| Tests | One placeholder (`expect(true).toBe(true)`) | Add tests for the RLS rules you just fixed, the upload validation, and the download URL flow. Three real tests beat none. |
| CI | None | GitHub Action on PR: `npm ci`, `tsc --noEmit`, `eslint`, `vitest run`, `npm run build` |
| Type safety | Several `as any` and `(supabase as any)` casts | The generated types already include `department_levels`, but every call site bypasses them. Regenerate after each migration and drop the casts |
| Staging | None | Second free Supabase project; apply every migration there first |
| Migrations | Applied via SQL Editor per the README | Use `supabase db push` and commit the migration history; this removes "works on my machine" schema drift |
| Secrets | Committed config (S1) | `.env` local only, Edge Function secrets via `supabase secrets set`, `gitleaks` pre-commit |
| Bundle | Main JS 627 KB, CSS 70 KB | Acceptable, but lazy-load `recharts`/admin-only UI if you want faster first paint on 3G |
| SEO | Title + description only; no OG image, no sitemap | Add OG image, canonical URLs, `sitemap.xml`, per-course metadata (pairs with D2) |
| Auth polling | `Auth.tsx` re-attempts sign-in every 5 s while awaiting verification | Harmless but wasteful, and it keeps the password in memory; replace with a `onAuthStateChange` redirect plus a "resend email" button |
| Error copy | `error.message` shown raw to users | Map common Supabase errors to friendly messages |

---

## 8. Suggested 14-day sequence

**Days 1–2 — stop the bleeding**
- [ ] Rotate the Supabase `service_role` key and database password
- [ ] Remove `config.toml` from git, add `.gitignore`, add `gitleaks`
- [ ] Apply S2 (self-approval) and S3 (profile leak) SQL
- [ ] Fix the duplicate migration version

**Days 3–5 — make storage real**
- [ ] Create R2 bucket; `rclone` the Drive library across
- [ ] Add `storage_key` columns; backfill from Drive IDs
- [ ] Deploy `get-file-url` Edge Function; switch the frontend
- [ ] Raise upload limits; remove Drive helpers

**Days 6–7 — launch blockers**
- [ ] Real waitlist link or remove the section
- [ ] Password reset flow
- [ ] Working search (query param + Postgres FTS)
- [ ] Error boundary; fix "& notify" copy
- [ ] Upgrade Supabase to Pro

**Days 8–11 — differentiators**
- [ ] `.edu.ng` instant verification + domain mapping
- [ ] Public course pages + sitemap + OG images
- [ ] Exam Packs
- [ ] Email notifications on approval/rejection

**Days 12–14 — hardening and measurement**
- [ ] CI pipeline, three real tests, staging project
- [ ] Sentry + PostHog, funnel events
- [ ] Backups restored once (a backup you have never restored is not a backup)
- [ ] Privacy page updated for NDPA + retention policy
- [ ] Soft launch to one department, watch the funnel for a week

---

## 9. Budget

| Item | Month 1 | At ~10k students |
|------|---------|------------------|
| Supabase Pro | $25 | $25 |
| Cloudflare R2 (storage beyond 10 GB) | $0 | ~$1–2 |
| R2 egress | $0 | $0 |
| Email (free tier) | $0 | $0–20 |
| Sentry / PostHog (free tier) | $0 | $0–25 |
| Domain | ~$1 | ~$1 |
| **Total** | **~$26/mo** | **~$30–75/mo** |

For comparison: a self-managed VPS is $20–40/mo **before** your time, and gives you no managed backups, no PITR, and no RLS. Renting Postgres correctly is cheaper than owning it.

---

## 10. What I would not do right now

- **Build a custom database.** Months of work to end up less secure than Supabase.
- **Chase another free database tier.** It is a lateral move that breaks your RLS and auth, and every free tier has a ceiling.
- **Self-host Supabase on a VPS to avoid $25.** You inherit upgrades, backups, security patches, and downtime.
- **Keep using Google Drive as the backend.** It is a temporary import source, not infrastructure.
- **Add payments before retention.** Nail the free loop (find a course → download → get value) first.
- **Microservices / Kubernetes / a mobile app before the web product works.** The web app on a phone *is* the mobile product for now.

---

## 11. The honest summary

You have not failed to find a database — you already have one, and it is the right one. What you do not yet have is:

1. **A home for the files** (currently Google Drive + a 1 GB bucket).
2. **Free-tier terms you can launch on** (pause after 7 days, no backups).
3. **Four security issues** — a leaked service key plus three access-control bugs — that undermine the "verified, secure library" promise.
4. **A first-run experience** with a dead button, no password reset, and a search box that does nothing.

Fix those four things — roughly two weeks of focused work and $25/month — and you are launchable. Everything in Section 6 is what turns "launchable" into "students choose this over their WhatsApp group".
