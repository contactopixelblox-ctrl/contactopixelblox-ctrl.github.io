# Entrenador de Aperturas

App web para aprender la **Apertura Italiana** (con blancas) y la **Defensa Caro-Kann** (con negras). Tiene modo Aprender y modo Práctica. Es HTML, CSS y JavaScript sin compilación ni dependencias externas.

Publicada en: https://contactopixelblox-ctrl.github.io/

## Estructura

| Archivo | Contenido |
|---|---|
| `index.html` | Solo el HTML |
| `css/style.css` | Estilos |
| `js/app.js` | Lógica de la app |
| `js/version.js` | Versión e historial de cambios |
| `js/menu.js` | Menú de la app |
| `js/pieces.js` | Piezas en SVG |
| `js/data/italiana.js` | Variantes de la Italiana |
| `js/data/carokann.js` | Variantes de la Caro-Kann |
| `js/lib/chess.min.js` | chess.js 0.10.3, minificado (incluye su licencia BSD) |

Son scripts normales (sin módulos ES) que comparten el registro global `window.EA`. El orden de los `<script>` en `index.html` importa: librería, piezas, datos, versión, menú y al final `app.js`.

## Cómo añadir una variante

En el archivo de la apertura, dentro de `js/data/`:

1. Añade un objeto a `variants`: `{ id: "nueva", name: "Nombre visible", path: ["e4", "e5", "..."] }`. El `id` no debe repetirse y `path` usa notación en inglés (N, B, R, Q, K).
2. En `root`, añade los nodos que falten, siguiendo las jugadas de `path`. Cada nodo es `{ san, label, reason, children: [] }`. `label` es el texto en español que se muestra. Si el comienzo coincide con otra variante, reutiliza esos nodos y crea la rama donde se separan.

## Cómo probarla

- Abre `index.html` en el navegador (funciona también como archivo local, manteniendo las carpetas).
- Si una variante está mal escrita, la consola del navegador muestra `Línea inválida`.
- Recorre la variante nueva en **Aprender** y luego en **Práctica**.

## Cómo publicar una versión

1. Añade una entrada al inicio de la lista en `js/version.js`.
2. Cambia todos los `?v=` de `index.html` al mismo número, para que el navegador pida los archivos nuevos.
3. Comprueba la versión en el menú **☰** de la app.
