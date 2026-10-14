/* ===== LOGIN INTRO SEQUENCE ===== */
(function(){
  const modal = document.getElementById('loginModal');
  if(!modal) return;
  const stage = modal.querySelector('.login-stage');
  const reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  let t1, t2;
  new MutationObserver(() => {
    clearTimeout(t1); clearTimeout(t2);
    if(modal.classList.contains('open')){
      if(reduce) return;
      stage.classList.add('intro');
      t2 = setTimeout(() => {
        const a = document.activeElement;
        if(a && stage.contains(a) && a.blur) a.blur();
      }, 260);
      t1 = setTimeout(() => {
        stage.classList.remove('intro');
        if(window.matchMedia('(pointer:fine)').matches){
          const em = document.getElementById('loginEmail');
          setTimeout(() => { if(modal.classList.contains('open') && em) em.focus(); }, 500);
        }
      }, 1500);
    } else {
      stage.classList.remove('intro');
    }
  }).observe(modal, {attributes:true, attributeFilter:['class']});
})();
