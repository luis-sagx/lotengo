# Actualizar a Expo SDK 57

## Objetivo y problema

Usar este proyecto con la versión actual de Expo Go. El proyecto declara SDK 56 y el teléfono tiene Expo Go SDK 57, por lo que Expo Go rechaza abrirlo.

## Alcance autorizado

Actualizar Expo SDK y las dependencias directas relacionadas, sincronizar `package-lock.json` y aplicar cambios de configuración solo si la guía oficial de SDK 57 o los diagnósticos los requieren. El proyecto usa Expo administrado: no hay carpetas `android/` o `ios/` versionadas. Migrar el splash antiguo de `app.json` al plugin oficial si la validación del SDK lo exige, manteniendo su imagen y fondo.

## Criterios de aceptación

- `npx expo config --json` declara SDK 57 y las versiones de dependencias cumplen el SDK.
- `npx expo-doctor` no reporta incompatibilidades.
- `npm run validate` y `npm test` pasan.
- `npx expo export --platform android` empaqueta la app. La apertura manual en Expo Go SDK 57 se verifica al tener el Android disponible.

## Plan y seguimiento

- [x] T1 — Actualizar Expo SDK y dependencias compatibles; migrar configuración incompatible detectada; validar el bundle Android. Ruta: delegada; disparador: manifest, lockfile, Babel y app config. Resultado: Expo 57.0.25, React Native 0.86.3, Reanimated 4.5.1 y Worklets 0.10.1; `expo-splash-screen` reemplaza el `splash` rechazado; Babel usa la configuración automática de Expo. `npx expo config --json` confirma SDK 57, Expo Doctor (21/21), `npm run validate` (209/209 lecciones), `npm test` (7/7), `npx expo export --platform android` y `git diff --check` pasan. `npx expo start --android --clear` no pudo abrir el dispositivo: `adb devices` ya no lista teléfonos. Commit: pendiente.

## Configuración y entrega

- TDD: desactivado; no hay configuración que lo active. Checks: `npx expo-doctor`, `npm run validate`, `npm test`, arranque Expo Go Android.
- RDD: no disponible en este entorno (`gentle-ai` no está instalado); no iniciar revisión.
- Estrategia de entrega: `ask-on-risk`; previsión de cambios authored inferior a 400 líneas, excluyendo lockfile.
- Rama: `feat/expo-sdk-57`; base: `689e4eb`.
- Rationale: SDK 57 requiere las versiones compatibles de Expo modules, RN 0.86 y worklets. Expo Doctor detectó que su esquema rechaza `expo.splash`; se migró a `expo-splash-screen` conservando imagen y color. `babel-preset-expo` ya añade el plugin de Worklets, así que se quitó la declaración manual duplicada.
- npm informó 17 vulnerabilidades (15 moderadas, 2 altas) durante la instalación; no se ejecutó `npm audit fix`.
- Estado: T1 completo. Prueba manual en Expo Go pendiente por dispositivo USB no disponible. Próximo paso: cuando el teléfono esté conectado, iniciar `npm start` y abrir el QR con Expo Go SDK 57.
