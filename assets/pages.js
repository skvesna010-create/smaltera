/* Отрисовка объектов, отзывов, видео и команды из assets/data.js */
(function(){
  var SM = window.SM || {}, me = document.currentScript;
  var ROOT = me ? me.src.replace(/assets\/pages\.js.*$/, '') : '';
  var anyDemo = false;
  function U(p){ return !p ? '' : /^(https?:|\/|data:)/.test(p) ? p : ROOT + p; }
  function el(tag, cls, txt){ var e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; }
  function badge(){ anyDemo = true; return el('span', 'demo-badge', 'Пример'); }
  function img(src, alt, cls){ var i = new Image(); i.loading = 'lazy'; i.alt = alt || ''; if (cls) i.className = cls; i.src = U(src); i.onerror = function(){ i.style.visibility = 'hidden'; }; return i; }
  function byId(id){ return (SM.projects || []).filter(function(p){ return p.id === id; })[0]; }
  function objUrl(p){ return ROOT + 'obekt.html?id=' + encodeURIComponent(p.id); }

  /* ---------- объекты ---------- */
  function projCard(p){
    var a = el('a', 'pj'); a.href = objUrl(p);
    var ph = el('span', 'pj-ph'); ph.appendChild(img(p.photos && p.photos[0], p.title));
    if (p.demo) ph.appendChild(badge());
    ph.appendChild(el('span', 'pj-cnt', (p.photos || []).length + ' фото'));
    a.appendChild(ph);
    var tx = el('span', 'pj-tx');
    tx.appendChild(el('small', 'pj-type', p.type + (p.district ? ' · ' + p.district : '')));
    tx.appendChild(el('b', null, p.title));
    var m = el('span', 'pj-meta'); [p.area + ' м²', p.days + ' дней'].forEach(function(t){ m.appendChild(el('span', null, t)); }); tx.appendChild(m);
    tx.appendChild(el('span', 'pj-price', p.price));
    a.appendChild(tx);
    return a;
  }
  function renderProjects(box){
    var list = (SM.projects || []).slice();
    if (box.dataset.service) list = list.filter(function(p){ return p.service === box.dataset.service; });
    if (box.dataset.exclude) list = list.filter(function(p){ return p.id !== box.dataset.exclude; });
    if (box.dataset.limit) list = list.slice(0, +box.dataset.limit);
    if (!list.length){ var sec = box.closest('[data-hide-empty]'); if (sec) sec.hidden = true; return; }
    var grid = el('div', 'pj-grid');
    list.forEach(function(p){ grid.appendChild(projCard(p)); });
    if (box.dataset.filter){
      var types = []; list.forEach(function(p){ if (types.indexOf(p.type) < 0) types.push(p.type); });
      var chips = el('div', 'qnav pj-filter');
      ['Все объекты'].concat(types).forEach(function(t, i){
        var b = el('button', i ? '' : 'on', t); b.type = 'button';
        b.addEventListener('click', function(){
          chips.querySelectorAll('button').forEach(function(x){ x.classList.remove('on'); }); b.classList.add('on');
          grid.querySelectorAll('.pj').forEach(function(c, k){ c.hidden = i && list[k].type !== t; });
        });
        chips.appendChild(b);
      });
      box.appendChild(chips);
    }
    box.appendChild(grid);
  }

  /* ---------- отзывы ---------- */
  var SRC = { yandex:'Яндекс Карты', '2gis':'2ГИС' };
  function revCard(r){
    var d = el('article', 'rv');
    var top = el('div', 'rv-top'); top.appendChild(el('span', 'rv-ava', (r.name || '?').trim().charAt(0).toUpperCase()));
    var who = el('span', 'rv-who'); who.appendChild(el('b', null, r.name)); who.appendChild(el('small', null, r.place || '')); top.appendChild(who);
    if (r.demo) top.appendChild(badge()); else if (SRC[r.source]) top.appendChild(el('span', 'rv-src', SRC[r.source]));
    d.appendChild(top);
    d.appendChild(el('i', 'rv-stars', '★★★★★'.slice(0, r.stars || 5)));
    var t = el('p', 'rv-text', r.text); d.appendChild(t);
    var more = el('button', 'rv-more', 'Читать полностью'); more.type = 'button'; more.hidden = true; d.appendChild(more);
    more.addEventListener('click', function(){ d.classList.toggle('open'); more.textContent = d.classList.contains('open') ? 'Свернуть' : 'Читать полностью'; });
    requestAnimationFrame(function(){ if (t.scrollHeight > t.clientHeight + 4) more.hidden = false; });
    if (r.photo) d.appendChild(img(r.photo, 'Фото объекта из отзыва', 'rv-ph'));
    var f = el('div', 'rv-foot');
    var p = r.project && byId(r.project);
    if (p){ var a = el('a', 'rv-work', r.work || p.title); a.href = objUrl(p); f.appendChild(a); } else f.appendChild(el('span', 'rv-work', r.work || ''));
    f.appendChild(el('span', null, r.date || ''));
    d.appendChild(f);
    return d;
  }
  function renderReviews(box){
    var list = (SM.reviews || []).slice();
    if (box.dataset.project) list = list.filter(function(r){ return r.project === box.dataset.project; });
    if (box.dataset.limit) list = list.slice(0, +box.dataset.limit);
    if (!list.length){ var sec = box.closest('[data-hide-empty]'); if (sec) sec.hidden = true; return; }
    var g = el('div', 'rv-grid'); list.forEach(function(r){ g.appendChild(revCard(r)); }); box.appendChild(g);
  }
  function renderRating(box){
    var R = SM.rating || {};
    if (R.value){ var s = el('div', 'rv-score'); s.appendChild(el('b', null, R.value)); var t = el('span'); t.appendChild(el('i', 'rv-stars', '★★★★★')); t.appendChild(el('small', null, R.count ? R.count + ' отзывов на картах' : '')); s.appendChild(t); box.appendChild(s); }
    var links = el('div', 'row');
    if (SM.yandexMaps){ var a = el('a', 'btn', 'Отзывы на Яндекс Картах'); a.href = SM.yandexMaps; a.target = '_blank'; a.rel = 'noopener'; links.appendChild(a); }
    if (SM.gis){ var b = el('a', 'btn ghost', 'Отзывы в 2ГИС'); b.href = SM.gis; b.target = '_blank'; b.rel = 'noopener'; links.appendChild(b); }
    if (links.children.length) box.appendChild(links);
  }

  /* ---------- видео ---------- */
  var vp;
  function player(v){
    if (!vp){
      vp = el('div', 'vp'); vp.hidden = true; vp.setAttribute('role', 'dialog'); vp.setAttribute('aria-modal', 'true');
      var x = el('button', 'vp-x', '×'); x.type = 'button'; x.setAttribute('aria-label', 'Закрыть');
      var inner = el('div', 'vp-in'); vp.appendChild(x); vp.appendChild(inner); document.body.appendChild(vp);
      function close(){ vp.hidden = true; inner.innerHTML = ''; }
      x.addEventListener('click', close); vp.addEventListener('click', function(e){ if (e.target === vp) close(); });
      document.addEventListener('keydown', function(e){ if (e.key === 'Escape' && !vp.hidden) close(); });
    }
    var box = vp.querySelector('.vp-in'); box.innerHTML = '';
    if (v.embed){ var f = el('iframe'); f.src = v.embed; f.allow = 'autoplay; fullscreen'; f.allowFullscreen = true; box.appendChild(f); }
    else if (v.file){ var vd = el('video'); vd.src = U(v.file); vd.controls = true; vd.autoplay = true; box.appendChild(vd); }
    else box.appendChild(el('p', null, 'Здесь будет видео с объекта.'));
    vp.hidden = false;
  }
  function renderVideos(box){
    var list = (SM.videos || []).slice();
    if (box.dataset.project) list = list.filter(function(v){ return v.project === box.dataset.project; });
    if (!list.length){ var sec = box.closest('[data-hide-empty]'); if (sec) sec.hidden = true; return; }
    var g = el('div', 'vd-grid');
    list.forEach(function(v){
      var b = el('button', 'vd'); b.type = 'button';
      b.appendChild(img(v.poster, ''));
      if (v.demo) b.appendChild(badge());
      b.appendChild(el('span', 'vd-play'));
      var t = el('span', 'vd-t'); t.appendChild(el('b', null, v.title)); t.appendChild(el('span', null, v.note || '')); b.appendChild(t);
      b.addEventListener('click', function(){ player(v); });
      g.appendChild(b);
    });
    box.appendChild(g);
  }

  /* ---------- команда ---------- */
  function renderTeam(box){
    var g = el('div', 'tm-grid');
    (SM.team || []).forEach(function(t){
      var c = el('div', 'tmc');
      var ph = el('div', 'tmc-ph');
      if (t.photo) ph.appendChild(img(t.photo, t.name));
      else ph.appendChild(el('span', null, (t.role || '?').charAt(0)));
      if (t.demo) ph.appendChild(badge());
      c.appendChild(ph);
      var tx = el('div', 'tmc-tx');
      tx.appendChild(el('small', null, t.role)); tx.appendChild(el('b', null, t.name)); if (t.exp) tx.appendChild(el('em', null, t.exp)); if (t.text) tx.appendChild(el('p', null, t.text));
      c.appendChild(tx); g.appendChild(c);
    });
    box.appendChild(g);
  }

  /* ---------- страница объекта ---------- */
  function renderProject(box){
    var id = new URLSearchParams(location.search).get('id');
    var p = id && byId(id);
    var h1 = document.querySelector('.pg-hero h1'), lead = document.querySelector('.pg-hero .lead');
    if (!p){ h1.textContent = 'Объект не найден'; lead.innerHTML = 'Возможно, ссылка устарела. <a href="' + ROOT + 'obekty.html">Посмотреть все объекты</a>'; return; }
    document.title = p.title + ' — ' + p.type + ' | Смальтэра';
    h1.textContent = p.title; if (p.demo) h1.appendChild(badge());
    lead.textContent = p.type + ' · ' + p.area + ' м² · ' + p.days + ' дней';
    var cr = document.querySelector('.crumbs .cur'); if (cr) cr.textContent = p.title;
    var lay = el('div', 'ob');
    /* галерея */
    var gal = el('div', 'ob-gal'), main = el('div', 'ob-main'), mi = img(p.photos[0], p.title); main.appendChild(mi); gal.appendChild(main);
    var th = el('div', 'ob-th');
    p.photos.forEach(function(src, i){
      var b = el('button', i ? '' : 'on'); b.type = 'button'; b.setAttribute('aria-label', 'Фото ' + (i + 1)); b.appendChild(img(src, ''));
      b.addEventListener('click', function(){ mi.src = U(src); th.querySelectorAll('button').forEach(function(x){ x.classList.remove('on'); }); b.classList.add('on'); });
      th.appendChild(b);
    });
    if (p.photos.length > 1) gal.appendChild(th);
    lay.appendChild(gal);
    /* карточка */
    var side = el('aside', 'ob-side');
    var dl = el('div', 'ob-specs');
    [['Вид ремонта', p.type], ['Район', p.district], ['Площадь', p.area + ' м²'], ['Срок', p.days + ' дней'], ['Год', p.year]].forEach(function(r){
      if (!r[1]) return; var d = el('div'); d.appendChild(el('span', null, r[0])); d.appendChild(el('b', null, String(r[1]))); dl.appendChild(d);
    });
    side.appendChild(dl);
    side.appendChild(el('small', 'ob-pl', 'Стоимость работ')); side.appendChild(el('b', 'ob-price', p.price));
    var c1 = el('a', 'btn', 'Рассчитать похожий ремонт'); c1.href = ROOT + '#quiz'; side.appendChild(c1);
    if (p.service){ var c2 = el('a', 'btn ghost', 'Подробнее об услуге'); c2.href = ROOT + 'uslugi/' + p.service + '.html'; side.appendChild(c2); }
    lay.appendChild(side);
    box.appendChild(lay);
    /* задача и работы */
    var two = el('div', 'two ob-two');
    if (p.task){ var b1 = el('div', 'box'); b1.appendChild(el('h3', null, 'Задача клиента')); b1.appendChild(el('p', null, p.task)); two.appendChild(b1); }
    if (p.done && p.done.length){ var b2 = el('div', 'box'); b2.appendChild(el('h3', null, 'Что сделали')); var ul = el('ul'); p.done.forEach(function(x){ ul.appendChild(el('li', null, x)); }); b2.appendChild(ul); two.appendChild(b2); }
    var s1 = el('section', 'blk'); s1.appendChild(two); box.appendChild(s1);
    if (p.before && p.before.length){
      var s2 = el('section', 'blk'); s2.appendChild(el('h2', null, 'До ремонта'));
      var bg = el('div', 'ob-before'); p.before.forEach(function(src){ bg.appendChild(img(src, 'До ремонта')); }); s2.appendChild(bg); box.appendChild(s2);
    }
    [['reviews', 'Отзыв клиента'], ['videos', 'Видео с объекта']].forEach(function(k){
      var s = el('section', 'blk'); s.setAttribute('data-hide-empty', ''); s.appendChild(el('h2', null, k[1]));
      var c = el('div'); c.dataset.project = p.id; s.appendChild(c); box.appendChild(s);
      (k[0] === 'reviews' ? renderReviews : renderVideos)(c);
    });
    var s3 = el('section', 'blk'); s3.setAttribute('data-hide-empty', ''); s3.appendChild(el('h2', null, 'Другие объекты'));
    var c3 = el('div'); c3.dataset.exclude = p.id; c3.dataset.limit = '3'; s3.appendChild(c3); box.appendChild(s3); renderProjects(c3);
  }

  var R = { projects:renderProjects, reviews:renderReviews, rating:renderRating, videos:renderVideos, team:renderTeam, project:renderProject };
  document.querySelectorAll('[data-sm]').forEach(function(b){ var f = R[b.dataset.sm]; if (f) f(b); });
  var n = document.querySelector('[data-sm-notice]');
  if (n && anyDemo){ n.hidden = false; }
})();
