// Única fuente de la versión y del historial. La entrada más nueva va primero.
// Al publicar un cambio: añade una entrada aquí y actualiza los "?v=" de index.html.
window.EA = window.EA || { aperturas: {} };

window.EA.historial = [
  { version: "5.1.0", fecha: "27/11/2026", cambios: [
    "Lector de PGN: pega o abre tus partidas y revísalas sobre el tablero."
  ] },
  { version: "5.0.0", fecha: "27/11/2026", cambios: [
    "Diseño nuevo con tema oscuro (o claro) y navegación abajo.",
    "Revisión sobre el tablero con un símbolo de color en cada jugada.",
    "Flecha con la mejor jugada, barra de ventaja y gráfica.",
    "Nueva categoría: Gran jugada.",
    "Pantalla Más con ajustes y tu progreso."
  ] },
  { version: "4.1.0", fecha: "26/11/2026", cambios: [
    "Análisis de partidas Vs IA con Stockfish.",
    "Cuenta jugadas de libro, brillantes, buenas, imprecisiones y errores.",
    "Propone una jugada mejor y puedes practicarla moviendo la pieza."
  ] },
  { version: "4.0.0", fecha: "26/11/2026", cambios: [
    "Nuevo modo Vs IA: tres niveles, con blancas o negras.",
    "Sonidos, que puedes apagar en el menú ☰.",
    "En Práctica el rival a veces se sale del libro y juegas 4 jugadas libres.",
    "Avance automático desactivado por defecto.",
    "Instalable en Android y preparada para usarse sin conexión.",
    "Variantes en un formato fácil de ampliar, con validador.",
    "\"Dos Caballos\" ahora se llama \"Italiana tranquila vs 3...Cf6\"."
  ] },
  { version: "3.3.0", fecha: "26/11/2026", cambios: [
    "Nueva pantalla de carga con la versión y los cambios recientes."
  ] },
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
