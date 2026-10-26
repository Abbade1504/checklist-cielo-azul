/* Cola de envíos sin conexión – Check list Cielo Azul
 * La usan la página (index.html) y el service worker (sw.js).
 * Cada check list se guarda primero en el celular (IndexedDB) y se manda
 * cuando hay internet. El servidor ignora envíos repetidos por su ID.
 */
var API_URL = 'https://script.google.com/macros/s/AKfycbzNAEcmSJ9XIwBdYqH1c4zgnbCPHgQEyHocLLAGhUTVsHDJwz_4VSuCPvieLIK_EaMF/exec';

var Cola = (function () {
  var DB = 'checklist-cielo-azul', STORE = 'pendientes';

  function abrir() {
    return new Promise(function (ok, mal) {
      var r = indexedDB.open(DB, 1);
      r.onupgradeneeded = function () { r.result.createObjectStore(STORE, { keyPath: 'id' }); };
      r.onsuccess = function () { ok(r.result); };
      r.onerror = function () { mal(r.error); };
    });
  }
  function tx(modo, fn) {
    return abrir().then(function (db) {
      return new Promise(function (ok, mal) {
        var t = db.transaction(STORE, modo), st = t.objectStore(STORE), res;
        res = fn(st);
        t.oncomplete = function () { ok(res && res.result !== undefined ? res.result : res); };
        t.onerror = function () { mal(t.error); };
      });
    });
  }

  function guardar(item) { return tx('readwrite', function (st) { st.put(item); }); }
  function borrar(id) { return tx('readwrite', function (st) { st.delete(id); }); }
  function todos() { return tx('readonly', function (st) { return st.getAll(); }); }

  var enviando = null;
  /** Manda todo lo pendiente. Devuelve {enviados, pendientes, error}. */
  function enviarPendientes() {
    if (enviando) return enviando;
    enviando = todos().then(function (lista) {
      lista.sort(function (a, b) { return a.fecha < b.fecha ? -1 : 1; });
      var enviados = 0, error = '';
      return lista.reduce(function (p, item) {
        return p.then(function () {
          return fetch(API_URL, { method: 'POST', body: JSON.stringify(item), redirect: 'follow' })
            .then(function (r) { return r.json(); })
            .then(function (j) {
              if (j && j.ok) { enviados++; return borrar(item.id); }
              // El servidor rechazó el envío: se guarda el motivo y queda pendiente
              item.error = (j && j.error) || 'Error desconocido';
              error = item.error;
              return guardar(item);
            })
            .catch(function () { error = error || 'sin conexión'; });
        });
      }, Promise.resolve()).then(function () {
        return todos().then(function (resto) { return { enviados: enviados, pendientes: resto.length, error: error }; });
      });
    }).finally(function () { enviando = null; });
    return enviando;
  }

  return { guardar: guardar, todos: todos, borrar: borrar, enviarPendientes: enviarPendientes };
})();
