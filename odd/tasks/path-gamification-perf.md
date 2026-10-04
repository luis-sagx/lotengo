# Ruta única, gamificación y rendimiento

## Objetivo y problema

La app es lenta al arrancar y en la ruta. La navegación duplica contenido: la ruta y las pestañas Palabras y Frases usan las mismas filas, pero no tienen ninguna relación entre sí. El aprendizaje es solo autoevaluación, sin incentivos de juego, y parte del contenido es relleno sintético ("morning common verb a1 279"). Objetivo: una app rápida, con la ruta como página principal organizada por categorías, lecciones con ejercicios objetivos, vidas, XP, sonidos y hápticos, válida para alguien que no sabe nada de inglés.

## Decisiones del usuario (2026-10-03)

- Navegación: 4 pestañas. Ruta (inicio, unidades agrupadas por categoría), Repaso (tarjetas vencidas por SRS más un diccionario buscable), Progreso y Ajustes. Se eliminan Palabras y Frases.
- Vidas: la lección presenta las tarjetas y después un quiz objetivo (elegir traducción, escuchar y elegir, ordenar frase). Cada error cuesta 1 vida. Hay 5 vidas, se recupera 1 cada 30 min o completando un repaso.
- Sonidos: se añaden expo-audio y expo-haptics. Los sonidos se generan por script, sin licencias. Se pueden desactivar en Ajustes.
- Contenido: se elimina el relleno sintético. La app aún no tiene usuarios, así que no hay migración: se puede reiniciar la base de datos. Debe servir para principiantes absolutos.

## Alcance autorizado

Optimizar el arranque, la base de datos y el render; reestructurar la navegación; crear el motor de quiz, vidas, XP, meta diaria y combo; añadir sonidos y hápticos; corregir logros y el bug de "Seguir estudiando"; eliminar el relleno y recalcular el currículo.

## Criterios de aceptación

- El splash nativo se mantiene hasta que la app está lista. El seeding no se repite en arranques posteriores, y un error de arranque muestra un mensaje.
- No hay N+1 en las tarjetas de lección. La ruta usa una lista virtualizada con nodos memoizados.
- Hay 4 pestañas y la ruta muestra un banner de categoría por unidad. Repaso ofrece tarjetas vencidas y búsqueda.
- La lección consiste en presentación más quiz con respuestas objetivas. Los errores restan vida y vuelven a aparecer al final. Con 0 vidas, la lección no empieza.
- Las vidas se recargan con el tiempo y con el repaso. Hay XP, meta diaria y combo, con persistencia.
- Los sonidos de acierto, error y fin, y los hápticos, se pueden desactivar.
- No queda contenido sintético. Todas las lecciones planifican sin avisos, y `npm test` y `npm run validate` pasan.

## Plan y seguimiento

