# CourseConnect — Fixing Storage at Zero Budget, and Expanding to LASU + UNILORIN

**Scope of this document:** what to do about file storage before launch, given no budget, plus the concrete work needed to open LASU and UNILORIN.

**Correction to my earlier draft:** I had this backwards. I assumed the Google Drive links in the seed migrations were the product design and that users would paste links. That's wrong. Users upload raw files themselves — PDFs, notes, images, video — and the Drive links were a space-saving stopgap for seeded content. That changes the recommendations substantially, because the problem is no longer "replace Drive" but "accept real uploads on 1 GB of free storage with no money to spend." This version is built around that.

---

## 1. TL;DR

| Question | Answer | Cost |
|---|---|---|
| Do we need a new database? | **No.** You already run Postgres on Supabase: 22 migrations, RLS on every table, triggers, views, RPCs. Rebuilding is 2–4 months for a worse result. | $0 |
| Can we store user uploads for free? | **Documents and images yes, carefully. Video no.** 1 GB storage and 5 GB egress/month cannot hold raw video — the arithmetic is in §2. | $0 |
| What does video need? | Either a link field (what you're already doing) or a paid/zero-egress store. Keep links for video as a **feature**, not a hack. | $0 |
| What breaks LASU/UNILORIN today? | `department_levels` is seeded **only for UNILAG**. LASU and UNILORIN students hit an empty Level dropdown in Profile, Upload, and Explore and cannot proceed. One migration fixes it. | $0 |
| What is the first money you should spend? | Not Pro, not R2. **Nothing** — until either (a) you have a card and 10 GB of video to host, or (b) egress is the ceiling. See §11 for trigger points. | $0 |
| Biggest non-storage launch blocker? | A `service_role` JWT is committed in `supabase/config.toml`, and any verified student can self-approve their own uploads. §7. | $0 |

---

## 2. The arithmetic that decides everything

Supabase free tier (verified November 2026): **500 MB database, 1 GB file storage, 5 GB egress/month**, 50,000 monthly active users, 2 projects. Free projects **pause after 7 days without activity** and have **no backups**.

**Storage: 1 GB is the whole library.**

| Content | Typical size | Fits in 1 GB |
|---|---|---|
| Text-heavy lecture note (PDF) | 1–3 MB | 350–1,000 files |
| Scanned handout (PDF) | 6–10 MB | 100–170 files |
| Phone photo of a whiteboard | 3–5 MB | 200–340 files |
| 5-minute 720p MP4 | 100–150 MB | **7–10 videos total** |
| 30-minute recorded lecture | 500 MB–1 GB | **1–2 videos total** |

**Egress: 5 GB/month is the real ceiling, and it's lower than you think.** Downloads are what get charged, not uploads.

- A 4 MB PDF downloaded 1,000 times = 4 GB. **One department in exam week can exhaust the month.**
- A 120 MB video watched 40 times = 4.8 GB. **One popular lecture video exhausts it.**

So: *storage* limits what you can hold, *egress* limits who can read it. Both are hard caps — once egress is exceeded, your files stop serving. That's a worse failure mode than a slow site, and it lands during exam season when you have the most traffic.

**The honest conclusion:** a free tier can host a **curated library of a few hundred documents** with a few hundred active users. It cannot host an open upload firehose for a university. Your approval queue is not just a quality gate — it is your **storage budget**.

---

## 3. Why "build our own database" and "switch to a free DB platform" both lose

- **Build your own:** you'd be re-implementing Postgres, auth, row-level security, file storage, and backups. Supabase is already free and already integrated. Nothing to gain, months to lose.
- **Switch to another free DB (Firebase, Neon, PlanetScale, etc.):** none of them give you Postgres + auth + storage + RLS in one place on a free tier. You'd rewrite every migration, every RLS policy, and every `supabase.from(...)` call. Your 22 migrations are an asset, not a liability.
- **Free file hosts (Cloudinary, ImageKit, Filebase, B2):** each has its own limits and most require a payment method at signup. Migration cost is high, gain is a few GB.

**Keep Supabase.** Your database is not the problem and never was.

---

## 4. The zero-cost storage design

### 4.1 Raw uploads for what fits, links for what doesn't

Split by file type, because the physics differ by three orders of magnitude:

| Type | Path | Why |
|---|---|---|
| PDF / notes / `.docx` | **Raw upload** to `materials` bucket, ≤ 10 MB | Small, high value, searchable text |
| Images | **Raw upload**, compressed to WebP client-side | 5 MB phone photo → ~400 KB |
| Video | **Link field** (YouTube unlisted, Drive, or any embeddable URL) | 100× larger than everything else combined |

This is what you already do. Make it a deliberate, documented product rule — "**Upload your notes, link your videos**" — instead of an accident, and stop apologising for it. Every serious study platform that runs on a shoestring does the same thing.

Recommend **YouTube unlisted** over Drive for video: unlimited free bandwidth, real player, works on cheap Android phones, and no Drive download-quota errors ("Too many users have viewed this file"). Drive embeds break exactly when a file gets popular. Keep Drive support too, since some uploaded content is already there.

### 4.2 Schema changes (one migration)

Right now `materials.file_url` holds a full public URL, and the same column holds both Supabase URLs and Drive links. That's why you can't move storage later without rewriting every row, and why the frontend has to sniff the string to decide how to render it.

```sql
alter table public.materials
  add column storage_path      text,     -- bucket-relative path: "<uid>/<ts>.pdf"
  add column storage_provider  text not null default 'supabase'
    check (storage_provider in ('supabase','youtube','drive','external')),
  add column file_hash         text,     -- sha-256 of the bytes, for dedupe
  add column file_size_bytes   bigint,
  add column external_url      text;     -- for provider <> 'supabase'

create index materials_file_hash_idx on public.materials (file_hash)
  where file_hash is not null;
```

Then store the path, not the URL. Derive the URL at read time with `getPublicUrl(storage_path)`. When you eventually move to R2 or Supabase Pro, you change one helper function instead of 1,789 rows.

Backfill the existing Drive rows as `storage_provider = 'drive'`, `external_url = file_url`. Keep `file_url` for one release as a fallback, then drop it.

### 4.3 Deduplicate — the single biggest free win

In a 300-level class of 200 students, the same lecturer's handout gets uploaded **forty times**. That is 40× the storage for one file.

- Hash the file in the browser before upload (`crypto.subtle.digest('SHA-256', buffer)`).
- Before uploading, query: does an approved material with this `file_hash` already exist for this course?
- If yes, don't upload the bytes. Show: *"This exact file is already on CourseConnect for CSC 313. Thanks — we've credited you as a contributor."* Increment a `contribution_count` on the existing record instead.
- If no, upload normally and store the hash.

This typically cuts storage 30–60% on a real campus, and it's pure profit: no extra infrastructure. It also gives you a genuine social feature — **contributor credit**, which is the strongest growth loop a student platform has.

### 4.4 Compress before upload

Currently `Upload.tsx` sends the file untouched with a hard 1 MB cap (`1 * 1024 * 1024`) — which contradicts your own bucket policy of 10 MB and makes the advertised video uploads impossible.

- **Images:** draw to a `<canvas>`, export WebP at quality 0.8, cap the long edge at 1600 px. A 5 MB JPEG becomes ~350 KB with no visible loss on a phone screen. A 12-line helper function.
- **PDFs:** don't try to re-render (lossy, risky). Instead, warn above 8 MB and tell the user how to compress, or accept and let moderation decide.
- **Raise the client cap to 10 MB** so it matches `file_size_limit = 10485760` in migration `20260614154500`. Right now the server allows more than the form does, which is confusing and undocumented.

Estimated saving: images 85–92%, PDFs 0%. Overall, on a notes-heavy corpus, roughly 40%.

### 4.5 Quotas enforced in the database, not the UI

Browser-side checks are advisory; anyone can `curl` your API with their session token. Enforce server-side:

```sql
create or replace function public.enforce_upload_quota()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  used_bytes  bigint;
  today_count int;
begin
  select coalesce(sum(file_size_bytes), 0) into used_bytes
    from public.materials where uploaded_by = new.uploaded_by;

  select count(*) into today_count
    from public.materials
   where uploaded_by = new.uploaded_by
     and created_at > now() - interval '24 hours';

  if used_bytes + coalesce(new.file_size_bytes, 0) > 25 * 1024 * 1024 then
    raise exception 'Upload quota reached (25 MB per account). Ask an admin to raise it.';
  end if;

  if today_count >= 5 then
    raise exception 'Daily upload limit reached (5). Try again tomorrow.';
  end if;

  return new;
end;
$$;

drop trigger if exists materials_upload_quota on public.materials;
create trigger materials_upload_quota
  before insert on public.materials
  for each row execute function public.enforce_upload_quota();
```

25 MB lifetime per account is deliberate and tight, because 1 GB ÷ 25 MB = 40 fully-stocked accounts. It is a **stopgap, not a policy** — raise it the moment you have more storage. Pair it with a clear error message so users understand why.

### 4.6 Stop leaking storage on reject and delete

Two leaks are already live in the codebase:

1. **Deleting a material leaves the file in the bucket.** `Users can delete own materials` (base migration) removes the row; the object stays forever, invisible and uncounted.
2. **Rejecting in the admin panel keeps the file.** `Admin.tsx` sets `status = 'rejected'` and never deletes the object.

Both silently eat your 1 GB. Fix with a trigger that records the path, plus a small Edge Function (using `service_role`) that deletes storage objects when a row is deleted or rejected:

```sql
create table if not exists public.storage_cleanup_queue (
  id bigserial primary key,
  bucket_id text not null,
  object_path text not null,
  created_at timestamptz not null default now(),
  processed_at timestamptz
);
alter table public.storage_cleanup_queue enable row level security;
-- no policies: only service_role touches this table

create or replace function public.queue_file_cleanup()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'DELETE' then
    insert into public.storage_cleanup_queue (bucket_id, object_path)
    values ('materials', coalesce(old.storage_path, ''))
    on conflict do nothing;
    return old;
  end if;

  if new.status = 'rejected' and old.status <> 'rejected' then
    insert into public.storage_cleanup_queue (bucket_id, object_path)
    values ('materials', coalesce(new.storage_path, ''))
    on conflict do nothing;
  end if;
  return new;
end;
$$;

create trigger materials_queue_cleanup
  after delete or update of status on public.materials
  for each row execute function public.queue_file_cleanup();
```

Once a day, a scheduled function drains the queue. Pending uploads older than 30 days that were never approved should also be purged — that's your retention policy and your storage budget in one.

### 4.7 Downloads: cheapest possible path

- Keep the bucket **public** for approved materials. Signed URLs cost you an extra round trip per download and don't save bandwidth. Make it private only if you later gate content behind login.
- Set `cacheControl: '31536000'` (1 year) on upload. Files are immutable once uploaded (path contains a timestamp), so this is safe and lets browsers and any future CDN skip re-downloading entirely.
- Show PDFs in an inline viewer (browser-native `<iframe>` / `pdf.js`) rather than forcing a download. A 200-page PDF read in the browser uses **range requests** — the user may pull 2 MB of it, not 9 MB. Same file, one-fifth the egress.
- Don't auto-preview videos in a grid. Poster image only, click to open.

### 4.8 What not to do

- **Don't build your own DB.** Covered in §3.
- **Don't spread files across three free hosts** to multiply your quota. You lose the ability to delete, migrate, back up, or reason about your corpus, and one policy change takes the platform down.
- **Don't store base64 file data in Postgres.** It inflates the 500 MB database limit and makes backups huge.
- **Don't buy Supabase Pro yet.** $25/month is real money for a pre-launch product, and it buys you 100 GB you don't have files to fill. See §11.

---

## 5. Surviving on the free tier

Three free-tier behaviours will hurt you in production and none are in your code yet.

### 5.1 Projects pause after 7 days of inactivity

A paused project means **the whole site is down** — auth, database, storage. For a study platform with exam-season traffic spikes and quiet holidays, this *will* happen. It looks exactly like a dead product to a new visitor.

**Fix (free, 10 minutes):** create an account at cron-job.org or UptimeRobot (both free, no card) and ping a lightweight endpoint every 12 hours:

```
GET https://<project-ref>.supabase.co/rest/v1/levels?select=id&limit=1
Headers: apikey: <anon key>
```

That counts as activity and keeps the project awake. Add a `SELECT 1` health route if you'd rather not expose a table. Set up a second monitor hitting your actual homepage so you learn about an outage before a user tweets about it.

### 5.2 No backups at all on free

One bad migration (like the `DELETE FROM public.departments` in `20260604112600`, which nulls out every affected user's department and level) and you have no recovery path. This is the scariest item in this document, because it's silent until it happens.

**Fix (free):** a GitHub Actions workflow that runs `pg_dump` nightly and uploads it as an artifact (90-day retention). For a 500 MB database this takes under a minute, so you're well inside the free 2,000 minutes/month.

```yaml
name: backup
on:
  schedule: [{ cron: "0 2 * * *" }]
  workflow_dispatch:
jobs:
  dump:
    runs-on: ubuntu-latest
    steps:
      - run: |
          sudo apt-get install -y postgresql-client
          pg_dump "${{ secrets.SUPABASE_DB_URL }}" \
            --no-owner --no-privileges -Fc -f backup.dump
      - uses: actions/upload-artifact@v4
        with: { name: db-backup, path: backup.dump, retention-days: 90 }
```

Store the connection string as a repository secret. **Test a restore once** — an untested backup is a rumour.

Note: this backs up the database, not the bucket. File bytes matter too, but at 1 GB, users can re-upload and you can re-seed. Database first.

### 5.3 Watch the egress number

Check the Supabase dashboard weekly: **Storage → Usage**. If egress trends above 3 GB in a month, act before it caps (see §11). Don't discover this after files stop serving.

---

## 6. Expanding to LASU and UNILORIN

Good news first: **the schema already supports multiple universities.** `universities → departments → courses` is properly normalised, `profiles.university_id` exists, and the base migration seeds ten universities including `LASU` and `UNILORIN`. You do not need a schema rewrite to expand. You need data and one bug fix.

### 6.1 The blocker: LASU and UNILORIN users cannot complete onboarding

`Profile.tsx`, `Upload.tsx`, and `Explore.tsx` all resolve the level list through `department_levels`:

```ts
supabase.from("department_levels").select("level_id, levels(...)").eq("department_id", deptId)
```

Migration `20260604112600` seeds `department_levels` **only for UNILAG's departments**, and `20260623200000` adds rows only for UNILAG's Mathematics department. The other nine universities have departments but **zero** `department_levels` rows.

Result: a LASU student signs up, picks Lagos State University, picks a department, and the **Level dropdown is empty** — no error, no message, just nothing. They cannot save a profile, so they cannot be verified, so they cannot upload. The funnel silently ends there.

**Immediate fix:**

```sql
-- Give every non-UNILAG department a sensible default ladder.
-- Refine per-department later (Computer Science is 4-year, Engineering is 5-year).
insert into public.department_levels (department_id, level_id)
select d.id, l.id
from public.departments d
join public.universities u on u.id = d.university_id
join public.levels l on l.sort_order between 100 and 500
where u.short_name in ('LASU','UNILORIN')
on conflict (department_id, level_id) do nothing;
```

Also add an empty-state message in `Profile.tsx` and `Upload.tsx` when `levels.length === 0` — right now it's a blank dropdown, which reads as a broken site rather than missing data.

### 6.2 Their department lists are placeholder data

The base migration gave all ten universities the same ten generic departments (`Medicine & Surgery`, `Mass Communication`, `Business Administration`, …). UNILAG was then cleaned up to five real ones plus Mathematics. **LASU and UNILORIN still carry the placeholders.**

Faculty structures differ. LASU runs a Faculty of Science, Faculty of Law, School of Transport, etc. UNILORIN has its own set, and course codes differ between campuses for the same subject. You need, per campus:

1. **Departments** — real faculty/department names, not the generic ten.
2. **`department_levels`** — correct programme length per department (4-year vs 5-year vs 6-year for Medicine).
3. **Courses** — at least 10–20 per department for the levels you open, with correct codes, titles, and semester.

This is **data entry, not engineering**, and it's the actual cost of expanding. Budget roughly a day per campus for a usable catalogue, done with a student from that campus who knows the codes. Do not let a user-created free-text course be the primary path on a new campus — your `courses` table has `UNIQUE(code, department_id)`, so typos create permanent duplicate rows that fragment the library. Let users *suggest* new courses, but have an admin confirm them.

The `seed_course_helper(p_uni_short, p_dept_name, p_code, p_title, p_level_sort, p_semester)` function from `20260623200000` is already the right tool — reuse it per campus instead of hand-writing `INSERT`s.

### 6.3 Don't show empty campuses

`university_course_counts` (view from `20260607151500`) `LEFT JOIN`s, so it lists **all ten universities including the nine with zero approved materials**. The homepage card renders `{course_count} courses available`, so visitors currently see nine cards reading "0 courses available" — which looks abandoned.

Add an explicit launch state rather than inferring from counts:

```sql
alter table public.universities
  add column is_active boolean not null default false;

update public.universities set is_active = true  where short_name = 'UNILAG';
update public.universities set is_active = false where short_name <> 'UNILAG';
```

Then:
- Filter `is_active = true` in `PopularUniversities.tsx` and in the Explore university picker.
- For inactive campuses, show **"LASU — coming soon, join the waitlist"** with a real email-capture form, not a dead card. You already have a `WaitlistSection` component; it currently points at `const GOOGLE_FORM_URL = "#"`, so the waitlist collects nothing. Wiring it up is a prerequisite for a campus rollout — it's how you know when LASU has enough demand to be worth the data entry.
- Update the hardcoded copy "Launching with UNILAG. More universities coming soon." to be driven by data.

### 6.4 Admin roles are global — fix before campus #2

`user_roles` has `role` but **no `university_id`**. Any admin can approve, reject, or delete materials for every campus, and see every campus's user verifications.

For one campus that's fine. For three it's a governance problem: a LASU moderator would hold power over UNILAG content, and would see UNILAG students' ID documents. That's both an operational risk and an NDPA exposure (see §7.5).

Minimum viable fix — scope moderators to a campus:

```sql
alter table public.user_roles
  add column university_id uuid references public.universities(id);

create or replace function public.is_university_admin(_user_id uuid, _uni uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.user_roles
     where user_id = _user_id
       and role = 'admin'
       and (university_id is null or university_id = _uni)
  );
$$;
```

`university_id is null` means super-admin (all campuses) — that's you. Then update the two admin policies on `materials` and `profiles` to use `is_university_admin(auth.uid(), <campus of the row>)` instead of `has_role(auth.uid(),'admin')`. Do this **before** onboarding a second campus's moderator, not after.

### 6.5 Verification across campuses

Your current flow — upload a school ID or admission letter, admin approves — is the right default for Nigeria, because most students don't reliably have working university email addresses. Keep it.

Two things to watch as you add campuses:

- **Don't hardcode `.edu.ng` allowlists** anywhere in the signup path. Campuses use different domains (`@lasu.edu.ng`, `@unilorin.edu.ng`, `@student.unilag.edu.ng`) and students often use personal Gmail. If you add email verification later, make the domain list a table, not a regex.
- **Manual verification becomes the bottleneck at ~300 users.** Each one is a human decision, and a LASU student waiting two days for approval in the wrong campus's queue will leave. Make the queue filterable by university (§6.4), show the applicant's campus and department in the review card, and add a bulk-approve for obviously-valid ID uploads.

### 6.6 Rollout order

1. **Now:** fix `department_levels` so LASU/UNILORIN aren't dead ends, add `is_active`, hide empty campuses, wire the waitlist.
2. **Before campus #2 opens:** scope admin roles, seed real departments and levels for that campus, seed 20–30 courses per open department, recruit one moderator from that campus.
3. **Open one campus at a time.** UNILAG first, then whichever of LASU or UNILORIN shows more waitlist demand. Opening two empty campuses at once gives you two empty products instead of one full one.
4. Expect the storage ceiling in §2 to arrive roughly 3× faster with three campuses. Plan the upgrade trigger (§11) before you open #2, not after.

---

## 7. Fix these before anyone outside your team can upload

These are unchanged by the storage work and still the highest-severity items in the repo.

### 7.1 S1 — Committed `service_role` key (critical)

`supabase/config.toml` is tracked in git and contains a JWT decoding to `role: service_role`. That key bypasses every RLS policy: anyone with repo access can read, write, and delete anything, including ID documents. Its `ref` doesn't match the `project_id` beside it, so it may be a placeholder — **treat it as live anyway**, since a wrong-but-real key is indistinguishable from a working one until it's used.

1. Supabase Dashboard → Settings → API → **roll the JWT secret** (this invalidates the old key; users will need to re-login).
2. Remove the key from `supabase/config.toml`, replace it with an env reference.
3. `git rm --cached supabase/config.toml` and purge it from history — it stays readable in old commits otherwise.
4. Add `.env*` and `config.toml` to `.gitignore`, plus a `gitleaks` pre-commit hook so this can't recur.

### 7.2 S2 — Users can approve their own uploads (critical)

The update policy checks ownership but not `status`:

```sql
CREATE POLICY "Users can update own materials" ON public.materials
  FOR UPDATE USING (auth.uid() = uploaded_by);   -- no WITH CHECK, no status guard
```

`auto_approve_admin_materials` is `BEFORE INSERT` only, so it doesn't help. A verified student can call `update({ status: 'approved' })` on their own row and publish anything — bypassing moderation entirely, which also means bypassing your only storage gate (§2).

Fix: restrict the user-facing update policy to non-status columns, and move status transitions into a `SECURITY DEFINER` RPC that only admins can call. Add `WITH CHECK (status = old.status)` style protection via a trigger, since RLS can't reference `OLD`.

### 7.3 S3 — Every profile is world-readable, with emails in `display_name`

`CREATE POLICY "Profiles are publicly readable" ON public.profiles FOR SELECT USING (true);` was never dropped, and `display_name` defaults to the user's email. So anyone can scrape the full user list, including `identification_url` paths (the bucket is private, but the paths leak structure) and `verification_rejection_reason`, which may quote ID details.

Fix: a public view exposing only `id, display_name, university_id, department_id, level_id, avatar_url`; drop the blanket policy; keep full rows to the owner and campus admins.

### 7.4 S4 — `materials` UPDATE has no `WITH CHECK`

Same migration, same shape: `WITH CHECK` is missing, so an owner can rewrite `course_id` or `uploaded_by` and move their row into any course. Add `WITH CHECK (auth.uid() = uploaded_by)`.

### 7.5 S5 — KYC documents under NDPA

You collect school IDs and admission letters — sensitive personal data under the Nigeria Data Protection Act. Minimum: state in the Privacy Policy what you collect and how long you keep it, **delete ID files after approval**, restrict the `identifications` bucket to owner + campus admin (currently any admin, see §6.4), and give users a deletion path. `20260614132200` correctly made the bucket private — the gap is retention and access scope.

### 7.6 S6 — Duplicate migration version

`20260623200001` is used by both `seed_math_materials_part1.sql` and `part2.sql`. The CLI's migration bookkeeping keys on version, so one will be skipped or collide. Rename part2 to `20260623200002` **before** your next `supabase db push` — this matters most exactly when you add LASU/UNILORIN seeds.

### 7.7 S7 — `increment_material_downloads` is a free write for anonymous users

It's `SECURITY DEFINER` and granted to `anon`, with no rate limit. Anyone can inflate download counts in a loop. Not a data breach, but it corrupts the only popularity signal you have. Make it `TO authenticated` and add a per-user-per-day guard.

---

## 8. Launch blockers (non-security)

| # | Issue | Where | Fix |
|---|---|---|---|
| B1 | "Join the Waitlist" goes nowhere | `WaitlistSection.tsx` — `GOOGLE_FORM_URL = "#"` | Point at a real form, or a `waitlist` table with an insert policy |
| B2 | No password reset | `Auth.tsx` | `supabase.auth.resetPasswordForEmail` + `/reset-password` route |
| B3 | Hero search discards the query | `HeroSection.tsx` — `navigate("/explore")` with no params | Pass `?q=` and read it in Explore |
| B4 | 1 MB client cap vs 10 MB bucket policy | `Upload.tsx` — `1 * 1024 * 1024` | Raise to 10 MB; make it one shared constant |
| B5 | No error boundary | `App.tsx` | A top-level boundary; a lazy-route chunk failure currently blanks the page |
| B6 | Verification polled every 5 s | `Auth.tsx` — repeated `signInWithPassword` | Poll the profile row, not the login |
| B7 | Nine empty universities on the homepage | `PopularUniversities.tsx` + view | §6.3 |
| B8 | "Reject & notify" sends no email | `Admin.tsx` | Rename the button, or wire a real email provider |
| B9 | No tests, no CI | `src/test/example.test.ts` is `expect(true).toBe(true)` | Add CI running `lint` + `build` + `test` on every PR |

---

## 9. Differentiators that cost nothing

Ranked by effort-to-impact for a zero-budget, three-campus product.

1. **Contributor credit.** Every approved upload earns a visible badge and a place on a course's "top contributors" list. This is the strongest free growth loop in student products — students share because their name is on it. Combines naturally with dedupe (§4.3): a duplicate upload still earns credit.
2. **Instant `.edu.ng` verification where possible.** Look up the email domain against a `universities` domain column and auto-approve, falling back to manual ID review. Removes your biggest funnel bottleneck (§6.5) without removing the gate.
3. **Public course pages for search.** `/unilag/csc-313` as a server-rendered or prerendered page with course code, title, material count, and top downloads. Nigerian students Google "CSC 313 past questions UNILAG" — there is currently almost nothing ranking for those queries. Your existing SPA ships an empty `<div id="root">`, so none of it is indexable. This is the single biggest acquisition lever you have, and it's free.
4. **Exam Packs.** One tap: every approved material for a course, in semester order, as a single zip or ordered list. Students don't want a library, they want *this course, this week*.
5. **Offline/mobile data awareness.** Nigerian data is expensive. Show file size on every download button, default to compressed previews, and let users "save for offline." Nobody else does this well and it's pure code.
6. **Course-level WhatsApp share.** One button that produces a proper Open Graph preview. This is how Nigerian campus content actually spreads.
7. **"What's missing" signal.** Let students request a course or flag outdated material. Gives you a free backlog and tells you which campus to open next.
8. **Campus leaderboard.** Departments ranked by approved contributions per semester. Cheap, competitive, and drives uploads — which is how you grow the library without growing your storage bill (see §2 on why curated beats firehose).
9. **Material freshness dates.** "Uploaded 2023, syllabus may have changed." Small, honest, builds trust.
10. **Shareable verification badge.** A verified status others can see makes uploads feel authored rather than anonymous, which raises quality without more moderation.

Deliberately **not** recommended yet: AI summaries, chat over notes, payment gating. All either cost money per request or add a support burden before you have users.

---

## 10. Two-week plan

| Days | Work |
|---|---|
| 1 | Rotate the `service_role` key (S1). Purge `config.toml` from history. Fix the duplicate migration version (S6). |
| 2 | RLS fixes: S2 (self-approval), S3 (profile PII), S4 (`WITH CHECK`). One migration, tested locally. |
| 3 | Storage migration from §4.2 (`storage_path`, `provider`, `file_hash`, `file_size_bytes`). Backfill Drive rows. |
| 4 | Upload path: raise cap to 10 MB, add client-side WebP compression, add hash + dedupe check. |
| 5 | Delete/reject cleanup (§4.6) + quota trigger (§4.5). Verify by uploading and deleting a test file. |
| 6 | Free-tier survival: keep-alive cron (§5.1) and nightly `pg_dump` backup (§5.2). Test a restore. |
| 7 | `is_active` + hide empty campuses (§6.3) + fix `department_levels` for LASU/UNILORIN (§6.1). |
| 8 | Launch blockers B1–B5: waitlist, password reset, search params, error boundary, shared size constant. |
| 9 | Public course pages (§9.3) — prerender or SSR the course route with real meta tags. |
| 10 | Contributor credit (§9.1) + Exam Packs (§9.4). |
| 11 | Seed LASU departments, levels, and 20–30 courses. Recruit one LASU moderator. |
| 12 | Scope admin roles per campus (§6.4) — **before** adding that moderator. |
| 13 | Load test with a real class: 50 concurrent downloads, watch egress in the dashboard. |
| 14 | Soft launch UNILAG. Keep LASU/UNILORIN as waitlist-only. |

Days 1–2 are non-negotiable before any public traffic. Everything else is ordered by leverage.

---

## 11. When to spend the first money

You don't need to spend anything now. Spend when a specific trigger fires, not on a calendar.

| Trigger | Buy | Cost |
|---|---|---|
| Egress consistently > 3 GB/month, or files stop serving | Supabase Pro (100 GB storage, 250 GB egress, daily backups, no pausing) | $25/mo |
| You have a card **and** > 5 GB of video to host | Cloudflare R2 (10 GB free, **zero egress**) | $0 until you exceed 10 GB |
| You're opening campus #2 and #3 | Supabase Pro first — three campuses will exhaust free storage faster than you expect | $25/mo |
| Verification queue > 50/day | Nothing — add bulk approve and domain auto-verify first (§6.5) | $0 |

**One correction from my earlier draft:** I recommended R2 as the immediate answer. R2's free allowance is real (10 GB, zero egress, 1M writes, 10M reads/month), but **enabling R2 requires a payment method on file**, even though you won't be charged inside the free tier. Confirmed in Cloudflare's own billing docs and R2 get-started flow as of November 2026. So R2 is a "zero-cost" option only if you have a card you're willing to put on file with a hard spending limit — it is not a no-card option. Don't plan around it until that's true for you.

Ranked by value per dollar for when you do have money:

1. **Supabase Pro, $25/mo** — removes pausing, adds backups, 100 GB storage, 250 GB egress. Buys peace of mind more than capacity.
2. **A domain, ~$10/yr** — required for decent SEO (§9.3) and makes the product look real. Cheapest credibility you can buy.
3. **R2, $0** once a card exists — only when you're actually hosting video.

Skip: paid analytics, AI features, custom email domains, and any service with a per-request cost. You have no revenue and no reason to add variable costs.

---

## 12. Anti-patterns to avoid

- **Building your own database.** §3. Months of work, worse security, no upside.
- **Chasing free tiers to multiply quota.** Fragmentation costs more than $25.
- **Accepting raw video uploads on the free tier.** One video can exhaust your monthly egress and take the whole platform offline during exams.
- **Treating moderation as optional.** It's your storage budget and your quality gate at the same time.
- **Storing full URLs instead of paths.** Locks you to today's bucket; §4.2 unlocks it.
- **Adding a campus before the previous one has content.** Three empty products is worse than one full one.
- **Deleting rows without deleting files.** Silent, permanent quota loss (§4.6).
- **Skipping backups because "it's just a free project."** The free project holds your only copy of every user's data.

---

## 13. Summary

You don't have a database problem. You have a **physics problem**: 1 GB of storage and 5 GB of monthly egress, against users who want to upload video. No architecture choice fixes that; only curation, deduplication, compression, and time do.

The plan that works at zero budget:

1. **Keep Supabase.** Your schema is good and already multi-university.
2. **Raw uploads for documents and images** (with compression, dedupe, and server-side quotas), **links for video** — and stop treating the link path as a compromise.
3. **Moderation is your storage budget.** Curate a few hundred high-quality materials instead of accepting everything.
4. **Fix the free-tier landmines** — keep-alive ping, nightly backups — before launch, not after.
5. **Fix the RLS holes and the committed key first**, because they're cheap to fix now and expensive to explain later.
6. **LASU and UNILORIN are one migration away from being unblocked** (`department_levels`), then a few days of catalogue data each. Open them one at a time, with campus-scoped moderators, once a campus has real content.

The storage ceiling is a launch constraint, not a launch blocker — a curated library of 300 good materials is genuinely useful to a student, and it's what you can afford today.
