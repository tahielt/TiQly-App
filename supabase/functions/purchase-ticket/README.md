# purchase-ticket Edge Function

## Purpose
Creates tickets server-side and computes fees securely. This removes price manipulation from the client.

## Required env
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

## Deploy
```
supabase functions deploy purchase-ticket
```

## Notes
- This function uses the service role to insert tickets.
- You should still enforce RLS policies and/or DB constraints for full protection.
- Consider replacing the `available` update with a SQL function to avoid race conditions.
