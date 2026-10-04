# Repetición espaciada basada en evidencia

## Objetivo y problema

La app empezó como Anki, después pasó a quiz y hoy se parece demasiado a Duolingo: vidas que bloquean, XP, combos y una ruta de lecciones como eje. El usuario quiere una herramienta para aprender inglés **por repetición de palabras**, con diseño respaldado por investigación. Objetivo del MVP: la pantalla principal es la sesión diaria (repasos vencidos + pocas palabras nuevas), con recuerdo activo, scheduler FSRS, contenido con contexto real y métricas honestas de retención.

## Evidencia (resumen de la investigación, 2026-10-04)

- Recuerdo activo > releer/voltear (Roediger & Karpicke 2006; Rowland 2014 g≈0.50; Adesope et al. 2017; Dunlosky et al. 2013).
- Espaciado con intervalos crecientes, medido en retención diferida (Cepeda et al. 2006/2008; Kim & Webb 2022, L2).
- Scheduler ajustado a datos: FSRS (Ye, Su & Cao, KDD 2022; open-spaced-repetition/srs-benchmark), retención objetivo 0.85–0.90.
- Frecuencia primero (Nation; Laufer & Ravenhorst-Kalovski 2010).
- Reconocimiento al inicio, luego producción en ambas direcciones (Nakata 2016, 2017).
- Errores con feedback inmediato ayudan; no castigar (Kornell, Hays & Bjork 2009).
- Contexto: oración de ejemplo + audio; imagen solo si es concreta (Webb 2007; Paivio; Mayer).
- Límite de nuevas por día, repasos primero, sesiones cortas, sueño entre sesiones (Mazza et al. 2016; Sweller).
- Intercalar temas; no agrupar palabras semánticamente parecidas (Tinkham 1993; Nakata & Suzuki 2019).
- Gamificación ligera, sin vidas ni rankings (Sailer & Homner 2020; Hanus & Fox 2015; Deci, Koestner & Ryan 1999).

Huecos: no hay ensayo sobre el número ideal de nuevas por día ni sobre FSRS vs SM-2 en aprendizaje (los benchmarks miden predicción).

## Decisiones del usuario (2026-10-04)

- Ruta de lecciones: queda como sección secundaria ("Temas").
- Repaso: escribir la respuesta por defecto; voltear tarjeta como opción en Ajustes.
- Misma rama `feat/path-gamification-perf`; implementación inline por instrucción explícita («aplica todo el plan inline»), que prevalece sobre los disparadores de delegación.

## Alcance autorizado

F0–F6 del plan aprobado: base de datos con migraciones y `review_log`; FSRS; ejercicios de recuerdo (escribir, cloze, escuchar y escribir); pantalla Hoy como inicio; contenido por frecuencia con oraciones reales de Tatoeba, audio grabado y falsos amigos; quitar vidas, combos y XP; racha con congelación; estadísticas de retención, cobertura y pronóstico. Fuera: voz/ASR, lecturas, optimizador FSRS por usuario, rankings.

## Criterios de aceptación

- Cambiar el contenido (CONTENT_VERSION) no borra el progreso del usuario; las tablas de usuario se migran.
- Cada repaso queda en `review_log`. El scheduler es FSRS con retención objetivo configurable; ninguna tarjeta queda fuera del calendario; hay pasos de aprendizaje dentro del día; la práctica libre no altera el calendario.
- Las tarjetas en repaso se preguntan con recuerdo activo (escribir, cloze o escuchar y escribir), con corrección tolerante; la opción múltiple solo en las primeras exposiciones. La nota sugerida se puede cambiar.
- La pestaña inicial es Hoy: repasos vencidos primero y luego N nuevas (10 por defecto), intercaladas por categoría.
- Las palabras siguen un orden de frecuencia real y tienen oración de ejemplo real con traducción; se reproduce audio grabado cuando existe; los falsos amigos muestran aviso.
- No hay vidas, combos ni XP. La racha perdona un día por semana.
- Progreso muestra palabras retenidas, cobertura aproximada, retención real y pronóstico de repasos.
- `npm test`, `npm run validate`, `git diff --check` y `expo export` pasan.

## Plan y seguimiento

- [ ] T1 — F0 Base de datos: separar contenido y datos de usuario; migraciones de esquema; reconstrucción de contenido que conserva el progreso (remapeo por texto); `review_log`; columnas FSRS; fechas locales.
- [ ] T2 — F1 Scheduler FSRS (`ts-fsrs`): módulo puro con tests, 4 notas, pasos intradía, retención objetivo, registro de cada repaso; lecciones y repaso usan FSRS.
- [ ] T3 — F2 Recuerdo activo: ejercicios escribir/cloze/escuchar-escribir, corrección tolerante, nota sugerida editable, elección de ejercicio según estado; tarjeta volteable con 4 notas.
- [ ] T4 — F3 Pantalla Hoy: cola unificada (vencidas + nuevas intercaladas), límite diario, pestañas Hoy/Temas/Diccionario/Progreso/Ajustes.
- [ ] T5 — F4 Contenido: orden por frecuencia (FrequencyWords, OpenSubtitles 2018), oraciones Tatoeba con traducción, falsos amigos, audio grabado, enriquecimiento sin sobrescribir ejemplos, créditos.
- [ ] T6 — F5 Quitar vidas, combos y XP; racha con congelación semanal; ajustes de nuevas por día, retención y modo de repaso.
- [ ] T7 — F6 Progreso: retenidas, cobertura, retención real, pronóstico; logros basados en retención.

## Configuración y entrega

- TDD: desactivado (sin configuración que lo active; mismo criterio que la feature anterior). Runner: `npm test` (node:test). Comprobaciones: `npm test`, `npm run validate`, `git diff --check`, `npx expo export --platform android`.
- RDD: no disponible (`gentle-ai` no está en PATH). Estado: unavailable/unmanaged; no se inicia revisión.
- Entrega: `single-pr` en la rama actual por decisión del usuario; push y PR a cargo del usuario. Previsión: bastante más de 400 líneas authored, justificado por el alcance (7 fases).
- Ruta por tarea: inline (instrucción explícita del usuario).
- Rama: `feat/path-gamification-perf`; punto de partida de esta feature: `e4b2357`.
- Espejo Engram: pendiente; no hay herramientas de memoria en esta sesión.
- `package.json` tiene un cambio local del usuario (scripts android/ios) que no se incluye en los commits.

## Progreso

Doc creado. Siguiente: T1.
