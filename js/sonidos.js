// Sonidos cortos generados con Web Audio: no hay archivos y funcionan sin conexión
(function () {
  const KEY = "ea_sonido";
  let ctx = null;
  let activo = true;
  try { activo = localStorage.getItem(KEY) !== "false"; } catch (e) {}

  // [frecuencia Hz, inicio s, duración s, forma, volumen]
  const SONIDOS = {
    mover:   [[260, 0, 0.07, "triangle", 0.25]],
    captura: [[180, 0, 0.09, "square", 0.18], [110, 0.04, 0.1, "triangle", 0.3]],
    jaque:   [[660, 0, 0.09, "triangle", 0.25], [880, 0.1, 0.13, "triangle", 0.25]],
    error:   [[170, 0, 0.12, "sawtooth", 0.14], [130, 0.12, 0.16, "sawtooth", 0.14]],
    exito:   [[523, 0, 0.12, "sine", 0.25], [659, 0.11, 0.12, "sine", 0.25], [784, 0.22, 0.25, "sine", 0.25]],
    derrota: [[392, 0, 0.18, "sine", 0.25], [311, 0.17, 0.18, "sine", 0.25], [233, 0.34, 0.35, "sine", 0.25]]
  };

  // El navegador solo permite audio después de que toques la pantalla
  function preparar() {
    const Audio = window.AudioContext || window.webkitAudioContext;
    if (!Audio) return;
    if (!ctx) ctx = new Audio();
    if (ctx.state === "suspended") ctx.resume().catch(() => {});
  }
  ["pointerdown", "keydown", "click"].forEach(ev => document.addEventListener(ev, preparar, true));

  function tocar(tipo) {
    if (!activo || !ctx || !SONIDOS[tipo]) return;
    SONIDOS[tipo].forEach(([freq, inicio, dur, forma, vol]) => {
      const osc = ctx.createOscillator(), gain = ctx.createGain();
      const t = ctx.currentTime + inicio;
      osc.type = forma;
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(vol, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
      osc.connect(gain).connect(ctx.destination);
      osc.start(t);
      osc.stop(t + dur);
    });
  }

  const toggle = document.getElementById("soundToggle");
  toggle.checked = activo;
  toggle.addEventListener("change", () => {
    activo = toggle.checked;
    try { localStorage.setItem(KEY, activo); } catch (e) {}
    if (activo) tocar("mover");
  });

  window.EA = window.EA || { aperturas: {} };
  window.EA.sonido = { tocar };
})();
