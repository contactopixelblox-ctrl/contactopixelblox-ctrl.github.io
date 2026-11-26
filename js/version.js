// Única fuente de la versión y del historial. La entrada más nueva va primero.
// Al publicar un cambio: añade una entrada aquí y actualiza los "?v=" de index.html.
window.EA = window.EA || { aperturas: {} };

window.EA.historial = [
  { version: "3.2.0", fecha: "26/11/2026", cambios: [
    "Nuevo menú con la versión y el historial de cambios."
  ] },
  { version: "3.1.0", fecha: "26/11/2026", cambios: [
    "El código se ordenó en carpetas. La app funciona igual."
  ] },
  { version: "3.0.0", fecha: "26/11/2026", cambios: [
    "Corregidas las jugadas fantasma al reiniciar o cambiar de apertura.",
    "Mejor diseño y control táctil en celular.",
    "Avance automático opcional y pistas en tres niveles.",
    "Caro-Kann Clásica ampliada hasta 7...Cd7.",
    "chess.js incluido en la app, sin depender de un CDN."
  ] }
];
