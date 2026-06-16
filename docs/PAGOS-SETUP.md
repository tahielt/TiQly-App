# TiQly · Fundación de pagos — Setup y despliegue

Rama: `feat/payments-foundation`. Todo lo de esta rama es **aditivo** salvo dos archivos
(`EventDetailScreen.tsx` y `tsconfig.json`). La app sigue compilando igual que antes
(verificado: `tsc` sin errores nuevos).

---

## 1 · Subir esta rama a GitHub

Claude no puede pushear a tu repo (necesita tus credenciales), así que la rama viene
empaquetada. Dos opciones — usá una:

**Opción A — bundle (recomendada, preserva el commit tal cual):**
```bash
cd TiQly-App
git fetch /ruta/descargas/tiqly-payments-foundation.bundle feat/payments-foundation:feat/payments-foundation
git push -u origin feat/payments-foundation
```

**Opción B — patch:**
```bash
cd TiQly-App
git checkout main && git pull
git checkout -b feat/payments-foundation
git am /ruta/descargas/tiqly-payments-foundation.patch
git push -u origin feat/payments-foundation
```

Después abrí el PR en GitHub y mergealo cuando lo revises. Para revisar:
`git diff main..feat/payments-foundation --stat`.

---

## 2 · Qué contiene

```
supabase/
├── config.toml                                  # mp-webhook con verify_jwt = false
├── migrations/
│   ├── 20260611000001_core_schema.sql           # orgs, events, ticket_types(stock/sold/reserved),
│   │                                            # orders(hold), tickets, platform_config
│   └── 20260611000002_rls_and_functions.sql     # RLS completo + funciones atómicas:
│                                                # create_order_with_hold, confirm_order_paid,
│                                                # release_order, release_expired_holds, validate_ticket
└── functions/
    ├── create-order/index.ts                    # auth → hold → preference MP (split si la org conectó MP)
    └── mp-webhook/index.ts                      # firma x-signature → confirma pago → emite tickets

packages/core/                                   # @tiqly/core: fees + tipos compartidos (mobile/web)
pnpm-workspace.yaml                              # workspace pnpm (fase 1: packages/*)
src/services/checkoutService.ts                  # startCheckout / openMercadoPagoCheckout / waitForPayment
src/screens/att/eventos/EventDetailScreen.tsx    # compra falsa → flujo real con MP
tsconfig.json                                    # excluye supabase/, packages/, tiqly-web del tsc mobile
```

**Garantías del diseño:**
- El precio y el fee se calculan **solo en SQL** leyendo `ticket_types.price` y
  `platform_config.service_fee_rate`. El cliente no manda montos nunca.
- Anti-sobreventa en dos capas: lock de fila + `CHECK (sold + reserved <= stock)`.
- Hold de 10 min (`platform_config.hold_minutes`); liberación perezosa en cada
  compra + función `release_expired_holds()` para cron.
- Webhook idempotente por `mp_payment_id` (reintentos de MP no duplican tickets).
- Pago tardío (orden expirada que igual se pagó): retoma stock si hay; si no,
  marca `refund_required` para reembolso manual.
- `validate_ticket`: un solo UPDATE atómico → imposible doble ingreso con dos
  scanners, y exige ser staff de la organización del evento.

---

## 3 · Desplegar Supabase

Recomendado: **proyecto nuevo** (ej. `tiqly-staging`) para no pisar tu base demo actual.

```bash
npm i -g supabase
supabase login
cd TiQly-App
supabase link --project-ref <PROJECT_REF>

# Migraciones (schema + RLS + funciones)
supabase db push

# Secrets de las Edge Functions
supabase secrets set MP_ACCESS_TOKEN=APP_USR-xxxx        # token de tu app de MP
supabase secrets set MP_WEBHOOK_SECRET=xxxx              # firma del panel de webhooks
supabase secrets set APP_BASE_URL=https://tiqly.app

# Deploy de funciones (config.toml ya marca mp-webhook como pública)
supabase functions deploy create-order
supabase functions deploy mp-webhook
```

Cron de limpieza (Dashboard → SQL):
```sql
select cron.schedule('release-holds', '* * * * *',
  $$ select public.release_expired_holds() $$);
```
(Activá la extensión `pg_cron` en Database → Extensions si no está.)

Apuntá la app al proyecto nuevo en `.env`:
```
EXPO_PUBLIC_SUPABASE_URL=https://<PROJECT_REF>.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
```

**Registro sin fricción (obligatorio para el flujo TiQly):** Supabase trae la
confirmación de email **activada por default** — el usuario se registra y no
tiene sesión hasta clickear un link en su casilla. Eso rompe el principio de
"la única salida de la app es el pago". Desactivarla:

