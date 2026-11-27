// Motor propio y pequeño (alfa-beta). Solo ELIGE jugadas; chess.js las valida y las aplica.
// Tablero 0x88: casilla = fila * 16 + columna (fila 0 = octava).
(function (global) {
  const VALOR = { p: 100, n: 320, b: 330, r: 500, q: 900, k: 0 };
  const SALTOS = [-33, -31, -18, -14, 14, 18, 31, 33];
  const DIAG = [-17, -15, 15, 17], RECTAS = [-16, -1, 1, 16], TODAS = DIAG.concat(RECTAS);
  const MATE = 100000;
  // Derechos de enroque que se pierden al mover desde o capturar en una casilla
  const ENROQUE = { 116: 3, 119: 1, 112: 2, 4: 12, 7: 4, 0: 8 }; // 1 K, 2 Q, 4 k, 8 q
  const nombre = s => "abcdefgh"[s & 15] + (8 - (s >> 4));
  const colorDe = p => p === p.toUpperCase() ? "w" : "b";
  const otro = c => c === "w" ? "b" : "w";

  function leerFen(fen) {
    const [piezas, turno, enroques, paso] = fen.split(" ");
    const b = new Array(128).fill(null);
    piezas.split("/").forEach((fila, r) => {
      let c = 0;
      for (const ch of fila) { if (ch >= "1" && ch <= "8") c += +ch; else b[r * 16 + c++] = ch; }
    });
    let derechos = 0;
    [..."KQkq"].forEach((l, i) => { if (enroques.includes(l)) derechos |= 1 << i; });
    const ep = paso === "-" ? -1 : (8 - +paso[1]) * 16 + "abcdefgh".indexOf(paso[0]);
    return { b, turno, derechos, ep };
  }

  function atacada(b, s, por) {
    const es = (t, tipo) => !(t & 0x88) && b[t] && b[t] === (por === "w" ? tipo.toUpperCase() : tipo);
    const dp = por === "w" ? [15, 17] : [-15, -17];
    if (es(s + dp[0], "p") || es(s + dp[1], "p")) return true;
    for (const d of SALTOS) if (es(s + d, "n")) return true;
    for (const d of TODAS) if (es(s + d, "k")) return true;
    for (const d of TODAS) {
      for (let t = s + d; !(t & 0x88); t += d) {
        if (!b[t]) continue;
        if (es(t, "q") || es(t, DIAG.includes(d) ? "b" : "r")) return true;
        break;
      }
    }
    return false;
  }

  const rey = (b, c) => b.indexOf(c === "w" ? "K" : "k");
  const enJaque = pos => atacada(pos.b, rey(pos.b, pos.turno), otro(pos.turno));

  function pseudo(pos) {
    const { b, turno, ep } = pos, lista = [];
    const add = (de, a, extra) => lista.push(Object.assign({ de, a, cap: b[a], promo: null, flag: null }, extra));
    for (let s = 0; s < 120; s++) {
      if (s & 0x88) { s += 7; continue; }
      const p = b[s];
      if (!p || colorDe(p) !== turno) continue;
      const tipo = p.toLowerCase();
      if (tipo === "p") {
        const dir = turno === "w" ? -16 : 16;
        const inicio = turno === "w" ? 6 : 1, ultima = turno === "w" ? 0 : 7;
        const peon = (a, extra) => {
          if ((a >> 4) === ultima) for (const pr of "qrbn") add(s, a, Object.assign({ promo: pr }, extra));
          else add(s, a, extra);
        };
        if (!b[s + dir]) {
          peon(s + dir);
          if ((s >> 4) === inicio && !b[s + 2 * dir]) add(s, s + 2 * dir, { flag: "doble" });
        }
        for (const d of [dir - 1, dir + 1]) {
          const a = s + d;
          if (a & 0x88) continue;
          if (b[a] && colorDe(b[a]) !== turno) peon(a);
          else if (a === ep) add(s, a, { flag: "paso", cap: turno === "w" ? "p" : "P" });
        }
        continue;
      }
      const desliza = tipo === "b" || tipo === "r" || tipo === "q";
      const dirs = tipo === "n" ? SALTOS : tipo === "b" ? DIAG : tipo === "r" ? RECTAS : TODAS;
      for (const d of dirs) {
        for (let a = s + d; !(a & 0x88); a += d) {
          if (!b[a]) add(s, a);
          else { if (colorDe(b[a]) !== turno) add(s, a); break; }
          if (!desliza) break;
        }
      }
      if (tipo === "k") {
        const base = turno === "w" ? 112 : 0, riv = otro(turno);
        const corto = turno === "w" ? 1 : 4, largo = turno === "w" ? 2 : 8;
        if (s !== base + 4 || atacada(b, s, riv)) continue;
        const torre = turno === "w" ? "R" : "r";
        if ((pos.derechos & corto) && b[base + 7] === torre && !b[base + 5] && !b[base + 6] &&
            !atacada(b, base + 5, riv)) add(s, base + 6, { flag: "corto" });
        if ((pos.derechos & largo) && b[base] === torre && !b[base + 1] && !b[base + 2] && !b[base + 3] &&
            !atacada(b, base + 3, riv)) add(s, base + 2, { flag: "largo" });
      }
    }
    return lista;
  }

  // Aplica una jugada y devuelve la posición nueva, o null si deja al rey en jaque
  function aplicar(pos, m) {
    const b = pos.b.slice(), turno = pos.turno;
    let p = b[m.de];
    b[m.de] = null;
    if (m.promo) p = turno === "w" ? m.promo.toUpperCase() : m.promo;
    b[m.a] = p;
    if (m.flag === "paso") b[m.a + (turno === "w" ? 16 : -16)] = null;
    if (m.flag === "corto") { b[m.a - 1] = b[m.a + 1]; b[m.a + 1] = null; }
    if (m.flag === "largo") { b[m.a + 1] = b[m.a - 2]; b[m.a - 2] = null; }
    if (atacada(b, rey(b, turno), otro(turno))) return null;
    return {
      b, turno: otro(turno),
      derechos: pos.derechos & ~(ENROQUE[m.de] || 0) & ~(ENROQUE[m.a] || 0),
      ep: m.flag === "doble" ? (m.de + m.a) / 2 : -1
    };
  }

  const legales = pos => pseudo(pos).filter(m => aplicar(pos, m));

  function perft(pos, n) {
    if (!n) return 1;
    let total = 0;
    for (const m of pseudo(pos)) { const h = aplicar(pos, m); if (h) total += perft(h, n - 1); }
    return total;
  }

  // Valoración: material + principios (centro, desarrollo, peones, enroque)
  function evaluar(pos) {
    const b = pos.b;
    let puntos = 0, material = 0;
    for (let s = 0; s < 120; s++) {
      if (s & 0x88) { s += 7; continue; }
      const p = b[s];
      if (p && !"pPkK".includes(p)) material += VALOR[p.toLowerCase()];
    }
    const final = material < 2600;
    for (let s = 0; s < 120; s++) {
      if (s & 0x88) { s += 7; continue; }
      const p = b[s];
      if (!p) continue;
      const c = colorDe(p), tipo = p.toLowerCase();
      const fila = c === "w" ? 7 - (s >> 4) : s >> 4;       // 0 = fila propia
      const col = s & 15;
      const centro = 6 - Math.abs(col - 3.5) - Math.abs((s >> 4) - 3.5); // 0..5
      let v = VALOR[tipo];
      if (tipo === "p") v += fila * 4 + (col === 3 || col === 4 ? fila * 6 : 0) + (final ? fila * 8 : 0);
      else if (tipo === "n") v += centro * 9 - (fila === 0 ? 20 : 0);
      else if (tipo === "b") v += centro * 5 - (fila === 0 ? 20 : 0);
      else if (tipo === "r") v += fila === 6 ? 20 : 0;
      else if (tipo === "q") v += centro * 2;
      else if (final) v += centro * 10;
      else v += fila === 0 ? ([1, 2, 6].includes(col) ? 45 : 0) : -25 * fila;
      puntos += c === "w" ? v : -v;
    }
    return pos.turno === "w" ? puntos : -puntos;
  }

  const orden = (pos, m) => (m.cap ? 10 * VALOR[m.cap.toLowerCase()] - VALOR[pos.b[m.de].toLowerCase()] / 10 + 1000 : 0) + (m.promo === "q" ? 900 : 0);
  const ordenar = (pos, lista) => lista.sort((x, y) => orden(pos, y) - orden(pos, x));
  const TIEMPO = {};

  function reloj(ctx) {
    if ((++ctx.nodos & 511) === 0 && Date.now() > ctx.limite) throw TIEMPO;
  }

  function capturas(pos, alfa, beta, ctx, nivel) {
    reloj(ctx);
    const base = evaluar(pos);
    if (base >= beta) return beta;
    if (base > alfa) alfa = base;
    if (nivel >= 6) return alfa;
    for (const m of ordenar(pos, pseudo(pos).filter(x => x.cap || x.promo))) {
      const h = aplicar(pos, m);
      if (!h) continue;
      const v = -capturas(h, -beta, -alfa, ctx, nivel + 1);
      if (v >= beta) return beta;
      if (v > alfa) alfa = v;
    }
    return alfa;
  }

  function buscar(pos, prof, alfa, beta, ply, ctx) {
    reloj(ctx);
    const jaque = enJaque(pos);
    if (prof <= 0 && !(jaque && ply < 8)) {
      return ctx.quieto ? capturas(pos, alfa, beta, ctx, 0) : evaluar(pos);
    }
    let hay = false;
    for (const m of ordenar(pos, pseudo(pos))) {
      const h = aplicar(pos, m);
      if (!h) continue;
      hay = true;
      const v = -buscar(h, prof - 1, -beta, -alfa, ply + 1, ctx);
      if (v >= beta) return beta;
      if (v > alfa) alfa = v;
    }
    if (!hay) return jaque ? -MATE + ply : 0;
    return alfa;
  }

  const NIVELES = {
    facil:   { prof: 1, quieto: false, margen: 90, azar: 0.2, ms: 400 },
    medio:   { prof: 2, quieto: true,  margen: 25, azar: 0,   ms: 900 },
    dificil: { prof: 6, quieto: true,  margen: 4,  azar: 0,   ms: 1300 }
  };

  // Devuelve { from, to, promotion } o null si no hay jugadas
  function elegir(fen, nivel) {
    const cfg = NIVELES[nivel] || NIVELES.medio;
    const pos = leerFen(fen);
    let raiz = ordenar(pos, legales(pos));
    if (!raiz.length) return null;
    const salida = m => ({ from: nombre(m.de), to: nombre(m.a), promotion: m.promo || undefined });
    const alAzar = l => l[Math.floor(Math.random() * l.length)];
    if (Math.random() < cfg.azar) return salida(alAzar(raiz));

    const ctx = { nodos: 0, limite: Date.now() + cfg.ms, quieto: cfg.quieto };
    let resultado = null;
    try {
      for (let prof = 1; prof <= cfg.prof; prof++) {
        const notas = [];
        let mejor = -Infinity;
        for (const m of raiz) {
          // Ventana que conserva puntuaciones exactas dentro del margen
          const piso = mejor === -Infinity ? -MATE * 2 : mejor - cfg.margen - 1;
          const v = -buscar(aplicar(pos, m), prof - 1, -MATE * 2, -piso, 1, ctx);
          notas.push({ m, v });
          if (v > mejor) mejor = v;
        }
        notas.sort((x, y) => y.v - x.v);
        resultado = notas;
        raiz = notas.map(n => n.m);
        if (mejor > MATE - 100) break;
      }
    } catch (e) {
      if (e !== TIEMPO) throw e;
    }
    if (!resultado) return salida(raiz[0]);
    const mejor = resultado[0].v;
    const margen = mejor > MATE - 100 ? 0 : cfg.margen;
    return salida(alAzar(resultado.filter(n => n.v >= mejor - margen)).m);
  }

  const api = { elegir, perft, leerFen, legales, nombre };
  if (typeof module !== "undefined") module.exports = api;
  else (global.EA = global.EA || { aperturas: {} }).motor = api;
})(typeof window !== "undefined" ? window : globalThis);
