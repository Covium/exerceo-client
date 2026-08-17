# Exerceo client

Vue 3 frontend and Android WebView wrapper for Exerceo. This repository is independent of `exerceo-server`.

## Frontend

```powershell
cd frontend
Copy-Item .env.example .env
npm install
npm install-scripts approve esbuild
npm run dev
```

Open [http://localhost:5173](http://localhost:5173). The Vite proxy forwards `/api` to the NestJS server at `http://localhost:3000`.

Production build:

```powershell
npm run build
```

The same build is a PWA and can be copied into `android/app/src/main/assets/www` for the Android wrapper.

## Android

The Kotlin layer hosts the Vue app in a WebView and exposes Health Connect through `window.ExerceoNative`. In a desktop browser the Health Connect bridge is absent and the UI continues to work with manual workouts, groups, and measurements.

Android Studio with JDK 17+ is required to assemble the APK. Java 8 is not sufficient.

Debug builds load `http://10.0.2.2:5173` (the host machine's Vite server). Release builds load bundled assets.

## Theme

Exerceo uses original classical and spellcasting imagery. Latin labels such as EXERCITIUM and GRADUS stay in Latin; tooltips and explanations follow English or Russian via Fluent.
