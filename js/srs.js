// Repaso espaciado. Una tarjeta es una posición de una lección completada.
// Sirve en el navegador y en Node. Se guarda en el teléfono (ea_repaso).
(function (global) {
  const INTERVALOS = [1, 3, 7, 14, 30];   // días

  const dos = n => String(n).padStart(2, "0");
  const fecha = d => `${d.getFullYear()}-${dos(d.getMonth() + 1)}-${dos(d.getDate())}`;
  const hoy = () => fecha(new Date());
  function sumar(dia, n) {
    const [a, m, d] = dia.split("-").map(Number);
    return fecha(new Date(a, m - 1, d + n));
  }

  // Si dos pasos usan la misma posición, manda el más nuevo. Las respuestas que solo
  // aceptaba el anterior quedan como "alternativas": son buenas y no cuentan como fallo.
  function tarjetas(curso, hechas, Chess) {
    const mapa = new Map();
    curso.lecciones.filter(l => hechas[l.id]).forEach(l => l.pasos.forEach(p => {
      if (!p.correctas) return;
      const game = p.fen ? new Chess(p.fen) : new Chess();
      (p.tras || []).forEach(san => game.move(san));
      const clave = game.fen().split(" ").slice(0, 4).join(" ");
      const antes = mapa.get(clave);
      const conocidas = antes ? [...antes.alternativas, ...Object.keys(antes.paso.correctas)] : [];
      mapa.set(clave, {
        clave, paso: p,
        alternativas: [...new Set(conocidas)].filter(s => !p.correctas[s]),
        firma: Object.keys(p.correctas).sort().join(",")
      });
    }));
    return [...mapa.values()];
  }

  // Una tarjeta nueva, o cuya respuesta cambió, está pendiente ya
  const vigente = (t, estado) => estado[t.clave] && estado[t.clave].firma === t.firma ? estado[t.clave] : null;
  const pendientes = (lista, estado, dia) => lista.filter(t => !vigente(t, estado) || vigente(t, estado).vence <= dia);
  const proxima = (lista, estado) => lista.map(t => vigente(t, estado)?.vence).filter(Boolean).sort()[0] || null;

  // Acierto limpio: sube un intervalo. Fallo o pista: vuelve mañana.
  function calificar(t, estado, limpio, dia) {
    const antes = vigente(t, estado);
    const caja = limpio ? Math.min(antes ? antes.caja + 1 : 0, INTERVALOS.length - 1) : 0;
    estado[t.clave] = { caja, vence: sumar(dia, INTERVALOS[caja]), firma: t.firma };
    return estado[t.clave];
  }

  const api = { INTERVALOS, hoy, sumar, tarjetas, pendientes, proxima, calificar };
  if (typeof module !== "undefined") module.exports = api;
  else (global.EA = global.EA || { aperturas: {} }).srs = api;
})(typeof window !== "undefined" ? window : globalThis);
