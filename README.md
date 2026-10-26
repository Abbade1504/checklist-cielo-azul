# Check list Cielo Azul – app para choferes

App web instalable (PWA) del check list diario de equipos FO-MA-03.

- Se instala desde el navegador ("Instalar" / "Agregar a pantalla de inicio"), sin Play Store.
- Funciona sin internet: el check list (con fotos) queda guardado en el celular y se envía solo cuando vuelve la señal.
- Envía a la misma planilla de Google, con los mismos avisos por email y el mismo panel de revisores que la versión web.

Archivos:
- `index.html` – la app (formulario).
- `cola.js` – cola de envíos sin conexión (IndexedDB). Contiene la URL del servidor (`API_URL`).
- `sw.js` – service worker: guarda la app para abrirla sin internet y envía en segundo plano.
- `manifest.webmanifest` e íconos – datos para instalarla en el celular.

La lista de choferes, ítems y sucursales se descarga del servidor (Apps Script) y se guarda en el celular; no está en este repositorio.
