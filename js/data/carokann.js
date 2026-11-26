window.EA = window.EA || { aperturas: {} };

// Defensa Caro-Kann (juegas con negras)
window.EA.aperturas.carokann = {
  name: "Defensa Caro-Kann",
  userColor: "b",
  variants: [
    { id: "clasica", name: "Variante Clásica (3. Cc3)", path: ["e4","c6","d4","d5","Nc3","dxe4","Nxe4","Bf5","Ng3","Bg6","h4","h6","Nf3","Nd7"] },
    { id: "avance", name: "Variante del Avance (3. e5)", path: ["e4","c6","d4","d5","e5","Bf5","Nf3","e6","Be2","c5"] },
    { id: "cambio", name: "Variante del Cambio (3. exd5 ... 4. Ad3)", path: ["e4","c6","d4","d5","exd5","cxd5","Bd3","Nc6","c3","Nf6"] },
    { id: "panov", name: "Ataque Panov (3. exd5 ... 4. c4)", path: ["e4","c6","d4","d5","exd5","cxd5","c4","Nf6","Nc3","e6"] }
  ],
  root: [
    {
      san: "e4", label: "1. e4",
      reason: "Las blancas ocupan el centro y abren líneas para su dama y alfil.",
      children: [
        {
          san: "c6", label: "1... c6",
          reason: "Prepara el golpe central d5 con el respaldo de otro peón, manteniendo solidez.",
          children: [
            {
              san: "d4", label: "2. d4",
              reason: "Las blancas toman el centro completo con sus dos peones.",
              children: [
                {
                  san: "d5", label: "2... d5",
                  reason: "Desafías de inmediato el centro blanco atacando su peón de e4.",
                  children: [
                    {
                      san: "Nc3", label: "3. Cc3 (Variante Clásica)",
                      reason: "Las blancas defienden e4 desarrollando un caballo.",
                      children: [
                        {
                          san: "dxe4", label: "3... dxe4",
                          reason: "Capturas en el centro para abrir líneas y evitar que ganen más espacio.",
                          children: [
                            {
                              san: "Nxe4", label: "4. Cxe4",
                              reason: "Las blancas recapturan centralizando su caballo.",
                              children: [
                                {
                                  san: "Bf5", label: "4... Af5",
                                  reason: "Sacas tu alfil fuera de la cadena de peones antes de jugar e6 y atacas el caballo.",
                                  children: [{ san: "Ng3", label: "5. Cg3", reason: "Las blancas retiran el caballo atacado y atacan tu alfil de f5.", children: [{ san: "Bg6", label: "5... Ag6", reason: "Retiras el alfil sin abandonar su diagonal activa.", children: [{ san: "h4", label: "6. h4", reason: "Las blancas amenazan h5 para atrapar tu alfil.", children: [{ san: "h6", label: "6... h6", reason: "Creas la casilla h7 para que tu alfil pueda retirarse ante h5.", children: [{ san: "Nf3", label: "7. Cf3", reason: "Las blancas desarrollan su caballo y controlan e5.", children: [{ san: "Nd7", label: "7... Cd7", reason: "Desarrollas el caballo, vigilas e5 y preparas Cgf6.", children: [] }] }] }] }] }] }]
                                }
                              ]
                            }
                          ]
                        }
                      ]
                    },
                    {
                      san: "e5", label: "3. e5 (Variante del Avance)",
                      reason: "Las blancas ganan espacio y cierran el centro.",
                      children: [
                        {
                          san: "Bf5", label: "3... Af5",
                          reason: "Desarrollas tu alfil de casillas claras fuera de la cadena antes de cerrar con e6.",
                          children: [
                            {
                              san: "Nf3", label: "4. Cf3",
                              reason: "Las blancas desarrollan su caballo de rey controlando el centro.",
                              children: [
                                {
                                  san: "e6", label: "4... e6",
                                  reason: "Sostienes el centro y abres paso a tu alfil oscuro y dama.",
                                  children: [
                                    {
                                      san: "Be2", label: "5. Ae2",
                                      reason: "Las blancas preparan su enroque corto.",
                                      children: [
                                        {
                                          san: "c5", label: "5... c5",
                                          reason: "Golpeas la base de la cadena de peones blanca en d4 para generar contrajuego.",
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
                      san: "exd5", label: "3. exd5 (Variante del Cambio)",
                      reason: "Las blancas simplifican la tensión central.",
                      children: [
                        {
                          san: "cxd5", label: "3... cxd5",
                          reason: "Recapturas manteniendo un peón central fuerte y abriendo la columna c.",
                          children: [
                            {
                              san: "Bd3", label: "4. Ad3 (Cambio)",
                              reason: "Las blancas desarrollan su alfil apuntando al flanco de rey.",
                              children: [
                                {
                                  san: "Nc6", label: "4... Cc6",
                                  reason: "Desarrollas tu caballo presionando directamente sobre el peón de d4.",
                                  children: [
                                    {
                                      san: "c3", label: "5. c3",
                                      reason: "Las blancas refuerzan su peón central de d4.",
                                      children: [
                                        {
                                          san: "Nf6", label: "5... Cf6",
                                          reason: "Desarrollas tu segundo caballo controlando e4 y preparando el desarrollo del alfil.",
                                          children: []
                                        }
                                      ]
                                    }
                                  ]
                                }
                              ]
                            },
                            {
                              san: "c4", label: "4. c4 (Ataque Panov)",
                              reason: "Las blancas atacan tu centro de inmediato buscando actividad de piezas.",
                              children: [
                                {
                                  san: "Nf6", label: "4... Cf6",
                                  reason: "Desarrollas un caballo defendiendo el punto clave d5.",
                                  children: [
                                    {
                                      san: "Nc3", label: "5. Cc3",
                                      reason: "Las blancas añaden más presión sobre tu peón de d5.",
                                      children: [
                                        {
                                          san: "e6", label: "5... e6",
                                          reason: "Refuerzas d5 con solidez y liberas tu alfil oscuro para enrocar.",
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
};
