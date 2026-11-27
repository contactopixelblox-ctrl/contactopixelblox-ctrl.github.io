// Lector de PGN: pega o abre una partida y revísala sobre el tablero.
(function () {
  // Separa el texto en partidas: { cabeceras, sans, error }
  function leer(texto) {
    const TROZOS = /\{[^}]*\}?|;[^\n]*|\[\s*(\w+)\s+"((?:\\.|[^"\\])*)"\s*\]|\(|\)|\$\d+|1-0|0-1|1\/2-1\/2|\*|\d+\s*\.+|\.+|[^\s(){};[\].]+/g;
    const partidas = [];
    let p = null, g = null, nivel = 0, cerrada = false;
    const nueva = () => {
      p = { cabeceras: {}, sans: [], error: null };
      partidas.push(p);
      g = null; nivel = 0; cerrada = false;
    };
    for (const m of String(texto).matchAll(TROZOS)) {
      const t = m[0];
      if (t[0] === "{" || t[0] === ";" || t[0] === "$" || t[0] === ".") continue;
      if (m[1]) {                                   // cabecera
        if (!p || p.sans.length || cerrada) nueva();
        p.cabeceras[m[1]] = m[2].replace(/\\(.)/g, "$1");
        continue;
      }
      if (t === "(") { nivel++; continue; }         // las variantes entre paréntesis se ignoran
      if (t === ")") { nivel = Math.max(0, nivel - 1); continue; }
      if (nivel) continue;
      if (/^(1-0|0-1|1\/2-1\/2|\*)$/.test(t)) { if (p) cerrada = true; continue; }
      if (/^\d+\s*\.+$/.test(t) || /^\d+$/.test(t) || /^[!?]+$/.test(t)) continue;
      if (!p || cerrada) nueva();
      if (p.error) continue;
      if (!g) {
        const fen = p.cabeceras.FEN, variante = p.cabeceras.Variant;
        if ((fen && fen.split(" ")[0] !== new Chess().fen().split(" ")[0]) ||
            (variante && !/^(standard|chess|from position)$/i.test(variante))) {
          p.error = "Solo se pueden analizar partidas normales desde la posición inicial.";
          continue;
        }
        g = new Chess();
      }
      const limpio = t.replace(/[!?]+$/, "").replace(/^0-0-0/, "O-O-O").replace(/^0-0/, "O-O");
      const jugada = g.move(limpio, { sloppy: true });
      if (jugada) p.sans.push(jugada.san);
      else {
        const n = Math.floor(p.sans.length / 2) + 1;
        p.error = `No se entiende la jugada «${t.slice(0, 12)}» (jugada ${n}).`;
      }
    }
    partidas.forEach(x => {
      if (!x.error && !x.sans.length) x.error = "No hay jugadas.";
      if (!x.error && x.sans.length > 400) x.error = "La partida es demasiado larga.";
    });
    return partidas;
  }

  window.EA.pgn = { leer };
  if (typeof document === "undefined") return;

  /* ---------- Ventana ---------- */
  const el = id => document.getElementById(id);
  const modal = el("pgnModal"), caja = el("pgnText"), aviso = el("pgnMsg"), lista = el("pgnGame");
  let partidas = [], color = null;

  const nombre = (c, lado) => c[lado] && c[lado] !== "?" ? c[lado] : lado === "White" ? "Blancas" : "Negras";
  const conElo = (c, lado) => nombre(c, lado) + (/^\d+$/.test(c[lado + "Elo"] || "") ? ` (${c[lado + "Elo"]})` : "");
  const usuarioGuardado = () => { try { return localStorage.getItem("ea_usuario"); } catch (e) { return null; } };

  function elegirColor(c) {
    color = c;
    el("pgnWhite").setAttribute("aria-pressed", c === "w");
    el("pgnBlack").setAttribute("aria-pressed", c === "b");
    el("btnPgnAnalyze").disabled = !c;
  }

  function mostrarPartida() {
    const p = partidas[Number(lista.value)];
    const c = p.cabeceras;
    el("pgnChoice").hidden = !!p.error;
    aviso.className = p.error ? "pgn-msg feedback-error" : "pgn-msg";
    aviso.textContent = p.error || `${conElo(c, "White")} contra ${conElo(c, "Black")} · ${c.Result || "sin resultado"} · ${Math.ceil(p.sans.length / 2)} jugadas`;
    el("pgnWhite").textContent = `Blancas: ${nombre(c, "White")}`;
    el("pgnBlack").textContent = `Negras: ${nombre(c, "Black")}`;
    // Recuerda con qué nombre juegas para marcar tu color solo
    const yo = usuarioGuardado();
    elegirColor(yo && c.White === yo ? "w" : yo && c.Black === yo ? "b" : null);
  }

  function limpiar() {
    partidas = [];
    lista.hidden = true;
    el("pgnChoice").hidden = true;
    aviso.textContent = "";
    elegirColor(null);
  }

  function procesar() {
    limpiar();
    partidas = leer(caja.value).slice(0, 200);
    if (!partidas.length) {
      aviso.className = "pgn-msg feedback-error";
      aviso.textContent = "No encontré ninguna partida. Pega el PGN completo.";
      return;
    }
    lista.innerHTML = "";
    partidas.forEach((p, i) => {
      const o = document.createElement("option");
      o.value = i;
      o.textContent = `${i + 1}. ${nombre(p.cabeceras, "White")} – ${nombre(p.cabeceras, "Black")} ${p.cabeceras.Date || ""}`;
      lista.appendChild(o);
    });
    lista.hidden = partidas.length < 2;
    lista.value = 0;
    mostrarPartida();
  }

  el("btnPgn").addEventListener("click", () => modal.classList.add("open"));
  el("btnPgnClose").addEventListener("click", () => modal.classList.remove("open"));
  caja.addEventListener("input", () => caja.value.trim() ? procesar() : limpiar());
  lista.addEventListener("change", mostrarPartida);
  el("pgnWhite").addEventListener("click", () => elegirColor("w"));
  el("pgnBlack").addEventListener("click", () => elegirColor("b"));

  el("btnPgnPaste").addEventListener("click", async () => {
    try {
      const texto = await navigator.clipboard.readText();
      if (!texto.trim()) throw new Error("vacío");
      caja.value = texto;
      procesar();
    } catch (e) {
      aviso.className = "pgn-msg feedback-warn";
      aviso.textContent = "No pude leer el portapapeles. Mantén pulsado el cuadro y elige «Pegar».";
      caja.focus();
    }
  });

  el("pgnFile").addEventListener("change", async e => {
    const archivo = e.target.files[0];
    e.target.value = "";
    if (!archivo) return;
    if (archivo.size > 1000000) {
      limpiar();
      aviso.className = "pgn-msg feedback-error";
      aviso.textContent = "El archivo pesa más de 1 MB. Exporta menos partidas.";
      return;
    }
    caja.value = await archivo.text();
    procesar();
  });

  el("btnPgnAnalyze").addEventListener("click", () => {
    const p = partidas[Number(lista.value)];
    const lado = color === "w" ? "White" : "Black";
    if (p.cabeceras[lado] && p.cabeceras[lado] !== "?") {
      try { localStorage.setItem("ea_usuario", p.cabeceras[lado]); } catch (e) {}
    }
    modal.classList.remove("open");
    window.EA.analisis.importar(p.sans, color);
  });
})();
