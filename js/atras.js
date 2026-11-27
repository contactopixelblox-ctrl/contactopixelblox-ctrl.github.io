// Botón Atrás de Android: cierra la ventana abierta en lugar de salir de la app.
(function () {
  const $ = id => document.getElementById(id);
  const VENTANAS = [
    ["checklistModal", "btnCloseModal"], ["menuModal", "btnCloseMenu"], ["pgnModal", "btnPgnClose"],
    ["analysisModal", "btnCloseAnalysis"], ["courseModal", "lsClose"]
  ];
  const abierta = () => VENTANAS.find(([id]) => $(id).classList.contains("open"));
  const hayAlgo = () => !!abierta() || document.body.classList.contains("reviewing");

  let guardado = !!(history.state && history.state.ea);   // hay una entrada extra en el historial
  let ignorar = false;

  function sincronizar() {
    if (ignorar) return;
    if (hayAlgo() && !guardado) { history.pushState({ ea: 1 }, ""); guardado = true; }
    else if (!hayAlgo() && guardado) { guardado = false; ignorar = true; history.back(); }
  }

  window.addEventListener("popstate", () => {
    if (ignorar) { ignorar = false; return sincronizar(); }
    guardado = false;
    const v = abierta();
    if (v) {
      const [id, cerrar] = v;
      // Dentro de una lección o del repaso, Atrás vuelve a la lista
      if (id === "courseModal" && !$("lsBack").hidden) $("lsBack").click();
      else $(cerrar).click();
    } else if (document.body.classList.contains("reviewing")) $("btnExitReview").click();
    setTimeout(sincronizar);
  });

  const vigia = new MutationObserver(sincronizar);
  [...VENTANAS.map(([id]) => $(id)), document.body].forEach(el =>
    vigia.observe(el, { attributes: true, attributeFilter: ["class"] }));
  sincronizar();
})();
