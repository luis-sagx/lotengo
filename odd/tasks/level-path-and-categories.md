# Ruta por nivel y categorías legibles

## Objetivo y problema

Hacer que la ruta empiece en el nivel elegido, cargue con rapidez y conserve la vista al navegar; permitir cambiar el nivel desde Configuración; mostrar nombres y categorías legibles en Palabras y Frases; unificar las cabeceras visibles de las pestañas y los detalles de categoría.

## Alcance autorizado

Corregir la selección y presentación de nivel, consulta y refresco de ruta, navegación desde Configuración, nombres visibles de categorías, altura de filtros e iconos de categorías. Por solicitud posterior con capturas, alinear los títulos de Inicio, Palabras, Frases, Progreso y Ajustes; quitar el título repetido en Frases y los identificadores internos en la cabecera de categorías. Conservar progreso y contenido existente.

## Criterios de aceptación

- La ruta muestra primero el nivel elegido y permite recorrer niveles por páginas sin dibujar todo el currículo.
- Volver a la ruta no causa una recarga visible innecesaria; el progreso cambia tras estudiar o elegir otro nivel.
- Configuración abre el cambio de nivel y refleja el nivel nuevo al regresar.
- Palabras y Frases no muestran guiones bajos en categorías, los filtros no recortan texto y cada categoría tiene un icono representativo.
- Las cinco pestañas muestran su título con altura, margen y tipografía coherentes; Frases muestra un solo título.
- Las pantallas de categoría muestran arriba su nombre legible, sin identificador interno ni título repetido; el conteo sigue visible.

## Plan y seguimiento

- [x] T1 — Filtrar/paginar la ruta por nivel y evitar recargas redundantes, con actualización tras cambios de nivel o lección. Ruta: delegada; disparadores: exploración de más de cuatro archivos y escritura de varios archivos no triviales. Resultado: consulta SQL y caché por nivel, invalidación al desbloquear/completar/crear lecciones, una página de nivel en la UI y refresco sin spinner al volver. Comprobación: inspección de llamadas `getPath`, flujo de selección/finalización y `git diff --check` correcto; dispositivo pendiente. Commit: `6e5094c`.
- [x] T2 — Reparar navegación desde Configuración y actualización del nivel visible. Ruta: delegada; disparadores: preparación y edición de varios archivos vinculados. Resultado: enlace correcto al navegador raíz y carga de configuración al recuperar el foco. Comprobación: árbol AppNavigator/MainTabNavigator/LevelPick inspeccionado y `git diff --check` correcto; dispositivo pendiente. Commit: `cd8b32e`.
- [x] T3 — Normalizar nombres de categorías, iconos y altura de filtros en Palabras y Frases. Ruta: delegada; disparadores: preparación y edición de varios archivos no triviales. Resultado: 47 categorías reales con nombres y emojis representativos, etiquetas de conteo correctas, filtros de 52 px con texto de 20 px de interlínea. Comprobación: auditoría estática de seeds (0 nombres/iconos faltantes, 0 emojis duplicados), `git diff --check` e Impeccable detect sin hallazgos; dispositivo pendiente. Commit: `9f4f7bf`.
- [x] T4 — Unificar cabeceras de las cinco pestañas y eliminar el título duplicado en Frases; corregir la etiqueta de racha repetida en Progreso. Ruta: delegada, iniciada antes de la instrucción posterior de continuar inline; disparadores: mapeo de más de cuatro archivos y escritura de varios archivos no triviales. Resultado: componente `ScreenHeader` compartido, cabecera nativa oculta en las listas raíz y racha sin repetición. Comprobación: inspección de jerarquía/estilos, `git diff --check` y detector Impeccable sin hallazgos; dispositivo pendiente. Commit: pendiente.
- [ ] T5 — Mostrar el nombre legible de cada categoría en la cabecera de navegación y eliminar el título duplicado en el cuerpo, conservando el conteo. Ruta: inline por instrucción explícita posterior del usuario; la preferencia del usuario prevalece sobre el disparador de escritura de varios archivos. Comprobación: inspección de ambos navegadores y pantallas de detalle; dispositivo pendiente. Commit: pendiente.

## Configuración y entrega

- TDD: desactivado; no hay configuración que lo active. Runner existente: `npm test`, reservado porque no se solicitó ejecutar tests. Comprobaciones ordinarias: inspección estática y `git diff --check`.
- RDD: no disponible; el comando `gentle-ai` no está instalado. Estado: unavailable/unmanaged; no iniciar revisión.
- Estrategia de entrega: `single-pr` por elección posterior del usuario de hacer solo commits normales y gestionar personalmente el PR. Previsión actualizada de código authored: aproximadamente 450 líneas acumuladas, excluyendo seguimiento. No se crearán PRs en esta sesión.
- Rama: `fix/level-path-and-categories`; punto de partida: `8e156b8`.
- Código authored acumulado: 278 líneas añadidas más eliminadas (`6e5094c`: 174; `cd8b32e`: 9; `9f4f7bf`: 95). Un solo tramo local desde `8e156b8` hasta `9f4f7bf`; no se creó PR.
- Espejo Engram: pendiente; no hay herramientas de memoria disponibles en esta sesión.
- Progreso: T1 a T4 implementadas y comprobadas estáticamente; T5 pendiente. Siguiente paso: registrar commit de T4 y corregir detalle de categorías inline. La publicación de la rama queda a cargo del usuario.
