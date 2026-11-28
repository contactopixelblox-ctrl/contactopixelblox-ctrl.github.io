// Curso por lecciones. Tiene su propio tablero y no toca el estado de app.js.
(function () {
  const $ = id => document.getElementById(id);
  const curso = window.EA.curso;
  const modal = $("courseModal"), tablero = $("lsBoard"), grid = $("lsGrid"), svg = $("lsArrows");
  const sonar = t => window.EA.sonido && window.EA.sonido.tocar(t);
  const COLORES = { verde: "#1f9d55", azul: "#2f6fe4", rojo: "#dc333b" };

  let leccion = null, indice = 0, game = null;
  let elegida = null, resuelto = false, pistas = 0, ultima = [], marcasPista = [];
  let sesion = null;   // repaso en curso: { cola, total, hechas, extra, falladas }
  const srs = window.EA.srs;
  let esperando = false, relojRival = 0, relojAuto = 0;
  const version = l => Math.max(...l.pasos.map(p => p.desde || 1));
  const nivel = v => v === true ? 1 : v || 0;
  const conAuto = () => { try { return localStorage.getItem("ea_curso_auto") === "1"; } catch (e) { return false; } };

  function botonAuto() {
    $("lsAuto").textContent = relojAuto ? "⏸ Detener (avanza solo)" : `Avance automático: ${conAuto() ? "sí" : "no"}`;
  }
  function pararAuto() {
    clearTimeout(relojAuto);
    relojAuto = 0;
    botonAuto();
  }
  // Solo tras acertar y nunca en el último paso. Más texto, más tiempo.
  function programarAuto(texto) {
    pararAuto();
    if (!conAuto() || esFinal()) return;
    relojAuto = setTimeout(() => { relojAuto = 0; $("lsNext").click(); }, Math.min(9000, Math.max(2500, texto.length * 65)));
    botonAuto();
  }
  function parar() {
    clearTimeout(relojRival);
    esperando = false;
    pararAuto();
  }
  const esFinal = () => sesion ? sesion.cola.length === 1 && !sesion.repetir : indice === leccion.pasos.length - 1;

  function leer() {
    try { return JSON.parse(localStorage.getItem("ea_curso")) || {}; } catch (e) { return {}; }
  }
  function cargar(clave) {
    try { return JSON.parse(localStorage.getItem(clave)) || {}; } catch (e) { return {}; }
  }
  function guardar(clave, datos) {
    try { localStorage.setItem(clave, JSON.stringify(datos)); } catch (e) {}
  }
  function completar(id) {
    const datos = leer();
    datos[id] = version(curso.lecciones.find(l => l.id === id));
    guardar("ea_curso", datos);
    guardarPaso(id, 0);
    contar();
  }
  // Paso en el que quedó cada lección sin terminar
  function guardarPaso(id, n) {
    const datos = cargar("ea_curso_paso");
    if (n > 0) datos[id] = n; else delete datos[id];
    guardar("ea_curso_paso", datos);
  }

  const tarjetas = () => srs.tarjetas(curso, leer(), Chess);
  function contar() {
    const n = srs.pendientes(tarjetas(), cargar("ea_repaso"), srs.hoy()).length;
    $("rvCount").textContent = n;
    $("rvCount").hidden = !n;
  }

  function verLista() {
    parar();
    leccion = null;
    sesion = null;
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
      const guardado = cargar("ea_curso_paso")[l.id];
      const hayNuevo = hechas[l.id] && nivel(hechas[l.id]) < version(l);
      b.querySelector("small").textContent = guardado ? `${l.resumen} Sigues en el paso ${guardado + 1} de ${l.pasos.length}.` : hayNuevo ? `${l.resumen} Hay práctica nueva.` : l.resumen;
      b.addEventListener("click", () => abrir(l));
      caja.appendChild(b);
    });
  }

  function abrir(l) {
    leccion = l;
    sesion = null;
    // Si ya la completaste y hay pasos nuevos, empieza en el primero de ellos
    const hecha = nivel(leer()[l.id]);
    const primero = hecha ? Math.max(0, l.pasos.findIndex(p => (p.desde || 1) > hecha)) : 0;
    indice = Math.min(cargar("ea_curso_paso")[l.id] || primero, l.pasos.length - 1);
    $("lsList").hidden = true;
    $("lsPlayer").hidden = false;
    $("lsBack").hidden = false;
    $("lsTitle").textContent = `Lección ${curso.lecciones.indexOf(l) + 1}`;
    mostrar();
  }

  const paso = () => sesion ? sesion.cola[0].paso : leccion.pasos[indice];

  function elemento(etiqueta, texto, clase) {
    const el = document.createElement(etiqueta);
    el.textContent = texto;
    if (clase) el.className = clase;
    return el;
  }
  const plural = n => `${n} ${n === 1 ? "posición" : "posiciones"}`;

  function verRepaso(aviso) {
    parar();
    leccion = null;
    sesion = null;
    $("lsList").hidden = false;
    $("lsPlayer").hidden = true;
    $("lsBack").hidden = true;
    $("lsTitle").textContent = "Repaso";
    const caja = $("lsList");
    caja.innerHTML = "";
    const todas = tarjetas(), estado = cargar("ea_repaso"), dia = srs.hoy();
    const hoy = srs.pendientes(todas, estado, dia);
    if (aviso) caja.appendChild(elemento("p", aviso, "ls-feedback ok"));
    if (!todas.length) {
      caja.appendChild(elemento("p", "Todavía no tienes nada que repasar. Completa una lección y sus posiciones aparecerán aquí.", "rs-text"));
      return;
    }
    const prox = srs.proxima(todas, estado);
    const cuando = prox === srs.sumar(dia, 1) ? "mañana" : prox && `el ${prox.split("-").reverse().join("/")}`;
    caja.appendChild(elemento("p", hoy.length ? `Hoy te toca repasar ${plural(hoy.length)}.` : `Nada pendiente hoy. Tu próximo repaso es ${cuando}.`, "rs-text"));
    if (hoy.length) {
      const b = elemento("button", "Empezar repaso", "btn btn-primary");
      b.addEventListener("click", () => empezar(hoy, false));
      caja.appendChild(b);
    }
    const extra = elemento("button", "Práctica extra (no cambia las fechas)", "btn btn-secondary");
    extra.addEventListener("click", () => empezar(todas, true));
    caja.appendChild(extra);
    caja.appendChild(elemento("p", `En tu repaso: ${plural(todas.length)}. Si aciertas sin ayuda, cada una vuelve en ${srs.INTERVALOS.join(", ")} días. Si fallas o pides pista, vuelve mañana.`, "rs-nota"));
  }

  function empezar(lista, extra) {
    const cola = lista.slice().sort(() => Math.random() - 0.5);
    sesion = { cola, total: cola.length, hechas: 0, extra, falladas: new Set() };
    leccion = {};
    $("lsList").hidden = true;
    $("lsPlayer").hidden = false;
    $("lsBack").hidden = false;
    $("lsTitle").textContent = extra ? "Práctica extra" : "Repaso";
    mostrar();
  }

  // Se anota en el primer fallo o al acertar limpio; los reintentos no cambian la fecha
  function fallo() {
    if (!sesion) return;
    const t = sesion.cola[0];
    if (sesion.falladas.has(t.clave)) return;
    sesion.falladas.add(t.clave);
    anotar(t, false);
  }
  function anotar(t, limpio) {
    if (sesion.extra) return;
    const estado = cargar("ea_repaso");
    srs.calificar(t, estado, limpio, srs.hoy());
    guardar("ea_repaso", estado);
    contar();
  }

  // Pasa a la siguiente tarjeta; las respondidas con ayuda vuelven al final
  function avanzarRepaso() {
    const t = sesion.cola.shift();
    if (sesion.repetir) sesion.cola.push(t); else sesion.hechas++;
    if (sesion.cola.length) return mostrar();
    const { total, falladas } = sesion;
    sonar("exito");
    verRepaso(`Repaso terminado: ${total - falladas.size} de ${total} a la primera y sin ayuda.`);
  }

  function mostrar() {
    parar();
    const p = paso();
    game = p.fen ? new Chess(p.fen) : new Chess();
    (p.tras || []).forEach(san => game.move(san));
    const jugadas = game.history();
    const delRival = p.rival && jugadas.length ? game.undo() : null;
    elegida = null;
    resuelto = !p.correctas;
    pistas = 0;
    marcasPista = [];
    ultima = [];
    if (sesion) {
      sesion.repetir = false;
      sesion.conAyuda = false;
      $("lsBar").style.width = `${(sesion.hechas / sesion.total) * 100}%`;
      $("lsKind").textContent = `Sin flechas · quedan ${sesion.cola.length}`;
      $("lsStepTitle").textContent = `¿Qué juegas con ${(p.tras || []).length % 2 || (p.fen && game.turn() === "b") ? "negras" : "blancas"}?`;
      const antes = jugadas.map((s, i) => (i % 2 ? "" : `${i / 2 + 1}. `) + window.EA.aEspanol(s)).join(" ");
      $("lsText").textContent = (antes ? `Van: ${antes}. ` : "") + (p.repaso || p.texto);
    } else {
      guardarPaso(leccion.id, indice);
      $("lsBar").style.width = `${((indice + 1) / leccion.pasos.length) * 100}%`;
      $("lsKind").textContent = `${p.correctas ? "Tu turno: mueve" : "Aprende"} · ${indice + 1} de ${leccion.pasos.length}`;
      $("lsStepTitle").textContent = p.titulo;
      $("lsText").textContent = p.texto;
    }
    feedback("");
    $("lsCard").scrollTop = 0;
    pintar();
    flechas(sesion ? [] : p.flechas);
    botones();
    if (delRival) {
      esperando = true;
      relojRival = setTimeout(() => {
        const m = game.move(delRival.san);
        esperando = false;
        ultima = [m.from, m.to];
        pintar();
        deslizar(m);
        sonar("mover");
      }, 650);
    }
  }

  function deslizar(m) {
    const origen = grid.querySelector(`[data-square="${m.from}"]`);
    const destino = grid.querySelector(`[data-square="${m.to}"]`);
    const pieza = destino && destino.querySelector(".piece");
    if (!pieza || !pieza.animate) return;
    const a = origen.getBoundingClientRect(), b = destino.getBoundingClientRect();
    destino.style.zIndex = 15;
    pieza.animate([{ transform: `translate(${a.left - b.left}px, ${a.top - b.top}px)` }, { transform: "none" }], { duration: 350, easing: "ease-in-out" });
  }

  function botones() {
    const p = paso(), final = esFinal();
    $("lsPrev").hidden = !!sesion;
    $("lsNext").parentElement.classList.toggle("review", !!sesion);
    $("lsPrev").disabled = indice === 0;
    $("lsHint").hidden = resuelto;
    $("lsNext").hidden = !resuelto;
    const otra = !sesion && curso.lecciones[curso.lecciones.indexOf(leccion) + 1];
    $("lsNext").textContent = !final ? "Siguiente →" : sesion ? "Terminar ✓" : otra ? "Siguiente lección →" : "Ir a Repaso →";
    $("lsToList").hidden = !!sesion || !final || !resuelto;
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
      if (!sesion && (p.marcas || []).includes(n)) el.classList.add("ls-mark");
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
    if (esperando) return;
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
      if (sesion) {
        const t = sesion.cola[0];
        if (!sesion.conAyuda && !sesion.falladas.has(t.clave)) anotar(t, true);
        sesion.repetir = sesion.conAyuda;
      }
      feedback("✓ " + p.correctas[san], "ok");
      sonar("mover");
      botones();
      programarAuto(p.correctas[san]);
    } else if (sesion && sesion.cola[0].alternativas.includes(san)) {
      pintar();
      feedback(`${window.EA.aEspanol(san)} también es buena, pero en esta línea se juega otra. No cuenta como fallo: prueba otra vez.`, "pista");
    } else {
      if (sesion) { sesion.conAyuda = true; fallo(); }
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
    if (!e.isPrimary || resuelto || esperando) return;
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
    if (esperando) return;
    const [de, a] = paso().pista;
    pistas++;
    if (sesion) { sesion.conAyuda = true; fallo(); }
    marcasPista = pistas === 1 ? [de] : [de, a];
    elegida = null;
    pintar();
    flechas(pistas > 1 ? [[de, a]] : []);
    feedback(pistas === 1 ? "Pista: mueve la pieza marcada." : "Haz la jugada de la flecha.", "pista");
    botones();
  });
  $("lsNext").addEventListener("click", () => {
    if (sesion) return avanzarRepaso();
    if (indice < leccion.pasos.length - 1) { indice++; return mostrar(); }
    const siguiente = curso.lecciones[curso.lecciones.indexOf(leccion) + 1];
    terminar();
    if (siguiente) abrir(siguiente); else verRepaso();
  });
  function terminar() {
    completar(leccion.id);
    sonar("exito");
  }
  $("lsToList").addEventListener("click", () => { terminar(); verLista(); });
  $("lsAuto").addEventListener("click", () => {
    if (relojAuto) return pararAuto();
    try { localStorage.setItem("ea_curso_auto", conAuto() ? "0" : "1"); } catch (e) {}
    botonAuto();
  });
  $("lsPrev").addEventListener("click", () => { if (indice > 0) { indice--; mostrar(); } });
  $("lsBack").addEventListener("click", () => sesion ? verRepaso() : verLista());
  $("btnCourse").addEventListener("click", () => { verLista(); modal.classList.add("open"); });
  $("btnReview").addEventListener("click", () => { verRepaso(); modal.classList.add("open"); });
  document.addEventListener("visibilitychange", () => { if (document.hidden) pararAuto(); contar(); });
  botonAuto();
  contar();
  $("lsClose").addEventListener("click", () => { parar(); modal.classList.remove("open"); });
})();
