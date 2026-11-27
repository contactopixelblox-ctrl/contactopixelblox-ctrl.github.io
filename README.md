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
| `js/splash.js` | Pantalla de carga |
| `js/arbol.js` | Construye el árbol de variantes |
| `tools/validar.js` | Valida las jugadas con chess.js (Node) |
| `js/motor.js` | Motor que elige las jugadas libres y las de la IA |
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
2. Cambia todos los `?v=` de `index.html` al mismo número, para que el navegador pida los archivos nuevos.
3. Comprueba la versión en el menú **☰** de la app.
