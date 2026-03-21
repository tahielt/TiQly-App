# purchase-ticket Edge Function

## Purpose
Creates tickets server-side, reads fee config from `platform_config`, and delegates stock decrement plus ticket creation to `purchase_ticket_atomic()` in Postgres.

## Required env
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

## Deploy
```bash
supabase functions deploy purchase-ticket
```

## Notes
- Pricing is finalized in SQL, not in the client.
- Stock is decremented atomically inside the database transaction to avoid overselling.
- Apply [monetization_v2.sql](C:/Users/mocha/Documents/TiQly/supabase/sql/monetization_v2.sql) before deploying the function.
