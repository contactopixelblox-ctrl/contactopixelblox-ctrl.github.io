window.EA = window.EA || { aperturas: {} };

// Curso "Italiana desde cero". Cada paso parte de "tras" (jugadas desde el inicio) o de "fen".
// Paso sin "correctas": explicación. Con "correctas": pregunta que se responde moviendo.
// flechas: [desde, hasta, color]; marcas: casillas resaltadas. Colores: verde (por defecto), azul, rojo.
(function () {
  const CENTRO = ["d4", "e4", "d5", "e5"];
  const INICIO_ITALIANA = ["e4", "e5", "Nf3", "Nc6", "Bc4", "Bc5"];
  const borde = "Un peón del borde casi no toca el centro y no abre camino a tus piezas importantes.";
  const debilitaF = "Mover el peón f tan pronto abre una diagonal hacia tu rey. Por ahora no lo toques.";

  window.EA.curso = {
    nombre: "Italiana desde cero",
    lecciones: [
      {
        id: "l1",
        titulo: "¿Qué buscas en la apertura?",
        resumen: "Centro, desarrollo y rey seguro.",
        pasos: [
          { titulo: "No se trata de memorizar",
            texto: "En la apertura casi nunca ganas de golpe. Preparas tus piezas para la pelea. Tienes 3 metas: 1) controlar el centro, 2) desarrollar tus piezas y 3) poner a salvo a tu rey." },
          { titulo: "Meta 1: el centro", marcas: CENTRO,
            texto: "Estas 4 casillas (d4, e4, d5, e5) son el centro. Controlar una casilla significa que tus piezas la atacan o la vigilan." },
          { titulo: "¿Por qué importa el centro?", fen: "4k3/8/8/8/3N4/8/8/N3K3 w - - 0 1",
            flechas: [["a1","b3","rojo"],["a1","c2","rojo"],["d4","b3"],["d4","b5"],["d4","c2"],["d4","c6"],["d4","e2"],["d4","e6"],["d4","f3"],["d4","f5"]],
            texto: "Compara los dos caballos. En la esquina solo llega a 2 casillas. En el centro llega a 8. Desde el centro tus piezas hacen más y llegan antes a cualquier lado." },
          { titulo: "Tu turno: ocupa el centro",
            texto: "Avanza un peón dos casillas para que quede en el centro.",
            pista: ["e2","e4"],
            correctas: {
              e4: "¡Bien! Tu peón ocupa e4 y vigila d5 y f5. Con esta jugada empieza la Italiana.",
              d4: "¡Bien! d4 también ocupa el centro. En este curso usarás e4, porque así empieza la Italiana."
            },
            errores: {
              e3: "Va hacia el centro, pero se queda corto. Puede ir dos casillas y además e3 estorba a tu alfil de c1.",
              d3: "Va hacia el centro, pero se queda corto. Avanza dos casillas.",
              a3: borde, a4: borde, h3: borde, h4: borde, f3: debilitaF, f4: debilitaF,
              Nf3: "Es una buena jugada, pero ahora te pido ocupar el centro con un peón.",
              Nc3: "Es una jugada útil, pero ahora te pido ocupar el centro con un peón."
            },
            otro: "Ese peón no queda en el centro. Mira los peones de delante de tu rey y de tu dama." },
          { titulo: "Meta 2: desarrollar", tras: ["e4","e5"],
            flechas: [["g1","f3"],["b1","c3"],["f1","c4"]],
            texto: "Desarrollar es sacar caballos y alfiles de su casilla inicial hacia casillas activas. Regla de principiante: no muevas dos veces la misma pieza sin una razón y no saques la dama demasiado pronto." },
          { titulo: "Tu turno: saca un caballo", tras: ["e4","e5"],
            texto: "Desarrolla un caballo hacia el centro.",
            pista: ["g1","f3"],
            correctas: {
              Nf3: "¡Excelente! El caballo mira al centro y además ataca el peón de e5.",
              Nc3: "Bien: desarrolla y vigila el centro. En la Italiana sale primero el otro caballo, porque Cf3 además ataca e5."
            },
            errores: {
              Nh3: "En el borde el caballo controla menos casillas y se aleja del centro.",
              Na3: "En el borde el caballo controla menos casillas y se aleja del centro.",
              Ne2: "El caballo sale, pero tapa a tu dama y a tu alfil de f1.",
              Qh5: "Eso es la dama, no un caballo. Si sale pronto, el rival la persigue mientras desarrolla sus piezas.",
              Qf3: "Eso es la dama. Además le quita a tu caballo su mejor casilla: f3.",
              Qg4: "Eso es la dama. Tan pronto, el rival la puede atacar y ganar tiempo.",
              Bc4: "Buen desarrollo, y lo verás pronto. Ahora te pido sacar un caballo."
            },
            otro: "Esa jugada no saca un caballo. Los tienes en b1 y g1." },
          { titulo: "Meta 3: el rey seguro", tras: INICIO_ITALIANA,
            flechas: [["e1","g1","azul"],["h1","f1","azul"]], marcas: ["e1","g1"],
            texto: "Cuando el centro se abre, un rey que sigue en medio recibe ataques. El enroque lo lleva hacia un lado y acerca una torre al centro. Solo se puede si el rey y esa torre no se han movido, no hay piezas entre ellos, no estás en jaque y el rey no pasa ni termina en una casilla atacada." },
          { titulo: "Tu turno: protege a tu rey", tras: INICIO_ITALIANA,
            texto: "Haz el enroque corto. Mueve el rey dos casillas hacia la torre.",
            pista: ["e1","g1"],
            correctas: { "O-O": "¡Perfecto! El rey queda protegido tras sus peones y la torre pasa a f1." },
            errores: {
              Kf1: "Si mueves el rey así, pierdes el derecho a enrocar y encierras la torre de h1.",
              Ke2: "El rey sigue en el centro, tapa a tu dama y ya no podrás enrocar.",
              Rf1: "Si mueves esa torre, ya no podrás enrocar de ese lado. Mueve el REY dos casillas.",
              Rg1: "Si mueves esa torre, ya no podrás enrocar de ese lado. Mueve el REY dos casillas."
            },
            otro: "Esa jugada puede servir en otro momento, pero tu rey sigue en el centro. Mueve el rey dos casillas a la derecha." },
          { titulo: "Tu brújula", tras: INICIO_ITALIANA.concat("O-O"), marcas: CENTRO,
            texto: "Cuando no sepas qué jugar, pregúntate: ¿mi jugada ayuda al centro?, ¿desarrolla una pieza?, ¿cuida a mi rey? Y antes de soltar la pieza: ¿me la pueden comer gratis?" }
        ]
      },
      {
        id: "l2",
        titulo: "Las 3 primeras jugadas",
        resumen: "1.e4, 2.Cf3 y 3.Ac4, con su porqué.",
        pasos: [
          { titulo: "Primera jugada",
            texto: "Juegas con blancas. ¿Qué peón ocupa el centro y abre camino a tu alfil de f1 y a tu dama? Muévelo.",
            pista: ["e2","e4"],
            correctas: { e4: "¡Correcto! 1.e4." },
            errores: {
              d4: "Es una gran jugada, pero lleva a otras aperturas y no abre camino al alfil de f1.",
              e3: "Abre al alfil de f1, pero el peón no llega al centro y además estorba al alfil de c1.",
              d3: "No ocupa el centro con fuerza y no abre camino al alfil de f1.",
              Nf3: "Buena jugada, pero en la Italiana primero va el peón.",
              f3: debilitaF, f4: debilitaF, a4: borde, h4: borde, a3: borde, h3: borde
            },
            otro: "Busca el peón que está delante de tu rey." },
          { titulo: "¿Por qué 1.e4?", tras: ["e4"], marcas: ["d5","f5"],
            flechas: [["e4","d5"],["e4","f5"],["f1","b5","azul"],["d1","h5","azul"]],
            texto: "Tres razones: ocupa el centro, vigila d5 y f5 (flechas verdes) y abre caminos a tu alfil y a tu dama (flechas azules). Abrir camino a la dama no obliga a sacarla ya." },
          { titulo: "El rival responde 1...e5", tras: ["e4","e5"], marcas: ["e5"],
            flechas: [["e7","e5","azul"]],
            texto: "El rival hace lo mismo: toma su parte del centro. Su peón de e5 todavía no tiene ningún defensor." },
          { titulo: "Segunda jugada", tras: ["e4","e5"],
            texto: "Desarrolla una pieza y, a la vez, ataca el peón de e5.",
            pista: ["g1","f3"],
            correctas: { Nf3: "¡Correcto! 2.Cf3 desarrolla y amenaza el peón." },
            errores: {
              Nc3: "Desarrolla, pero no ataca e5. El rival juega con libertad.",
              Bc4: "Se puede jugar, pero no ataca e5. Primero el caballo: obliga al rival a responder.",
              Qh5: "Ataca e5, pero saca la dama muy pronto. Luego el rival la persigue y gana tiempo para desarrollarse.",
              Qf3: "No ataca e5 y le quita al caballo su mejor casilla.",
              d4: "Ataca e5 y se juega, pero es otro plan. Aquí busca desarrollar una pieza.",
              f4: "Es el Gambito de Rey: ataca e5, pero expone a tu rey y no desarrolla.",
              d3: "Es sólido, pero no ataca nada ni saca una pieza.",
              Ne2: "No ataca e5 y tapa a tu alfil y a tu dama."
            },
            otro: "Busca una pieza que salga de su casilla y desde allí apunte a e5." },
          { titulo: "¿Por qué 2.Cf3?", tras: ["e4","e5","Nf3"], marcas: ["f1","g1"],
            flechas: [["f3","e5","rojo"],["f3","d4"]],
            texto: "Ataca e5 (flecha roja), vigila d4 y deja libre g1, un paso hacia el enroque. Como amenaza algo, el rival tiene que atenderlo." },
          { titulo: "El rival defiende: 2...Cc6", tras: ["e4","e5","Nf3","Nc6"],
            flechas: [["c6","e5","azul"],["f3","e5","rojo"]],
            texto: "Su caballo defiende e5. Si comes con 3.Cxe5??, él responde 3...Cxe5: ganas un peón (1 punto) y pierdes un caballo (3 puntos). Antes de capturar, cuenta quién defiende." },
          { titulo: "Tercera jugada", tras: ["e4","e5","Nf3","Nc6"],
            texto: "Saca tu alfil de f1 a una casilla desde donde apunte al punto débil del rival.",
            pista: ["f1","c4"],
            correctas: { Bc4: "¡Correcto! 3.Ac4: ya estás en la Apertura Italiana." },
            errores: {
              Nxe5: { texto: "Error grave: el caballo de c6 te lo come. Cambias un caballo (3) por un peón (1).", flechas: [["c6","e5","rojo"]] },
              Ba6: { texto: "Regalas el alfil: el peón de b7 lo captura.", flechas: [["b7","a6","rojo"]] },
              Bb5: "Muy buena jugada, pero es la Apertura Española. En la Italiana el alfil va a otra casilla.",
              Bd3: "El alfil tapa a tu peón de d2, y eso deja encerrado a tu alfil de c1.",
              Be2: "No es un error grave, pero es pasivo: desde ahí presiona poco.",
              Nc3: "Buen desarrollo, pero ahora le toca al alfil de f1.",
              d4: "Es la Apertura Escocesa: se juega, pero no es la Italiana."
            },
            otro: "Mueve el alfil de f1 por su diagonal. Busca la casilla que mira hacia f7." },
          { titulo: "¿Por qué 3.Ac4?", tras: ["e4","e5","Nf3","Nc6","Bc4"], marcas: ["f7"],
            flechas: [["c4","f7","rojo"],["e1","g1","azul"]],
            texto: "El alfil sale activo, vigila d5 y apunta a f7, que al inicio solo defiende el rey. Además f1 y g1 quedaron libres: ya puedes enrocar cuando te toque. Ojo: apuntar no es atacar ya. No entregues el alfil en f7 sin un motivo claro." },
          { titulo: "Repaso: jugada 1",
            texto: "Ahora sin ayudas. Haz tu primera jugada.", pista: ["e2","e4"],
            correctas: { e4: "Bien. Ocupas el centro y abres caminos." },
            otro: "Recuerda: primero un peón al centro que abra paso al alfil de f1." },
          { titulo: "Repaso: jugada 2", tras: ["e4","e5"],
            texto: "El rival jugó 1...e5. ¿Qué haces?", pista: ["g1","f3"],
            correctas: { Nf3: "Bien. Desarrollas y atacas e5." },
            otro: "Recuerda: saca una pieza que ataque e5, sin usar la dama." },
          { titulo: "Repaso: jugada 3", tras: ["e4","e5","Nf3","Nc6"],
            texto: "El rival jugó 2...Cc6. Completa la Italiana.", pista: ["f1","c4"],
            correctas: { Bc4: "¡Italiana completa! Alfil activo, mirando a f7." },
            errores: { Nxe5: { texto: "e5 está defendido: perderías el caballo.", flechas: [["c6","e5","rojo"]] } },
            otro: "Recuerda: el alfil de f1 va a la diagonal que apunta a f7." },
          { titulo: "Lo que debes llevarte", tras: ["e4","e5","Nf3","Nc6","Bc4"], marcas: ["e4","f3","c4"],
            texto: "e4 toma el centro. Cf3 desarrolla y amenaza. Ac4 activa el alfil y prepara el enroque. El rival no siempre responderá igual: antes de repetir una jugada, revisa qué amenaza él." }
        ]
      }
    ]
  };
})();
