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

- [x] T1 — F0 Base de datos: separar contenido y datos de usuario; migraciones de esquema; reconstrucción de contenido que conserva el progreso (remapeo por texto); `review_log`; columnas FSRS; fechas locales. Ruta: inline (instrucción del usuario). Resultado: `PRAGMA user_version` pasa a ser la versión de esquema (base 10, lista `MIGRATIONS`); la versión de contenido vive en la tabla `meta`. Al cambiar `CONTENT_VERSION` (ahora 5), words/phrases pasan a `*_old`, se resiembra, `user_progress` y `review_log` se remapean por texto (ids negativos para no chocar con el UNIQUE), se borran huérfanos y `lesson_progress` se reconstruye desde el progreso de tarjetas. Las bases previas (user_version < 10) solo tenían datos de desarrollo y se reinician una vez. Fechas: `due`/`last_review` en epoch ms, "hoy" según el día local. Se hizo junto con T2 porque el esquema de `user_progress` lo define el scheduler.
- [x] T2 — F1 Scheduler FSRS (`ts-fsrs`): módulo puro con tests, 4 notas, pasos intradía, retención objetivo, registro de cada repaso; lecciones y repaso usan FSRS. Ruta: inline. Resultado: `services/srs.mjs` (ts-fsrs 5.4.2, pasos 1m/10m, reaprendizaje 10m, fuzz, máx. 10 años, retención 0.9 por defecto), `answerCard` guarda estado y `review_log` en una transacción; ninguna tarjeta sale del calendario (desaparece `known`); "dominada" = estabilidad ≥ 21 d; la práctica libre no toca el calendario; RatingButtons con 4 notas e intervalo de cada una. Comprobación: `npm test` 47/47 (8 de FSRS y 1 de integración sobre `node:sqlite` con loader para expo-sqlite que cubre resiembra con ids desplazados, huérfanos e historial), `npm run validate`, `git diff --check`, `expo export` android. Commit T1+T2: `9c1851e`.
- [x] T3 — F2 Recuerdo activo: ejercicios escribir/cloze/escuchar-escribir, corrección tolerante, nota sugerida editable, elección de ejercicio según estado; tarjeta volteable con 4 notas. Ruta: inline. Resultado: `quiz.mjs` añade TYPE_EN, CLOZE (solo si la oración de ejemplo contiene la palabra), LISTEN_TYPE y FLIP; `checkTyped` ignora mayúsculas, tildes, puntuación, "to" y artículos iniciales y tolera 1 error (2 desde 8 letras); `exerciseFor` usa reconocimiento mientras la tarjeta aprende y recuerdo en repaso; la nota sugerida (fallo→Otra vez, typo o >15 s→Difícil, si no Bien) aparece marcada y el usuario elige cualquiera de las 4. Commit: `3c7f633`.
- [x] T4 — F3 Pantalla Hoy: cola unificada (vencidas + nuevas intercaladas), límite diario, pestañas Hoy/Temas/Diccionario/Progreso/Ajustes. Ruta: inline. Resultado: `useStudySession` (vencidas antes que nuevas; cada nueva = presentación + reconocimiento; pasos de aprendizaje que vencen en <20 min vuelven en la misma sesión); `pickNew` toma nuevas por nivel y frecuencia, una frase cada 4 y evita dos de la misma categoría seguidas; límite `new_per_day` (10) contado desde `review_log`; TodayScreen con conteos, minutos estimados, "al día" con repasos de mañana y práctica libre; Repaso pasa a Diccionario y la ruta a Temas (sin cabecera de XP/vidas). Comprobación: `npm test` 52/52, oxlint sin nombres indefinidos ni variables sin uso en lo tocado, `expo export` android. Commit: `467cd3e` (se rehízo junto con T3 porque el primer commit de T3 arrastró renombres ya preparados y dejaba imports rotos; ninguno estaba publicado).
- [x] T5 — F4 Contenido: orden por frecuencia (FrequencyWords, OpenSubtitles 2018), oraciones Tatoeba con traducción, falsos amigos, audio grabado, enriquecimiento sin sobrescribir ejemplos, créditos. Ruta: inline. Resultado: `scripts/build-corpus.mjs` genera `src/seeds/corpus.mjs` (117 KB): rango y ocurrencias por millón en subtítulos, más la oración de Tatoeba más simple (3–10 palabras, el resto de palabras lo más frecuentes posible) con traducción al español; 1354/1600 palabras tienen ejemplo (manythings.org devolvió 406, así que se usaron los exports por idioma de Tatoeba). Cada nivel ordena sus palabras por frecuencia real; se eliminan los ejemplos de relleno; `per_million` queda en `words` para la cobertura de T7; CONTENT_VERSION 6. Las palabras de función (`basics`) se preguntan con cloze en repaso porque fuera de contexto son ambiguas. 17 falsos amigos presentes en el contenido con aviso en presentación, tarjeta y corrección. La pronunciación usa la grabación humana del diccionario cuando existe (expo-audio) y TTS si no; el enriquecimiento ya no reemplaza el ejemplo traducido. Créditos de datos en Ajustes. Comprobación: `npm test` 54/54 (2 tests nuevos de contenido), `npm run validate`, `expo export` android, `git diff --check`.
- [x] T6 — F5 Quitar vidas, combos y XP; racha con congelación semanal; ajustes de nuevas por día, retención y modo de repaso. Ruta: inline. Resultado: se eliminan vidas (HeartsBadge, pantalla sin vidas, recarga), combos, XP, meta diaria de XP y el logro de XP; las columnas correspondientes salen del esquema base. `gamification.mjs` pasa a `streak.mjs`: la racha perdona un día perdido como máximo una vez cada 7 días (`streak_freeze_at`). Los errores en lecciones no cuestan nada y la tarjeta vuelve al final. El resumen explica que equivocarse con feedback también enseña. Ajustes: palabras nuevas por día (5/10/15/20), retención objetivo (85/90/95 %) y modo de repaso (escribir o voltear), con chips de 44 px. «Resetear progreso» ahora borra de verdad progreso, historial y sesiones (antes solo la racha, aunque el aviso decía «TODO»). Comprobación: `npm test` 52/52 (tests de racha nuevos, test de integración del reset), `expo export` android, sin referencias restantes a vidas/XP, `git diff --check`.
- [x] T7 — F6 Progreso: retenidas, cobertura, retención real, pronóstico; logros basados en retención. Ruta: inline. Resultado: `services/stats.mjs` (puro, con tests): palabras que recuerdas hoy (recuperabilidad FSRS ≥ 0.9), dominadas (estabilidad ≥ 21 d), cobertura aproximada del inglés cotidiano (suma de ocurrencias por millón de las palabras recordadas; no cuenta inflexiones ni expresiones de varias palabras), retención real de 30 días desde `review_log` (solo con ≥ 20 repasos, comparada con el objetivo y con consejo si queda >5 puntos por debajo) y pronóstico de 7 días (vencidas cuentan hoy). Progreso muestra todo esto con un gráfico de barras de una serie (barras de 14 px, extremos de 4 px, etiqueta de accesibilidad con los valores). El historial etiqueta bien las sesiones (antes todas salían como «Frases»). Los logros de palabras usan dominadas. Comprobación: `npm test` 55/55, `npm run validate`, `expo export` android, `git diff --check`. Commit: `d8e689c`. T6: `1894bad`. T5: `66cd6a9`.

