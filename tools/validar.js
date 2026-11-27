#!/usr/bin/env node
// Uso: node tools/validar.js
const fs = require("fs");
const path = require("path");
const root = path.join(__dirname, "..");
const { Chess } = require(path.join(root, "js/lib/chess.min.js"));
const { construirArbol } = require(path.join(root, "js/arbol.js"));

global.window = { EA: { aperturas: {} } };
const dataDir = path.join(root, "js/data");
fs.readdirSync(dataDir).filter(f => f.endsWith(".js")).forEach(f => require(path.join(dataDir, f)));

const errores = [];
let total = 0;

// Devuelve la partida si todas las jugadas son legales; si no, anota el error
function reproducir(jugadas, donde) {
  const game = new Chess();
  for (let i = 0; i < jugadas.length; i++) {
    const m = game.move(jugadas[i]);
    if (!m) { errores.push(`${donde}: jugada ${i + 1} ilegal "${jugadas[i]}"`); return null; }
    if (m.san !== jugadas[i]) { errores.push(`${donde}: escribe "${m.san}" en lugar de "${jugadas[i]}"`); return null; }
  }
  return game;
}

Object.entries(window.EA.aperturas).forEach(([clave, apertura]) => {
  if (!["w", "b"].includes(apertura.color)) errores.push(`${clave}: color debe ser "w" o "b"`);
  const ids = new Set();
  const razones = new Map();
  const lineas = [];

  apertura.variantes.forEach(v => {
    total++;
    const donde = `${clave}/${v.id}`;
    if (!v.id || !v.nombre || !v.jugadas || !v.jugadas.length) return errores.push(`${donde}: faltan id, nombre o jugadas`);
    if (ids.has(v.id) || v.id === "random") errores.push(`${donde}: id repetido o reservado`);
    ids.add(v.id);
    v.jugadas.forEach((j, i) => {
      if (!j.san || !j.razon) errores.push(`${donde}: jugada ${i + 1} sin san o razon`);
      // Las jugadas compartidas se unen: su explicación debe ser la misma
      const key = v.jugadas.slice(0, i + 1).map(x => x.san).join(" ");
      const texto = `${j.razon}|${j.nota || ""}`;
      if (razones.has(key) && razones.get(key) !== texto) errores.push(`${donde}: "${key}" tiene otra razon o nota en otra variante`);
      razones.set(key, texto);
    });
    const san = v.jugadas.map(j => j.san);
    reproducir(san, donde);
    lineas.push({ id: v.id, texto: san.join(" ") + " " });
  });

  lineas.forEach(a => lineas.forEach(b => {
    if (a !== b && b.texto.startsWith(a.texto)) errores.push(`${clave}: "${a.id}" está contenida al inicio de "${b.id}"`);
  }));

  // Desvíos: jugadas razonables del rival que no están en el libro
  const arbol = construirArbol(apertura);
  (apertura.desvios || []).forEach((d, n) => {
    const donde = `${clave}/desvío ${n + 1}`;
    if (!reproducir([...d.tras, d.san], donde)) return;
    let nivel = arbol.root;
    for (const san of d.tras) {
      const nodo = nivel.find(x => x.san === san);
      if (!nodo) return errores.push(`${donde}: "tras" no sigue una línea del libro`);
      nivel = nodo.children;
    }
    if (!nivel.length) errores.push(`${donde}: la línea ya terminó en ese punto`);
    if (nivel.some(x => x.san === d.san)) errores.push(`${donde}: "${d.san}" sí está en el libro`);
    const turnoRival = (d.tras.length % 2 === 0 ? "w" : "b") !== apertura.color;
    if (!turnoRival) errores.push(`${donde}: no es turno del rival`);
  });
});

// Curso: las posiciones, respuestas, errores previstos y pistas deben ser legales
let pasosCurso = 0;
(window.EA.curso?.lecciones || []).forEach(l => l.pasos.forEach((p, i) => {
  pasosCurso++;
  const donde = `curso/${l.id} paso ${i + 1}`;
  const game = p.fen ? new Chess(p.fen) : new Chess();
  for (const san of p.tras || []) if (!game.move(san)) return errores.push(`${donde}: "${san}" ilegal en "tras"`);
  if (!p.correctas) return;
  const legales = game.moves().map(s => s.replace(/[+#]/g, ""));
  [...Object.keys(p.correctas), ...Object.keys(p.errores || {})].forEach(san => {
    if (!legales.includes(san)) errores.push(`${donde}: "${san}" no es legal`);
  });
  if (!p.otro || !p.pista) return errores.push(`${donde}: faltan "otro" o "pista"`);
  const m = game.move({ from: p.pista[0], to: p.pista[1] });
  if (!m || !p.correctas[m.san]) errores.push(`${donde}: la pista no lleva a una respuesta correcta`);
}));

// Si existe la parte sin conexión, la versión y la lista de archivos deben coincidir
const swPath = path.join(root, "sw.js");
if (fs.existsSync(swPath)) {
  require(path.join(root, "js/version.js"));
  const version = window.EA.historial[0].version;
  const sw = fs.readFileSync(swPath, "utf8");
  const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
  if (!sw.includes(`const VERSION = "${version}"`)) errores.push(`sw.js: VERSION debe ser ${version}`);
  [...html.matchAll(/(?:href|src)="((?:css|js)\/[^"]+\.(?:css|js)(?:\?[^"]*)?)"/g)].forEach(([, ref]) => {
    const [archivo, v] = ref.split("?v=");
    if (v !== version) errores.push(`index.html: ${archivo} debe usar ?v=${version}`);
    if (!sw.includes(`"${archivo}"`)) errores.push(`sw.js: falta ${archivo}`);
  });
  [...sw.matchAll(/^\s+"([^"]+\.[a-z]+)",?$/gm)].forEach(([, f]) => {
    if (!fs.existsSync(path.join(root, f))) errores.push(`sw.js: no existe ${f}`);
  });
}

if (errores.length) {
  console.error(errores.join("\n"));
  process.exit(1);
}
console.log(`OK: ${total} variantes con jugadas legales y ${pasosCurso} pasos del curso.`);