- [x] T1 — Rendimiento: splash, (versión de seed hecha en T2), pantalla de error, índices, JOIN de tarjetas, consultas duplicadas, doble carga, memo y virtualización, bug de enriquecimiento. Ruta: inline, por instrucción del usuario. Resultado: el splash nativo se mantiene hasta que la app está lista y los errores de arranque se muestran con texto; `getLessonCards` usa 2 JOIN en vez de N+1; `completeLesson` busca la siguiente lección por id; `upsertProgress` es un único UPSERT; los inserts del path van en lotes de 100; hay índices nuevos; se eliminó la doble carga de stats; en el enriquecimiento, un 404 cuenta como final y se persiste el `enriched` real. La virtualización y el memo de la ruta pasan a T3, porque esa pantalla se rehace; las listas de Palabras/Frases se eliminan en T3. Comprobación: `npm test` 25/25, `git diff --check` y `expo export` android correctos; pendiente medir en dispositivo. Commit: `463c50e`.
- [x] T2 — Contenido: eliminar el relleno sintético, adaptar el currículo a contenido real, orden para principiantes y reinicio de la base de datos. Ruta: inline, por instrucción del usuario («hazlo inline»), que prevalece sobre el disparador de escritura; el agente escritor se detuvo sin cambios. Resultado: el contenido real no encajaba en cuotas fijas por categoría (C1 no tiene frases y B2 tiene 12), así que el path se deriva del contenido: una unidad por categoría en orden para principiantes, lecciones de 8 tarjetas, categorías pequeñas reunidas en una unidad mixta y saludos al inicio. Quedan 1600 palabras, 496 frases, 270 lecciones y 102 unidades. Se eliminan las fonéticas falsas `/word/` y las vocales sueltas. `PRAGMA user_version` reconstruye las bases antiguas y el seeding se ejecuta una sola vez, lo que adelanta parte de T1. Comprobación: `npm test` 25/25, `npm run validate` válido, `git diff --check` correcto y `expo export` android correcto; pendiente probar en dispositivo. Commit: `9a3ece0` (165+/482−).
- [x] T3 — Navegación: 4 pestañas, ruta con banners de categoría, pantalla Repaso (vencidas más diccionario), eliminar Palabras/Frases y HomeScreen muerto. Ruta: inline, por instrucción del usuario. Resultado: las pestañas son Ruta, Repaso, Progreso y Ajustes. La ruta es un FlatList con filas de alto fijo (`getItemLayout`), banners por unidad con progreso, nodos en zigzag memoizados sin los ~64 Views por conector, y desplazamiento automático a la lección actual. Repaso muestra cuántas tarjetas tocan hoy y un diccionario buscable (palabras y frases, con debounce de 200 ms y audio al tocar). StudyLesson pasa al stack raíz en pantalla completa. Se eliminaron 10 pantallas/navegadores, 7 componentes/hooks y funciones de repositorio sin uso. El botón «Repasar ahora» apunta a `ReviewSession`, que se crea en T4. Comprobación: `npm test` 25/25, `git diff --check` y `expo export` android correctos; pendiente probar en dispositivo. Commit: `02d4109` (459+/2675−).
- [x] T4 — Motor de quiz: módulo puro de ejercicios con tests; flujo de lección presentación→quiz con reencolado de errores y SRS por acierto. Ruta: inline. Resultado: `services/quiz.mjs` con cuatro tipos de ejercicio (elegir español, elegir inglés, escuchar y ordenar fichas para frases de 3 a 8 palabras), distractores tomados de la lección y del nivel, presentación de dos en dos seguida de quiz, y reintento con otro tipo al fallar. La primera respuesta de cada tarjeta alimenta SM-2 (acierto=Bien, fallo=Difícil) y las estrellas. Repaso (`ReviewSession`) reutiliza el motor sin presentación. Se eliminan FlashCard, RatingButtons, PronunciationButton y el estado de sesión del store. Comprobación: `npm test` 32/32 (7 tests nuevos de quiz), `git diff --check` y `expo export` android correctos; pendiente probar en dispositivo. Commit: `7b3273c`.
- [x] T5 — Vidas, XP, meta diaria y combo (incluye pasar racha y meta a fecha local; hoy usan fecha UTC): módulo puro con tests, persistencia, cabecera con corazones, modal sin vidas y recarga por repaso. Ruta: inline. Resultado: `services/gamification.mjs` define 5 vidas con recarga cada 30 min, XP (10 por lección, +5 si es perfecta, +2 por cada 5 de combo; repaso 5 más 1 por acierto), racha y fecha local. Cada error de lección resta una vida, y la pantalla sin vidas aparece después de ver la corrección y lleva a Repaso. Completar un repaso devuelve una vida. Cuando no hay tarjetas vencidas, Repaso ofrece práctica con lo estudiado. La meta diaria es de XP y aparece en la cabecera con racha y vidas (con cuenta atrás); el combo se ve desde 3 aciertos seguidos; Progreso muestra el XP total. Las columnas pasan al CREATE TABLE con CONTENT_VERSION 3, y se eliminan las 6 migraciones PRAGMA del arranque. Comprobación: `npm test` 39/39 (7 tests nuevos), `git diff --check` y `expo export` android correctos; pendiente probar en dispositivo. Commit: `d81ee7d`.
- [x] T6 — Sonidos y hápticos: dependencias, WAV generados, servicio y toggle en Ajustes. Ruta: inline. Resultado: `expo-audio` ~57.0.5 y `expo-haptics` ~57.0.3 instalados con `expo install`, con el plugin de audio sin micrófono ni reproducción en segundo plano. `scripts/generate-sounds.mjs` sintetiza correct/wrong/complete en WAV de 22 kHz (14 a 34 KB). `soundService` reproduce los efectos con hápticos. Ajustes persiste la pronunciación automática (antes era un switch sin efecto) y los efectos, con CONTENT_VERSION 4. El ejercicio de escuchar tiene botón lento 🐢. Comprobación: `npm test` 39/39, `git diff --check`, `expo export` android (incluye los 3 .wav) y `expo config` sin RECORD_AUDIO; pendiente oír y sentir en dispositivo. Commit: `2fb0ae6`.
- [x] T7 — Resumen animado, logros reparados y guardado de sesión en "Seguir estudiando". Ruta: inline. Resultado: en el resumen, el XP, las estrellas y los resultados entran con animaciones de Reanimated y suena `complete`; el título distingue lección y repaso. Los logros de frases y de lección perfecta, que nunca podían desbloquearse, leen datos reales; «palabras dominadas» cuenta solo palabras; hay un logro nuevo de 500 XP. El bug de «Seguir estudiando» desapareció con StudyWords/StudyPhrases en T3: toda sesión guarda progreso al terminar. Comprobación: `npm test` 39/39, `git diff --check`, `expo export` android, verificación estática de imports con nombre (0 rotos) y oxlint `no-undef` (0); los avisos `no-unused-vars` son anteriores. Pendiente probar en dispositivo. Commit: `d5717fb`.

## Configuración y entrega

- TDD: desactivado; no hay configuración que lo active. Runner: `npm test` (node:test). Comprobaciones: `npm test`, `npm run validate`, `git diff --check` y el bundle de Expo.
- RDD: no disponible (`gentle-ai` no está instalado; se volvió a comprobar al cerrar). Estado: unavailable/unmanaged; no se inició revisión.
- Entrega: `single-pr` con commits normales, igual que la preferencia del usuario en la feature anterior; el usuario gestiona push y PR. Previsión: más de 400 líneas authored, justificado por el alcance acordado.
- Rama: `feat/path-gamification-perf`; punto de partida: `a14efd5`.
- Espejo Engram: pendiente; no hay herramientas de memoria en esta sesión.

## Progreso

T1 a T7 implementadas y con commit, inline por petición del usuario a partir de T2 (el agente escritor de T2 se detuvo sin cambios). Código authored acumulado (70 files changed, 2119 insertions(+), 4136 deletions(-)); el volumen grande se debe sobre todo a eliminaciones (relleno sintético y pestañas antiguas).

Pendiente:
- Probar en dispositivo: primer arranque con reconstrucción de la base de datos, ruta, quiz, vidas, sonidos y hápticos. Con CONTENT_VERSION 4 las bases de desarrollo antiguas se borran y se vuelve a hacer el onboarding.
- Las dependencias nativas nuevas (expo-audio, expo-haptics) requieren un nuevo development build; Expo Go ya las incluye.
- Push y PR quedan a cargo del usuario.

Siguiente: verificación en dispositivo y PR.
