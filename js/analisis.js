// Análisis de partidas con Stockfish y repaso moviendo las piezas.
// Usa las funciones globales de app.js. Stockfish corre en un Web Worker aparte.
(function () {
  const MOTOR = "js/lib/stockfish/stockfish-19-lite-single.js";
  const LIMITE = "go depth 15 movetime 500";
  const VALOR = { p: 100, n: 300, b: 300, r: 500, q: 900, k: 10000 };
  const TIPOS = {
    libro:       { nombre: "De libro", icono: "📖" },
    brillante:   { nombre: "Brillante", icono: "‼" },
    mejor:       { nombre: "La mejor", icono: "★" },
    excelente:   { nombre: "Excelente", icono: "✓" },
    buena:       { nombre: "Buena", icono: "·" },
    imprecision: { nombre: "Imprecisión", icono: "?!" },
    error:       { nombre: "Error", icono: "?" },
    grave:       { nombre: "Error grave", icono: "??" }
  };
  const FALLOS = ["imprecision", "error", "grave"];
  const es = san => window.EA.aEspanol(san);

  const modal = $("analysisModal"), cuerpo = $("analysisBody");
  let worker = null;
  let tarea = 0;          // cambia al cancelar: descarta resultados viejos
  let informe = null;
  let repaso = null;

  /* ---------- Comunicación con Stockfish (protocolo UCI) ---------- */
  function cerrarMotor() {
    if (worker) worker.terminate();
    worker = null;
  }

  function esperar(comandos, fin, alLeer) {
    return new Promise((ok, mal) => {
      const reloj = setTimeout(() => mal(new Error("Stockfish no respondió")), 30000);
      worker.onerror = () => { clearTimeout(reloj); mal(new Error("No se pudo cargar Stockfish")); };
      worker.onmessage = e => {
        const linea = String(e.data);
        if (alLeer) alLeer(linea);
        if (linea.startsWith(fin)) { clearTimeout(reloj); ok(linea); }
      };
      comandos.forEach(c => worker.postMessage(c));
    });
  }

  async function iniciarMotor() {
    cerrarMotor();
    worker = new Worker(MOTOR);
    await esperar(["uci"], "uciok");
    await esperar(["ucinewgame", "isready"], "readyok");
  }

  // Puntuación desde el punto de vista de quien mueve
  async function evaluar(fen) {
    let nota = null;
    const fin = await esperar([`position fen ${fen}`, LIMITE], "bestmove", linea => {
      const m = linea.match(/ score (cp|mate) (-?\d+)/);
      if (m && !/(lowerbound|upperbound)/.test(linea)) nota = { tipo: m[1], valor: Number(m[2]) };
    });
    return { nota: nota || { tipo: "cp", valor: 0 }, mejor: fin.split(" ")[1] };
  }

  /* ---------- Clasificación ---------- */
  // Estimación de opciones de ganar (0 a 100) a partir de la puntuación
  function opciones(nota) {
    if (nota.tipo === "mate") return nota.valor > 0 ? 100 : 0;
    return 100 / (1 + Math.exp(-0.00368208 * nota.valor));
  }

  // Cuánto material puede ganar quien mueve capturando en una casilla
  function intercambio(g, casilla) {
    const capturas = g.moves({ verbose: true }).filter(m => m.to === casilla && m.captured);
    if (!capturas.length) return 0;
    capturas.sort((a, b) => VALOR[a.piece] - VALOR[b.piece]);
    const m = capturas[0];
    g.move(m);
    const ganancia = Math.max(0, VALOR[m.captured] - intercambio(g, casilla));
    g.undo();
    return ganancia;
  }

  function clasificar(d) {
    if (d.libro) return "libro";
    const perdida = d.esMejor || d.unica ? 0 : Math.max(0, d.antes - d.despues);
    if (perdida < 2 && !d.unica && d.sacrificio && d.despues >= 50 && d.antes <= 95) return "brillante";
    if (d.esMejor || d.unica) return "mejor";
    if (perdida < 2) return "excelente";
    if (perdida < 5) return "buena";
    if (perdida < 10) return "imprecision";
    if (perdida < 20) return "error";
    return "grave";
  }

  // "Libro" = coincide desde el inicio con una línea incluida en esta app
  function lineasDelLibro() {
    const set = new Set();
    Object.values(OPENING_TREES).forEach(o => o.variants.forEach(v =>
      v.path.forEach((_, i) => set.add(v.path.slice(0, i + 1).join(" ")))));
    return set;
  }

  const uciDe = m => m.from + m.to + (m.promotion || "");
  function sanDe(fen, uci) {
    if (!uci || uci === "(none)") return null;
    const m = new Chess(fen).move({ from: uci.slice(0, 2), to: uci.slice(2, 4), promotion: uci[4] });
    return m ? m.san : null;
  }

  async function analizar(sans, color, avance) {
    const id = tarea;
    const g = new Chess();
    const posiciones = [g.fen()], jugadas = [], estados = [null];
    sans.forEach(san => {
      jugadas.push(g.move(san));
      posiciones.push(g.fen());
      estados.push(g.in_checkmate() ? "mate" : g.in_draw() || g.in_threefold_repetition() ? "tablas" : null);
    });

    await iniciarMotor();
    const evals = [];
    for (let i = 0; i < posiciones.length; i++) {
      if (id !== tarea) return null;
      avance(i, posiciones.length);
      if (estados[i] === "mate") evals.push({ nota: { tipo: "mate", valor: 0 }, mejor: null });
      else if (estados[i] === "tablas") evals.push({ nota: { tipo: "cp", valor: 0 }, mejor: null });
      else evals.push(await evaluar(posiciones[i]));
    }
    if (id !== tarea) return null;
    cerrarMotor();

    const libro = lineasDelLibro();
    let enLibro = true;
    const lista = jugadas.map((m, i) => {
      enLibro = enLibro && libro.has(sans.slice(0, i + 1).join(" "));
      const antesPos = new Chess(posiciones[i]);
      const antes = opciones(evals[i].nota);
      const darMate = estados[i + 1] === "mate";
      const despues = darMate ? 100 : 100 - opciones(evals[i + 1].nota);
      const capturado = m.captured ? VALOR[m.captured] : 0;
      const sacrificio = "nbrq".includes(m.piece) &&
        intercambio(new Chess(posiciones[i + 1]), m.to) - capturado >= 200;
      const esMejor = darMate || uciDe(m) === evals[i].mejor;
      const tipo = clasificar({ libro: enLibro, esMejor, unica: antesPos.moves().length === 1, antes, despues, sacrificio });
      const nota = evals[i].nota;
      return {
        indice: i, color: m.color, san: m.san, tipo,
        fen: posiciones[i], mejorUci: evals[i].mejor,
        mejorSan: sanDe(posiciones[i], evals[i].mejor),
        respuestaSan: sanDe(posiciones[i + 1], evals[i + 1].mejor),
        mateEnMano: !enLibro && !esMejor && nota.tipo === "mate" && nota.valor > 0 ? nota.valor : 0
      };
    });
    return { sans, color, jugadas: lista };
  }

  /* ---------- Informe ---------- */
  const numero = j => `${Math.floor(j.indice / 2) + 1}${j.color === "w" ? "." : "..."}`;

  function crear(etiqueta, texto, clase) {
    const el = document.createElement(etiqueta);
    if (texto) el.textContent = texto;
    if (clase) el.className = clase;
    return el;
  }

  function consejo(fallos) {
    if (!fallos.length) return "Stockfish no marcó imprecisiones ni errores en tus jugadas en este análisis rápido.";
    const capturas = fallos.filter(j => j.respuestaSan && j.respuestaSan.includes("x")).length;
    const jaques = fallos.filter(j => j.respuestaSan && /[+#]/.test(j.respuestaSan)).length;
    const mates = fallos.filter(j => j.mateEnMano).length;
    const partes = [];
    if (capturas) partes.push(`en ${capturas} de tus fallos la mejor respuesta rival era una captura: revisa qué dejas atacado`);
    if (jaques) partes.push(`en ${jaques} había un jaque como respuesta: revisa los jaques del rival`);
    if (mates) partes.push(`dejaste pasar un mate ${mates} ${mates === 1 ? "vez" : "veces"}: busca primero tus jaques`);
    if (!partes.length) return "Repasa las posiciones de abajo y busca la mejor jugada antes de ver la solución.";
    const texto = partes.join("; ") + ".";
    return texto[0].toUpperCase() + texto.slice(1);
  }

  function filaFallo(j) {
    const caja = crear("div", null, `an-move an-${j.tipo}`);
    caja.append(crear("strong", `${numero(j)} ${es(j.san)} ${TIPOS[j.tipo].icono} ${TIPOS[j.tipo].nombre}`));
    caja.append(crear("p", `Stockfish proponía: ${j.mejorSan ? es(j.mejorSan) : "—"}.`));
    if (j.mateEnMano) caja.append(crear("p", `Tenías mate en ${j.mateEnMano}.`));
    if (j.respuestaSan) caja.append(crear("p", `Tras tu jugada, la mejor respuesta rival era ${es(j.respuestaSan)}.`));
    const boton = crear("button", "Practicar esta posición", "btn btn-secondary an-practice");
    boton.type = "button";
    boton.addEventListener("click", () => practicar(j));
    caja.append(boton);
    return caja;
  }

  function mostrarInforme() {
    cuerpo.innerHTML = "";
    const mias = informe.jugadas.filter(j => j.color === informe.color);
    const suyas = informe.jugadas.filter(j => j.color !== informe.color);

    const tabla = crear("table", null, "an-table");
    const cabecera = tabla.insertRow();
    ["Tipo", "Tú", "IA"].forEach(t => cabecera.append(crear("th", t)));
    Object.entries(TIPOS).forEach(([clave, t]) => {
      const fila = tabla.insertRow();
      fila.dataset.tipo = clave;
      fila.append(crear("td", `${t.icono} ${t.nombre}`),
        crear("td", String(mias.filter(j => j.tipo === clave).length)),
        crear("td", String(suyas.filter(j => j.tipo === clave).length)));
    });
    cuerpo.append(tabla);

    const orden = { grave: 0, error: 1, imprecision: 2 };
    const fallos = mias.filter(j => FALLOS.includes(j.tipo))
      .sort((a, b) => orden[a.tipo] - orden[b.tipo] || a.indice - b.indice);
    cuerpo.append(crear("h4", "Para mejorar"), crear("p", consejo(fallos), "an-tip"));
    fallos.forEach(j => cuerpo.append(filaFallo(j)));

    const todas = crear("details");
    todas.append(crear("summary", "Todas las jugadas"));
    informe.jugadas.forEach(j => todas.append(crear("p",
      `${numero(j)} ${es(j.san)} ${TIPOS[j.tipo].icono} ${TIPOS[j.tipo].nombre}${j.color === informe.color ? " (tú)" : ""}`)));
    cuerpo.append(todas);
    cuerpo.append(crear("p", "Análisis rápido con Stockfish 19 lite: las categorías son aproximadas y no coinciden necesariamente con Chess.com. «De libro» se refiere solo a las líneas de esta app. «Brillante» se estima cuando una de las mejores jugadas parece sacrificar material.", "an-note"));
    $("btnCloseAnalysis").textContent = "Cerrar";
    modal.classList.add("open");
  }

  /* ---------- Flujo ---------- */
  async function pedirAnalisis() {
    if (informe) return mostrarInforme();
    if (!game.game_over() && !confirm("¿Terminar esta partida y analizarla?")) return;

    // Detiene la IA: a partir de aquí la partida está terminada
    session++;
    timers.forEach(clearTimeout);
    timers.clear();
    clearSelection();
    renderBoard();
    isLocked = true;
    gameClosed = true;
    updateUndo();
    $("stepCounter").textContent = "Terminada";
    setCard("Partida terminada", "Toca «Analizar» para ver el informe.");

    const id = ++tarea;
    const sans = game.history();
    cuerpo.innerHTML = "";
    const estado = crear("p", "Cargando Stockfish…");
    const barra = crear("progress");
    barra.max = 100;
    barra.value = 0;
    cuerpo.append(estado, barra);
    $("btnCloseAnalysis").textContent = "Cancelar";
    modal.classList.add("open");

    try {
      if (location.protocol === "file:") throw new Error("El análisis solo funciona desde el enlace web, no abriendo el archivo");
      const resultado = await analizar(sans, userColor(), (i, n) => {
        estado.textContent = `Analizando posición ${i + 1} de ${n}…`;
        barra.value = Math.round((i / n) * 100);
      });
      if (!resultado || id !== tarea) return;
      informe = resultado;
      mostrarInforme();
    } catch (e) {
      if (id !== tarea) return;
      cerrarMotor();
      cuerpo.innerHTML = "";
      cuerpo.append(crear("p", `No se pudo analizar. ${e.message}. Cierra y vuelve a tocar «Analizar».`, "feedback-error"));
      $("btnCloseAnalysis").textContent = "Cerrar";
    }
  }

  function cargarHasta(n) {
    game.reset();
    informe.sans.slice(0, n).forEach(san => game.move(san));
    const h = game.history({ verbose: true }).pop();
    lastMove = h ? [h.from, h.to] : [];
    clearSelection();
    clearHint();
    renderBoard();
  }

  function practicar(j) {
    session++;
    timers.forEach(clearTimeout);
    timers.clear();
    modal.classList.remove("open");
    repaso = { jugada: j, fallos: 0, resuelta: false };
    cargarHasta(j.indice);
    isLocked = false;
    $("aiControls").style.display = "none";
    $("reviewControls").style.display = "grid";
    $("stepCounter").textContent = "Repaso";
    setCard(`Encuentra una jugada mejor que ${es(j.san)}`, "Mueve la pieza que creas correcta.");
  }

  // Devuelve true si estaba en repaso y ya se ocupó de la jugada
  function intento(from, to) {
    if (!repaso) return false;
    const j = repaso.jugada;
    if (from + to === (j.mejorUci || "").slice(0, 4)) {
      repaso.resuelta = true;
      clearHint();
      executeMove({ from, to, promotion: j.mejorUci[4] || "q" }, () => {
        isLocked = true;
        flashSquare(to);
        sound("exito");
        setCard(`✓ ${es(j.mejorSan)}`, "Es la jugada que proponía Stockfish.", "feedback-success");
      });
    } else {
      repaso.fallos++;
      if (repaso.fallos >= 2) hint = { from: j.mejorUci.slice(0, 2), to: null };
      shake(from);
      setCard("No es la jugada propuesta",
        repaso.fallos >= 2 ? "Pista: mira la pieza marcada." : "Puede haber otras jugadas aceptables. Busca la que proponía Stockfish.",
        "feedback-warn");
    }
    return true;
  }

  function verSolucion() {
    if (!repaso || repaso.resuelta) return;
    const j = repaso.jugada;
    hint = { from: j.mejorUci.slice(0, 2), to: j.mejorUci.slice(2, 4) };
    updateHighlights();
    setCard(`La propuesta es ${es(j.mejorSan)}`, "Ahora haz tú la jugada marcada.", "feedback-warn");
  }

  function volverAlFinal() {
    session++;
    timers.forEach(clearTimeout);
    timers.clear();
    repaso = null;
    cargarHasta(informe.sans.length);
    isLocked = true;
    $("reviewControls").style.display = "none";
    $("aiControls").style.display = "grid";
    $("stepCounter").textContent = "Terminada";
    setCard("Partida analizada", "Toca «Analizar» para volver al informe o empieza una partida nueva.");
    updateUndo();
  }

  function reiniciar() {
    tarea++;
    cerrarMotor();
    informe = null;
    repaso = null;
    modal.classList.remove("open");
    $("reviewControls").style.display = "none";
  }

  $("btnAnalyze").addEventListener("click", pedirAnalisis);
  $("btnShowSolution").addEventListener("click", verSolucion);
  $("btnBackReport").addEventListener("click", () => { volverAlFinal(); mostrarInforme(); });
  $("btnCloseAnalysis").addEventListener("click", () => {
    if (!informe) { tarea++; cerrarMotor(); }
    modal.classList.remove("open");
  });

  window.EA.analisis = { reiniciar, intento, clasificar, analizar };
})();
