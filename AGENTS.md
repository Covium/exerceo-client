# Exerceo client (`exerceo-client`)

This repository is the Exerceo **client**: the Vue 3 web app and the Android WebView wrapper.

The HTTP API lives in the sibling repository `exerceo-server`. Do not put NestJS or PostgreSQL code here.

Product logic lives in TypeScript. The Kotlin layer only hosts the WebView and exposes Health Connect through a small JavaScript bridge.

## Stack

- Vue 3 + TypeScript
- Pinia
- Tailwind CSS
- Mozilla Fluent (`fluent-vue`)
- PWA
- Kotlin Android wrapper + Health Connect

## Conventions

- LF line endings, 2-space indentation
- TypeScript strict mode; do not use `any` except for imported library types
- Do not call Android APIs from Vue. Use `src/bridge/health.ts`
- The web app must run without the native bridge
- Keep the native layer thin. Do not put streak, group, or goal logic in Kotlin
- Latin UI terms use Fluent ids `latin-<id>` (value is Latin in every locale, `.gloss` is the user's language). Render them with `LatinTerm` / `useLatinTerm`. A later setting can flip `preferences.useLocalizedTerms` to show the gloss as the label.

## Layout

```text
frontend/     Vue application (npm package: exerceo-frontend)
android/      Kotlin WebView + Health Connect bridge
```

## Local development

```powershell
cd frontend
npm install
npm run dev
```

The Vite dev server proxies `/api` to `http://localhost:3000` (`exerceo-server`).

CI is `workflow_dispatch` only. Web deploy and APK builds do not run on push. APK `release` bumps git tags `vX.Y.Z` and sets Android `versionName` / `versionCode` from that tag.
