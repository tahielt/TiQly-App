Project Overview
TiQly-App is an Expo-based React Native mobile application for event ticketing focused on Gen Z. The core business goal is fast conversion and cash flow. The UX must be: Map-first discovery, extremely fast purchase, minimal navigation, and almost non-existent onboarding. There are two user types: Consumers and Organizers. Organizations are strictly a backend construct and MUST be invisible to Consumers.

Project Structure (Feature-Based)
All new code MUST follow this structure. Do not use type-based folders (components/, screens/ at root level).

src/features/auth/: Signup, Login, Session handling.
src/features/events/: Map view, Event feed, Event detail.
src/features/tickets/: Checkout flow, Payment integration, QR generation & display.
src/features/organizer/: Admin Dashboard, Event creation, QR Scanner (Staff).
src/shared/:
components/: Generic UI (Buttons, Cards, Inputs).
lib/: Supabase client, Payment config, helpers.
hooks/: Global hooks (useAuth, etc).
types/: Global TypeScript interfaces.
Tech Stack
Framework: Expo (~54.0.0), React Native (~0.81.4)
Language: TypeScript (~5.9.2)
Navigation: React Navigation v7
State Management: Zustand for local state. @tanstack/react-query for server state (Supabase). REDUX TOOLKIT IS PROHIBITED.
Styling: StyleSheet objects, expo-linear-gradient.
Animations: react-native-reanimated (ONLY for screen transitions and essential micro-interactions. NO complex sequence animations).
Backend: Supabase (PostgreSQL, Auth, RLS, Edge Functions)
Payments: Stripe Connect / Mercado Pago.
Assets: expo-av IS PROHIBITED. No video backgrounds, no audio previews. Use optimized static images or gradients.
🗺️ UX & Design Patterns (Speed & Conversion)
The UI must be clean, dark-mode, and minimal. Distraction kills conversion.

Map-First Home: The main screen is an interactive map with event pins. To ensure fast load times, use map clustering and DO NOT load heavy assets on map pins.
2-Tap Rule: From the Map, a user must be able to reach the "Purchase" button in 2 taps maximum (Tap Pin -> Tap Buy).
Zero Fluff: Remove video backgrounds, slot-machine tickers, and heavy haptics. Haptics are ONLY allowed for: Purchase Success (Light) and Scanner Success (Light).
Visual Identity: Dark background, high-contrast text, clear call-to-action buttons. Glassmorphism is allowed only for non-interactive cards, but flat translucent panels are preferred for performance on Android.
🗄️ Database Schema & Organizations Logic (Supabase)
CRITICAL: Organizations are invisible to Consumers. No workspace/team UI for regular users.

Required Schema:

profiles: id (references auth.users), role ('consumer' | 'organizer'), full_name.
organizations: id, name, slug, stripe_account_id, owner_id (references profiles.id).
organization_members: org_id, user_id, role ('owner' | 'admin' | 'scanner').
events: id, organization_id, title, description, lat, lng, base_price, stock, date.
tickets: id, user_id, event_id, qr_code_hash, status ('valid' | 'used'), created_at.
Flows:

Auto-Creation: When a Consumer taps "Create Event", the system updates their role to 'organizer' and automatically creates a default organization ("Eventos de [Nombre]") without asking for more info. Zero friction.
Simple Invites: Organizers invite staff via link/email. Accepting inserts the user into organization_members with their assigned role.
RLS: Consumers can only read events and buy. Organizers can only CRUD their own org's events and scan tickets for their events.
💰 Financial & Data Integrity
Fee Management: Every transaction must clearly separate base_price, service_fee (TiQly cut), and total_price.
Organizer Logic: The Dashboard must prioritize Net Profit visibility. Calculations handled via Supabase Edge Functions.
Zero-Mock Policy: New features in feat/ branches MUST implement real Supabase service calls. Static mocks are strictly prohibited.
🔄 Core Flows (Must be functional at all times)
Discovery: Open App -> Map loads events instantly.
Checkout: User clicks Buy -> Payment Provider -> Webhook success -> Insert into tickets table.
QR Generation: On payment success, generate a unique hash, save to tickets.qr_code_hash, display via react-native-qrcode-svg.
QR Scanner (Organizer): Open Camera (expo-camera) -> Scan Hash -> Fetch Supabase -> If 'valid', show Green Screen & UPDATE status to 'used'.
🛠️ Git & Branching Strategy
Naming Convention:
feat/: New features.
fix/: Bug fixes.
refactor/: Code improvements.
chore/: Dependencies, config.
Safety: Always git fetch origin before creating a new branch.
Testing & Verification
Manual Verification: Verify changes on a physical device or emulator (focus on Android mid-range performance for map and scanner).
Key Flows to Test:
Map loads fast with pins.
Checkout process completes and creates a ticket.
QR generates and Scanner validates/invalidates it correctly.
Critical Rules
Performance over Aesthetics: If an animation or blur drops frames on a mid-range Android, remove it.
Data Safety: Never hardcode sensitive API keys. Use .env files.
Simplicity: If a library adds bloat for a purely cosmetic feature, DO NOT USE IT.
Clean DB: No schema for unused features (Posts, Comments, Likes, Spotify columns). Keep the DB strictly to the schema defined above.
Deployment Checklist
 Update Version: Increment version in app.json and package.json.
 Type Check: Run npx tsc --noEmit.
 Clean Logs: Remove console.log statements.
 Dependencies: Ensure no expo-av, redux-toolkit, or prohibited libraries are in package.json.
 Build: Run eas build to verify production build.

