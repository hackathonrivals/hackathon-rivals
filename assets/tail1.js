/* ===== LOGIN CHARACTER: follows cursor / typing, covers eyes on password ===== */
(function(){
  const modal = document.getElementById('loginModal');
  if(!modal) return;
  const stage = modal.querySelector('.login-stage');
  const char  = stage.querySelector('.login-char');
  const head  = char.querySelector('.hd');
  const shake = char.querySelector('.sh');
  const pw    = document.getElementById('loginPassword');
  const err   = document.getElementById('loginError');
  const clamp = (v) => Math.max(-1, Math.min(1, v));

  function lookAt(x, y){
    const r = char.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const cy = r.top + Math.min(r.height, 120) * 0.35;
    const dx = clamp((x - cx) / 280), dy = clamp((y - cy) / 280);
    head.style.transform = 'translate(' + (dx*4).toFixed(1) + 'px,' + (dy*2.5).toFixed(1) + 'px) rotate(' + (dx*7).toFixed(1) + 'deg)';
  }
  function lookAtInput(el){
    const r = el.getBoundingClientRect();
    const textW = Math.min(r.width - 20, 18 + (el.value ? el.value.length * 9 : 0));
    lookAt(r.left + textW, r.top + r.height / 2);
  }
  function updateCover(){
    const covering = document.activeElement === pw;
    stage.classList.toggle('cover', covering);
    stage.classList.toggle('peek', covering && pw.type !== 'password');
  }

  document.addEventListener('mousemove', (e) => {
    if(!modal.classList.contains('open')) return;
    if(document.activeElement && stage.contains(document.activeElement) &&
       /^(INPUT|TEXTAREA)$/.test(document.activeElement.tagName)) return;
    lookAt(e.clientX, e.clientY);
  });
  stage.addEventListener('focusin', (e) => {
    if(e.target.tagName === 'INPUT' && e.target.type !== 'checkbox') lookAtInput(e.target);
    updateCover();
  });
  stage.addEventListener('focusout', () => setTimeout(updateCover, 0));
  stage.addEventListener('input', (e) => {
    if(e.target.tagName === 'INPUT' && e.target !== pw) lookAtInput(e.target);
  });
  stage.addEventListener('click', (e) => {
    if(e.target.closest('#pwToggle')) setTimeout(updateCover, 0);
  });

  new MutationObserver(() => {
    if(!modal.classList.contains('open')){
      stage.classList.remove('cover','peek');
      head.style.transform = '';
    }
  }).observe(modal, {attributes:true, attributeFilter:['class']});

  if(err) new MutationObserver(() => {
    if(err.classList.contains('show')){
      shake.classList.remove('shake'); void shake.getBoundingClientRect(); shake.classList.add('shake');
    }
  }).observe(err, {attributes:true, attributeFilter:['class']});
})();
