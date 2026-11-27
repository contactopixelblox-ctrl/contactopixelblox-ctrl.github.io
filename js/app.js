// Datos cargados por los scripts anteriores (registro global window.EA)
const PIECE_SVGS = window.EA.piezas;
const OPENING_TREES = Object.fromEntries(
  Object.entries(window.EA.aperturas).map(([clave, datos]) => [clave, window.EA.construirArbol(datos)]));

// Validación de legalidad de todas las variantes
function validateAllTrees() {
  Object.entries(OPENING_TREES).forEach(([key, opening]) => {
    opening.variants.forEach(v => {
      const g = new Chess();
      if (extractLineFromTree(opening.root, v.path).length !== v.path.length || !v.path.every(s => g.move(s))) {
        console.error(`Línea inválida en ${key}: ${v.id}`);
      }
    });
  });
}

const $ = id => document.getElementById(id);
const boardGrid = $("boardGrid"), variantSelect = $("variantSelect");
const btnPrev = $("btnPrev"), btnNext = $("btnNext"), btnContinue = $("btnContinuePractice");
const autoToggle = $("autoToggle"), checklistModal = $("checklistModal");

let currentOpeningKey = "italiana";
let currentMode = "learn";
let selectedVariantId = "giuoco";
let game = new Chess();
let activeLine = [];
let currentStep = 0;
let currentChildren = [];
let selectedSquare = null;
let legalMoves = [];
let hint = { from: null, to: null };
let errorCount = 0;   // errores en la jugada actual
let sessionErrors = 0;
let lastMove = [];
let isLocked = false;
let pendingContinue = false;
let session = 0;
const timers = new Set();

// Todo temporizador queda ligado a la sesión: al reiniciar se cancela
function later(fn, ms) {
  const id = session;
  const t = setTimeout(() => { timers.delete(t); if (id === session) fn(); }, ms);
  timers.add(t);
}

