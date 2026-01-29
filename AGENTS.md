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

## Code Style & Patterns
- **Components**: Functional components with Hooks.
- **Styling**: Use `StyleSheet.create` at the bottom of the file. Avoid inline styles for complex objects.
- **Animations**: Prefer `react-native-reanimated` for performant 60fps animations.
- **Haptics**: Use `expo-haptics` generously for interactive elements to create a premium feel.
- **Imports**: Use absolute paths or consistent relative paths. Group imports: React/RN -> 3rd Party -> Local.

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

