// Análisis de partidas con Stockfish y repaso moviendo las piezas.
// Usa las funciones globales de app.js. Stockfish corre en un Web Worker aparte.
(function () {
  const MOTOR = "js/lib/stockfish/stockfish-19-lite-single.js";
  const LIMITE = "go depth 15 movetime 500";
  const VALOR = { p: 100, n: 300, b: 300, r: 500, q: 900, k: 10000 };
  const TIPOS = {
    libro:       { nombre: "De libro", icono: "▤" },
    brillante:   { nombre: "Brillante", icono: "!!" },
    genial:      { nombre: "Gran jugada", icono: "!" },
    mejor:       { nombre: "La mejor", icono: "★" },
    excelente:   { nombre: "Excelente", icono: "✓✓" },
    buena:       { nombre: "Buena", icono: "✓" },
    imprecision: { nombre: "Imprecisión", icono: "?!" },
    error:       { nombre: "Error", icono: "?" },
    grave:       { nombre: "Error grave", icono: "??" }
  };
  const FALLOS = ["imprecision", "error", "grave"];
  const DESTACADAS = ["brillante", "genial", "imprecision", "error", "grave"];
  const FRASE = {
    libro: "es de libro", brillante: "es brillante", genial: "es una gran jugada", mejor: "es la mejor",
    excelente: "es excelente", buena: "es buena", imprecision: "es una imprecisión",
    error: "es un error", grave: "es un error grave"
  };
  const es = san => window.EA.aEspanol(san);

  const modal = $("analysisModal"), cuerpo = $("analysisBody");
  let worker = null;
  let tarea = 0;          // cambia al cancelar: descarta resultados viejos
  let informe = null;
  let repaso = null;
  let importada = false;  // se está revisando una partida PGN

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
    await esperar(["setoption name MultiPV value 2", "ucinewgame", "isready"], "readyok");
  }

  // Puntuación desde el punto de vista de quien mueve
  async function evaluar(fen) {
    const notas = [null, null];
    const fin = await esperar([`position fen ${fen}`, LIMITE], "bestmove", linea => {
      const m = linea.match(/ score (cp|mate) (-?\d+)/);
      const pv = linea.match(/ multipv (\d+) /);
      if (m && !/(lowerbound|upperbound)/.test(linea)) {
        notas[pv ? Number(pv[1]) - 1 : 0] = { tipo: m[1], valor: Number(m[2]) };
      }
    });
    return { nota: notas[0] || { tipo: "cp", valor: 0 }, segunda: notas[1], mejor: fin.split(" ")[1] };
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
    if (d.esMejor && !d.unica && d.destaca && d.despues >= 40 && d.antes <= 95) return "genial";
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
      // "Gran jugada": claramente mejor que la segunda opción y no es una captura obvia
      const anterior = jugadas[i - 1];
      const obvia = (anterior && m.captured && anterior.to === m.to) || capturado >= VALOR[m.piece];
      const destaca = !obvia && !!evals[i].segunda && antes - opciones(evals[i].segunda) >= 15;
      const tipo = clasificar({ libro: enLibro, esMejor, unica: antesPos.moves().length === 1, antes, despues, sacrificio, destaca });
      const nota = evals[i].nota;
      return {
        indice: i, color: m.color, san: m.san, tipo, uci: uciDe(m),
        fen: posiciones[i], mejorUci: evals[i].mejor,
        mejorSan: sanDe(posiciones[i], evals[i].mejor),
        respuestaSan: sanDe(posiciones[i + 1], evals[i + 1].mejor),
        mateEnMano: !enLibro && !esMejor && nota.tipo === "mate" && nota.valor > 0 ? nota.valor : 0
      };
    });
    // Ventaja de las blancas en cada posición, para la barra y la gráfica
    const curva = evals.map((e, i) => {
      const blancas = posiciones[i].split(" ")[1] === "w";
      if (estados[i] === "mate") return { pct: blancas ? 0 : 100, texto: blancas ? "0-1" : "1-0" };
      const pct = blancas ? opciones(e.nota) : 100 - opciones(e.nota);
      const v = blancas ? e.nota.valor : -e.nota.valor;
      const texto = e.nota.tipo === "mate" ? `${v < 0 ? "-" : ""}M${Math.abs(v)}`
        : `${v > 0 ? "+" : ""}${(v / 100).toFixed(1)}`;
      return { pct, texto };
    });
    return { sans, color, jugadas: lista, curva };
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

  function marca(tipo, clase = "") {
    const el = crear("span", TIPOS[tipo].icono, `mk mk-${tipo} ${clase}`);
    el.title = TIPOS[tipo].nombre;
    el.setAttribute("aria-label", TIPOS[tipo].nombre);
    return el;
  }

  // Resumen: se toca una categoría para verla en el tablero
  function mostrarInforme() {
    cuerpo.innerHTML = "";
    const mias = informe.jugadas.filter(j => j.color === informe.color);
    const suyas = informe.jugadas.filter(j => j.color !== informe.color);
    cuerpo.append(crear("p", consejo(mias.filter(j => FALLOS.includes(j.tipo))), "an-tip"));

    const tabla = crear("table", null, "an-table");
    const cabecera = tabla.insertRow();
    ["Jugada", "Tú", informe.importada ? "Rival" : "IA"].forEach(t => cabecera.append(crear("th", t)));
    Object.entries(TIPOS).forEach(([clave, t]) => {
      const fila = tabla.insertRow();
      fila.dataset.tipo = clave;
      const celda = crear("td");
      celda.append(marca(clave), crear("span", t.nombre));
      fila.append(celda);
      [mias, suyas].forEach(lista => {
        const encontradas = lista.filter(j => j.tipo === clave);
        const td = crear("td");
        const boton = crear("button", String(encontradas.length), "an-count");
        boton.type = "button";
        boton.disabled = !encontradas.length;
        boton.setAttribute("aria-label", `Ver ${t.nombre}: ${encontradas.length}`);
        if (encontradas.length) boton.addEventListener("click", () => abrirRevision(encontradas[0].indice + 1));
        td.append(boton);
        fila.append(td);
      });
    });
    cuerpo.append(tabla);

    const revisar = crear("button", "Revisar en el tablero", "btn btn-success an-start");
    revisar.type = "button";
    revisar.id = "btnStartReview";
    revisar.addEventListener("click", () => abrirRevision(primerPunto()));
    cuerpo.append(revisar);
    cuerpo.append(crear("p", "Análisis rápido con Stockfish 19 lite: las categorías son aproximadas y no coinciden necesariamente con Chess.com. «De libro» se refiere solo a las líneas de esta app.", "an-note"));
    $("btnCloseAnalysis").textContent = "Cerrar";
    modal.classList.add("open");
  }

  /* ---------- Revisión sobre el tablero ---------- */
  let rv = null;   // { ply, verMejor }

  // La revisión empieza en tu primer fallo
  function primerPunto() {
    const j = informe.jugadas.find(x => x.color === informe.color && FALLOS.includes(x.tipo));
    return j ? j.indice + 1 : Math.min(1, informe.sans.length);
  }

  function abrirRevision(ply) {
    modal.classList.remove("open");
    if (repaso) volverAlFinal();
    document.body.classList.add("reviewing");
    $("screenTitle").textContent = "Revisión";
    construirTira();
    irA(ply);
    window.scrollTo(0, 0);
  }

  function cerrarRevision() {
    if (!document.body.classList.contains("reviewing")) return;
    document.body.classList.remove("reviewing");
    $("screenTitle").textContent = informe && informe.importada ? "Partida PGN" : "Jugar contra la IA";
    $("boardWrapper").querySelector(".rv-arrows")?.remove();
  }

  function construirTira() {
    const tira = $("rvStrip");
    tira.innerHTML = "";
    informe.jugadas.forEach(j => {
      const b = crear("button", null, "rv-chip");
      b.type = "button";
      b.append(marca(j.tipo, "mk-small"), crear("span", `${numero(j)} ${es(j.san)}`));
      b.addEventListener("click", () => irA(j.indice + 1));
      tira.append(b);
    });
  }

  // Flechas sobre el tablero (coordenadas de 0 a 8)
  function flechas(lista) {
    $("boardWrapper").querySelector(".rv-arrows")?.remove();
    if (!lista.length) return;
    const NS = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(NS, "svg");
    svg.setAttribute("viewBox", "0 0 8 8");
    svg.setAttribute("class", "rv-arrows");
    const punto = casilla => {
      let x = casilla.charCodeAt(0) - 97, y = 8 - Number(casilla[1]);
      if (informe.color === "b") { x = 7 - x; y = 7 - y; }
      return [x + 0.5, y + 0.5];
    };
    lista.forEach(({ uci, color }) => {
      const [x1, y1] = punto(uci.slice(0, 2)), [x2, y2] = punto(uci.slice(2, 4));
      const largo = Math.hypot(x2 - x1, y2 - y1), ux = (x2 - x1) / largo, uy = (y2 - y1) / largo;
      const bx = x2 - ux * 0.42, by = y2 - uy * 0.42;
      const forma = document.createElementNS(NS, "path");
      forma.setAttribute("d", [
        `M${x1 - uy * 0.09},${y1 + ux * 0.09}`, `L${bx - uy * 0.09},${by + ux * 0.09}`,
        `L${bx - uy * 0.25},${by + ux * 0.25}`, `L${x2},${y2}`,
        `L${bx + uy * 0.25},${by - ux * 0.25}`, `L${bx + uy * 0.09},${by - ux * 0.09}`,
        `L${x1 + uy * 0.09},${y1 - ux * 0.09}`, "Z"].join(" "));
      forma.setAttribute("class", `arrow-${color}`);
      svg.appendChild(forma);
    });
    $("boardWrapper").appendChild(svg);
  }

  function explicacion(j) {
    const partes = [];
    if (j.tipo === "libro") partes.push("Coincide con una línea de tu libro de aperturas.");
    if (j.tipo === "brillante") partes.push("Parece entregar material y aun así mantiene una buena posición.");
    if (j.tipo === "genial") partes.push("Claramente mejor que la segunda opción que encontró Stockfish.");
    if (j.tipo === "mejor") partes.push("Es la que propone Stockfish o la única posible.");
    if (FALLOS.includes(j.tipo) || j.tipo === "buena" || j.tipo === "excelente") {
      if (j.mejorSan && j.mejorSan !== j.san) partes.push(`Stockfish prefería ${es(j.mejorSan)}.`);
    }
    if (j.mateEnMano) partes.push(`Había mate en ${j.mateEnMano}.`);
    if (FALLOS.includes(j.tipo) && j.respuestaSan) partes.push(`La mejor respuesta era ${es(j.respuestaSan)}.`);
    return partes.join(" ");
  }

  function irA(ply, verMejor = false) {
    const total = informe.sans.length;
    ply = Math.max(0, Math.min(total, ply));
    const j = ply ? informe.jugadas[ply - 1] : null;
    rv = { ply, verMejor: !!(verMejor && j) };

    cargarHasta(rv.verMejor ? ply - 1 : ply);
    isLocked = true;
    if (rv.verMejor) {
      lastMove = [];
      updateHighlights();
      const lista = [{ uci: j.mejorUci, color: "best" }];
      if (j.uci !== j.mejorUci) lista.unshift({ uci: j.uci, color: "played" });
      flechas(lista);
    } else {
      flechas([]);
      if (j) {
        [j.uci.slice(0, 2), j.uci.slice(2, 4)].forEach(c => squareEl(c).classList.add("rv-tint", `tint-${j.tipo}`));
        squareEl(j.uci.slice(2, 4)).appendChild(marca(j.tipo, "mk-board"));
      }
    }

    $("rvBadge").innerHTML = "";
    if (j) $("rvBadge").appendChild(marca(j.tipo, "mk-big"));
    $("rvTitle").textContent = !j ? "Inicio de la partida"
      : rv.verMejor ? `Mejor: ${es(j.mejorSan)}`
      : `${numero(j)} ${es(j.san)} ${FRASE[j.tipo]}`;
    $("rvText").textContent = !j ? "Toca ▶ para recorrer la partida."
      : rv.verMejor ? (j.uci === j.mejorUci ? "Flecha verde: la jugada propuesta." : "Verde: la propuesta. Roja: lo que se jugó.")
      : `${j.color === informe.color ? "Tu jugada." : informe.importada ? "Jugada del rival." : "Jugada de la IA."} ${explicacion(j)}`;

    const pos = informe.curva[rv.verMejor ? ply - 1 : ply];
    $("evalFill").style.width = pos.pct + "%";
    $("evalText").textContent = pos.texto;
    $("evalBar").setAttribute("aria-label", `Ventaja (positiva para las blancas): ${pos.texto}`);

    $("rvFirst").disabled = $("rvPrev").disabled = ply === 0;
    $("rvNext").disabled = $("rvLast").disabled = ply === total;
    $("btnShowBest").disabled = !j || !j.mejorUci;
    $("btnShowBest").textContent = rv.verMejor ? "Ver jugada hecha" : "Ver mejor";
    $("btnRetry").disabled = !j || j.color !== informe.color || !FALLOS.includes(j.tipo) || !j.mejorUci;

    const tira = $("rvStrip");
    [...tira.children].forEach((c, i) => c.classList.toggle("current", i === ply - 1));
    const actual = tira.children[ply - 1];
    tira.scrollLeft = actual ? actual.offsetLeft - tira.offsetLeft - tira.clientWidth / 2 + actual.offsetWidth / 2 : 0;
    grafica();
  }

  function grafica() {
    const n = Math.max(1, informe.curva.length - 1);
    const caja = $("rvGraph");
    const puntos = informe.curva.map((p, i) => `${(i / n) * 100},${40 - p.pct * 0.4}`).join(" ");
    caja.innerHTML = `<svg viewBox="0 0 100 40" preserveAspectRatio="none"><polygon points="0,40 ${puntos} 100,40"/><line x1="0" x2="100" y1="20" y2="20"/><line class="cursor" x1="${(rv.ply / n) * 100}" x2="${(rv.ply / n) * 100}" y1="0" y2="40"/></svg>`;
    informe.jugadas.filter(j => DESTACADAS.includes(j.tipo)).forEach(j => {
      const punto = crear("i", null, `dot mk-${j.tipo}`);
      punto.style.left = `${((j.indice + 1) / n) * 100}%`;
      punto.style.top = `${100 - informe.curva[j.indice + 1].pct}%`;
      caja.appendChild(punto);
    });
  }

  /* ---------- Flujo ---------- */
  // Detiene la partida en curso y bloquea el tablero
  function detener() {
    session++;
    timers.forEach(clearTimeout);
    timers.clear();
    clearSelection();
    clearHint();
    renderBoard();
    isLocked = true;
    gameClosed = true;
  }

  async function pedirAnalisis() {
    if (informe) return abrirRevision(rv ? rv.ply : primerPunto());
    if (!game.game_over() && !confirm("¿Terminar esta partida y analizarla?")) return;

    // A partir de aquí la partida está terminada
    detener();
    updateUndo();
    $("stepCounter").textContent = "Terminada";
    setCard("Partida terminada", "Toca «Analizar» para ver el informe.");
    await ejecutar(game.history(), userColor(), false);
  }

  // Revisa una partida leída de un PGN
  async function importar(sans, color) {
    resetSession();
    detener();
    importada = true;
    document.body.classList.add("importada");
    colorImportado = color;
    sans.forEach(san => game.move(san));
    lastMove = [];
    renderBoard();
    $("screenTitle").textContent = "Partida PGN";
    $("openingTitle").textContent = "Partida PGN";
    $("stepCounter").textContent = "";
    setCard("Analizando tu partida", "Espera a que termine Stockfish.");
    await ejecutar(sans, color, true);
  }

  // Sale de la partida PGN y vuelve a la sección en la que estabas
  function salirImportada() {
    if (importada) resetSession();
  }

  async function ejecutar(sans, color, esPgn) {
    const id = ++tarea;
    cuerpo.innerHTML = "";
    const estado = crear("p", "Cargando Stockfish…");
    const barra = crear("progress");
    barra.max = 100;
    barra.value = 0;
    cuerpo.append(estado, barra);
    if (sans.length > 60) cuerpo.append(crear("p", "Es una partida larga: puede tardar uno o dos minutos. No cierres la app.", "an-note"));
    $("btnCloseAnalysis").textContent = "Cancelar";
    modal.classList.add("open");

    try {
      if (location.protocol === "file:") throw new Error("El análisis solo funciona desde el enlace web, no abriendo el archivo");
      const resultado = await analizar(sans, color, (i, n) => {
        estado.textContent = `Analizando posición ${i + 1} de ${n}…`;
        barra.value = Math.round((i / n) * 100);
      });
      if (!resultado || id !== tarea) return;
      resultado.importada = esPgn;
      informe = resultado;
      mostrarInforme();
    } catch (e) {
      if (id !== tarea) return;
      cerrarMotor();
      cuerpo.innerHTML = "";
      cuerpo.append(crear("p", `No se pudo analizar. ${e.message}. Cierra y vuelve a intentarlo.`, "feedback-error"));
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
    cerrarRevision();
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
    if (importada) return;
    $("aiControls").style.display = "grid";
    $("stepCounter").textContent = "Terminada";
    setCard("Partida analizada", "Toca «Analizar» para volver a la revisión o empieza una partida nueva.");
    updateUndo();
  }

  function reiniciar() {
    tarea++;
    cerrarMotor();
    cerrarRevision();
    informe = null;
    repaso = null;
    rv = null;
    importada = false;
    colorImportado = null;
    document.body.classList.remove("importada");
    modal.classList.remove("open");
    $("reviewControls").style.display = "none";
  }

  $("btnAnalyze").addEventListener("click", pedirAnalisis);
  $("btnShowSolution").addEventListener("click", verSolucion);
  $("btnBackReport").addEventListener("click", () => {
    const ply = repaso.jugada.indice + 1;
    volverAlFinal();
    abrirRevision(ply);
  });
  $("btnExitReview").addEventListener("click", () => {
    if (importada) return salirImportada();
    cerrarRevision();
    volverAlFinal();
  });
  $("btnSummary").addEventListener("click", mostrarInforme);
  $("rvFirst").addEventListener("click", () => irA(0));
  $("rvPrev").addEventListener("click", () => irA(rv.ply - 1));
  $("rvNext").addEventListener("click", () => irA(rv.ply + 1));
  $("rvLast").addEventListener("click", () => irA(informe.sans.length));
  $("btnShowBest").addEventListener("click", () => irA(rv.ply, !rv.verMejor));
  $("btnRetry").addEventListener("click", () => practicar(informe.jugadas[rv.ply - 1]));
  $("rvGraph").addEventListener("click", e => {
    const r = $("rvGraph").getBoundingClientRect();
    irA(Math.round((e.clientX - r.left) / r.width * informe.sans.length));
  });
  $("btnCloseAnalysis").addEventListener("click", () => {
    if (!informe) { tarea++; cerrarMotor(); }
    modal.classList.remove("open");
    if (!document.body.classList.contains("reviewing")) salirImportada();
  });

  window.EA.analisis = { reiniciar, intento, importar, clasificar, analizar };
})();
