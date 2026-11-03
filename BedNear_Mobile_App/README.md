# BedNear User Android App — Expo + React Native + TypeScript

This is a complete **starter MVP project** with a locality-first PG discovery UI, demo data, search filters, listing details, local saved PGs and a structured API service layer. It is not a production-certified build; connect and test your actual backend, authentication, persistent favourites and enquiry endpoints before release.

## Requirements
- Node.js LTS compatible with your installed Expo SDK
- Android Studio emulator or Expo Go device
- npm

## Install and run
```bash
npm install
npx expo start -c
```
Press `a` to open Android emulator. Install missing native packages with `npx expo install` if Expo reports version mismatches.

## Demo vs backend
The app defaults to demo data so you can run the UI without a backend. In `.env`, copy `.env.example` and configure:
```env
EXPO_PUBLIC_USE_DEMO_DATA=true
EXPO_PUBLIC_API_BASE_URL=http://10.0.2.2:5000/api/v1
```
Restart Expo after editing environment variables. For a physical phone, use the computer's LAN IP and ensure both devices share a network. Use HTTPS in production.

Set `EXPO_PUBLIC_USE_DEMO_DATA=false` only after your backend routes and JSON payloads match the service methods. The sample routes are proposed contracts: `GET /properties`, `GET /properties/:id`, `POST /properties/:id/enquiries`, `GET /me/favourites`, and `GET /me/enquiries`. Update `src/services` to match your Swagger specification.

## Included
- Purple / orange / warm-cream design system
- Home, Search, Saved, Enquiries, Profile tabs
- Listing cards, availability freshness badge, reusable button, search, filter chip, empty and loading states
- Demo PG data for BTM Layout, HSR Layout, Marathahalli, Electronic City and Koramangala
- Locality search, maximum rent, sharing and gender filters
- PG details and call/WhatsApp action placeholders (demo data intentionally has no real owner contacts)
- Zustand local favourites (not yet server-synced)
- Axios API client, React Query, secure token helper and API service examples

## Important production work
1. Align API payloads and routes with the backend Swagger/OpenAPI.
2. Implement OTP send/verify and authorization; secure tokens and restore sessions.
3. Add authenticated server-synced favourites, enquiry submission/history, and report listing.
4. Confirm availability status and timestamps come from the server; never manufacture live vacancy on-device.
5. Add privacy policy, terms, account deletion, analytics consent, crash monitoring, image fallbacks and accessibility testing.
6. Replace sample images and sample listings with owner-approved real listing content.
7. Test on a physical Android phone and build a release APK/AAB only after resolving all checks.

## Folder structure
```text
App.tsx
src/
  components/       reusable UI and matching .styles.ts files
  constants/        theme and API config
  navigation/       typed React Navigation
  screens/          home, search, listing, favourites, enquiries, auth
  services/         API client, listings, auth, favourites, enquiries, demo data
  store/            Zustand auth and favourites state
  types/            Listing, Enquiry and User models
  utils/            formatters and availability freshness helper
```
