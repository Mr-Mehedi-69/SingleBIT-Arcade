# SingleBIT Arcade — Phase 05 backend setup

## What this phase provides
- One global creator profile stored online, so it is the same on every device.
- Optional visitor registration with a public username and account UUID.
- Owner-only list of registered public profiles.
- Anonymous profile views counted by day, without saving IP addresses, device fingerprints, exact locations or anonymous visitor identities.

## Step 1 — Create a Supabase project
1. Open https://supabase.com/ and create a project.
2. Keep the database password private. Do not put it in website files or send it in chat.
3. In Project Settings > API, copy the Project URL and the publishable/anon key. Never use the service_role key in browser code.
4. In Authentication > URL Configuration, add:
   - Site URL: https://mr-mehedi-69.github.io
   - Redirect URL: https://mr-mehedi-69.github.io/SingleBIT-Arcade/**

## Step 2 — Create the database
1. Open SQL Editor in Supabase.
2. Open backend/phase-05-schema.sql from this repository.
3. Paste the complete SQL and run it.
4. Create your own account through Supabase Auth once the registration UI is connected.
5. In Authentication > Users, copy your user UUID.
6. In SQL Editor run:
   update public.sb_profiles set is_owner = true where id = 'YOUR-AUTH-USER-UUID';

## Step 3 — Website connection
The browser app must use only the Project URL and publishable/anon key. The service_role key is secret and must never be placed in GitHub Pages, HTML, JavaScript or screenshots.

## Privacy notes
- Anonymous visits are aggregated per day and profile slug. There is no anonymous visitor ID.
- Registered visitors appear in the owner dashboard only as their chosen public username, display name and account UUID.
- Do not ask visitors for school, home address, phone number or other sensitive details.
- Show a short notice explaining that profile views are counted and account details are visible to the site owner.
- Country-level analytics are intentionally not enabled in this starter schema; add them only through a privacy-reviewed coarse geolocation provider, without storing raw IP addresses.

## Current status
The database schema is ready to run, but no Supabase project has been provisioned or connected yet. The online profile and visitor dashboard cannot become live until the project URL/key are configured and the owner account is promoted.
