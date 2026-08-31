# Supabase Storage for the ALI portal

## 1) Create the private bucket
Run the contents of `supabase/storage.sql` in Supabase SQL Editor.

The bucket name is:
`giant-files`

It is private. The server uses `SUPABASE_SERVICE_ROLE_KEY` and the browser never receives that key.

## 2) Vercel environment variables
Required for files/backups:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

The database connection remains separate:
- `DATABASE_URL` should point to Supabase PostgreSQL.

## 3) What the portal stores
The manager gets a "ملفات سحابية" section with:
- general files
- project files
- documents
- JSON workspace backups
- download / restore / delete

Files are stored per employee under their own folder. Only server-side Storage calls are made.

## 4) Size limit
The current UI limits uploads/downloads to 3 MB because files are transferred through a server function. Larger files should later use signed direct uploads if needed.
