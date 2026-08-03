/* OND — logo/ícone: FONTE ÚNICA (sprite injetado em runtime).
 * Trocar o ícone ou o wordmark = editar SÓ ESTE ARQUIVO. Propaga pra todas as
 * páginas (PT + en/es/fr/it) porque todas apenas referenciam <use href="#ond-logo">.
 *
 * Origem/design da verdade: ond-design-system/assets/logos/ (ond-logo-sprite.svg).
 * Regra de marca: a estrela é SEMPRE roxa #7f11f4 (nunca tingir, mesmo no B2B azul);
 * o wordmark é branco no dark / ink no claro (segue o texto).
 *
 * Cores tokenizadas (dá pra sobrescrever por contexto):
 *   --ond-logo-mark  → estrela  (default #7f11f4)
 *   --ond-logo-word  → wordmark (default var(--ond-color-text))
 * Ex.: sobre fundo roxo → defina --ond-logo-word:#fff.
 */
(function () {
  var ICON = 'M390.63,243.95l-76.8-49.85-63.18-129.75c-.84-1.72-2.35-2.7-3.97-2.96-1.62.26-3.14,1.24-3.97,2.96l-63.18,129.75-76.8,49.85c-1.69,1.1-2.5,2.9-2.45,4.68-.05,1.78.76,3.59,2.45,4.68l76.8,49.85,63.18,129.75c.84,1.72,2.35,2.7,3.97,2.96,1.62-.26,3.14-1.24,3.97-2.96l63.18-129.75,76.8-49.85c1.69-1.1,2.5-2.9,2.45-4.68.05-1.78-.76-3.59-2.45-4.68Z';
  var MARK = 'M327.85,243.05l-69.42-45.05-57.11-117.28c-.76-1.55-2.13-2.44-3.59-2.67-1.46.24-2.83,1.12-3.59,2.67l-57.11,117.28-69.42,45.05c-1.53.99-2.26,2.62-2.21,4.23-.04,1.61.69,3.24,2.21,4.23l69.42,45.05,57.11,117.28c.76,1.55,2.13,2.44,3.59,2.67,1.46-.24,2.83-1.12,3.59-2.67l57.11-117.28,69.42-45.05c1.53-.99,2.26-2.62,2.21-4.23.04-1.61-.69-3.24-2.21-4.23Z';
  var W_O = 'M373.12,248.52c0-42.54,34.63-76.96,77.17-76.96s77.18,34.42,77.18,76.96-34.63,77.18-77.18,77.18-77.17-34.42-77.17-77.18ZM477.88,248.52c0-15.18-12.4-27.58-27.58-27.58s-27.58,12.4-27.58,27.58,12.4,27.79,27.58,27.79,27.58-12.4,27.58-27.79Z';
  var W_N = 'M542.62,171.56h44.05c1.56,0,3.03.73,3.97,1.97l59.71,78.19h1.54v-75.15c0-2.76,2.24-5,5-5h41.53c2.76,0,5,2.24,5,5v144.14c0,2.76-2.24,5-5,5h-44.1c-1.53,0-2.98-.7-3.93-1.91l-59.49-75.6h-1.76v72.51c0,2.76-2.24,5-5,5h-41.53c-2.76,0-5-2.24-5-5v-144.14c0-2.76,2.24-5,5-5Z';
  var W_D = 'M880.82,247.53c0,50.65-43.38,78.17-75.75,78.17h-86.82c-2.76,0-5-2.24-5-5v-144.14c0-2.76,2.24-5,5-5h88.59c37.87,0,73.99,28.85,73.99,75.97ZM828.86,247.31c0-24.88-15.63-35.01-39.42-35.01h-24.66v72.67h26.42c21.58,0,37.65-14.53,37.65-37.65Z';

  var SVG =
    '<svg width="0" height="0" aria-hidden="true" focusable="false" style="position:absolute;width:0;height:0;overflow:hidden">' +
    '<style>' +
    '.ond-diamond{fill:var(--ond-logo-mark,#7f11f4)}' +
    '.ond-letter{fill:var(--ond-logo-word,var(--ond-color-text,#1c1c1c))}' +
    '</style>' +
    '<symbol id="ond-icon" viewBox="0 0 497.26 497.26"><path class="ond-diamond" d="' + ICON + '"/></symbol>' +
    '<symbol id="ond-logo" viewBox="0 0 951.32 497.26">' +
    '<path class="ond-diamond" d="' + MARK + '"/>' +
    '<path class="ond-letter" d="' + W_O + '"/>' +
    '<path class="ond-letter" d="' + W_N + '"/>' +
    '<path class="ond-letter" d="' + W_D + '"/>' +
    '</symbol></svg>';

  function inject() {
    if (document.getElementById('ond-logo')) return;
    var host = document.body || document.documentElement;
    var box = document.createElement('div');
    box.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden';
    box.setAttribute('aria-hidden', 'true');
    box.innerHTML = SVG;
    host.insertBefore(box, host.firstChild);
  }

  if (document.body) inject();
  else document.addEventListener('DOMContentLoaded', inject);
})();
