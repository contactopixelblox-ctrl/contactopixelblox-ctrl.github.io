window.EA = window.EA || { aperturas: {} };

// Apertura Italiana (juegas con blancas)
// Para añadir una variante, agrega un objeto a "variantes" (ver README.md)
window.EA.aperturas.italiana = {
  nombre: "Apertura Italiana",
  color: "w",
  variantes: [
    {
      id: "giuoco",
      nombre: "Giuoco Pianissimo (3...Ac5)",
      jugadas: [
        { san: "e4", razon: "Controla el centro (d5 y f5) y abre paso a tu dama y alfil de casillas claras." },
        { san: "e5", razon: "El rival ocupa el centro y frena el avance de tu peón." },
        { san: "Nf3", razon: "Desarrolla el caballo hacia el centro y ataca de inmediato el peón de e5." },
        { san: "Nc6", razon: "El rival desarrolla su caballo para defender su peón central de e5." },
        { san: "Bc4", razon: "Desarrolla el alfil a una diagonal activa apuntando al punto débil f7." },
        { san: "Bc5", razon: "El rival desarrolla su alfil apuntando también al centro y a f2.", nota: "Giuoco Pianissimo" },
        { san: "c3", razon: "Prepara el avance d4 para el centro." },
        { san: "Nf6", razon: "El rival desarrolla su segundo caballo y ataca tu peón de e4." },
        { san: "d3", razon: "Defiende con solidez tu peón de e4 y abre paso a tu alfil oscuro." },
        { san: "d6", razon: "El rival refuerza su peón de e5 y libera su alfil de casillas claras." },
        { san: "O-O", razon: "Pone a tu rey a salvo en el flanco y conecta la torre hacia el centro." }
      ]
    },
    {
      id: "twoknights",
      nombre: "Dos Caballos (3...Cf6)",
      jugadas: [
        { san: "e4", razon: "Controla el centro (d5 y f5) y abre paso a tu dama y alfil de casillas claras." },
        { san: "e5", razon: "El rival ocupa el centro y frena el avance de tu peón." },
        { san: "Nf3", razon: "Desarrolla el caballo hacia el centro y ataca de inmediato el peón de e5." },
        { san: "Nc6", razon: "El rival desarrolla su caballo para defender su peón central de e5." },
        { san: "Bc4", razon: "Desarrolla el alfil a una diagonal activa apuntando al punto débil f7." },
        { san: "Nf6", razon: "El rival contraataca de inmediato tu peón central de e4.", nota: "Dos Caballos" },
        { san: "d3", razon: "Defiende con solidez el peón de e4 y abre la diagonal de tu alfil de c1." },
        { san: "Be7", razon: "El rival desarrolla su alfil de forma sólida preparando el enroque." },
        { san: "c3", razon: "Prepara el avance d4 para el centro." },
        { san: "O-O", razon: "El rival pone a salvo su rey antes de abrir el centro." },
        { san: "O-O", razon: "Enrocas y completas un desarrollo armonioso y seguro." }
      ]
    },
    {
      id: "hungarian",
      nombre: "Defensa Húngara (3...Ae7)",
      jugadas: [
        { san: "e4", razon: "Controla el centro (d5 y f5) y abre paso a tu dama y alfil de casillas claras." },
        { san: "e5", razon: "El rival ocupa el centro y frena el avance de tu peón." },
        { san: "Nf3", razon: "Desarrolla el caballo hacia el centro y ataca de inmediato el peón de e5." },
        { san: "Nc6", razon: "El rival desarrolla su caballo para defender su peón central de e5." },
        { san: "Bc4", razon: "Desarrolla el alfil a una diagonal activa apuntando al punto débil f7." },
        { san: "Be7", razon: "El rival elige una defensa pasiva y sólida evitando ataques rápidos sobre f7.", nota: "Defensa Húngara" },
        { san: "d3", razon: "Sostiene el centro con e4 y libera el desarrollo de tu alfil de dama." },
        { san: "Nf6", razon: "El rival desarrolla su caballo de rey atacando e4." },
        { san: "c3", razon: "Prepara el avance d4 para el centro." },
        { san: "O-O", razon: "El rival enroca corto." },
        { san: "O-O", razon: "Aseguras tu rey antes de disputar el centro con d4." }
      ]
    }
  ]
};
