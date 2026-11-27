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

  // Tema oscuro por defecto; el claro es opcional
  const tema = document.getElementById("themeToggle");
  function aplicarTema(claro) {
    document.documentElement.dataset.theme = claro ? "light" : "dark";
    document.querySelector('meta[name="theme-color"]').content = claro ? "#f4f6f8" : "#161a22";
  }
  try { tema.checked = localStorage.getItem("ea_tema") === "light"; } catch (e) {}
  aplicarTema(tema.checked);
  tema.addEventListener("change", () => {
    aplicarTema(tema.checked);
    try { localStorage.setItem("ea_tema", tema.checked ? "light" : "dark"); } catch (e) {}
  });

  function pintarProgreso() {
    const lista = document.getElementById("progressList");
    let datos = {};
    try { datos = JSON.parse(localStorage.getItem("ea_stats")) || {}; } catch (e) {}
    lista.innerHTML = "";
    Object.entries(window.EA.aperturas).forEach(([clave, apertura]) => {
      apertura.variantes.forEach(v => {
        const s = datos[`${clave}:${v.id}`] || { done: 0, clean: 0 };
        const fila = document.createElement("div");
        fila.className = "progress-row";
        const nombre = document.createElement("span");
        nombre.textContent = v.nombre;
        const cifra = document.createElement("strong");
        cifra.textContent = s.done ? `${s.clean}/${s.done} sin errores` : "Sin jugar";
        fila.append(nombre, cifra);
        lista.appendChild(fila);
      });
    });
  }

  document.getElementById("btnMenu").addEventListener("click", () => { pintarProgreso(); modal.classList.add("open"); });
  document.getElementById("btnCloseMenu").addEventListener("click", () => modal.classList.remove("open"));
  document.getElementById("btnReload").addEventListener("click", () => location.reload());
  modal.addEventListener("click", e => { if (e.target === modal) modal.classList.remove("open"); });
})();
