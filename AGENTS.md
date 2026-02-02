# TiQly-App AGENTS.md

## Project Overview
TiQly-App is an Expo-based React Native mobile application focused on event ticketing and "addictive" user experiences. It uses TypeScript, Supabase for backend interactions, and emphasizes high-quality, animated UI.

## Project Structure
- **`src/components`**: Reusable UI components (Buttons, Cards, Modals).
- **`src/screens`**: Main application screens (Auth, Event, Map, User).
- **`src/services`**: Business logic and API interactions (Supabase, Stripe).
- **`src/navigation`**: React Navigation configuration (Stacks, Tabs).
- **`src/lib`**: Helpers and mock data (`mock-data.ts`).
- **`src/hooks`**: Custom React hooks for logic reuse.

## Tech Stack
- **Framework**: Expo (~54.0.0), React Native (~0.81.4)
- **Language**: TypeScript (~5.9.2)
- **Navigation**: React Navigation v7
- **State Management**: Redux Toolkit
- **Styling**: `StyleSheet` objects, `expo-linear-gradient`
- **Animations**: `react-native-reanimated`
- **Backend**: Supabase
- **Assets**: `expo-av` for audio/video, `expo-haptics` for tactile feedback

## Dev Environment
- **Start Project**: `npx expo start`
- **Run Android**: `npx expo run:android`
- **Run iOS**: `npx expo run:ios`
- **Lint**: `npx eslint . --ext .js,.jsx,.ts,.tsx` (if configured)
- **Type Check**: `npx tsc --noEmit

## 💎 TiQly Design Patterns (Dopamine & Sci-Fi)
- **Glassmorphism Architecture**: Use `BlurView` from `expo-blur` as the primary container layer. Backgrounds must never be flat; use deep gradients or `expo-video` loops with a dark overlay and heavy blur.
- **Haptic Engine Protocol**: Systemic implementation of `expo-haptics` is mandatory:
    - **Success/Purchase**: `ImpactFeedbackStyle.Heavy`.
    - **Navigation/Selection**: `SelectionChanged`.
    - **Errors**: `NotificationFeedbackType.Error`.
- **Motion & 60fps**: Use `react-native-reanimated` for all transitions. Avoid sudden layout jumps. Implement "Slot Machine" tickers for currency and ticket counts to trigger user dopamine.
- **Visual Identity**: Strictly follow the Sci-Fi "Command Center" aesthetic: Neon Cyan (#00FFFF) accents, translucent glass cards, and pulsing glow animations.

## 💰 Financial & Data Integrity
- **Fee Management**: Every transaction must clearly separate `base_price`, `service_fee` (TiQly cut), and `total_price`. 
- **Organizer Logic**: The Dashboard must prioritize `Net Profit` visibility. Calculation of fees must be handled via Supabase Edge Functions or validated strictly against the DB Schema.
- **Zero-Mock Policy**: New features in `feat/` branches must implement real Supabase service calls. Static mocks are only allowed for initial UI prototyping and must be replaced before PR.

## 🛠️ Git & Branching Strategy
- **Naming Convention**: 
    - `feat/`: New features or modules.
    - `fix/`: Bug fixes.
    - `ui/`: Purely aesthetic or animation adjustments.
    - `refactor/`: Code improvements without functional changes.
- **Safety**: Always `git fetch origin` before creating a new branch from a shared state (e.g., `fix/migracion-expo-av-y-reanimated`).
## Testing Instructions
- **Manual Verification**: Since automated tests are not yet fully set up, verify changes on a simulator/emulator.
- **Key Flows**:
    - Event Detail Screen: Check video background, audio preview, and ticket purchase flow.
    - Purchase Flow: Ensure Supabase calls (mocked or real) complete and UI updates.

## Critical Rules
- **Aesthetics**: The UI must be "addictive" and premium. Use dark modes, gradients, and subtle animations.
- **Performance**: Ensure heavy assets (videos) are optimized or handled correctly (e.g., `ResizeMode.COVER`).
- **Data Safety**: Never hardcode sensitive API keys in the code. Use `.env` files.

## Deployment Checklist
1. [ ] **Update Version**: Increment `version` in `app.json` and `package.json`.
2. [ ] **Type Check**: Run `npx tsc --noEmit` to ensure no TypeScript errors.
3. [ ] **Lint**: Run linter to catch potential code smells.
4. [ ] **Clean Logs**: Remove `console.log` statements used for debugging.
5. [ ] **Build**: Run `eas build` or `npx expo run:android --variant release` to verify production build.