> Dashboard → **Authentication → Sign In / Providers → Email → desactivar "Confirm email"**

Con eso `signUp` devuelve sesión al instante y el usuario puede comprar en el
mismo minuto en que se registró. Cuando sumes Google Sign-In (un tap, cero
emails, cero passwords), va a ser el camino principal para tu público; en iOS,
si ofrecés Google, App Store exige ofrecer también Apple Sign-In.

---

## 4 · Configurar Mercado Pago

1. Creá la aplicación en https://www.mercadopago.com.ar/developers
   (tipo: pagos online, modelo marketplace si vas a usar split).
2. Copiá el **Access Token de producción** (o el de prueba para sandbox) → secret `MP_ACCESS_TOKEN`.
3. En *Webhooks*, registrá: `https://<PROJECT_REF>.supabase.co/functions/v1/mp-webhook`
   para el evento **Pagos**, y copiá la **firma secreta** → `MP_WEBHOOK_SECRET`.
4. Probá con las cuentas de prueba de MP (comprador + vendedor de test).

**Split payments (fase OAuth, siguiente paso):** cuando un organizador conecte su
cuenta MP vía OAuth, guardá sus tokens en `organization_secrets`. `create-order`
ya lo detecta solo: cobra el organizador y retiene tu fee con `marketplace_fee`.
Mientras tanto, sin OAuth, cobra tu cuenta plataforma (fallback automático).

---

## 5 · Probar el flujo completo

1. Insertá datos mínimos (SQL Editor):
```sql
insert into organizations (name, owner_id) values ('Org Test', '<tu-user-id>') returning id;
insert into organization_members (org_id, user_id, role) values ('<org-id>', '<tu-user-id>', 'owner');
insert into events (organization_id, created_by, title, status, start_date, location_lat, location_lng)
values ('<org-id>', '<tu-user-id>', 'Fiesta Test', 'published', now() + interval '7 days', -41.13, -71.31)
returning id;
insert into ticket_types (event_id, name, price, stock) values ('<event-id>', 'General', 15000, 100);
```
2. En la app: evento → elegir tier → se abre MP → pagar con tarjeta de prueba
   (`5031 7557 3453 0604`, cualquier vencimiento futuro, CVV 123, nombre `APRO`).
3. Volvé a la app: "¡Compra confirmada!" → el ticket está en `tickets` con su QR.
4. Verificá el contador: `select stock, sold, reserved from ticket_types;`
5. Probá el abandono: iniciá una compra, no pagues, esperá 10 min → la orden pasa
   a `expired` y `reserved` vuelve a bajar.

---

## 6 · Migración monorepo (fases siguientes, cada una un PR chico)

- **Fase 1 (este PR):** `supabase/` + `packages/core` + workspace. Aditivo, cero riesgo.
- **Fase 2:** mover la app a `apps/mobile` con `git mv` (preserva historia):
  `mkdir -p apps/mobile && git mv App.tsx src assets app.json index.ts babel.config.js metro.config.js package.json tsconfig.json apps/mobile/`
  - agregar `- 'apps/*'` a `pnpm-workspace.yaml`, `pnpm install`, probar `expo start`.
  - si Metro se queja de symlinks: `.npmrc` con `node-linker=hoisted`.
- **Fase 3:** `apps/web` (Next.js nuevo para tiqly.app) y borrar `tiqly-web/`.
  La página `/purchase/callback` de la web es el puente https → deep link
  que ya usan las `back_urls` de la preference.
- **Regla de oro:** una fase = un PR. Nunca mezclar "mover carpetas" con "cambiar lógica".

## 7 · Siguientes piezas del roadmap (en orden)

1. OAuth de Mercado Pago para organizadores (activa el split real).
2. Pantalla de checkout propia (desglose precio + servicio con `@tiqly/core`, countdown del hold).
3. Pase de Apple/Google Wallet generado al confirmar el pago (respaldo del ticket
   sin emails: vive en la app y en el wallet del teléfono).
4. QR rotativo TOTP (`tickets.qr_secret` ya está reservado para esto).
5. Migrar el scanner a `validate_ticket` RPC (reemplaza la validación en dos pasos).

**Principio de producto:** cero emails en el flujo. Sin confirmación de registro,
sin recibos obligatorios: el ticket vive en la cuenta (se recupera logueándose
desde cualquier teléfono) y en el wallet. El email queda solo para el checkout
web de compradores sin app (fase web), donde es entrega y no interrupción.
