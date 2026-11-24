/* T188: site header menus. One open at a time; Escape and an outside click close; the phone menu toggles. */
(function(){
  var gh=document.querySelector('.gh'); if(!gh) return;
  var btns=[].slice.call(gh.querySelectorAll('.gh__btn')), tog=gh.querySelector('.gh__toggle');
  function closeAll(except){btns.forEach(function(b){if(b!==except) b.setAttribute('aria-expanded','false');});}
  btns.forEach(function(b){b.addEventListener('click',function(){var open=b.getAttribute('aria-expanded')==='true'; closeAll(b); b.setAttribute('aria-expanded',String(!open));});});
  if(tog) tog.addEventListener('click',function(){var open=tog.getAttribute('aria-expanded')==='true'; closeAll(); tog.setAttribute('aria-expanded',String(!open)); gh.classList.toggle('is-open',!open);});
  document.addEventListener('click',function(e){if(gh.contains(e.target)) return; closeAll(); if(tog && gh.classList.contains('is-open')){gh.classList.remove('is-open'); tog.setAttribute('aria-expanded','false');}});
  document.addEventListener('keydown',function(e){ if(e.key!=='Escape') return;
    var b=btns.filter(function(x){return x.getAttribute('aria-expanded')==='true';})[0]; closeAll(); if(b) b.focus();
    if(tog && gh.classList.contains('is-open')){gh.classList.remove('is-open'); tog.setAttribute('aria-expanded','false'); tog.focus();} });
})();
