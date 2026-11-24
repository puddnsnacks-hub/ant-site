/* Header menus: one open at a time, Escape and outside click close. */
(function(){
  var sh=document.querySelector('.sh'); if(!sh) return;
  var btns=[].slice.call(sh.querySelectorAll('.sh__btn')), tog=sh.querySelector('.sh__toggle');
  function closeAll(except){btns.forEach(function(b){if(b!==except) b.setAttribute('aria-expanded','false');});}
  btns.forEach(function(b){b.addEventListener('click',function(){
    var open=b.getAttribute('aria-expanded')==='true'; closeAll(b); b.setAttribute('aria-expanded',String(!open));});});
  if(tog) tog.addEventListener('click',function(){
    var open=tog.getAttribute('aria-expanded')==='true';
    tog.setAttribute('aria-expanded',String(!open)); sh.classList.toggle('is-open',!open);});
  document.addEventListener('click',function(e){if(!sh.contains(e.target)) closeAll();});
  document.addEventListener('keydown',function(e){
    if(e.key!=='Escape') return;
    var b=btns.filter(function(x){return x.getAttribute('aria-expanded')==='true';})[0];
    closeAll(); if(b) b.focus();
    if(tog && sh.classList.contains('is-open')){sh.classList.remove('is-open');tog.setAttribute('aria-expanded','false');tog.focus();}
  });
})();
