(function(){
  /* запасное фото, если картинка не загрузилась */
  var FB = 'https://images.pexels.com/photos/6908500/pexels-photo-6908500.jpeg?auto=compress&cs=tinysrgb&w=1200';
  function fix(im){ if (im.dataset.fb || im.src.indexOf('images.pexels.com') < 0) return false; im.dataset.fb = '1'; im.classList.remove('err'); im.style.visibility = ''; im.style.opacity = ''; im.src = FB; return true; }
  document.addEventListener('error', function(e){ if (e.target.tagName === 'IMG' && fix(e.target)) e.stopImmediatePropagation(); }, true);
  document.querySelectorAll('img').forEach(function(im){ if (im.complete && !im.naturalWidth && im.src) fix(im); });
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
  /* реквизиты из assets/data.js */
  var SM = window.SM || {}, co = SM.company || {};
  if (co.name){ document.querySelectorAll('[data-company]').forEach(function(e){ e.textContent = [co.name, co.inn && 'ИНН ' + co.inn, co.ogrn && 'ОГРН ' + co.ogrn, co.address, co.email].filter(Boolean).join(' · '); e.hidden = false; }); }
  document.querySelectorAll('[data-co]').forEach(function(e){ var v = co[e.dataset.co]; if (v){ e.textContent = v; e.classList.remove('ph-fill'); } });
  /* Яндекс Метрика на всех страницах */
  if (SM.ym && !window.ym){ (function(m,e,t,r,i,k,a){m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};m[i].l=1*new Date();k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)})(window,document,'script','https://mc.yandex.ru/metrika/tag.js','ym'); ym(SM.ym,'init',{clickmap:true,trackLinks:true,accurateTrackBounce:true,webvisor:true}); }
  document.addEventListener('click', function(e){ var a = e.target.closest && e.target.closest('a[href^="tel:"]'); if (a && SM.ym && window.ym) ym(SM.ym, 'reachGoal', 'phone'); });
  /* уведомление о cookie */
  var seen = false; try { seen = localStorage.getItem('sm-ck') === '1'; } catch(e){}
  if (!seen){
    var pl = document.querySelector('.mf-docs a'), root = pl ? pl.getAttribute('href') : 'privacy.html';
    var ck = document.createElement('div'); ck.className = 'ck';
    ck.innerHTML = '<span>Мы используем cookie и Яндекс Метрику, чтобы сайт работал удобнее. Подробнее — в <a href="' + root + '">политике конфиденциальности</a>.</span><button type="button">Понятно</button>';
    ck.querySelector('button').addEventListener('click', function(){ try { localStorage.setItem('sm-ck', '1'); } catch(e){} ck.remove(); });
    document.body.appendChild(ck);
  }
  /* таблицы на телефоне превращаются в карточки: подписываем ячейки названиями колонок */
  document.querySelectorAll('table.ptbl, table.tbl').forEach(function(t){
    var head = t.querySelector('tr'); if (!head || !head.querySelector('th')) { t.classList.add('t-plain'); return; }
    var names = [].map.call(head.children, function(c){ return c.textContent.trim(); });
    head.classList.add('t-head'); t.classList.add('t-cards');
    t.querySelectorAll('tr').forEach(function(tr){ if (tr === head) return; [].forEach.call(tr.children, function(td, i){ if (i && names[i]) td.setAttribute('data-label', names[i]); }); });
  });
  var here = location.pathname.replace(/index\.html$/, '');
  document.querySelectorAll('.mn-link, .mn-drop a').forEach(function(a){
    var u = new URL(a.getAttribute('href'), location.href);
    if (!u.hash && u.pathname.replace(/index\.html$/, '') === here) a.setAttribute('aria-current', 'page');
  });
})();
