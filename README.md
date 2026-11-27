# ChessClau

App web para aprender la **Apertura Italiana** (con blancas) y la **Defensa Caro-Kann** (con negras). Tiene modos Aprender, Práctica y Vs IA (tres niveles). Es HTML, CSS y JavaScript sin compilación ni dependencias externas.

Publicada en: https://contactopixelblox-ctrl.github.io/

## Analizar una partida PGN
Toca **PGN** en la barra inferior, pega el texto (o abre un archivo `.pgn`), elige tu color y toca **Analizar partida**. Si el archivo trae varias partidas, se elige una. Se ignoran comentarios, relojes y variantes entre paréntesis. Solo partidas desde la posición inicial. La app recuerda tu nombre de jugador en el teléfono para marcar tu color la próxima vez. El lector está en `js/pgn.js`.

## Estructura

| Archivo | Contenido |
|---|---|
| `index.html` | Solo el HTML |
| `css/style.css` | Estilos |
| `js/app.js` | Lógica de la app |
| `js/version.js` | Versión e historial de cambios |
| `js/menu.js` | Menú de la app |
| `js/splash.js` | Pantalla de carga |
| `js/arbol.js` | Construye el árbol de variantes |
| `tools/validar.js` | Valida las jugadas con chess.js (Node) |
| `js/motor.js` | Motor que elige las jugadas libres y las de la IA |
| `sw.js`, `js/offline.js` | Uso sin conexión |
| `manifest.webmanifest`, `icons/` | Instalación en Android |
| `js/sonidos.js` | Sonidos generados con Web Audio (sin archivos de audio) |
| `js/analisis.js` | Informe de la partida y repaso |
| `js/lib/stockfish/` | Stockfish 19 lite (GPL-3.0) |
| `js/pieces.js` | Piezas en SVG |
| `js/data/italiana.js` | Variantes de la Italiana |
| `js/data/carokann.js` | Variantes de la Caro-Kann |
| `js/lib/chess.min.js` | chess.js 0.10.3, minificado (incluye su licencia BSD) |

Son scripts normales (sin módulos ES) que comparten el registro global `window.EA`. El orden de los `<script>` en `index.html` importa: librería, piezas, datos, versión, menú, `app.js` y al final la pantalla de carga.

## Cómo añadir una variante

En el archivo de la apertura (`js/data/`), añade un objeto a la lista `variantes`:

```js
{
  id: "mi-variante",
  nombre: "Nombre visible",
  jugadas: [
    { san: "e4", razon: "..." },
    { san: "e5", razon: "..." }
  ]
}
```

- `san` usa la notación en inglés (N, B, R, Q, K). La app muestra las letras en español.
- Las jugadas iniciales compartidas con otra variante se unen solas; copia **la misma** `razon` (y `nota`, si tiene).
- `nota` es opcional y aparece entre paréntesis junto a la jugada.
- No hace falta tocar la lógica.

Los `desvios` son jugadas del rival fuera del libro: `{ tras: ["e4"], san: "c5" }`.

Después ejecuta:

```
node tools/validar.js
```

## Cómo probarla

- Abre `index.html` en el navegador (funciona también como archivo local, manteniendo las carpetas).
- Si una variante está mal escrita, la consola del navegador muestra `Línea inválida`.
- Recorre la variante nueva en **Aprender** y luego en **Práctica**.

## Cómo publicar una versión

1. Añade una entrada al inicio de la lista en `js/version.js`.
2. Cambia todos los `?v=` de `index.html` y `VERSION` en `sw.js` al mismo número, y ejecuta `node tools/validar.js`. Si creas un archivo nuevo, añádelo también a la lista de `sw.js`.
3. Comprueba la versión en el menú **Más** de la app.

## Instalar en Android

Abre la web en Chrome, toca **⋮ → Añadir a pantalla de inicio** (o **Instalar app**). Antes de usarla sin internet, ábrela una vez conectado y espera a que el menú **Más** diga «Sin conexión: lista ✓». Para probarlo en un computador usa un servidor local (`python3 -m http.server`); abriendo el archivo directo no se activa el service worker.

## Análisis de partidas

En **Vs IA**, el botón **Analizar** abre un resumen y la revisión sobre el tablero. El análisis usa Stockfish en un Web Worker (solo desde un servidor web o la app instalada). La clasificación se basa en la caída estimada de opciones de ganar: menos de 2 puntos excelente, menos de 5 buena, menos de 10 imprecisión, menos de 20 error y desde 20 error grave. Son umbrales propios y aproximados.

## Licencias de terceros

- chess.js 0.10.3: BSD (cabecera en `js/lib/chess.min.js`).
- Stockfish 19, compilado por [Stockfish.js](https://github.com/nmrugg/stockfish.js) (paquete npm `stockfish` 19.0.1, sin modificar): GPL-3.0, texto en `js/lib/stockfish/LICENSE.txt`. Código fuente en ese repositorio.
