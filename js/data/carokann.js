window.EA = window.EA || { aperturas: {} };

// Defensa Caro-Kann (juegas con negras)
// Para añadir una variante, agrega un objeto a "variantes" (ver README.md)
window.EA.aperturas.carokann = {
  nombre: "Defensa Caro-Kann",
  color: "b",
  // Jugadas razonables del rival fuera del libro (se juegan a veces en Práctica)
  desvios: [
    { tras: ["e4", "c6"], san: "Nf3" },
    { tras: ["e4", "c6"], san: "Nc3" },
    { tras: ["e4", "c6"], san: "Bc4" },
    { tras: ["e4", "c6"], san: "d3" },
    { tras: ["e4", "c6", "d4", "d5"], san: "Nd2" },
    { tras: ["e4", "c6", "d4", "d5"], san: "f3" }
  ],
  variantes: [
    {
      id: "clasica",
      nombre: "Variante Clásica (3. Cc3)",
      jugadas: [
        { san: "e4", razon: "Las blancas ocupan el centro y abren líneas para su dama y alfil." },
        { san: "c6", razon: "Prepara el golpe central d5 con el respaldo de otro peón, manteniendo solidez." },
        { san: "d4", razon: "Las blancas toman el centro completo con sus dos peones." },
        { san: "d5", razon: "Desafías de inmediato el centro blanco atacando su peón de e4." },
        { san: "Nc3", razon: "Las blancas defienden e4 desarrollando un caballo.", nota: "Variante Clásica" },
        { san: "dxe4", razon: "Capturas en el centro para abrir líneas y evitar que ganen más espacio." },
        { san: "Nxe4", razon: "Las blancas recapturan centralizando su caballo." },
        { san: "Bf5", razon: "Sacas tu alfil fuera de la cadena de peones antes de jugar e6 y atacas el caballo." },
        { san: "Ng3", razon: "Las blancas retiran el caballo atacado y atacan tu alfil de f5." },
        { san: "Bg6", razon: "Retiras el alfil sin abandonar su diagonal activa." },
        { san: "h4", razon: "Las blancas amenazan h5 para atrapar tu alfil." },
        { san: "h6", razon: "Creas la casilla h7 para que tu alfil pueda retirarse ante h5." },
        { san: "Nf3", razon: "Las blancas desarrollan su caballo y controlan e5." },
        { san: "Nd7", razon: "Desarrollas el caballo, vigilas e5 y preparas Cgf6." }
      ]
    },
    {
      id: "avance",
      nombre: "Variante del Avance (3. e5)",
      jugadas: [
        { san: "e4", razon: "Las blancas ocupan el centro y abren líneas para su dama y alfil." },
        { san: "c6", razon: "Prepara el golpe central d5 con el respaldo de otro peón, manteniendo solidez." },
        { san: "d4", razon: "Las blancas toman el centro completo con sus dos peones." },
        { san: "d5", razon: "Desafías de inmediato el centro blanco atacando su peón de e4." },
        { san: "e5", razon: "Las blancas ganan espacio y cierran el centro.", nota: "Variante del Avance" },
        { san: "Bf5", razon: "Desarrollas tu alfil de casillas claras fuera de la cadena antes de cerrar con e6." },
        { san: "Nf3", razon: "Las blancas desarrollan su caballo de rey controlando el centro." },
        { san: "e6", razon: "Sostienes el centro y abres paso a tu alfil oscuro y dama." },
        { san: "Be2", razon: "Las blancas preparan su enroque corto." },
        { san: "c5", razon: "Golpeas la base de la cadena de peones blanca en d4 para generar contrajuego." }
      ]
    },
    {
      id: "cambio",
      nombre: "Variante del Cambio (3. exd5 ... 4. Ad3)",
      jugadas: [
        { san: "e4", razon: "Las blancas ocupan el centro y abren líneas para su dama y alfil." },
        { san: "c6", razon: "Prepara el golpe central d5 con el respaldo de otro peón, manteniendo solidez." },
        { san: "d4", razon: "Las blancas toman el centro completo con sus dos peones." },
        { san: "d5", razon: "Desafías de inmediato el centro blanco atacando su peón de e4." },
        { san: "exd5", razon: "Las blancas simplifican la tensión central.", nota: "Variante del Cambio" },
        { san: "cxd5", razon: "Recapturas manteniendo un peón central fuerte y abriendo la columna c." },
        { san: "Bd3", razon: "Las blancas desarrollan su alfil apuntando al flanco de rey.", nota: "Cambio" },
        { san: "Nc6", razon: "Desarrollas tu caballo presionando directamente sobre el peón de d4." },
        { san: "c3", razon: "Las blancas refuerzan su peón central de d4." },
        { san: "Nf6", razon: "Desarrollas tu segundo caballo controlando e4 y preparando el desarrollo del alfil." }
      ]
    },
    {
      id: "panov",
      nombre: "Ataque Panov (3. exd5 ... 4. c4)",
      jugadas: [
        { san: "e4", razon: "Las blancas ocupan el centro y abren líneas para su dama y alfil." },
        { san: "c6", razon: "Prepara el golpe central d5 con el respaldo de otro peón, manteniendo solidez." },
        { san: "d4", razon: "Las blancas toman el centro completo con sus dos peones." },
        { san: "d5", razon: "Desafías de inmediato el centro blanco atacando su peón de e4." },
        { san: "exd5", razon: "Las blancas simplifican la tensión central.", nota: "Variante del Cambio" },
        { san: "cxd5", razon: "Recapturas manteniendo un peón central fuerte y abriendo la columna c." },
        { san: "c4", razon: "Las blancas atacan tu centro de inmediato buscando actividad de piezas.", nota: "Ataque Panov" },
        { san: "Nf6", razon: "Desarrollas un caballo defendiendo el punto clave d5." },
        { san: "Nc3", razon: "Las blancas añaden más presión sobre tu peón de d5." },
        { san: "e6", razon: "Refuerzas d5 con solidez y liberas tu alfil oscuro para enrocar." }
      ]
    }
  ]
};
