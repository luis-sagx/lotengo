# Vocabulario inglés útil B2 y C1

## Objetivo y problema

Ampliar el vocabulario para estudiantes de inglés con palabras y expresiones reales, útiles en conversación, trabajo, trámites, información y cultura. Las semillas originales contienen solo tres entradas B2 y ninguna C1; el recorrido de esos niveles se llena con términos sintéticos.

## Alcance autorizado

Añadir entradas originales a `src/seeds/words/b2.mjs` y `src/seeds/words/c1.mjs`, conservando el formato, categorías y niveles existentes. No cambiar la estructura de SQLite, el currículo ni las frases.

## Criterios de aceptación

- Cada una de las siete categorías B2 y seis categorías C1 tiene al menos 40 entradas reales, suficientes para sus cinco lecciones de ocho palabras.
- Inglés natural, traducciones españolas claras, sin duplicados entre niveles ni términos sintéticos nuevos.
- `npm run validate` y `npm test` terminan correctamente.

## Plan y seguimiento

- [x] T1 — Añadir vocabulario B2 en sus siete categorías; verificar conteos, unicidad y contenido. Ruta: delegada; disparador: escritura de dos archivos no triviales y preparación para la escritura. Resultado: 40 entradas reales por categoría, 280 nuevas; `npm run validate` (209/209 lecciones), `npm test` (7/7) y `git diff --check` correctos. Commit: `fa49977`.
- [ ] T2 — Añadir vocabulario C1 en sus seis categorías; verificar contenido y recorrido completo. Ruta: delegada; disparador: escritura de dos archivos no triviales en la función completa. Commit: pendiente.

## Configuración y entrega

- TDD: desactivado para esta tarea; no se encontró configuración ni instrucción que lo active. Verificación ordinaria: `npm run validate` y `npm test`.
- RDD: no disponible; `gentle-ai` no está instalado en este entorno. No se inició revisión.
- Estrategia de entrega: `ask-on-risk` (predeterminada). Estrategia de cadena: pendiente si el tamaño acumulado supera unas 400 líneas.
- Previsión: unas 520 filas nuevas más seguimiento, aproximadamente 550 líneas authored, excluyendo archivos generados.
- Rama: `feat/useful-english-vocabulary`; límite inicial de revisión: `f1b41b9`.
- Conteo acumulado de código authored: 286 líneas añadidas en `fa49977`.
- Estado: T1 completo. Próximo paso: ampliar C1 y verificar de nuevo.