// Almacenamiento seguro (puede fallar en modo privado o dentro de un iframe)
const store = {
  get(k, d) { try { const v = localStorage.getItem("ea_" + k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem("ea_" + k, JSON.stringify(v)); } catch (e) {} }
};

function extractLineFromTree(rootNodes, sanPath) {
  const line = [];
  let level = rootNodes;
  for (const san of sanPath) {
    const found = level.find(n => n.san === san);
    if (!found) break;
    line.push(found);
    level = found.children || [];
  }
  return line;
}

const opening = () => OPENING_TREES[currentOpeningKey];

function populateVariantSelector() {
  variantSelect.innerHTML = "";
  const list = opening().variants.slice();
  if (currentMode === "practice") list.unshift({ id: "random", name: "Aleatoria (el rival elige)" });
  list.forEach(v => variantSelect.add(new Option(v.name, v.id)));
  selectedVariantId = list[0].id;
}

function setCard(title, text, cls = "") {
  $("moveTitle").className = "move-title " + cls;
  $("moveTitle").textContent = title;
  $("moveExplanation").textContent = text;
}

function bindTabs(containerId, onPick) {
  const btns = document.querySelectorAll(`#${containerId} .tab-btn`);
  btns.forEach(btn => btn.addEventListener("click", () => {
    btns.forEach(b => { b.classList.toggle("active", b === btn); b.setAttribute("aria-pressed", b === btn); });
    onPick(btn.dataset);
    populateVariantSelector();
    resetSession();
  }));
}
bindTabs("openingTabs", d => currentOpeningKey = d.opening);
bindTabs("modeTabs", d => currentMode = d.mode);

variantSelect.addEventListener("change", () => { selectedVariantId = variantSelect.value; resetSession(); });
$("checklistBanner").addEventListener("click", () => checklistModal.classList.add("open"));
$("btnCloseModal").addEventListener("click", () => checklistModal.classList.remove("open"));
checklistModal.addEventListener("click", e => { if (e.target === checklistModal) checklistModal.classList.remove("open"); });

autoToggle.checked = store.get("auto", true) !== false;
autoToggle.addEventListener("change", () => {
  store.set("auto", autoToggle.checked);
  if (autoToggle.checked && pendingContinue) continuePractice();
});

btnNext.addEventListener("click", () => {
  if (isLocked || currentStep >= activeLine.length) return;
  clearHint();
  errorCount = 0;
  executeMove(activeLine[currentStep].san, () => { currentStep++; updateLearnUI(); });
});

btnPrev.addEventListener("click", () => {
  if (isLocked || currentStep <= 0) return;
  game.undo();
  currentStep--;
  const h = game.history({ verbose: true }).pop();
  lastMove = h ? [h.from, h.to] : [];
  errorCount = 0;
  clearSelection();
  clearHint();
  renderBoard();
  updateLearnUI();
});

$("btnRestartPractice").addEventListener("click", () => resetSession());
btnContinue.addEventListener("click", () => continuePractice());

function continuePractice() {
  if (!pendingContinue) return;
  pendingContinue = false;
  btnContinue.disabled = true;
  opponentTurn();
}

function resetSession() {
  session++;
  timers.forEach(clearTimeout);
  timers.clear();
  game.reset();
  currentStep = 0;
  errorCount = 0;
  sessionErrors = 0;
  isLocked = false;
  pendingContinue = false;
  btnContinue.disabled = true;
  lastMove = [];
  clearSelection();
  clearHint();

  const op = opening();
  $("openingTitle").textContent = op.name;
  const learn = currentMode === "learn";
  $("learnControls").style.display = learn ? "grid" : "none";
  $("practiceControls").style.display = learn ? "none" : "grid";
  $("autoRow").style.display = learn ? "none" : "flex";

  const variant = op.variants.find(v => v.id === selectedVariantId);
  activeLine = variant ? extractLineFromTree(op.root, variant.path) : [];
  currentChildren = op.root;
  renderBoard();
  updateStats();

  if (learn) return updateLearnUI();
  if (op.userColor === "w") userTurn();
  else opponentTurn();
}

function updateLearnUI() {
  $("stepCounter").textContent = `Paso ${currentStep} / ${activeLine.length}`;
  btnPrev.disabled = currentStep === 0;
  btnNext.disabled = currentStep === activeLine.length;
  if (currentStep === 0) {
    setCard("Posición inicial", "Toca «Siguiente» o haz la jugada en el tablero.");
  } else {
    const d = activeLine[currentStep - 1];
    setCard(d.label, d.reason);
  }
}

function expectedNodes() {
  if (selectedVariantId === "random") return currentChildren;
  return currentStep < activeLine.length ? [activeLine[currentStep]] : [];
}

// Reparte la probabilidad por variante final, no por rama
const countLeaves = n => n.children.length ? n.children.reduce((s, c) => s + countLeaves(c), 0) : 1;
function pickNode(nodes) {
  let r = Math.random() * nodes.reduce((s, n) => s + countLeaves(n), 0);
  return nodes.find(n => (r -= countLeaves(n)) < 0) || nodes[0];
}

function userTurn(prev) {
  if (!expectedNodes().length) return finishLine(prev);
  isLocked = false;
  $("stepCounter").textContent = `Jugada ${Math.floor(currentStep / 2) + 1}`;
  const color = opening().userColor === "w" ? "Blancas" : "Negras";
  if (prev) setCard(`Rival: ${prev.label} · Tu turno`, prev.reason);
  else setCard(`Tu turno (${color})`, "Toca o arrastra una pieza. Antes de soltar, revisa el checklist.");
}

function opponentTurn() {
  const nodes = expectedNodes();
  if (!nodes.length) return finishLine();
  isLocked = true;
  const node = pickNode(nodes);
  later(() => executeMove(node.san, () => {
    currentStep++;
    currentChildren = node.children;
    userTurn(node);
  }), 450);
}

function finishLine(prev) {
  isLocked = true;
  $("stepCounter").textContent = "Completado";
  // Identifica qué variante se jugó (útil en modo aleatorio)
  const played = game.history().join(" ");
  const done = opening().variants.find(v => v.path.join(" ") === played);
  if (done) {
    const stats = store.get("stats", {});
    const key = currentOpeningKey + ":" + done.id;
    const s = stats[key] || { done: 0, clean: 0 };
    s.done++;
    if (sessionErrors === 0) s.clean++;
    stats[key] = s;
    store.set("stats", stats);
    updateStats(done.id);
  }
  const last = prev ? `Última del rival: ${prev.label}. ` : "";
  setCard("¡Línea completada!",
    `${last}${done ? done.name + ". " : ""}Errores: ${sessionErrors}. Toca «Reiniciar» para otra ronda.`,
    "feedback-success");
}

function updateStats(id = selectedVariantId) {
  if (currentMode !== "practice" || id === "random") { $("stats").textContent = ""; return; }
  const s = store.get("stats", {})[currentOpeningKey + ":" + id];
  $("stats").textContent = s ? `Sin errores: ${s.clean}/${s.done}` : "";
}

function handleUserMove(from, to) {
  if (isLocked) return;
  const attempt = new Chess(game.fen()).move({ from, to, promotion: "q" });
  if (!attempt) return shake(from);

  if (currentMode === "learn") {
    const node = activeLine[currentStep];
    if (node && attempt.san === node.san) {
      btnNext.click();
    } else {
      wrongMove(from, node);
    }
    return;
  }

  const nodes = expectedNodes();
  const match = nodes.find(n => n.san === attempt.san);
  if (!match) { sessionErrors++; return wrongMove(from, nodes[0], nodes.length > 1); }

  clearHint();
  errorCount = 0;
  executeMove(match.san, () => {
    flashSquare(to);
    currentStep++;
    currentChildren = match.children;
    if (!expectedNodes().length) return finishLine();
    isLocked = true;
    setCard(`✓ ${match.label}`, match.reason, "feedback-success");
    if (autoToggle.checked) {
      later(opponentTurn, 1800);
    } else {
      pendingContinue = true;
      btnContinue.disabled = false;
    }
  });
}

// Pistas graduales: 1) idea  2) pieza  3) jugada completa
function wrongMove(from, node, several = false) {
  if (!node) return shake(from);
  errorCount++;
  const m = new Chess(game.fen()).move(node.san);
  if (errorCount === 1) {
    clearHint();
    setCard("No es la jugada del libro",
      several ? "Hay más de una línea posible. Piensa en centro, desarrollo y seguridad."
              : `Idea: ${node.reason}`, "feedback-error");
  } else if (errorCount === 2) {
    hint = { from: m.from, to: null };
    setCard("Pista: mira la pieza marcada", node.reason, "feedback-warn");
  } else {
    hint = { from: m.from, to: m.to };
    setCard(`Juega ${node.label}`, node.reason, "feedback-warn");
  }
  shake(from);
}

const squareEl = name => boardGrid.querySelector(`[data-square="${name}"]`);

function slide(fromName, toName) {
  const a = squareEl(fromName), b = squareEl(toName);
  const p = a && a.querySelector(".piece");
  if (!p || !b) return;
  const r1 = a.getBoundingClientRect(), r2 = b.getBoundingClientRect();
  p.classList.add("animating-slide");
  p.style.transform = `translate(${r2.left - r1.left}px, ${r2.top - r1.top}px)`;
}

function executeMove(san, onComplete) {
  isLocked = true;
  const m = game.move(san);
  if (!m) { isLocked = false; return; }
  clearSelection();
  updateHighlights();

  // Casilla capturada (en la captura al paso no es la de destino)
  if (m.captured) {
    const capSq = m.flags.includes("e") ? m.to[0] + m.from[1] : m.to;
    const cap = squareEl(capSq)?.querySelector(".piece");
    if (cap) cap.classList.add("capture-fade");
  }
  slide(m.from, m.to);
  if (m.flags.includes("k")) slide("h" + m.from[1], "f" + m.from[1]);
  if (m.flags.includes("q")) slide("a" + m.from[1], "d" + m.from[1]);

  later(() => {
    lastMove = [m.from, m.to];
    renderBoard();
    isLocked = false;
    if (onComplete) onComplete();
  }, 260);
}

function shake(fromName) {
  clearSelection();
  updateHighlights();
  const p = squareEl(fromName)?.querySelector(".piece");
  if (p) {
    p.classList.remove("shake-error");
    void p.offsetWidth;
    p.classList.add("shake-error");
  }
  if (navigator.vibrate) { try { navigator.vibrate(60); } catch (e) {} }
}

function flashSquare(name) { squareEl(name)?.classList.add("flash-correct"); }
function clearSelection() { selectedSquare = null; legalMoves = []; }
function clearHint() { hint = { from: null, to: null }; }

function updateHighlights() {
  boardGrid.querySelectorAll(".square").forEach(el => {
    const n = el.dataset.square;
    el.classList.toggle("last-move", lastMove.includes(n));
    el.classList.toggle("selected", selectedSquare === n);
    el.classList.toggle("hint-move", hint.from === n || hint.to === n);
    const t = legalMoves.find(m => m.to === n);
    el.classList.toggle("legal-dot", !!t && !t.captured);
    el.classList.toggle("legal-capture", !!t && !!t.captured);
  });
}

function renderBoard() {
  endDrag();
  boardGrid.innerHTML = "";
  const flipped = opening().userColor === "b";
  const files = [..."abcdefgh"], ranks = [..."87654321"];
  if (flipped) { files.reverse(); ranks.reverse(); }
  ranks.forEach((rank, r) => files.forEach((file, f) => {
    const name = file + rank;
    const el = document.createElement("div");
    el.className = "square " + ((file.charCodeAt(0) - 97 + Number(rank) - 1) % 2 ? "light" : "dark");
    el.dataset.square = name;
    if (f === 0) el.insertAdjacentHTML("beforeend", `<span class="coord-rank">${rank}</span>`);
    if (r === 7) el.insertAdjacentHTML("beforeend", `<span class="coord-file">${file}</span>`);
    const piece = game.get(name);
    if (piece) {
      const p = document.createElement("div");
      p.className = "piece";
      p.style.backgroundImage = `url("${PIECE_SVGS[piece.color + piece.type.toUpperCase()]}")`;
      el.appendChild(p);
    }
    boardGrid.appendChild(el);
  }));
  updateHighlights();
}

/* Entrada táctil: un solo manejador para todo el tablero */
let drag = null;
const squareAt = (x, y) => {
  const el = document.elementFromPoint(x, y)?.closest(".square");
  return el && boardGrid.contains(el) ? el : null;
};

function endDrag() {
  if (!drag) return;
  drag.piece?.classList.remove("dragging");
  if (drag.piece) drag.piece.style.transform = "";
  boardGrid.querySelector(".drag-over")?.classList.remove("drag-over");
  drag = null;
}

boardGrid.addEventListener("pointerdown", e => {
  if (!e.isPrimary || e.button > 0 || isLocked) return;
  const el = e.target.closest(".square");
  if (!el) return;
  const name = el.dataset.square;
  if (selectedSquare && legalMoves.some(m => m.to === name)) return handleUserMove(selectedSquare, name);

  const info = game.get(name);
  const mine = info && info.color === game.turn() &&
    (currentMode === "learn" || info.color === opening().userColor);
  if (!mine) { clearSelection(); return updateHighlights(); }

  drag = { from: name, piece: el.querySelector(".piece"), x: e.clientX, y: e.clientY,
           id: e.pointerId, moved: false, wasSelected: selectedSquare === name };
  selectedSquare = name;
  legalMoves = game.moves({ square: name, verbose: true });
  updateHighlights();
  try { boardGrid.setPointerCapture(e.pointerId); } catch (err) {}
});

boardGrid.addEventListener("pointermove", e => {
  if (!drag || e.pointerId !== drag.id) return;
  const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
  if (!drag.moved && Math.hypot(dx, dy) > 8) { drag.moved = true; drag.piece.classList.add("dragging"); }
  if (!drag.moved) return;
  drag.piece.style.transform = `translate(${dx}px, ${dy}px) scale(1.6)`;
  boardGrid.querySelector(".drag-over")?.classList.remove("drag-over");
  squareAt(e.clientX, e.clientY)?.classList.add("drag-over");
});

boardGrid.addEventListener("pointerup", e => {
  if (!drag || e.pointerId !== drag.id) return;
  const { from, moved, wasSelected } = drag;
  const target = squareAt(e.clientX, e.clientY)?.dataset.square;
  endDrag();
  if (moved) {
    if (target && target !== from) handleUserMove(from, target);
  } else if (wasSelected) {
    clearSelection();   // segundo toque: deseleccionar
    updateHighlights();
  }
});
boardGrid.addEventListener("pointercancel", () => { endDrag(); clearSelection(); updateHighlights(); });

validateAllTrees();
populateVariantSelector();
resetSession();
