// Menú con la versión y el historial (los datos están en version.js)
(function () {
  const modal = document.getElementById("menuModal");
  const log = document.getElementById("changeLog");
  const historial = window.EA.historial;

  document.getElementById("appVersion").textContent = "v" + historial[0].version;

  historial.forEach((entrada, i) => {
    const bloque = document.createElement("details");
    bloque.open = i === 0;
    const titulo = document.createElement("summary");
    titulo.textContent = `v${entrada.version} · ${entrada.fecha}`;
    const lista = document.createElement("ul");
    entrada.cambios.forEach(texto => {
      const item = document.createElement("li");
      item.textContent = texto;
      lista.appendChild(item);
    });
    bloque.append(titulo, lista);
    log.appendChild(bloque);
  });

  document.getElementById("btnMenu").addEventListener("click", () => modal.classList.add("open"));
  document.getElementById("btnCloseMenu").addEventListener("click", () => modal.classList.remove("open"));
  document.getElementById("btnReload").addEventListener("click", () => location.reload());
  modal.addEventListener("click", e => { if (e.target === modal) modal.classList.remove("open"); });
})();
