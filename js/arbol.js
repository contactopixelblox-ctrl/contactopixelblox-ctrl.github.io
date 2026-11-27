// Convierte la lista simple de variantes en el árbol que usa la app.
// Sirve en el navegador y en Node (tools/validar.js).
(function (global) {
  const LETRAS = { N: "C", B: "A", R: "T", Q: "D", K: "R" };
  const aEspanol = san => san.replace(/[NBRQK]/g, l => LETRAS[l]);

  function etiqueta(jugada, indice) {
    const numero = Math.floor(indice / 2) + 1;
    const puntos = indice % 2 ? "... " : ". ";
    return numero + puntos + aEspanol(jugada.san) + (jugada.nota ? ` (${jugada.nota})` : "");
  }

  function construirArbol(apertura) {
    const root = [];
    apertura.variantes.forEach(variante => {
      let nivel = root;
      variante.jugadas.forEach((jugada, i) => {
        let nodo = nivel.find(n => n.san === jugada.san);
        if (!nodo) {
          nodo = { san: jugada.san, label: etiqueta(jugada, i), reason: jugada.razon, children: [] };
          nivel.push(nodo);
        }
        nivel = nodo.children;
      });
    });
    return {
      name: apertura.nombre,
      userColor: apertura.color,
      desvios: apertura.desvios || [],
      variants: apertura.variantes.map(v => ({ id: v.id, name: v.nombre, path: v.jugadas.map(j => j.san) })),
      root
    };
  }

  const api = { construirArbol, etiqueta, aEspanol };
  if (typeof module !== "undefined") module.exports = api;
  else Object.assign(global.EA = global.EA || { aperturas: {} }, api);
})(typeof window !== "undefined" ? window : globalThis);
