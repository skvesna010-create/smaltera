(function(){
  var items = document.querySelectorAll('.mn-item'), t;
  function close(except){ items.forEach(function(it){ if (it !== except){ it.classList.remove('open'); it.querySelector('.mn-btn').setAttribute('aria-expanded','false'); } }); }
  function open(it){ close(it); it.classList.add('open'); it.querySelector('.mn-btn').setAttribute('aria-expanded','true'); }
  var hover = window.matchMedia('(hover:hover)').matches;
  items.forEach(function(it){
    var b = it.querySelector('.mn-btn');
    b.addEventListener('click', function(e){ e.stopPropagation(); it.classList.contains('open') ? close() : open(it); });
    if (hover){
      it.addEventListener('mouseenter', function(){ clearTimeout(t); open(it); });
      it.addEventListener('mouseleave', function(){ t = setTimeout(close, 180); });
    }
    it.querySelectorAll('.mn-drop a').forEach(function(a){ a.addEventListener('click', function(){ close(); }); });
  });
  document.addEventListener('click', function(e){ if (!e.target.closest('.mn-item')) close(); });
  document.addEventListener('keydown', function(e){ if (e.key === 'Escape'){ close(); mob(false); } });
  var bg = document.querySelector('.mn-burger'), mm = document.getElementById('mnMob');
  function mob(on){ if (!mm) return; mm.hidden = !on; bg.setAttribute('aria-expanded', on ? 'true' : 'false'); bg.setAttribute('aria-label', on ? 'Закрыть меню' : 'Открыть меню'); document.documentElement.style.overflow = on ? 'hidden' : ''; }
  if (bg) bg.addEventListener('click', function(){ mob(mm.hidden); });
  if (mm) mm.querySelectorAll('a').forEach(function(a){ a.addEventListener('click', function(){ mob(false); }); });
  var here = location.pathname.replace(/index\.html$/, '');
  document.querySelectorAll('.mn-link, .mn-drop a').forEach(function(a){
    var u = new URL(a.getAttribute('href'), location.href);
    if (!u.hash && u.pathname.replace(/index\.html$/, '') === here) a.setAttribute('aria-current', 'page');
  });
})();
