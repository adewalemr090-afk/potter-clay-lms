# Potter And Clay Schools — LMS

A professional, mobile-responsive Learning Management System starter for Potter And Clay Schools.

## Technology
- Frontend: HTML5, CSS3, Vanilla JavaScript
- Backend: Supabase Auth + PostgreSQL + Storage + Row Level Security
- Hosting: Netlify (or any static host)

## Features included
- Student registration/login with email verification
- Student profile photo upload
- Teacher registration/login and profile photo upload
- Role-based Student / Teacher / Admin dashboards
- JSS 1–3 and SS 1–3 class structure
- Course/subject catalogue
- Lessons with notes/PDF links and audio lectures
- Student comments under lessons
- Teacher assignments
- CBT exam engine
- Admin-generated CBT access codes
- Two-use maximum per CBT access code
- Immediate CBT scoring
- Downloadable result report as HTML
- WAEC/NECO/JAMB-style question-bank structure
- Admin activity view
- Mobile responsive interface

## Important content note
The database is ready to hold 50 questions per subject, but the school must populate it with its approved curriculum questions. Do not upload copyrighted examination questions unless the school has the necessary rights.

## Folder structure
- index.html
- styles.css
- app.js
- config.js
- netlify.toml
- supabase/schema.sql
- supabase/seed.sql
- docs/DEPLOYMENT.md

## Quick start
1. Create a Supabase project.
2. Run `supabase/schema.sql` in Supabase SQL Editor.
3. Run `supabase/seed.sql`.
4. Copy your Supabase Project URL and publishable/anon key into `config.js`.
5. Enable Email provider and Email Confirmations in Supabase Auth.
6. Create the storage buckets described in the deployment guide.
7. Open `index.html` locally or deploy the folder to Netlify.
8. Register the first user, then promote that user to admin with the SQL command in the deployment guide.
