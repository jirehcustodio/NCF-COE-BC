# admin-update-user (Supabase Edge Function)

Securely updates Supabase Auth user metadata using the Admin API. Only signed-in users with `role` of `admin` or `dean` can invoke it.

## Environment variables

Ensure these are set in your Supabase project (Edge Functions):

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

## Deploy

Use the Supabase CLI from the project root:

```bash
supabase functions deploy admin-update-user
```

## Invoke (from app)

The frontend uses `supabase.functions.invoke('admin-update-user', { body: { email, metadata } })`.

Payload example:

```json
{
  "email": "faculty@school.edu",
  "metadata": { "role": "dean" }
}
```
