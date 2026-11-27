// Curso por lecciones. Tiene su propio tablero y no toca el estado de app.js.
(function () {
  const $ = id => document.getElementById(id);
  const curso = window.EA.curso;
  const modal = $("courseModal"), tablero = $("lsBoard"), grid = $("lsGrid"), svg = $("lsArrows");
  const sonar = t => window.EA.sonido && window.EA.sonido.tocar(t);
  const COLORES = { verde: "#1f9d55", azul: "#2f6fe4", rojo: "#dc333b" };

  let leccion = null, indice = 0, game = null;
  let elegida = null, resuelto = false, pistas = 0, ultima = [], marcasPista = [];

  function leer() {
    try { return JSON.parse(localStorage.getItem("ea_curso")) || {}; } catch (e) { return {}; }
  }
  function completar(id) {
    const datos = leer();
    datos[id] = true;
    try { localStorage.setItem("ea_curso", JSON.stringify(datos)); } catch (e) {}
  }

  function verLista() {
    leccion = null;
    $("lsList").hidden = false;
    $("lsPlayer").hidden = true;
    $("lsTitle").textContent = curso.nombre;
    $("lsBack").hidden = true;
    const caja = $("lsList");
    caja.innerHTML = "";
    const hechas = leer();
    curso.lecciones.forEach((l, i) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "ls-item";
      b.innerHTML = '<span class="ls-num"></span><span><strong></strong><small></small></span>';
      b.querySelector(".ls-num").textContent = hechas[l.id] ? "✓" : i + 1;
      b.querySelector(".ls-num").classList.toggle("done", !!hechas[l.id]);
      b.querySelector("strong").textContent = l.titulo;
      b.querySelector("small").textContent = l.resumen;
      b.addEventListener("click", () => abrir(l));
      caja.appendChild(b);
    });
  }

  function abrir(l) {
    leccion = l;
    indice = 0;
    $("lsList").hidden = true;
    $("lsPlayer").hidden = false;
    $("lsBack").hidden = false;
    $("lsTitle").textContent = `Lección ${curso.lecciones.indexOf(l) + 1}`;
    mostrar();
  }

  const paso = () => leccion.pasos[indice];

  function mostrar() {
    const p = paso();
    game = p.fen ? new Chess(p.fen) : new Chess();
    (p.tras || []).forEach(san => game.move(san));
    elegida = null;
    resuelto = !p.correctas;
    pistas = 0;
    marcasPista = [];
    ultima = [];
    $("lsBar").style.width = `${((indice + 1) / leccion.pasos.length) * 100}%`;
    $("lsKind").textContent = `${p.correctas ? "Tu turno: mueve" : "Aprende"} · ${indice + 1} de ${leccion.pasos.length}`;
    $("lsStepTitle").textContent = p.titulo;
    $("lsText").textContent = p.texto;
    feedback("");
    $("lsCard").scrollTop = 0;
    pintar();
    flechas(p.flechas);
    botones();
  }

  function botones() {
    const p = paso(), final = indice === leccion.pasos.length - 1;
    $("lsPrev").disabled = indice === 0;
    $("lsHint").hidden = resuelto;
    $("lsNext").hidden = !resuelto;
    $("lsNext").textContent = final ? "Terminar ✓" : "Siguiente →";
    $("lsHint").textContent = pistas ? "Ver jugada" : "Pista";
    $("lsHint").disabled = pistas > 1 || !p.correctas;
  }

  function feedback(texto, tipo = "") {
    const el = $("lsFeedback");
    el.textContent = texto;
    el.hidden = !texto;
    el.className = "ls-feedback " + tipo;
  }

  function pintar() {
    const p = paso();
    grid.innerHTML = "";
    const movimientos = elegida ? game.moves({ square: elegida, verbose: true }) : [];
    [..."87654321"].forEach((fila, r) => [..."abcdefgh"].forEach((col, c) => {
      const n = col + fila;
      const el = document.createElement("div");
      el.className = "square " + ((col.charCodeAt(0) - 97 + Number(fila) - 1) % 2 ? "light" : "dark");
      el.dataset.square = n;
      if (c === 0) el.insertAdjacentHTML("beforeend", `<span class="coord-rank">${fila}</span>`);
      if (r === 7) el.insertAdjacentHTML("beforeend", `<span class="coord-file">${col}</span>`);
      const pieza = game.get(n);
      if (pieza) {
        const d = document.createElement("div");
        d.className = "piece";
        d.style.backgroundImage = `url("${window.EA.piezas[pieza.color + pieza.type.toUpperCase()]}")`;
        el.appendChild(d);
      }
      if (ultima.includes(n)) el.classList.add("last-move");
      if (elegida === n) el.classList.add("selected");
      // Tras responder se quitan las marcas de la pregunta
      if ((p.marcas || []).includes(n)) el.classList.add("ls-mark");
      if (marcasPista.includes(n)) el.classList.add("hint-move");
      const m = movimientos.find(x => x.to === n);
      if (m) el.classList.add(m.captured ? "legal-capture" : "legal-dot");
      grid.appendChild(el);
    }));
  }

  function flechas(lista = []) {
    const centro = n => [n.charCodeAt(0) - 97 + 0.5, 8 - Number(n[1]) + 0.5];
    svg.innerHTML = lista.map(([de, a, color]) => {
      const [x1, y1] = centro(de), [x2, y2] = centro(a);
      const largo = Math.hypot(x2 - x1, y2 - y1), ux = (x2 - x1) / largo, uy = (y2 - y1) / largo;
      const bx = x2 - ux * 0.42, by = y2 - uy * 0.42;
      const c = COLORES[color] || COLORES.verde;
      return `<g opacity="0.82"><line x1="${x1 + ux * 0.2}" y1="${y1 + uy * 0.2}" x2="${bx}" y2="${by}" stroke="${c}" stroke-width="0.17" stroke-linecap="round"/>` +
        `<polygon fill="${c}" points="${x2 - ux * 0.08},${y2 - uy * 0.08} ${bx - uy * 0.25},${by + ux * 0.25} ${bx + uy * 0.25},${by - ux * 0.25}"/></g>`;
    }).join("");
  }

  function intentar(de, a) {
    const p = paso();
    const prueba = new Chess(game.fen()).move({ from: de, to: a, promotion: "q" });
    elegida = null;
    if (!prueba) { pintar(); return; }
    const san = prueba.san.replace(/[+#]/g, "");
    if (p.correctas[san]) {
      game.move(prueba.san);
      resuelto = true;
      marcasPista = [];
      ultima = [de, a];
      pintar();
      flechas();
      feedback("✓ " + p.correctas[san], "ok");
      sonar("mover");
      botones();
    } else {
      // La pieza no se mueve: se explica el error y se puede volver a intentar
      const error = (p.errores || {})[san];
      const texto = typeof error === "string" ? error : error ? error.texto : p.otro;
      pintar();
      flechas(error && error.flechas);
      feedback(`✗ ${window.EA.aEspanol(san)}: ${texto} Inténtalo otra vez.`, "mal");
      sonar("error");
      const pieza = grid.querySelector(`[data-square="${de}"] .piece`);
      if (pieza) pieza.classList.add("shake-error");
      if (navigator.vibrate) { try { navigator.vibrate(60); } catch (e) {} }
    }
    // Deja visible la respuesta en pantallas pequeñas
    $("lsCard").scrollTop = $("lsCard").scrollHeight;
  }

  // Dos formas de mover: tocar pieza y destino, o arrastrar y soltar
  const casillaEn = e => {
    const el = document.elementFromPoint(e.clientX, e.clientY)?.closest(".square");
    return el && grid.contains(el) ? el.dataset.square : null;
  };
  let inicio = null;
  grid.addEventListener("pointerdown", e => {
    if (!e.isPrimary || resuelto) return;
    const n = casillaEn(e);
    if (!n) return;
    if (elegida && game.moves({ square: elegida, verbose: true }).some(m => m.to === n)) return intentar(elegida, n);
    const pieza = game.get(n);
    if (pieza && pieza.color === game.turn()) {
      elegida = elegida === n ? null : n;
      inicio = elegida;
    } else elegida = null;
    pintar();
    try { grid.setPointerCapture(e.pointerId); } catch (err) {}
  });
  grid.addEventListener("pointerup", e => {
    const de = inicio;
    inicio = null;
    const a = casillaEn(e);
    if (!resuelto && de && a && a !== de) intentar(de, a);
  });
  grid.addEventListener("pointercancel", () => { inicio = null; });

  $("lsHint").addEventListener("click", () => {
    const [de, a] = paso().pista;
    pistas++;
    marcasPista = pistas === 1 ? [de] : [de, a];
    elegida = null;
    pintar();
    flechas(pistas > 1 ? [[de, a]] : []);
    feedback(pistas === 1 ? "Pista: mueve la pieza marcada." : "Haz la jugada de la flecha.", "pista");
    botones();
  });
  $("lsNext").addEventListener("click", () => {
    if (indice < leccion.pasos.length - 1) { indice++; return mostrar(); }
    completar(leccion.id);
    sonar("exito");
    verLista();
  });
  $("lsPrev").addEventListener("click", () => { if (indice > 0) { indice--; mostrar(); } });
  $("lsBack").addEventListener("click", verLista);
  $("btnCourse").addEventListener("click", () => { verLista(); modal.classList.add("open"); });
  $("lsClose").addEventListener("click", () => modal.classList.remove("open"));
})();
