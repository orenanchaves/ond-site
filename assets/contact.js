/* Contato — modal reutilizável do OND.
   Injeta CSS + HTML e define openContact()/closeContact() globais.
   Se a página já tiver um #contactModal inline, não faz nada (usa o da página). */
(function(){
  if(window.__ondContact) return; window.__ondContact = true;
  if(document.getElementById('contactModal')) return; // página já tem o seu

  var css = ''
  + '.contact-overlay{position:fixed;inset:0;background:rgba(0,0,0,.55);backdrop-filter:blur(4px);z-index:900;opacity:0;pointer-events:none;transition:opacity .2s}'
  + '.contact-overlay.open{opacity:1;pointer-events:all}'
  + '.contact-modal{position:fixed;top:50%;left:50%;transform:translate(-50%,-52%) scale(.96);z-index:901;width:calc(100% - 40px);max-width:420px;background:var(--surface,#16161f);border:1px solid var(--border,#2a2a3a);border-radius:20px;padding:32px 28px;box-shadow:0 24px 64px rgba(0,0,0,.6);opacity:0;pointer-events:none;transition:opacity .22s,transform .25s cubic-bezier(.34,1.56,.64,1)}'
  + '.contact-modal.open{opacity:1;pointer-events:all;transform:translate(-50%,-50%) scale(1)}'
  + '.contact-modal-header{display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:24px}'
  + '.contact-modal-title{font-size:1.2rem;font-weight:800;letter-spacing:-.02em;color:var(--text,#f0eeff)}'
  + '.contact-modal-sub{font-size:.84rem;color:var(--muted,#9a97b5);margin-top:4px}'
  + '.contact-modal-close{background:none;border:1px solid var(--border,#2a2a3a);border-radius:50%;width:32px;height:32px;cursor:pointer;color:var(--muted,#9a97b5);font-size:.9rem;display:flex;align-items:center;justify-content:center;flex-shrink:0;transition:border-color .15s,color .15s}'
  + '.contact-modal-close:hover{border-color:var(--purple,#7c3fff);color:var(--text,#f0eeff)}'
  + '.contact-options{display:flex;flex-direction:column;gap:10px}'
  + '.contact-option{display:flex;align-items:center;gap:14px;background:var(--card,#1c1c26);border:1px solid var(--border,#2a2a3a);border-radius:14px;padding:16px 18px;text-decoration:none;color:var(--text,#f0eeff);transition:border-color .15s,transform .15s}'
  + '.contact-option:hover{transform:translateX(4px)}'
  + '.contact-option.wa:hover{border-color:var(--ond-color-whatsapp,#25D366)}'
  + '.contact-option.mail:hover{border-color:var(--purple,#7c3fff)}'
  + '.contact-option.form:hover{border-color:var(--green,#00e676)}'
  + '.contact-option-icon{width:42px;height:42px;border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:1.2rem;flex-shrink:0}'
  + '.contact-option.wa .contact-option-icon{background:color-mix(in srgb, var(--ond-color-whatsapp,#25D366) 10%, transparent);border:1px solid color-mix(in srgb, var(--ond-color-whatsapp,#25D366) 20%, transparent)}'
  + '.contact-option.mail .contact-option-icon{background:var(--purple-dim,rgba(124,63,255,.12));border:1px solid color-mix(in srgb, var(--purple,#7c3fff) 20%, transparent)}'
  + '.contact-option.form .contact-option-icon{background:var(--green-dim,rgba(0,230,118,.12));border:1px solid color-mix(in srgb, var(--green,#00e676) 20%, transparent)}'
  + '.contact-option-label{font-size:.93rem;font-weight:700;margin-bottom:2px}'
  + '.contact-option-desc{font-size:.78rem;color:var(--muted,#9a97b5)}'
  + '.contact-option-arrow{margin-left:auto;color:var(--muted2,#6b6880);font-size:.9rem;flex-shrink:0}';
  var style = document.createElement('style'); style.textContent = css; document.head.appendChild(style);

  var wa = '<svg viewBox="0 0 24 24" width="22" height="22" style="fill:var(--ond-color-whatsapp,#25D366)"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.1.547 4.072 1.505 5.788L0 24l6.335-1.663A11.95 11.95 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.85 0-3.58-.5-5.07-1.37l-.36-.22-3.76.99 1-3.66-.24-.38A9.94 9.94 0 0 1 2 12c0-5.514 4.486-10 10-10s10 4.486 10 10-4.486 10-10 10z"/></svg>';
  var html = ''
  + '<div class="contact-overlay" id="contactOverlay"></div>'
  + '<div class="contact-modal" id="contactModal" role="dialog" aria-modal="true" aria-label="Fale com a gente">'
  +   '<div class="contact-modal-header"><div>'
  +     '<div class="contact-modal-title">Fale com a gente</div>'
  +     '<div class="contact-modal-sub">Escolha como prefere entrar em contato</div>'
  +   '</div><button class="contact-modal-close" onclick="closeContact()" aria-label="Fechar">✕</button></div>'
  +   '<div class="contact-options">'
  +     '<a href="https://wa.me/5511910214133?text=Olá! vim do site OND" class="contact-option wa" target="_blank" rel="noopener">'
  +       '<div class="contact-option-icon">' + wa + '</div>'
  +       '<div><div class="contact-option-label">WhatsApp</div><div class="contact-option-desc">Resposta rápida · (11) 91021-4133</div></div>'
  +       '<div class="contact-option-arrow">→</div></a>'
  +     '<a href="mailto:renan@agamatec.com" class="contact-option mail">'
  +       '<div class="contact-option-icon">✉️</div>'
  +       '<div><div class="contact-option-label">E-mail</div><div class="contact-option-desc">renan@agamatec.com</div></div>'
  +       '<div class="contact-option-arrow">→</div></a>'
  +     '<a href="https://pci.jotform.com/form/252517268656062" class="contact-option form" target="_blank" rel="noopener">'
  +       '<div class="contact-option-icon">📋</div>'
  +       '<div><div class="contact-option-label">Formulário de parceria</div><div class="contact-option-desc">Para agências e hotéis</div></div>'
  +       '<div class="contact-option-arrow">→</div></a>'
  +   '</div>'
  + '</div>';
  var wrap = document.createElement('div'); wrap.innerHTML = html;
  while(wrap.firstChild) document.body.appendChild(wrap.firstChild);

  window.openContact = function(e){ if(e && e.preventDefault) e.preventDefault();
    document.getElementById('contactOverlay').classList.add('open');
    document.getElementById('contactModal').classList.add('open');
    document.body.style.overflow='hidden'; };
  window.closeContact = function(){
    document.getElementById('contactOverlay').classList.remove('open');
    document.getElementById('contactModal').classList.remove('open');
    document.body.style.overflow=''; };
  document.getElementById('contactOverlay').addEventListener('click', window.closeContact);
  document.addEventListener('keydown', function(e){ if(e.key==='Escape') window.closeContact(); });
})();
