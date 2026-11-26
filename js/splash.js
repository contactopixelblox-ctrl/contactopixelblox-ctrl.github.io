// Pantalla de carga. Se carga al final: si llega a ejecutarse, los demás archivos ya se pidieron.
(function () {
  const splash = document.getElementById("splash");
  const boton = document.getElementById("btnStart");
  const actual = window.EA.historial[0];
  const app = document.querySelector(".app-container");

  document.getElementById("splashVersion").textContent = `v${actual.version} · ${actual.fecha}`;
  actual.cambios.forEach(texto => {
    const item = document.createElement("li");
    item.textContent = texto;
    document.getElementById("splashChanges").appendChild(item);
  });

  app.inert = true;
  const listo = () => {
    document.getElementById("splashStatus").textContent = "Lista para jugar";
    boton.disabled = false;
  };
  // La barra dura 1,2 s (ver .splash-bar en style.css)
  setTimeout(listo, 1200);

  boton.addEventListener("click", () => {
    app.inert = false;
    splash.remove();
  });
})();
