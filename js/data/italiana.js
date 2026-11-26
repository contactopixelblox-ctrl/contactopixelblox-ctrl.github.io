window.EA = window.EA || { aperturas: {} };

// Apertura Italiana (juegas con blancas)
window.EA.aperturas.italiana = {
  name: "Apertura Italiana",
  userColor: "w",
  variants: [
    { id: "giuoco", name: "Giuoco Pianissimo (3...Ac5)", path: ["e4","e5","Nf3","Nc6","Bc4","Bc5","c3","Nf6","d3","d6","O-O"] },
    { id: "twoknights", name: "Dos Caballos (3...Cf6)", path: ["e4","e5","Nf3","Nc6","Bc4","Nf6","d3","Be7","c3","O-O","O-O"] },
    { id: "hungarian", name: "Defensa Húngara (3...Ae7)", path: ["e4","e5","Nf3","Nc6","Bc4","Be7","d3","Nf6","c3","O-O","O-O"] }
  ],
  root: [
    {
      san: "e4", label: "1. e4",
      reason: "Controla el centro (d5 y f5) y abre paso a tu dama y alfil de casillas claras.",
      children: [
        {
          san: "e5", label: "1... e5",
          reason: "El rival ocupa el centro y frena el avance de tu peón.",
          children: [
            {
              san: "Nf3", label: "2. Cf3",
              reason: "Desarrolla el caballo hacia el centro y ataca de inmediato el peón de e5.",
              children: [
                {
                  san: "Nc6", label: "2... Cc6",
                  reason: "El rival desarrolla su caballo para defender su peón central de e5.",
                  children: [
                    {
                      san: "Bc4", label: "3. Ac4",
                      reason: "Desarrolla el alfil a una diagonal activa apuntando al punto débil f7.",
                      children: [
                        {
                          san: "Bc5", label: "3... Ac5 (Giuoco Pianissimo)",
                          reason: "El rival desarrolla su alfil apuntando también al centro y a f2.",
                          children: [
                            {
                              san: "c3", label: "4. c3",
                              reason: "Prepara el avance d4 para el centro.",
                              children: [
                                {
                                  san: "Nf6", label: "4... Cf6",
                                  reason: "El rival desarrolla su segundo caballo y ataca tu peón de e4.",
                                  children: [
                                    {
                                      san: "d3", label: "5. d3",
                                      reason: "Defiende con solidez tu peón de e4 y abre paso a tu alfil oscuro.",
                                      children: [
                                        {
                                          san: "d6", label: "5... d6",
                                          reason: "El rival refuerza su peón de e5 y libera su alfil de casillas claras.",
                                          children: [
                                            {
                                              san: "O-O", label: "6. O-O",
                                              reason: "Pone a tu rey a salvo en el flanco y conecta la torre hacia el centro.",
                                              children: []
                                            }
                                          ]
                                        }
                                      ]
                                    }
                                  ]
                                }
                              ]
                            }
                          ]
                        },
                        {
                          san: "Nf6", label: "3... Cf6 (Dos Caballos)",
                          reason: "El rival contraataca de inmediato tu peón central de e4.",
                          children: [
                            {
                              san: "d3", label: "4. d3",
                              reason: "Defiende con solidez el peón de e4 y abre la diagonal de tu alfil de c1.",
                              children: [
                                {
                                  san: "Be7", label: "4... Ae7",
                                  reason: "El rival desarrolla su alfil de forma sólida preparando el enroque.",
                                  children: [
                                    {
                                      san: "c3", label: "5. c3",
                                      reason: "Prepara el avance d4 para el centro.",
                                      children: [
                                        {
                                          san: "O-O", label: "5... O-O",
                                          reason: "El rival pone a salvo su rey antes de abrir el centro.",
                                          children: [
                                            {
                                              san: "O-O", label: "6. O-O",
                                              reason: "Enrocas y completas un desarrollo armonioso y seguro.",
                                              children: []
                                            }
                                          ]
                                        }
                                      ]
                                    }
                                  ]
                                }
                              ]
                            }
                          ]
                        },
                        {
                          san: "Be7", label: "3... Ae7 (Defensa Húngara)",
                          reason: "El rival elige una defensa pasiva y sólida evitando ataques rápidos sobre f7.",
                          children: [
                            {
                              san: "d3", label: "4. d3",
                              reason: "Sostiene el centro con e4 y libera el desarrollo de tu alfil de dama.",
                              children: [
                                {
                                  san: "Nf6", label: "4... Cf6",
                                  reason: "El rival desarrolla su caballo de rey atacando e4.",
                                  children: [
                                    {
                                      san: "c3", label: "5. c3",
                                      reason: "Prepara el avance d4 para el centro.",
                                      children: [
                                        {
                                          san: "O-O", label: "5... O-O",
                                          reason: "El rival enroca corto.",
                                          children: [
                                            {
                                              san: "O-O", label: "6. O-O",
                                              reason: "Aseguras tu rey antes de disputar el centro con d4.",
                                              children: []
                                            }
                                          ]
                                        }
                                      ]
                                    }
                                  ]
                                }
                              ]
                            }
                          ]
                        }
                      ]
                    }
                  ]
                }
              ]
            }
          ]
        }
      ]
    }
  ]
};