- [x] T8 — Feedback de respuesta (pedido del usuario con capturas, 2026-10-04): mejor espaciado y tipografía; sin mostrar tiempos (sesgan la elección); 3 botones con la lógica por detrás según acierto. Ruta: inline (cambio pequeño y entendido). Resultado: `srs.gradeFor` (acierto: Difícil→Hard, Bien→Good, Fácil→Easy, con error de tipeo Fácil cuenta como Good; fallo: siempre Again y solo botón «Continuar»); modo voltear usa Otra vez / Bien / Fácil porque no hay corrección. Se eliminan `previewIntervals`, `formatInterval`, `suggestGrade` y el contorno de nota sugerida (sugería por tiempo de respuesta). Footer: icono + título 20 px, bloque «RESPUESTA CORRECTA»/«SE ESCRIBE» con la respuesta en 20 px, traducción solo cuando el ejercicio no la mostraba (escuchar, cloze), márgenes de 24 px alineados al contenido, botones de 52 px sin subtítulo. Comprobación: `npm test` 54/54, oxlint sin errores en lo tocado, `expo export` android; revisión visual pendiente en el dispositivo del usuario.

## Configuración y entrega

- TDD: desactivado (sin configuración que lo active; mismo criterio que la feature anterior). Runner: `npm test` (node:test). Comprobaciones: `npm test`, `npm run validate`, `git diff --check`, `npx expo export --platform android`.
- RDD: no disponible (`gentle-ai` no está en PATH). Estado: unavailable/unmanaged; no se inicia revisión.
- Entrega: `single-pr` en la rama actual por decisión del usuario; push y PR a cargo del usuario. Previsión: bastante más de 400 líneas authored, justificado por el alcance (7 fases).
- Ruta por tarea: inline (instrucción explícita del usuario).
- Rama: `feat/path-gamification-perf`; punto de partida de esta feature: `e4b2357`.
- Espejo Engram: pendiente; no hay herramientas de memoria en esta sesión.
- `package.json` tiene un cambio local del usuario (scripts android/ios) que no se incluye en los commits.

## Progreso

T1–T7 implementadas y con commit en `feat/path-gamification-perf` (sobre `e4b2357`). Las 7 tareas se hicieron inline por instrucción del usuario.

Pendiente:
- Probar en dispositivo (no hay AVD ni dispositivo conectado). En particular: escribir con el teclado del sistema, audio grabado vs TTS, la pantalla Hoy y el gráfico de Progreso. La base de desarrollo anterior (user_version 4) se reinicia una vez al abrir; a partir de ahí los cambios de contenido conservan el progreso.
- `ts-fsrs` es JS puro, así que no hace falta un nuevo development build.
- Push y PR quedan a cargo del usuario.
- `package.json` sigue con el cambio local de scripts del usuario, sin incluir en commits.

Siguiente: verificación en dispositivo y PR.
