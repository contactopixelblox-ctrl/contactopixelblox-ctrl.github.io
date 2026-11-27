// Activa el uso sin conexión (solo funciona desde https o localhost, no abriendo el archivo)
(function () {
  const estado = document.getElementById("offlineStatus");
  if (!("serviceWorker" in navigator) || location.protocol === "file:") {
    estado.textContent = "Sin conexión: disponible solo desde el enlace web.";
    return;
  }
  estado.textContent = "Sin conexión: preparando…";
  navigator.serviceWorker.register("sw.js")
    .then(() => navigator.serviceWorker.ready)
    .then(() => { estado.textContent = "Sin conexión: lista ✓"; })
    .catch(() => { estado.textContent = "Sin conexión: no se pudo preparar."; });
})();
