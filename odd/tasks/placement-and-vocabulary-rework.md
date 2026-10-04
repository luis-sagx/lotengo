# Rework del test de ubicación, niveles y vocabulario nativo

## Objetivo y problema
El test express ubicó a un usuario A2 en C1. Causas verificadas: solo evalúa las 2 palabras más fáciles de cada nivel, basta 1 de 2 para aprobar (44 % de pasar adivinando), los phrasal verbs heredan la frecuencia de su palabra más rara y quedan como "fáciles", hay cognados y significados secundarios. Además hay palabras mal niveladas (111 palabras A1 dentro de A2, phrasal verbs B1 dentro de B2), faltan palabras y frases cotidianas (yes, okay, really, maybe, I don't know, No way…) y las frases B2/C1 son 12/0.

## Alcance autorizado (usuario, 2026-10-04)
1. Test de máximo 15 preguntas, con opción "No sé", sin adivinanza ventajosa.
2. Reasignar niveles y agregar vocabulario nativo, tomando Oxford 3000/5000 como referencia orientativa (no copia literal, por licencia).
3. Completar frases B2/C1 y frases nativas comunes.
4. Etiquetas visibles de nivel nuevas; claves internas A1…C1 NO cambian (están en SQLite).

Nombres visibles: A1 Principiante, A2 Básico, B1 Intermedio, B2 Avanzado, C1 Experto. El código CEFR deja de mostrarse en la UI.

## Restricciones
Sin migración de base de datos. Sin duplicados de palabra/frase. `npm run validate` y `npm test` verdes. Heurística ~400 líneas por tarea (solo planificación).

## Tareas
- [x] T1 — Test de ubicación: banco curado `src/seeds/placementItems.mjs` (3 preguntas × 5 niveles = 15), aprobar con 2/3, "No sé", puntuación sin racha de suerte; pantalla actualizada; test que demuestre que responder al azar/"No sé" no pasa de A1/A2. Archivos: placementService.mjs, PlacementTestScreen.jsx, placementItems.mjs, tests/placementService.test.mjs.
- [x] T2 — Etiquetas: `levels.mjs` (nombres/descripciones), ocultar código CEFR en SettingsScreen y PathScreen. Test levels.
- [ ] T3 — Palabras: reasignar niveles (mover filas entre a1…c1), añadir vocabulario nativo común, regenerar corpus si hay red.
- [ ] T4 — Frases: completar B2/C1, añadir frases nativas comunes en el nivel correcto.

## Configuración
- TDD: desactivado (sin configuración ni instrucción que lo active); verificación ordinaria `npm run validate` y `npm test`. Runner: node --test.
- RDD: `gentle-ai` no disponible/no habilitado; no se inicia revisión.
- Entrega: `ask-on-risk` por defecto; rama `feat/placement-and-vocabulary-rework`, límite de revisión `30c5d14`. Si la acumulación pasa ~400 líneas se pregunta estrategia de cadena (T3/T4 son datos explícitos y largos por naturaleza).
- Route: T1+T2 delegada (2+ archivos no triviales); T3 delegada (escritura masiva en varios archivos); T4 delegada. Los writers NO hacen commit; el orquestador commitea por tarea.
- Engram mirror `odd/placement-and-vocabulary-rework/tasks`: PENDIENTE (herramientas mem_* no disponibles en esta sesión).

## Progreso
Creado el documento. T1 `08c11ff` y T2 `37371e8` completos (ruta delegada; `npm test` 56/56 y `npm run validate` correctos según el writer). Acumulado: 89 añadidas / 137 borradas. T3 y T4 en curso (delegados). Próximo paso: revisar y commitear T3/T4.
