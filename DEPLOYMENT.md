# Tonight Wired deployment guide

## What changed
This copy removes the direct mobile dependency on `@anythingai/app` and replaces the recommendation endpoint with a standard OpenAI-compatible API integration. It can now run as a regular Expo app plus a separate web/API service.

## Recommended free stack
- **Backend / API:** Vercel
- **Mobile app preview / testing:** Expo Go
- **Database:** Neon or Supabase free tier
- **Auth:** keep the current flow if it already works, otherwise Supabase Auth is the easiest fallback

## AI providers you can use now
Anything AI is no longer required for recommendations. The backend now accepts any provider that supports the OpenAI-compatible `chat/completions` API.

Examples:
- OpenAI
- OpenRouter
- Groq
- Together
- many self-hosted gateways that expose an OpenAI-compatible endpoint

## Environment variables

### Web (`apps/web/.env`)
- `OPENAI_API_KEY`
- `OPENAI_BASE_URL` default: `https://api.openai.com/v1`
- `OPENAI_MODEL` default: `gpt-4.1-mini`
- `TMDB_API_KEY`
- `SERPAPI_KEY`
- `APP_BASE_URL` set this to your deployed Vercel URL

### Mobile (`apps/mobile/.env`)
- `EXPO_PUBLIC_API_BASE_URL` set this to your deployed backend URL
- `EXPO_PUBLIC_PROXY_BASE_URL` usually the same as your backend URL
- `EXPO_PUBLIC_APP_ENV=DEVELOPMENT` for local dev

## Local development

### Web
```bash
cd apps/web
npm install
npm run dev
```

### Mobile
```bash
cd apps/mobile
npm install
npx expo start
```

## Free launch path
1. Deploy `apps/web` to **Vercel**
2. Add your env vars in Vercel
3. Set `EXPO_PUBLIC_API_BASE_URL` in `apps/mobile/.env` to that Vercel URL
4. Run the mobile app with **Expo Go**

## Notes
- App Store and Play Store publishing are not fully free because Apple and Google charge developer fees.
- The recommendation route now uses an OpenAI-compatible provider. If your provider supports JSON mode differently, update `apps/web/src/app/api/recommendations/generate/route.js`.
- Checked-in `.env` files in this portable copy are placeholders only. Add your real keys before running.
