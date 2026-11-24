/* Viagens criadas em /explorar/viagens/nova/. No protótipo ficam neste navegador e entram na
   mesma lista dos roteiros (OND_ROTEIROS). Com o servidor, vêm da conta. */
(function () {
  var list = [];
  try { list = JSON.parse(localStorage.getItem('ond_comunidade_viagens_criadas')) || []; } catch (storageError) {}
  window.OND_ROTEIROS = list.concat(window.OND_ROTEIROS || []);
})();
