/* Отрисовка объектов, отзывов, видео и команды из assets/data.js */
(function(){
  var SM = window.SM || {}, me = document.currentScript;
  var ROOT = me ? me.src.replace(/assets\/pages\.js.*$/, '') : '';
  var anyDemo = false;
  function U(p){ return !p ? '' : /^(https?:|\/|data:)/.test(p) ? p : ROOT + p; }
  function el(tag, cls, txt){ var e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; }
  function badge(){ anyDemo = true; return el('span', 'demo-badge', 'Пример'); }
  /* фото может быть строкой или объектом { src, sm, alt } */
  function PS(x){ return x && typeof x === 'object' ? x.src : x; }
  function PSM(x){ return x && typeof x === 'object' ? (x.sm || x.src) : x; }
  function PA(x, d){ return x && typeof x === 'object' && x.alt ? x.alt : (d || ''); }
  window.smGoal = window.smGoal || function(n){ try { if (SM.ym && window.ym) ym(SM.ym, 'reachGoal', n); } catch(e){} };
  function embedOf(v){
    if (v.embed) return v.embed;
    var u = v.url || '', m;
    if ((m = u.match(/rutube\.ru\/(?:video|shorts|play\/embed)\/([a-z0-9]+)/i))) return 'https://rutube.ru/play/embed/' + m[1];
    if ((m = u.match(/video(-?\d+)_(\d+)/))) return 'https://vk.com/video_ext.php?oid=' + m[1] + '&id=' + m[2] + '&hd=2&autoplay=1';
    if ((m = u.match(/(?:youtu\.be\/|v=|shorts\/|embed\/)([\w-]{11})/))) return 'https://www.youtube.com/embed/' + m[1] + '?autoplay=1';
    return '';
  }
  function img(src, alt, cls){ var i = new Image(); i.loading = 'lazy'; i.alt = alt || ''; if (cls) i.className = cls; i.src = U(src); i.onerror = function(){ i.style.visibility = 'hidden'; }; return i; }
  function byId(id){ return (SM.projects || []).filter(function(p){ return p.id === id; })[0]; }
  function objUrl(p){ return ROOT + 'obekt.html?id=' + encodeURIComponent(p.id); }

  /* ---------- объекты ---------- */
  function projCard(p){
    var a = el('a', 'pj'); a.href = objUrl(p);
    var ph = el('span', 'pj-ph'); ph.appendChild(img(PSM(p.photos && p.photos[0]), PA(p.photos && p.photos[0], p.title)));
    if (p.demo) ph.appendChild(badge());
    ph.appendChild(el('span', 'pj-cnt', (p.photos || []).length + ' фото'));
    a.appendChild(ph);
    var tx = el('span', 'pj-tx');
    tx.appendChild(el('small', 'pj-type', p.type + (p.district ? ' · ' + p.district : '')));
    tx.appendChild(el('b', null, p.title));
    var m = el('span', 'pj-meta'); [p.area && p.area + ' м²', p.days && plural(p.days, 'день', 'дня', 'дней')].forEach(function(t){ if (t) m.appendChild(el('span', null, t)); }); tx.appendChild(m);
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
    if (r.photo) d.appendChild(img(PSM(r.photo), PA(r.photo, 'Фото объекта из отзыва'), 'rv-ph'));
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
    smGoal('video_play');
    var em = embedOf(v);
    if (em){ var f = el('iframe'); f.src = em; f.allow = 'autoplay; fullscreen'; f.allowFullscreen = true; box.appendChild(f); }
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
      b.appendChild(img(PSM(v.poster), PA(v.poster, v.title)));
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
      if (t.photo) ph.appendChild(img(PSM(t.photo), PA(t.photo, t.role + ' ' + t.name)));
      else ph.appendChild(el('span', null, (t.role || '?').charAt(0)));
      if (t.demo) ph.appendChild(badge());
      c.appendChild(ph);
      var tx = el('div', 'tmc-tx');
      tx.appendChild(el('small', null, t.role)); tx.appendChild(el('b', null, t.name)); if (t.exp) tx.appendChild(el('em', null, t.exp)); if (t.text) tx.appendChild(el('p', null, t.text));
      c.appendChild(tx); g.appendChild(c);
    });
    box.appendChild(g);
  }

  /* ---------- окно заявки (замер, «хочу так же») ---------- */
  var PHONE = SM.phone || '+7 (343) 000-00-00', TEL = '+' + PHONE.replace(/\D/g, '');
  function openLead(title, extra){
    smGoal('open_form');
    var w = el('div', 'ld'), box = el('div', 'ld-in'), x = el('button', 'ld-x', '×'); x.type = 'button'; x.setAttribute('aria-label', 'Закрыть');
    w.setAttribute('role', 'dialog'); w.setAttribute('aria-modal', 'true');
    box.appendChild(x); box.appendChild(el('h3', null, title || 'Бесплатный замер'));
    function close(){ w.remove(); document.removeEventListener('keydown', key); }
    function key(e){ if (e.key === 'Escape') close(); }
    x.onclick = close; w.onclick = function(e){ if (e.target === w) close(); }; document.addEventListener('keydown', key);
    if (!SM.leadEmail){
      box.appendChild(el('p', null, 'Позвоните — инженер ответит на вопросы и договорится о времени замера. Замер и смета бесплатно.'));
      var t = el('a', 'btn', 'Позвонить ' + PHONE); t.href = 'tel:' + TEL; box.appendChild(t);
      box.appendChild(el('small', null, 'Ежедневно 9:00–21:00'));
    } else {
      box.appendChild(el('p', null, 'Оставьте телефон — инженер перезвонит, ответит на вопросы и договорится о замере. Это бесплатно и ни к чему не обязывает.'));
      var f = el('form'); f.noValidate = true;
      f.innerHTML = '<label>Имя<input name="name" autocomplete="name" placeholder="Как к вам обращаться"></label><label>Телефон<input name="phone" type="tel" inputmode="tel" autocomplete="tel" placeholder="+7 (___) ___-__-__" required></label>' +
        '<label class="consent"><input type="checkbox" name="consent"><span>Даю <a href="' + ROOT + 'soglasie.html" target="_blank">согласие на обработку персональных данных</a> и принимаю <a href="' + ROOT + 'privacy.html" target="_blank">политику конфиденциальности</a></span></label>' +
        '<button class="btn" type="submit">Жду звонка</button><div class="ld-msg" role="status"></div>';
      box.appendChild(f);
      var ph = f.phone;
      ph.addEventListener('input', function(){ var d = ph.value.replace(/\D/g, ''); if (d[0] === '8') d = '7' + d.slice(1); if (d[0] !== '7') d = '7' + d; d = d.slice(0, 11); var r = '+7'; if (d.length > 1) r += ' (' + d.slice(1, 4); if (d.length >= 4) r += ') ' + d.slice(4, 7); if (d.length >= 7) r += '-' + d.slice(7, 9); if (d.length >= 9) r += '-' + d.slice(9, 11); ph.value = r; });
      f.addEventListener('submit', function(e){
        e.preventDefault(); var m = f.querySelector('.ld-msg');
        if (ph.value.replace(/\D/g, '').length < 11){ m.textContent = 'Введите номер полностью.'; ph.focus(); return; }
        if (!f.consent.checked){ f.querySelector('.consent').classList.add('need'); m.textContent = 'Отметьте согласие на обработку данных.'; return; }
        m.textContent = 'Отправляем…';
        var data = Object.assign({ _subject:'Заявка с сайта Смальтэра', _template:'table', _captcha:'false', 'Заявка':title, 'Имя':f.name.value || '—', 'Телефон':ph.value, 'Страница':document.title }, extra || {});
        fetch('https://formsubmit.co/ajax/' + encodeURIComponent(SM.leadEmail), { method:'POST', headers:{ 'Content-Type':'application/json', 'Accept':'application/json' }, body: JSON.stringify(data) })
          .then(function(r){ return r.json(); }).then(function(j){ if (String(j.success) !== 'true') throw 0;
            smGoal('lead');
            box.innerHTML = ''; box.appendChild(x); box.appendChild(el('h3', null, 'Спасибо, заявка у нас!')); box.appendChild(el('p', null, 'Инженер перезвонит вам в рабочее время.'));
            setTimeout(function(){ location.href = ROOT + 'spasibo.html'; }, 1200); })
          .catch(function(){ m.innerHTML = 'Не получилось отправить. Позвоните нам: <a href="tel:' + TEL + '">' + PHONE + '</a>'; });
      });
    }
    w.appendChild(box); document.body.appendChild(w);
    var first = box.querySelector('input, a.btn'); if (first) first.focus();
  }
  document.addEventListener('click', function(e){ var b = e.target.closest && e.target.closest('[data-lead]'); if (b){ e.preventDefault(); openLead(b.dataset.lead); } });
  window.smOpenLead = openLead;

  /* ---------- общие помощники ---------- */
  function num(s){ return parseInt(String(s || '').replace(/\D/g, ''), 10) || 0; }
  function rub(n){ return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' ₽'; }
  function plural(n, a, b, c){ var m = n % 10, h = n % 100; return n + ' ' + (m === 1 && h !== 11 ? a : m >= 2 && m <= 4 && (h < 12 || h > 14) ? b : c); }

  /* ---------- лента портфолио (на всех страницах) ---------- */
  function renderPortfolio(box){
    var all = (SM.projects || []).slice(), list = all;
    if (box.dataset.exclude) list = list.filter(function(p){ return p.id !== box.dataset.exclude; });
    if (box.dataset.service){ var s = box.dataset.service; list = list.filter(function(p){ return p.service === s; }).concat(list.filter(function(p){ return p.service !== s; })); }
    if (!list.length){ box.hidden = true; return; }
    var wrap = el('div', 'pf');
    var inn = el('div', 'pf-in'), head = el('div', 'pf-head'), hl = el('div');
    hl.appendChild(el('h2', null, box.dataset.title || 'Наши объекты'));
    hl.appendChild(el('p', null, box.dataset.text || 'Реальные квартиры: фото, сроки и стоимость работ. Нажмите на объект, чтобы посмотреть всё.'));
    head.appendChild(hl);
    var ctrl = el('div', 'pf-ctrl');
    var all_ = el('a', 'pf-all', 'Все объекты · ' + all.length); all_.href = ROOT + 'obekty.html'; ctrl.appendChild(all_);
    var pv = el('button', 'pf-arr', '‹'), nx = el('button', 'pf-arr', '›'); pv.type = nx.type = 'button'; pv.setAttribute('aria-label', 'Назад'); nx.setAttribute('aria-label', 'Вперёд');
    ctrl.appendChild(pv); ctrl.appendChild(nx); head.appendChild(ctrl); inn.appendChild(head); wrap.appendChild(inn);
    var tr = el('div', 'pf-track');
    list.forEach(function(p){
      var a = el('a', 'pf-card'); a.href = objUrl(p);
      a.appendChild(img(PSM(p.photos && p.photos[0]), PA(p.photos && p.photos[0], p.title)));
      var top = el('span', 'pf-top'), tl = el('span'); tl.style.display = 'flex'; tl.style.gap = '8px';
      tl.appendChild(el('span', 'pf-type', p.type)); if (p.demo){ anyDemo = true; tl.appendChild(el('span', 'pf-demo', 'Пример')); }
      top.appendChild(tl); top.appendChild(el('span', 'pf-cnt', (p.photos || []).length + ' фото')); a.appendChild(top);
      var inf = el('span', 'pf-info'); inf.appendChild(el('b', null, p.title));
      var ch = el('span', 'pf-chips'); [p.area && p.area + ' м²', p.days && plural(p.days, 'день', 'дня', 'дней'), p.district].forEach(function(t){ if (t) ch.appendChild(el('span', null, t)); }); inf.appendChild(ch);
      var row = el('span', 'pf-row'), pr = el('span', 'pf-price'); pr.appendChild(el('small', null, 'Стоимость работ')); pr.appendChild(document.createTextNode(p.price));
      row.appendChild(pr); row.appendChild(el('span', 'pf-go', 'Смотреть объект')); inf.appendChild(row); a.appendChild(inf);
      tr.appendChild(a);
    });
    wrap.appendChild(tr);
    var bar = el('div', 'pf-bar'), bi = el('i'); bar.appendChild(bi); wrap.appendChild(bar);
    box.appendChild(wrap);
    function upd(){ var max = tr.scrollWidth - tr.clientWidth; var w = tr.clientWidth / tr.scrollWidth; bi.style.width = (w * 100) + '%'; bi.style.transform = 'translateX(' + (max > 0 ? tr.scrollLeft / max * (1 / w - 1) * 100 : 0) + '%)'; pv.disabled = tr.scrollLeft < 5; nx.disabled = tr.scrollLeft > max - 5; }
    function go(d){ var c = tr.querySelector('.pf-card'); tr.scrollBy({ left: d * (c.offsetWidth + 20), behavior: 'smooth' }); }
    pv.addEventListener('click', function(){ go(-1); }); nx.addEventListener('click', function(){ go(1); });
    tr.addEventListener('scroll', upd, { passive: true }); window.addEventListener('resize', upd); setTimeout(upd, 50);
  }

  /* ---------- страница объекта ---------- */
  function lightbox(photos, start){
    var lb = el('div', 'lbx'), im = new Image(), i = start, cnt = el('span');
    var x = el('button', 'x', '×'), p = el('button', 'p', '‹'), n = el('button', 'n', '›');
    [x, p, n].forEach(function(b){ b.type = 'button'; }); x.setAttribute('aria-label', 'Закрыть');
    lb.appendChild(im); lb.appendChild(x); lb.appendChild(p); lb.appendChild(n); lb.appendChild(cnt); document.body.appendChild(lb);
    function show(){ im.src = U(PS(photos[i])); im.alt = PA(photos[i]); cnt.textContent = (i + 1) + ' / ' + photos.length; }
    function close(){ lb.remove(); document.removeEventListener('keydown', key); }
    function key(e){ if (e.key === 'Escape') close(); if (e.key === 'ArrowRight'){ i = (i + 1) % photos.length; show(); } if (e.key === 'ArrowLeft'){ i = (i - 1 + photos.length) % photos.length; show(); } }
    x.onclick = close; lb.onclick = function(e){ if (e.target === lb) close(); };
    p.onclick = function(){ i = (i - 1 + photos.length) % photos.length; show(); }; n.onclick = function(){ i = (i + 1) % photos.length; show(); };
    document.addEventListener('keydown', key); show();
  }
  function sec(box, title, sub){ var s = el('section', 'blk'); if (title) s.appendChild(el('h2', null, title)); if (sub) s.appendChild(el('p', 'sub', sub)); box.appendChild(s); return s; }
  function renderProject(box){
    var id = new URLSearchParams(location.search).get('id');
    var p = id && byId(id);
    var h1 = document.querySelector('.pg-hero h1'), lead = document.querySelector('.pg-hero .lead');
    if (!p){ h1.textContent = 'Объект не найден'; lead.innerHTML = 'Возможно, ссылка устарела. <a href="' + ROOT + 'obekty.html">Посмотреть все объекты</a>'; return; }
    document.body.classList.add('has-ob2');
    var price = num(p.price), perM = p.area ? price / p.area : 0;
    document.title = p.title + ' — ' + p.type + ', ' + p.area + ' м², ' + p.price + ' | Смальтэра';
    h1.textContent = p.title;
    lead.textContent = '';
    var sub = el('div', 'ob2-sub'); [p.type, p.district, p.area && p.area + ' м²', p.days && plural(p.days, 'день', 'дня', 'дней'), p.year].forEach(function(t){ if (t) sub.appendChild(el('span', null, String(t))); }); lead.appendChild(sub);
    var cr = document.querySelector('.crumbs .cur'); if (cr) cr.textContent = p.title;

    /* галерея + карточка заказа */
    var lay = el('div', 'ob2'), gal = el('div'), main = el('div', 'ob2-main'), mi = img(PS(p.photos[0]), PA(p.photos[0], p.title)), gi = 0;
    smGoal('object_view');
    main.appendChild(mi); if (p.demo) main.appendChild(badge());
    var cnt = el('span', 'ob2-count'); main.appendChild(cnt); main.appendChild(el('span', 'ob2-zoom', 'Нажмите, чтобы увеличить'));
    var th = el('div', 'ob2-th');
    function show(i){ gi = (i + p.photos.length) % p.photos.length; mi.src = U(PS(p.photos[gi])); mi.alt = PA(p.photos[gi], p.title); cnt.textContent = (gi + 1) + ' / ' + p.photos.length; th.querySelectorAll('button').forEach(function(b, k){ b.classList.toggle('on', k === gi); }); }
    if (p.photos.length > 1){
      var pb = el('button', 'ob2-nav p', '‹'), nb = el('button', 'ob2-nav n', '›'); pb.type = nb.type = 'button'; pb.setAttribute('aria-label', 'Предыдущее фото'); nb.setAttribute('aria-label', 'Следующее фото');
      pb.onclick = function(e){ e.stopPropagation(); show(gi - 1); }; nb.onclick = function(e){ e.stopPropagation(); show(gi + 1); };
      main.appendChild(pb); main.appendChild(nb);
      p.photos.forEach(function(src, k){ var b = el('button'); b.type = 'button'; b.setAttribute('aria-label', 'Фото ' + (k + 1)); b.appendChild(img(PSM(src), '')); b.onclick = function(){ show(k); }; th.appendChild(b); });
    }
    main.onclick = function(){ lightbox(p.photos, gi); };
    gal.appendChild(main); if (p.photos.length > 1) gal.appendChild(th); lay.appendChild(gal);
    var card = el('aside', 'ob2-card');
    card.appendChild(el('small', null, 'Стоимость работ на этом объекте'));
    card.appendChild(el('div', 'ob2-price', p.price));
    if (perM) card.appendChild(el('div', 'ob2-pm', '≈ ' + rub(perM) + ' за м²' + (p.days ? ' · ' + plural(p.days, 'день', 'дня', 'дней') : '')));
    var ul = el('ul'); ['Цена закреплена в договоре', 'Оплата по этапам после приёмки', 'Гарантия 3 года на все работы', /kapital|dizajner/.test(p.service || '') ? 'Дизайн-проект в подарок' : 'Фото с объекта каждую неделю'].forEach(function(t){ ul.appendChild(el('li', null, t)); }); card.appendChild(ul);
    var b1 = el('button', 'btn', 'Хочу такой же ремонт'); b1.type = 'button'; b1.onclick = function(){ openLead('Хочу такой же ремонт', { 'Объект': p.title + ', ' + p.price }); }; card.appendChild(b1);
    var b2 = el('button', 'btn ghost', 'Бесплатный замер'); b2.type = 'button'; b2.onclick = function(){ openLead('Бесплатный замер'); }; card.appendChild(b2);
    var tel = el('a', 'ob2-tel', PHONE); tel.href = 'tel:' + TEL; card.appendChild(tel);
    lay.appendChild(card); box.appendChild(lay); show(0);

    /* цифры */
    var nums = el('div', 'ob2-nums');
    [['Площадь', p.area ? p.area + ' м²' : '—'], ['Срок ремонта', p.days ? plural(p.days, 'день', 'дня', 'дней') : '—'], ['Стоимость работ', p.price || '—'], ['Цена за м²', perM ? rub(perM) : '—']].forEach(function(r){ var d = el('div'); d.appendChild(el('small', null, r[0])); d.appendChild(el('b', null, r[1])); nums.appendChild(d); });
    box.appendChild(nums);

    /* задача и работы */
    var s1 = sec(box, 'Задача и что сделали'), two = el('div', 'two');
    if (p.task){ var q = el('div', 'ob2-quote'); q.appendChild(el('h3', null, 'С чем пришёл клиент')); q.appendChild(el('p', null, p.task)); two.appendChild(q); }
    if (p.done && p.done.length){ var dn = el('div', 'box'); dn.appendChild(el('h3', null, 'Что мы сделали')); var dl = el('ul', 'ob2-done'); p.done.forEach(function(x){ dl.appendChild(el('li', null, x)); }); dn.appendChild(dl); two.appendChild(dn); }
    s1.appendChild(two);

    /* смета */
    if (p.smeta && p.smeta.length){
      var s2 = sec(box, 'Смета по объекту', 'Из чего сложилась стоимость работ. Материалы оплачивались отдельно.');
      var tw = el('div', 'tw'), t = el('table', 'ptbl ob2-smeta'), tot = 0, mx = 0;
      p.smeta.forEach(function(r){ tot += r[1]; mx = Math.max(mx, r[1]); });
      var hr = el('tr'); hr.appendChild(el('th', null, 'Работы')); hr.appendChild(el('th', null, 'Сумма')); t.appendChild(hr);
      p.smeta.forEach(function(r){ var tr = el('tr'), a = el('td'); a.appendChild(el('b', null, r[0])); var bar = el('span', 'ob2-bar'), bi = el('i'); bi.style.width = (r[1] / mx * 100) + '%'; bar.appendChild(bi); a.appendChild(bar); tr.appendChild(a); tr.appendChild(el('td', null, rub(r[1]))); t.appendChild(tr); });
      var tt = el('tr', 'tot'); tt.appendChild(el('td', null, 'Итого за работы')); tt.appendChild(el('td', null, rub(tot))); t.appendChild(tt);
      tw.appendChild(t); s2.appendChild(tw);
      var f = el('p', 'fine'); f.innerHTML = 'Хотите такую же подробную смету на свою квартиру? <a href="#" data-lead="Смета на мою квартиру">Закажите бесплатный замер</a>'; s2.appendChild(f);
    }

    /* этапы */
    if (p.stages && p.stages.length){
      var s3 = sec(box, 'Как шёл ремонт', p.days ? 'Всего ' + plural(p.days, 'день', 'дня', 'дней') + ' — точно по графику из договора.' : ''), tl = el('div', 'ob2-tl');
      p.stages.forEach(function(r){ var d = el('div'); d.appendChild(el('b', null, r[0])); d.appendChild(el('span', null, r[1])); tl.appendChild(d); });
      s3.appendChild(tl);
    }

    /* материалы */
    if (p.materials && p.materials.length){ var s4 = sec(box, 'Материалы'), m = el('div', 'ob2-mat'); p.materials.forEach(function(x){ m.appendChild(el('span', null, x)); }); s4.appendChild(m); }

    /* отзыв и видео */
    [['reviews', 'Отзыв клиента'], ['videos', 'Видео с объекта']].forEach(function(k){
      var s = sec(box, k[1]); s.setAttribute('data-hide-empty', ''); var c = el('div'); c.dataset.project = p.id; s.appendChild(c);
      (k[0] === 'reviews' ? renderReviews : renderVideos)(c);
    });

    /* расчёт для своей квартиры */
    if (perM){
      var s5 = sec(box, 'Сколько будет стоить такой ремонт у вас'), cw = el('div', 'ob2-calc'), l = el('div');
      var lab = el('label'), lv = el('span'); lab.appendChild(el('span', null, 'Площадь вашей квартиры')); lab.appendChild(lv); l.appendChild(lab);
      var r = el('input'); r.type = 'range'; r.min = p.service === 'remont-vannoj' ? 2 : 20; r.max = p.service === 'remont-vannoj' ? 15 : 150; r.value = p.area; r.setAttribute('aria-label', 'Площадь, м²'); l.appendChild(r);
      var lim = el('div', 'lim'); lim.appendChild(el('span', null, r.min + ' м²')); lim.appendChild(el('span', null, r.max + ' м²')); l.appendChild(lim);
      l.appendChild(el('p', 'fine', 'Расчёт по цене этого объекта. Точную сумму закрепим в договоре после бесплатного замера.'));
      var res = el('div', 'ob2-res'); res.appendChild(el('small', null, p.type + ', работы')); var rv = el('b'); res.appendChild(rv);
      var rb = el('a', 'btn', 'Получить точную смету'); rb.href = ROOT + '#quiz'; res.appendChild(rb);
      function rc(){ lv.textContent = r.value + ' м²'; rv.textContent = '≈ ' + rub(Math.round(perM * r.value / 1000) * 1000); }
      r.addEventListener('input', rc); rc();
      cw.appendChild(l); cw.appendChild(res); s5.appendChild(cw);
    }

    /* гарантии */
    var s6 = sec(box, 'Почему с нами спокойно'), why = el('div', 'why');
    [['Цена в договоре', 'Сумма за работы не меняется без вашего письменного согласия.'], ['Оплата по этапам', 'Платите только за то, что уже сделано и принято.'], ['Гарантия 3 года', 'На все работы, прописана в договоре.'], ['Отчёты каждую неделю', 'Фото и видео с объекта от прораба.']].forEach(function(r){ var d = el('div'); d.appendChild(el('b', null, r[0])); d.appendChild(el('span', null, r[1])); why.appendChild(d); });
    s6.appendChild(why);

    /* другие объекты */
    var o = el('div'); o.dataset.exclude = p.id; o.dataset.title = 'Другие объекты'; o.dataset.service = p.service || ''; box.appendChild(o); renderPortfolio(o);

    /* нижняя панель на телефоне */
    var bb = el('div', 'ob2-bottom'), x1 = el('a', 'a', 'Хочу так же'), x2 = el('a', 'b', 'Позвонить'); x1.href = '#'; x1.onclick = function(e){ e.preventDefault(); openLead('Хочу такой же ремонт', { 'Объект': p.title + ', ' + p.price }); }; x2.href = 'tel:' + TEL; bb.appendChild(x1); bb.appendChild(x2); document.body.appendChild(bb);
  }

  var R = { portfolio:renderPortfolio, projects:renderProjects, reviews:renderReviews, rating:renderRating, videos:renderVideos, team:renderTeam, project:renderProject };
  document.querySelectorAll('[data-sm]').forEach(function(b){ var f = R[b.dataset.sm]; if (f) f(b); });
  var n = document.querySelector('[data-sm-notice]');
  if (n && anyDemo){ n.hidden = false; }
})();
