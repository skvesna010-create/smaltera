/* Директ · Домилия — программа для подготовки, выгрузки и анализа рекламы в Яндекс Директе.
   Работает в браузере, данные хранятся в localStorage; резервная копия — JSON-файл. */
(function(){
'use strict';
var KEY = 'dk1', SEED = window.SEED;
var $ = function(s, r){ return (r || document).querySelector(s); };
var $$ = function(s, r){ return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
function h(tag, a, kids){
  var e = document.createElement(tag); a = a || {};
  for (var k in a){ var v = a[k]; if (v == null || v === false) continue;
    if (k === 'text') e.textContent = v; else if (k === 'html') e.innerHTML = v; else if (k.slice(0, 2) === 'on') e[k] = v; else e.setAttribute(k, v === true ? '' : v); }
  (kids || []).forEach(function(c){ if (c != null && c !== false) e.appendChild(typeof c === 'string' || typeof c === 'number' ? document.createTextNode(String(c)) : c); });
  return e;
}
function esc(s){ return String(s == null ? '' : s).replace(/[&<>"]/g, function(c){ return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' }[c]; }); }
function toast(t){ var e = h('div', { class:'toast', text:t }); document.body.appendChild(e); setTimeout(function(){ e.remove(); }, 2800); }
function copy(t, what){ (navigator.clipboard ? navigator.clipboard.writeText(t) : Promise.reject()).then(function(){ toast('Скопировано' + (what ? ': ' + what : '')); }, function(){ var ta = h('textarea'); ta.value = t; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); ta.remove(); toast('Скопировано'); }); }
function rub(n){ return Math.round(n || 0).toLocaleString('ru-RU') + ' ₽'; }
function num(n, d){ return (+n || 0).toLocaleString('ru-RU', { maximumFractionDigits:d == null ? 0 : d }); }
function clone(o){ return JSON.parse(JSON.stringify(o)); }
function download(name, data, type){ var b = data instanceof Blob ? data : new Blob([data], { type:type || 'text/plain;charset=utf-8' }); var a = h('a', { href:URL.createObjectURL(b), download:name }); document.body.appendChild(a); a.click(); setTimeout(function(){ URL.revokeObjectURL(a.href); a.remove(); }, 500); }

/* ================= состояние ================= */
function fresh(){
  return { v:1, niches:clone(SEED.niches), minus:clone(SEED.minus), minusOff:{}, compBrands:true, usp:clone(SEED.usp), sitelinks:clone(SEED.sitelinks), callouts:clone(SEED.callouts),
    comps:clone(SEED.competitors), compAds:'', stats:null, target:3500,
    forecast:{ budget:50000, cpc:140, cr:4, close:15, check:900000 },
    camp:{ region:'Екатеринбург', bid:60, prefix:'Домилия', display:{ remont:'remont', design:'dizain-proekt', bath:'vannaya', ceil:'potolki' }, utm:true },
    todo:{} };
}
var S; try { S = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch(e){}
if (!S || !S.niches) S = fresh();
var saveT = null;
function save(){ clearTimeout(saveT); saveT = setTimeout(function(){ try { localStorage.setItem(KEY, JSON.stringify(S)); $('#saved').textContent = 'Сохранено · ' + new Date().toLocaleTimeString('ru-RU', { hour:'2-digit', minute:'2-digit' }); } catch(e){ toast('Не удалось сохранить: мало места в браузере. Сделайте резервную копию.'); } }, 300); }

/* ================= текст ================= */
function norm(s){ return String(s || '').toLowerCase().replace(/ё/g, 'е').replace(/[^a-zа-я0-9+!\-\s]/gi, ' ').replace(/\s+/g, ' ').trim(); }
var STOP = { 'в':1, 'на':1, 'с':1, 'со':1, 'и':1, 'по':1, 'для':1, 'под':1, 'за':1, 'от':1, 'до':1, 'из':1, 'к':1, 'о':1, 'у':1, 'а':1, 'или':1, 'без':1, 'м2':1, 'м':1 };
function stem(w){ w = w.replace(/^[+!]/, ''); if (w.length <= 4) return w; return w.replace(/(ами|ями|ого|его|ому|ему|ыми|ими|ах|ях|ов|ев|ей|ой|ий|ый|ая|яя|ое|ее|ые|ие|ую|юю|ом|ем|ам|ям|а|я|ы|и|у|ю|е|о|ь)$/, ''); }
function words(p){ return norm(p).split(' ').filter(function(w){ return w && !/^-/.test(w); }); }
function stems(p){ return words(p).filter(function(w){ return !STOP[w.replace(/^[+!]/, '')]; }).map(stem); }
function cap(s){ s = String(s || '').trim(); return s.charAt(0).toUpperCase() + s.slice(1); }
function fixNames(s){
  return s.replace(/\bекб\b/gi, 'Екатеринбург').replace(/\bекатеринбург(е|а|у)?\b/gi, function(m){ return 'Е' + m.slice(1); })
    .replace(/\bwhite box\b/gi, 'White box').replace(/\bвайт бокс\b/gi, 'White box').replace(/\bм2\b/gi, 'м²').replace(/\bуралмаш\b/gi, 'Уралмаш').replace(/\bэльмаш\b/gi, 'Эльмаш')
    .replace(/\bакадемический\b/gi, 'Академический').replace(/\bвиз\b/gi, 'ВИЗ').replace(/\bхиммаш\b/gi, 'Химмаш').replace(/\bвторчермет\b/gi, 'Вторчермет').replace(/\bуктус\b/gi, 'Уктус')
    .replace(/\bюго западный\b/gi, 'Юго-Западный').replace(/\bширокая речка\b/gi, 'Широкая Речка').replace(/\bботаника\b/gi, 'Ботаника').replace(/\bпионерский\b/gi, 'Пионерский');
}
function allMinus(){
  var out = [];
  Object.keys(S.minus).forEach(function(c){ if (!S.minusOff[c]) out = out.concat(S.minus[c]); });
  if (S.compBrands) S.comps.forEach(function(c){ var n = norm(c.name.replace(/\(.*?\)/g, '')).split(' ').filter(function(w){ return w.length > 3 && !/ремонт|строй|дизайн|групп|студи|мастер|частн|хорош|премиум|принцип|отделк|гарант/.test(w); }); if (n.length) out.push(n.join(' ')); });
  var seen = {}; return out.map(norm).filter(function(w){ if (!w || seen[w]) return false; seen[w] = 1; return true; });
}

/* ================= проверка текстов по правилам Директа ================= */
var SUPER = /(^|\s)(лучш[а-яё]*|сам(ый|ая|ое|ые)\s|№\s?1|номер один|лидер[а-яё]*|первые? в|уникальн[а-яё]*|идеальн[а-яё]*|гарантия 100|100\s?% гарант)/i;
function check(txt, kind){
  var L = { title:[56, 22], text:[81, 23], sl:[30, 23], sld:[60, 23], co:[25, 25], disp:[20, 20] }[kind], out = [];
  var s = String(txt || '');
  if (!s.trim()){ if (kind === 'title' || kind === 'text') out.push(['bad', 'пусто']); return out; }
  if (s.length > L[0]) out.push(['bad', 'длиннее ' + L[0] + ' (' + s.length + ')']);
  s.split(/\s+/).forEach(function(w){ if (w.length > L[1]) out.push(['bad', 'слово длиннее ' + L[1] + ': «' + w + '»']); });
  if (kind === 'text' && (s.match(/[.,!?;:\-—«»"()]/g) || []).length > 15) out.push(['bad', 'больше 15 знаков препинания']);
  if (/[!?\[\]]/.test(s) && (kind === 'sl' || kind === 'sld')) out.push(['bad', 'нельзя «!», «?», «[», «]»']);
  if ((s.match(/!/g) || []).length > 1) out.push(['bad', 'больше одного «!»']);
  if (kind === 'title' && /!/.test(s)) out.push(['warn', '«!» в заголовке снижает доверие']);
  var caps = s.match(/\b[А-ЯЁA-Z]{4,}\b/g); if (caps && caps.some(function(w){ return !/^(ДОМИЛИЯ|WHITE|BOX)$/.test(w); })) out.push(['bad', 'слово целиком заглавными: ' + caps[0]]);
  if (SUPER.test(s)) out.push(['bad', 'превосходная степень («лучший», «№1»…) — нужна документальная проверка']);
  if (/\+?\d[\d\s\-()]{9,}\d/.test(s.replace(/\d[\d ]*\s?₽/g, ''))) out.push(['bad', 'телефон в тексте запрещён']);
  if (/https?:|www\.|\.ru\b/i.test(s)) out.push(['bad', 'ссылка в тексте запрещена']);
  if (/[\u{1F300}-\u{1FAFF}☀-➿]/u.test(s)) out.push(['bad', 'эмодзи']);
  if (/\s{2,}|\s[,.!?]/.test(s)) out.push(['warn', 'лишние пробелы']);
  if (/скидк/i.test(s) && !/до|%|₽/.test(s)) out.push(['warn', 'скидку указывайте с условиями']);
  if (kind === 'disp' && /[^a-zа-я0-9\-№\/%#]/i.test(s)) out.push(['bad', 'в отображаемой ссылке только буквы, цифры и - № / % #']);
  return out;
}
function fits(s, max){ return String(s || '').length <= max; }

/* ================= генерация объявлений ================= */
function t2For(n, g){
  var u = S.usp, gn = (g.name || '').toLowerCase();
  if (n.id === 'remont'){
    if (/космет|недорог/.test(gn)) return 'Цена в договоре — ' + u.cosm.replace(/^К/, 'к');
    if (/новострой/.test(gn)) return 'Ремонт новостройки — ' + u.price.replace(' под ключ', '') + ' под ключ';
    if (/цен/.test(gn)) return u.contract + ' — ' + u.price;
    return u.contract + ' — ' + u.price;
  }
  if (n.id === 'design') return 'Планировка, 3D и чертежи — смета за 24 часа';
  if (n.id === 'bath') return u.bath + ' — цена в договоре';
  if (n.id === 'ceil') return 'Натяжной потолок под ключ — замер бесплатно';
  return u.contract;
}
function genAd(n, g){
  var o = g.ad || {}, u = S.usp, p = fixNames(norm(g.phrases[0] || g.name)), t1 = cap(p);
  if (!/екатеринбург/i.test(t1)){ var a = t1 + ' в Екатеринбурге'; if (fits(a, 56)) t1 = a; }
  if (!fits(t1, 56)) t1 = cap(fixNames(g.name)).slice(0, 56);
  var t2 = t2For(n, g); if (!fits(t2, 56)) t2 = u.contract;
  var t3 = n.id === 'design' ? 'Стоимость проекта засчитаем в ремонт' : u.design + ' · ' + u.guarantee; if (!fits(t3, 56)) t3 = u.guarantee;
  var x1 = n.id === 'design' ? 'Обмеры, планировка, визуализация и рабочие чертежи. Замер бесплатно. Звоните!'
    : n.id === 'bath' ? 'Гидроизоляция, разводка, плитка, инсталляция. Оплата по этапам, гарантия 3 года'
    : n.id === 'ceil' ? 'Теневые, парящие, с подсветкой. Замер бесплатно, цена в договоре, гарантия'
    : 'Смета за 24 часа после замера. Оплата по этапам, без предоплаты. Гарантия 3 года';
  var x2 = n.id === 'remont' ? 'Рассчитайте стоимость за 1 минуту на сайте и получите дизайн-проект в подарок' : 'Рассчитайте стоимость на сайте за 1 минуту. Выезд замерщика — бесплатно';
  if (/новострой/i.test(g.name) && n.id === 'remont') x1 = 'Ремонт с нуля и после White box. Смета за 24 часа, оплата по этапам, гарантия';
  if (/космет/i.test(g.name)) x1 = 'Обои, покраска, полы, потолки, двери. Цена в договоре, без предоплаты за работы';
  return { t1:o.t1 || t1, t2:o.t2 || t2, t3:o.t3 || t3, x1:o.x1 || x1, x2:o.x2 || x2 };
}
function utm(url, n){
  if (!S.camp.utm) return url;
  var hash = '', i = url.indexOf('#'); if (i > -1){ hash = url.slice(i); url = url.slice(0, i); }
  return url + (url.indexOf('?') > -1 ? '&' : '?') + 'utm_source=yandex&utm_medium=cpc&utm_campaign={campaign_id}_' + n.id + '&utm_content={ad_id}&utm_term={keyword}&src={source_type}' + hash;
}
function slFor(n){ var L = S.sitelinks[n.id] || []; return L.map(function(x){ var base = n.url || ''; var href = x[2] ? (/^https?:/.test(x[2]) ? x[2] : base.replace(/#.*$/, '') + x[2]) : base; return { t:x[0], d:x[1], u:utm(href, n) }; }); }

/* кросс-минусовка внутри кампании: если фраза B содержит все слова фразы A и ещё что-то — эти слова идут в минус к A */
function crossMinus(n){
  if (S.camp.cross === false) return {};
  var all = []; n.groups.forEach(function(g, gi){ g.phrases.forEach(function(p){ var ps = norm(p); if (ps) all.push({ p:ps, gi:gi, st:stems(ps), w:words(ps) }); }); });
  var res = {};
  all.forEach(function(a){
    var extra = {};
    all.forEach(function(b){
      if (a === b || b.gi === a.gi || b.st.length <= a.st.length) return;
      if (a.st.every(function(s){ return b.st.indexOf(s) > -1; })){
        b.w.forEach(function(w){ var s = stem(w); if (a.st.indexOf(s) < 0 && !STOP[w] && w.length > 1 && !/^\d+$/.test(w)) extra[w.replace(/^[+!]/, '')] = 1; });
      }
    });
    var ex = Object.keys(extra); var out = a.p;
    ex.forEach(function(w){ var c = out + ' -' + w; if (c.length <= 4096) out = c; });
    res[a.gi + '|' + a.p] = out;
  });
  return res;
}

/* ================= разделы ================= */
var view = 'dash';
var V = {};
function go(v){ view = v; $$('#side [data-v]').forEach(function(b){ b.classList.toggle('on', b.dataset.v === v); }); var w = $('#view'); w.innerHTML = ''; $('#barR').innerHTML = ''; V[v](w); scrollTo(0, 0); try { history.replaceState(null, '', '#' + v); } catch(e){} }
$$('#side [data-v]').forEach(function(b){ b.onclick = function(){ go(b.dataset.v); }; });
function title(t){ $('#ttl').textContent = t; }
function field(label, input, sm){ return h('label', { class:'f' }, [label, input, sm ? h('small', { class:'muted sm', text:sm }) : null]); }
function inp(obj, key, type, onch){ var i = h('input', { type:type || 'text' }); i.value = obj[key] == null ? '' : obj[key]; i.oninput = function(){ obj[key] = type === 'number' ? +i.value : i.value; save(); if (onch) onch(); }; return i; }

/* ---------- Обзор ---------- */
function issuesCount(){
  var n = 0; S.niches.forEach(function(ni){ if (!ni.on) return; ni.groups.forEach(function(g){ var a = genAd(ni, g); [['title', a.t1], ['title', a.t2], ['title', a.t3], ['text', a.x1], ['text', a.x2]].forEach(function(x){ n += check(x[1], x[0]).filter(function(i){ return i[0] === 'bad'; }).length; }); }); }); return n;
}
V.dash = function(w){
  title('Обзор и прогноз');
  var on = S.niches.filter(function(n){ return n.on; });
  var ph = 0, gr = 0; on.forEach(function(n){ gr += n.groups.length; n.groups.forEach(function(g){ ph += g.phrases.length; }); });
  var iss = issuesCount(), todoN = TODO.length, todoD = TODO.filter(function(t){ return S.todo[t[0]]; }).length;
  w.appendChild(h('div', { class:'grid4' }, [
    h('div', { class:'kpi' }, [h('b', { text:on.length + ' / ' + S.niches.length }), h('span', { text:'направлений включено' })]),
    h('div', { class:'kpi' }, [h('b', { text:num(ph) }), h('span', { text:'ключевых фраз в ' + gr + ' группах' })]),
    h('div', { class:'kpi' }, [h('b', { text:num(allMinus().length) }), h('span', { text:'минус-слов' })]),
    h('div', { class:'kpi ' + (iss ? 'r' : 'g') }, [h('b', { text:iss ? iss + ' ошибок' : 'Без ошибок' }), h('span', { text:'в объявлениях по правилам Директа' })])]));
  if (S.stats && S.stats.sum){
    var s = S.stats.sum;
    w.appendChild(h('div', { class:'card' }, [h('h3', { text:'Последняя статистика · ' + (S.stats.file || '') }),
      h('div', { class:'grid4' }, [kpi(rub(s.cost), 'расход'), kpi(num(s.clk), 'кликов, CTR ' + num(s.imp ? s.clk / s.imp * 100 : 0, 2) + '%'), kpi(num(s.conv), 'заявок (конверсий)', s.conv ? 'g' : 'r'), kpi(s.conv ? rub(s.cost / s.conv) : '—', 'цена заявки, цель ' + rub(S.target), s.conv && s.cost / s.conv <= S.target ? 'g' : 'r')]),
      h('button', { class:'btn lt', text:'Открыть разбор →', onclick:function(){ go('stats'); } })]));
  }
  /* прогноз */
  var F = S.forecast, out = h('div', { class:'grid4' });
  function calc(){
    var clicks = F.budget / Math.max(1, F.cpc), leads = clicks * F.cr / 100, sales = leads * F.close / 100, cpl = leads ? F.budget / leads : 0, rev = sales * F.check;
    out.innerHTML = ''; [ [num(clicks), 'кликов в месяц'], [num(leads, 1), 'заявок в месяц'], [rub(cpl), 'цена заявки'], [num(sales, 1) + ' · ' + rub(rev), 'договоров и выручка'] ].forEach(function(x, i){ out.appendChild(kpi(x[0], x[1], i === 2 ? (cpl <= S.target ? 'g' : 'r') : '')); });
  }
  var fc = h('div', { class:'card' }, [h('h3', { text:'Прогноз: что даст бюджет' }),
    h('div', { class:'grid4' }, [field('Бюджет в месяц, ₽', inp(F, 'budget', 'number', calc)), field('Средняя цена клика, ₽', inp(F, 'cpc', 'number', calc), 'поиск по ремонту в Екб: обычно 80–250 ₽'), field('Конверсия сайта в заявку, %', inp(F, 'cr', 'number', calc), 'хороший квиз-лендинг: 3–8%'), field('Из заявки в договор, %', inp(F, 'close', 'number', calc))]),
    h('div', { class:'grid4' }, [field('Средний чек договора, ₽', inp(F, 'check', 'number', calc)), field('Целевая цена заявки, ₽', inp(S, 'target', 'number', calc), 'по ней программа оценивает фразы')]), out]);
  w.appendChild(fc); calc();
  /* распределение бюджета */
  var tot = on.reduce(function(a, n){ return a + (+n.weight || 0); }, 0) || 1, bars = h('div', { class:'bars' });
  on.forEach(function(n){ var b = F.budget * (n.weight || 0) / tot; bars.appendChild(h('div', { class:'barl' }, [h('span', { text:n.name }), h('div', {}, [h('i', { style:'width:' + Math.round((n.weight || 0) / tot * 100) + '%' })]), h('b', { text:Math.round(b / 30.4).toLocaleString('ru-RU') + ' ₽/д' })])); });
  w.appendChild(h('div', { class:'card' }, [h('h3', { text:'Бюджет по направлениям' }), h('div', { class:'hint', html:'Доли меняются в «Семантике» (поле «Доля бюджета»). Справа — дневной бюджет кампании. Начинайте с поиска по горячим запросам; РСЯ — только после 2–3 недель и 10+ заявок.' }), bars]));
  w.appendChild(h('div', { class:'card' }, [h('h3', {}, ['Запуск: ' + todoD + ' из ' + todoN + ' шагов', h('span', { class:'sp' }), h('button', { class:'btn lt xs', text:'Открыть', onclick:function(){ go('plan'); } })]),
    h('div', { class:'bars' }, [h('div', { class:'barl' }, [h('span', { text:'Готовность' }), h('div', {}, [h('i', { class:'y', style:'width:' + Math.round(todoD / todoN * 100) + '%' })]), h('b', { text:Math.round(todoD / todoN * 100) + '%' })])])]));
};
function kpi(b, s, cls){ return h('div', { class:'kpi ' + (cls || '') }, [h('b', { text:b }), h('span', { text:s })]); }

/* ---------- Семантика ---------- */
var semNiche = 0;
V.sem = function(w){
  title('Семантика');
  var tabs = h('div', { class:'tabs' });
  S.niches.forEach(function(n, i){ var c = n.groups.reduce(function(a, g){ return a + g.phrases.length; }, 0); tabs.appendChild(h('button', { class:i === semNiche ? 'on' : '', onclick:function(){ semNiche = i; go('sem'); } }, [n.name, h('span', { class:'n', text:c })])); });
  tabs.appendChild(h('button', { text:'+ направление', onclick:function(){ var nm = prompt('Название направления (например «Электромонтаж»)'); if (!nm) return; S.niches.push({ id:'n' + Date.now().toString(36), name:nm, on:true, url:'https://domilia.ru/', weight:10, core:[], groups:[{ name:nm, phrases:[] }] }); semNiche = S.niches.length - 1; save(); go('sem'); } }));
  w.appendChild(tabs);
  var n = S.niches[semNiche]; if (!n) return;
  var on = h('input', { type:'checkbox' }); on.checked = n.on; on.onchange = function(){ n.on = on.checked; save(); };
  w.appendChild(h('div', { class:'card' }, [h('h3', {}, [n.name, h('span', { class:'sp' }), h('label', { class:'chk' }, [on, 'Рекламировать'])]),
    h('div', { class:'grid3' }, [field('Посадочная страница', inp(n, 'url', 'url')), field('Доля бюджета', inp(n, 'weight', 'number')), field('Корневые слова (через запятую)', (function(){ var i = h('input', { type:'text' }); i.value = (n.core || []).join(', '); i.oninput = function(){ n.core = i.value.split(',').map(function(x){ return x.trim().toLowerCase(); }).filter(Boolean); save(); }; return i; })(), 'не попадут в минус-слова из статистики')])]));
  /* инструменты */
  var paste = h('textarea', { class:'mono', placeholder:'Вставьте фразы из Wordstat или любого списка — по одной в строке. Частота через Tab или пробел допустима:\nремонт квартир под ключ 12345\nремонт ванной цена 2300' });
  var minF = h('input', { type:'number', value:'0' });
  var res = h('div', { class:'muted sm' });
  w.appendChild(h('div', { class:'card' }, [h('h3', { text:'Добавить фразы (Wordstat, свои списки)' }),
    h('div', { class:'hint b', html:'Откройте <a href="https://wordstat.yandex.ru/?region=54" target="_blank" rel="noopener">Вордстат по Екатеринбургу</a>, введите маску (например «ремонт ванной»), скопируйте таблицу и вставьте сюда. Программа почистит фразы, уберёт дубли и всё, что попадает под минус-слова, и разложит по группам по смыслу.' }),
    paste, h('div', { class:'row' }, [field('Не брать с частотой меньше', minF), h('button', { class:'btn', text:'Разобрать и добавить', onclick:function(){ var r = importPhrases(n, paste.value, +minF.value || 0); res.textContent = r; paste.value = ''; save(); setTimeout(function(){ go('sem'); toast(r); }, 50); } }), res])]));
  /* генератор */
  var gA = h('textarea', { placeholder:'ремонт квартиры\nремонт квартир' }), gB = h('textarea', { placeholder:'под ключ\nцена\nстоимость\nв новостройке\nекатеринбург' }), gC = h('textarea', { placeholder:'(необязательно)\nекатеринбург\nекб' });
  w.appendChild(h('div', { class:'card' }, [h('h3', { text:'Размножить фразы (маска × уточнения)' }),
    h('div', { class:'grid3' }, [field('Основа', gA), field('Уточнения', gB), field('Добавки (необязательно)', gC)]),
    h('div', { class:'row' }, [h('button', { class:'btn lt', text:'Сгенерировать и добавить', onclick:function(){
      var A = lines(gA.value), B = lines(gB.value), Cc = lines(gC.value); if (!A.length) return toast('Заполните «Основу»');
      var out = []; A.forEach(function(a){ (B.length ? B : ['']).forEach(function(b){ out.push((a + ' ' + b).trim()); (Cc).forEach(function(c){ out.push((a + ' ' + b + ' ' + c).trim()); }); }); });
      var r = importPhrases(n, out.join('\n'), 0); save(); go('sem'); toast(r); } }), h('span', { class:'muted sm', text:'Проверяйте частоту в Вордстате: фразы с нулевым спросом Директ пометит «мало показов».' })])]));
  /* группы */
  var dup = dupMap(), mins = allMinus(), list = h('div', { class:'list' });
  n.groups.forEach(function(g, gi){
    var ta = h('textarea', { class:'mono' }); ta.value = g.phrases.join('\n'); ta.style.minHeight = Math.min(300, 40 + g.phrases.length * 20) + 'px';
    var warn = h('div', { class:'issues' });
    function chk(){ warn.innerHTML = ''; g.phrases.forEach(function(p){ var k = norm(p); if (dup[k] > 1) warn.appendChild(h('div', { class:'warn', text:'дубль в другой группе: «' + p + '»' })); var m = mins.filter(function(x){ return x.indexOf(' ') < 0 && words(k).map(stem).indexOf(stem(x)) > -1; }); if (m.length) warn.appendChild(h('div', { class:'bad', text:'«' + p + '» содержит минус-слово «' + m[0] + '» — не будет показываться' })); if (words(k).length > 7) warn.appendChild(h('div', { class:'bad', text:'больше 7 слов: «' + p + '»' })); }); }
    ta.oninput = function(){ g.phrases = lines(ta.value); save(); };
    ta.onchange = function(){ dup = dupMap(); chk(); };
    var nm = h('input', { type:'text' }); nm.value = g.name; nm.oninput = function(){ g.name = nm.value; save(); };
    list.appendChild(h('div', { class:'grp' }, [h('div', { class:'grp-h' }, [h('b', { text:(gi + 1) + '.' }), nm, h('span', { class:'badge', text:g.phrases.length + ' фраз' }),
      h('button', { class:'btn lt xs', text:'↑', title:'Выше', onclick:function(){ if (gi){ n.groups.splice(gi - 1, 0, n.groups.splice(gi, 1)[0]); save(); go('sem'); } } }),
      h('button', { class:'btn lt xs', text:'Проверить в Яндексе ↗', onclick:function(){ open('https://yandex.ru/search/?lr=54&text=' + encodeURIComponent(g.phrases[0] || g.name), '_blank'); } }),
      h('button', { class:'btn red xs', text:'×', title:'Удалить группу', onclick:function(){ if (confirm('Удалить группу «' + g.name + '»?')){ n.groups.splice(gi, 1); save(); go('sem'); } } })]), ta, warn]));
    chk();
  });
  list.appendChild(h('button', { class:'btn lt', text:'+ Группа', onclick:function(){ n.groups.push({ name:'Новая группа', phrases:[] }); save(); go('sem'); } }));
  w.appendChild(h('div', { class:'card' }, [h('h3', { text:'Группы объявлений' }), h('div', { class:'hint', html:'Одна группа = одно объявление + её фразы. Держите в группе фразы с одним смыслом (5–15 штук), чтобы заголовок совпадал с запросом — так выше CTR и ниже цена клика. Кросс-минусовка между группами добавится автоматически при выгрузке.' }), list]));
};
function lines(t){ var seen = {}; return String(t || '').split(/\n/).map(function(x){ return x.trim(); }).filter(function(x){ var k = norm(x); if (!k || seen[k]) return false; seen[k] = 1; return true; }); }
function dupMap(){ var m = {}; S.niches.forEach(function(n){ n.groups.forEach(function(g){ g.phrases.forEach(function(p){ var k = norm(p); m[k] = (m[k] || 0) + 1; }); }); }); return m; }
function importPhrases(n, text, minFreq){
  var mins = allMinus().filter(function(x){ return x.indexOf(' ') < 0; }).map(stem), exist = dupMap(), added = 0, skipM = 0, skipD = 0, skipF = 0, newG = 0;
  String(text || '').split(/\n/).forEach(function(line){
    var m = line.replace(/ /g, ' ').match(/^(.*?)[\t ]+([\d ]+)\s*$/), phrase = line, fq = null;
    if (m && /\d/.test(m[2]) && !/[а-яa-z]/i.test(m[2])){ phrase = m[1]; fq = +m[2].replace(/\s/g, ''); }
    phrase = norm(phrase.replace(/^\+|\s\+/g, ' ')); if (!phrase || phrase.length < 4) return;
    if (fq != null && fq < minFreq){ skipF++; return; }
    if (exist[phrase]){ skipD++; return; }
    var st = stems(phrase); if (st.some(function(s){ return mins.indexOf(s) > -1; })){ skipM++; return; }
    if (words(phrase).length > 7){ skipM++; return; }
    /* куда положить: группа с максимальным совпадением слов */
    var best = null, bs = 0;
    n.groups.forEach(function(g){ var gs = {}; g.phrases.forEach(function(p){ stems(p).forEach(function(s){ gs[s] = (gs[s] || 0) + 1; }); }); stems(g.name).forEach(function(s){ gs[s] = (gs[s] || 0) + 2; });
      var sc = st.reduce(function(a, s){ return a + (gs[s] ? 1 + Math.min(gs[s], 5) / 5 : 0); }, 0) / Math.max(st.length, 1); if (sc > bs){ bs = sc; best = g; } });
    if (!best || bs < 0.9){ best = { name:cap(phrase), phrases:[] }; n.groups.push(best); newG++; }
    best.phrases.push(phrase); exist[phrase] = 1; added++;
  });
  return 'Добавлено ' + added + ' фраз' + (newG ? ', новых групп: ' + newG : '') + '. Пропущено: дублей ' + skipD + ', с минус-словами или длинных ' + skipM + (skipF ? ', с малой частотой ' + skipF : '') + '.';
}

/* ---------- Минус-слова ---------- */
V.minus = function(w){
  title('Минус-слова');
  var all = allMinus();
  $('#barR').appendChild(h('button', { class:'btn', text:'Скопировать все (' + all.length + ')', onclick:function(){ copy(all.map(function(x){ return x.indexOf(' ') > -1 ? '"' + x + '"' : x; }).join(' '), 'минус-фразы на кампанию'); } }));
  w.appendChild(h('div', { class:'hint', html:'Минус-слова отсекают нецелевые запросы — это главный способ не сливать бюджет. Слово в минусе убирает все его формы: «вакансия» уберёт и «вакансии». Отключите категорию, если она вам не подходит. Из «Анализа статистики» новые слова попадают в категорию «Из статистики».' }));
  var cb = h('input', { type:'checkbox' }); cb.checked = S.compBrands; cb.onchange = function(){ S.compBrands = cb.checked; save(); go('minus'); };
  w.appendChild(h('div', { class:'card' }, [h('label', { class:'chk' }, [cb, 'Добавлять названия конкурентов в минус (не показываться по их брендовым запросам — это дорого и рискованно по закону)'])]));
  Object.keys(S.minus).forEach(function(c){
    var off = !!S.minusOff[c], chips = h('div', { class:'chips' });
    S.minus[c].forEach(function(x, i){ chips.appendChild(h('span', { class:'chip' + (c === 'Из статистики' ? ' y' : '') }, [x, h('button', { text:'×', title:'Убрать', onclick:function(){ S.minus[c].splice(i, 1); save(); go('minus'); } })])); });
    var add = h('input', { type:'text', placeholder:'добавить слова через запятую или пробел' });
    add.onkeydown = function(e){ if (e.key === 'Enter'){ addWords(); } };
    function addWords(){ add.value.split(/[,\n]/).map(norm).filter(Boolean).forEach(function(x){ x.split(/\s+/).length > 3 ? null : (S.minus[c].indexOf(x) < 0 && S.minus[c].push(x)); }); save(); go('minus'); }
    var tg = h('input', { type:'checkbox' }); tg.checked = !off; tg.onchange = function(){ if (tg.checked) delete S.minusOff[c]; else S.minusOff[c] = true; save(); go('minus'); };
    w.appendChild(h('div', { class:'card', style:off ? 'opacity:.55' : '' }, [h('h3', {}, [h('label', { class:'chk' }, [tg, c]), h('span', { class:'badge', text:S.minus[c].length }), h('span', { class:'sp' }),
      c === 'Из статистики' || !SEED.minus[c] ? h('button', { class:'btn red xs', text:'Удалить категорию', onclick:function(){ if (confirm('Удалить категорию?')){ delete S.minus[c]; save(); go('minus'); } } }) : null]),
      chips, h('div', { class:'row' }, [add, h('button', { class:'btn lt xs', text:'Добавить', onclick:addWords })])]));
  });
  w.appendChild(h('button', { class:'btn lt', text:'+ Категория', onclick:function(){ var nm = prompt('Название категории'); if (nm && !S.minus[nm]){ S.minus[nm] = []; save(); go('minus'); } } }));
};

/* ---------- Объявления ---------- */
var adNiche = 0;
V.ads = function(w){
  title('Объявления');
  var tabs = h('div', { class:'tabs' });
  S.niches.forEach(function(n, i){ tabs.appendChild(h('button', { class:i === adNiche ? 'on' : '', text:n.name + (n.on ? '' : ' (выкл.)'), onclick:function(){ adNiche = i; go('ads'); } })); });
  w.appendChild(tabs);
  var n = S.niches[adNiche]; if (!n) return;
  /* общие элементы */
  var disp = h('input', { type:'text' }); disp.value = S.camp.display[n.id] || ''; disp.oninput = function(){ S.camp.display[n.id] = disp.value; save(); };
  var ut = h('input', { type:'checkbox' }); ut.checked = S.camp.utm; ut.onchange = function(){ S.camp.utm = ut.checked; save(); };
  var slBox = h('div', { class:'list' }); S.sitelinks[n.id] = S.sitelinks[n.id] || [['Цены', 'Стоимость работ', ''], ['Заявка', 'Бесплатная консультация', '']];
  S.sitelinks[n.id].forEach(function(x, i){
    var a = h('input', { type:'text' }), b = h('input', { type:'text' }), c = h('input', { type:'text', placeholder:'#якорь или полный адрес' });
    a.value = x[0]; b.value = x[1]; c.value = x[2] || '';
    var iss = h('div', { class:'issues' });
    function upd(){ x[0] = a.value; x[1] = b.value; x[2] = c.value; save(); iss.innerHTML = ''; check(x[0], 'sl').concat(check(x[1], 'sld')).forEach(function(q){ iss.appendChild(h('div', { class:q[0], text:q[1] })); }); }
    a.oninput = b.oninput = c.oninput = upd;
    slBox.appendChild(h('div', { class:'grid3' }, [field('Быстрая ссылка ' + (i + 1) + ' (до 30)', a), field('Описание (до 60)', b), field('Адрес', c)])); slBox.appendChild(iss); upd();
  });
  var slTot = S.sitelinks[n.id].reduce(function(s, x){ return s + x[0].length; }, 0);
  var co = h('input', { type:'text' }); co.value = S.callouts.join(' || '); co.oninput = function(){ S.callouts = co.value.split('||').map(function(x){ return x.trim(); }).filter(Boolean); save(); };
  w.appendChild(h('div', { class:'card' }, [h('h3', { text:'Общее для всех объявлений «' + n.name + '»' }),
    h('div', { class:'grid3' }, [field('Посадочная страница', inp(n, 'url', 'url')), field('Отображаемая ссылка (до 20)', disp, 'домен.ru/' + (S.camp.display[n.id] || '…')), h('label', { class:'chk', style:'align-self:end' }, [ut, 'Добавлять UTM-метки'])]),
    h('h4', {}, ['Быстрые ссылки ', h('span', { class:slTot > 66 ? 'bad' : 'muted sm', text:'(заголовки вместе: ' + slTot + ' из 66)' })]), slBox,
    field('Уточнения (до 25 символов, через ||)', co)]));
  /* УТП */
  var uspG = h('div', { class:'grid3' });
  Object.keys(S.usp).forEach(function(k){ uspG.appendChild(field({ price:'Цена под ключ', design:'Подарок', guarantee:'Гарантия', smeta:'Смета', stages:'Оплата', prepay:'Предоплата', contract:'Договор', measure:'Замер', calc:'Расчёт', cosm:'Косметика', bath:'Ванная' }[k] || k, inp(S.usp, k, 'text'))); });
  w.appendChild(h('details', { class:'card' }, [h('summary', { html:'<b>Преимущества (УТП)</b> — из них собираются заголовки' }), uspG]));
  /* объявления по группам */
  var list = h('div', { class:'list' }), slx = slFor(n), callouts = S.callouts.filter(function(x){ return x.length <= 25; }).slice(0, 4);
  n.groups.forEach(function(g, gi){
    var a = genAd(n, g), box = h('div', { class:'grp' }), prev = h('div');
    function render(){
      a = genAd(n, g); prev.innerHTML = '';
      prev.appendChild(h('div', { class:'ad' }, [h('div', { class:'ad-u' }, [h('i', { text:'Реклама' }), (n.url || '').replace(/^https?:\/\//, '').replace(/\/.*$/, '') + (S.camp.display[n.id] ? ' › ' + S.camp.display[n.id] : '')]),
        h('div', { class:'ad-t', text:a.t1 + ' — ' + a.t2 }), h('div', { class:'ad-x', text:a.x1 }), h('div', { class:'ad-c', text:callouts.join(' · ') }),
        h('div', { class:'ad-s' }, slx.map(function(s){ return h('span', { text:s.t }); }))]));
    }
    var fl = h('div', { class:'grid2' }), iss = h('div', { class:'issues' });
    [['t1', 'Заголовок 1', 'title'], ['t2', 'Заголовок 2', 'title'], ['t3', 'Заголовок 3', 'title'], ['x1', 'Текст 1', 'text'], ['x2', 'Текст 2', 'text']].forEach(function(f){
      var i = h('input', { type:'text' }); i.value = a[f[0]]; var c = h('div', { class:'cnt' });
      var max = f[2] === 'title' ? 56 : 81;
      function up(){ c.textContent = i.value.length + ' / ' + max; c.className = 'cnt' + (i.value.length > max ? ' over' : ''); }
      i.oninput = function(){ g.ad = g.ad || {}; g.ad[f[0]] = i.value; save(); up(); render(); issues(); }; up();
      fl.appendChild(h('label', { class:'f' }, [f[1], i, c]));
    });
    function issues(){ iss.innerHTML = ''; var A = genAd(n, g); var bad = 0; [['Заг. 1', A.t1, 'title'], ['Заг. 2', A.t2, 'title'], ['Заг. 3', A.t3, 'title'], ['Текст 1', A.x1, 'text'], ['Текст 2', A.x2, 'text']].forEach(function(x){ check(x[1], x[2]).forEach(function(q){ if (q[0] === 'bad') bad++; iss.appendChild(h('div', { class:q[0], text:x[0] + ': ' + q[1] })); }); });
      var ph = norm(g.phrases[0] || ''), t = norm(A.t1); var hit = stems(ph).filter(function(s){ return stems(t).indexOf(s) > -1; }).length / Math.max(1, stems(ph).length);
      if (hit < .6) iss.appendChild(h('div', { class:'warn', text:'В заголовке мало слов из запроса — CTR будет ниже' }));
      if (!bad && hit >= .6) iss.appendChild(h('div', { class:'ok', text:'Готово к модерации' })); }
    render(); issues();
    box.appendChild(h('div', { class:'grp-h' }, [h('b', { text:(gi + 1) + '. ' + g.name }), h('span', { class:'badge', text:g.phrases.length + ' фраз' }), h('span', { style:'flex:1' }),
      h('button', { class:'btn lt xs', text:'Сбросить к авто', onclick:function(){ delete g.ad; save(); go('ads'); } })]));
    box.appendChild(prev); box.appendChild(fl); box.appendChild(iss);
    list.appendChild(box);
  });
  w.appendChild(h('div', { class:'card' }, [h('h3', { text:'Объявления по группам' }), h('div', { class:'hint', html:'Тексты собираются автоматически из первой фразы группы и ваших преимуществ. Любое поле можно переписать — изменённое сохранится. Проверка идёт по правилам Директа: длина, слова, знаки, заглавные, «лучший/№1», телефоны и ссылки в тексте.' }), list]));
};

/* ---------- Выгрузка ---------- */
var COLS = ['Доп. объявление группы', 'Название группы', 'Номер группы', 'Фраза (с минус-словами)', 'Ставка', 'Регион', 'Заголовок 1', 'Заголовок 2', 'Заголовок 3', 'Текст 1', 'Текст 2', 'Ссылка', 'Отображаемая ссылка', 'Заголовки быстрых ссылок', 'Описания быстрых ссылок', 'Адреса быстрых ссылок', 'Уточнения', 'Минус-фразы на кампанию'];
function buildRows(n){
  var cm = crossMinus(n), sl = slFor(n), co = S.callouts.filter(function(x){ return x.length <= 25; }), rows = [], minusC = allMinus().map(function(x){ return x.indexOf(' ') > -1 ? '"' + x + '"' : x; }).join(', ').slice(0, 20000), first = true;
  n.groups.forEach(function(g, gi){
    var a = genAd(n, g);
    g.phrases.forEach(function(p){
      var k = gi + '|' + norm(p);
      rows.push(['-', g.name.slice(0, 255), gi + 1, cm[k] || norm(p), S.camp.bid, S.camp.region, a.t1, a.t2, a.t3, a.x1, a.x2, utm(n.url, n), S.camp.display[n.id] || '',
        sl.map(function(s){ return s.t; }).join('||'), sl.map(function(s){ return s.d; }).join('||'), sl.map(function(s){ return s.u; }).join('||'), co.join('||'), first ? minusC : '']);
      first = false;
    });
  });
  return rows;
}
var XLSX_URL = 'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js', xl = null;
function loadXLSX(){ return xl || (xl = new Promise(function(res, rej){ if (window.XLSX) return res(window.XLSX); var s = document.createElement('script'); s.src = XLSX_URL; s.onload = function(){ res(window.XLSX); }; s.onerror = function(){ xl = null; rej(new Error('Не загрузилась библиотека Excel. Проверьте интернет и повторите.')); }; document.head.appendChild(s); })); }
V.export = function(w){
  title('Выгрузка в Директ');
  w.appendChild(h('div', { class:'card' }, [h('h3', { text:'Параметры кампаний' }),
    h('div', { class:'grid3' }, [field('Префикс названия кампании', inp(S.camp, 'prefix')), field('Регион', inp(S.camp, 'region'), 'как в справочнике Директа'), field('Ставка по умолчанию, ₽', inp(S.camp, 'bid', 'number'), 'игнорируется при автостратегии')]), (function(){ var c = h('input', { type:'checkbox' }); c.checked = S.camp.cross !== false; c.onchange = function(){ S.camp.cross = c.checked; save(); }; return h('label', { class:'chk' }, [c, 'Кросс-минусовка между группами (чтобы запрос шёл в самую точную группу)']); })()]));
  S.niches.forEach(function(n){
    if (!n.on) return;
    var ph = n.groups.reduce(function(a, g){ return a + g.phrases.length; }, 0), iss = 0;
    n.groups.forEach(function(g){ var a = genAd(n, g); [['title', a.t1], ['title', a.t2], ['title', a.t3], ['text', a.x1], ['text', a.x2]].forEach(function(x){ iss += check(x[1], x[0]).filter(function(q){ return q[0] === 'bad'; }).length; }); });
    var name = S.camp.prefix + ' · ' + n.name + ' · Поиск';
    w.appendChild(h('div', { class:'card' }, [h('h3', {}, [name, h('span', { class:'badge', text:n.groups.length + ' групп · ' + ph + ' фраз' }), iss ? h('span', { class:'badge r', text:iss + ' ошибок в объявлениях' }) : h('span', { class:'badge g', text:'объявления в порядке' })]),
      h('div', { class:'row' }, [
        h('button', { class:'btn', text:'Скачать для Коммандера (.tsv)', onclick:function(){ var rows = buildRows(n); var t = [COLS].concat(rows).map(function(r){ return r.map(function(c){ return String(c).replace(/[\t\n\r]/g, ' '); }).join('\t'); }).join('\r\n'); download(slugify(name) + '.tsv', '﻿' + t, 'text/tab-separated-values;charset=utf-8'); } }),
        h('button', { class:'btn lt', text:'Скачать Excel (.xlsx)', onclick:function(){ loadXLSX().then(function(X){ var ws = X.utils.aoa_to_sheet([COLS].concat(buildRows(n))); var wb = X.utils.book_new(); X.utils.book_append_sheet(wb, ws, 'Тексты'); download(slugify(name) + '.xlsx', new Blob([X.write(wb, { type:'array', bookType:'xlsx' })], { type:'application/octet-stream' })); }).catch(function(e){ toast(e.message); }); } }),
        h('button', { class:'btn lt', text:'Скопировать минус-фразы', onclick:function(){ copy(allMinus().map(function(x){ return x.indexOf(' ') > -1 ? '"' + x + '"' : x; }).join(' '), 'минус-фразы на кампанию'); } }),
        iss ? h('button', { class:'btn red xs', text:'Исправить ошибки →', onclick:function(){ adNiche = S.niches.indexOf(n); go('ads'); } }) : null])]));
  });
  w.appendChild(h('div', { class:'card' }, [h('h3', { text:'Как загрузить' }), h('ol', { class:'steps', html:
    '<li><b>Через Директ Коммандер (надёжнее всего):</b> установите <a href="https://direct.yandex.ru/commander/" target="_blank" rel="noopener">Коммандер</a>, войдите в аккаунт → создайте новую кампанию «Единая перфоманс-кампания» → меню «Импорт» → выберите скачанный .tsv → проверьте и нажмите «Отправить на сервер».</li>' +
    '<li><b>Через сайт Директа:</b> «Инструменты» → «Управление с помощью XLS/XLSX» → «Загрузить» → файл .xlsx. Если Директ ругается на столбцы — скачайте их шаблон и перенесите наши столбцы в него.</li>' +
    '<li>После загрузки в настройках кампании: стратегия, регион «Екатеринбург», счётчик Метрики и цель «Заявка» (/spasibo/), расписание показов. Подробно — в разделе «Запуск и стратегия».</li>' +
    '<li>Кросс-минусовка уже вшита во фразы: например, «ремонт квартир под ключ -цена», если цена вынесена в отдельную группу. Минус-фразы на кампанию — в первой строке файла.</li>' })]));
};
function slugify(s){ var m = { а:'a',б:'b',в:'v',г:'g',д:'d',е:'e',ё:'e',ж:'zh',з:'z',и:'i',й:'y',к:'k',л:'l',м:'m',н:'n',о:'o',п:'p',р:'r',с:'s',т:'t',у:'u',ф:'f',х:'h',ц:'c',ч:'ch',ш:'sh',щ:'sch',ъ:'',ы:'y',ь:'',э:'e',ю:'yu',я:'ya' }; return String(s).toLowerCase().split('').map(function(c){ return m[c] != null ? m[c] : c; }).join('').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''); }

/* ---------- Анализ статистики ---------- */
var COLMAP = [['q', /поисков[а-яё]* запрос|^запрос$/], ['kw', /услови[а-яё]* показа|ключев[а-яё]* фраз|^фраза/], ['pl', /площадк|место показа/], ['camp', /^кампания|название кампании/], ['grp', /^группа|название группы/], ['dev', /тип устройства|устройств/],
  ['imp', /^показы/], ['clk', /^клики/], ['cost', /расход|стоимость|затрат/], ['conv', /конверси|достижени|^цели$/]];
function pnum(v){ if (typeof v === 'number') return v; var s = String(v == null ? '' : v).replace(/\s| /g, '').replace(',', '.').replace(/[^\d.\-]/g, ''); return s && s !== '-' ? +s : 0; }
function parseSheet(rows){
  var hi = -1; for (var i = 0; i < Math.min(rows.length, 30); i++){ if ((rows[i] || []).some(function(c){ return /^клики/i.test(String(c || '').trim()); })){ hi = i; break; } }
  if (hi < 0) throw new Error('Не нашёл строку заголовков со столбцом «Клики». Выгрузите отчёт из Мастера отчётов Директа.');
  var head = rows[hi].map(function(c){ return String(c || '').trim().toLowerCase(); }), map = {};
  COLMAP.forEach(function(m){ for (var j = 0; j < head.length; j++){ if (m[1].test(head[j]) && map[m[0]] == null){ if (m[0] === 'conv' && /цена|стоим|%|доля/.test(head[j])) continue; if (m[0] === 'cost' && /цена|ср\.|средн/.test(head[j])) continue; map[m[0]] = j; } } });
  var out = [];
  rows.slice(hi + 1).forEach(function(r){
    if (!r || !r.length) return; var first = String(r[0] || '').toLowerCase();
    if (/^итого|^всего/.test(first)) return;
    var o = {}; ['q', 'kw', 'pl', 'camp', 'grp', 'dev'].forEach(function(k){ if (map[k] != null) o[k] = String(r[map[k]] == null ? '' : r[map[k]]).trim(); });
    ['imp', 'clk', 'cost', 'conv'].forEach(function(k){ o[k] = map[k] != null ? pnum(r[map[k]]) : 0; });
    if (!o.clk && !o.imp && !o.cost) return; out.push(o);
  });
  return { rows:out, map:map };
}
function readFile(file){
  return new Promise(function(res, rej){
    var r = new FileReader();
    if (/\.(csv|tsv|txt)$/i.test(file.name)){
      r.onload = function(){ var t = String(r.result).replace(/^﻿/, ''); var sep = (t.split('\n')[0].match(/\t/g) || []).length > 1 || /\t/.test(t.slice(0, 2000)) ? '\t' : ';';
        res(t.split(/\r?\n/).map(function(l){ return l.split(sep).map(function(c){ return c.replace(/^"|"$/g, ''); }); })); };
      r.readAsText(file, 'utf-8');
    } else {
      r.onload = function(){ loadXLSX().then(function(X){ var wb = X.read(r.result, { type:'array' }); var ws = wb.Sheets[wb.SheetNames[0]]; res(X.utils.sheet_to_json(ws, { header:1, raw:true, defval:'' })); }).catch(rej); };
      r.readAsArrayBuffer(file);
    }
  });
}
V.stats = function(w){
  title('Анализ статистики');
  var drop = h('div', { class:'drop', html:'<b>Перетащите отчёт сюда</b> или нажмите, чтобы выбрать файл<br><span class="sm">XLSX или CSV из Мастера отчётов Директа · можно сразу несколько</span>' });
  var fi = h('input', { type:'file', accept:'.xlsx,.xls,.csv,.tsv,.txt', multiple:true, hidden:true });
  drop.onclick = function(){ fi.click(); };
  drop.ondragover = function(e){ e.preventDefault(); drop.classList.add('ov'); }; drop.ondragleave = function(){ drop.classList.remove('ov'); };
  drop.ondrop = function(e){ e.preventDefault(); drop.classList.remove('ov'); load(e.dataTransfer.files); };
  fi.onchange = function(){ load(fi.files); };
  function load(files){
    var L = Array.prototype.slice.call(files); if (!L.length) return;
    Promise.all(L.map(function(f){ return readFile(f).then(function(rows){ return parseSheet(rows); }); })).then(function(parts){
      var rows = []; parts.forEach(function(p){ rows = rows.concat(p.rows); });
      var sum = rows.reduce(function(a, r){ a.imp += r.imp; a.clk += r.clk; a.cost += r.cost; a.conv += r.conv; return a; }, { imp:0, clk:0, cost:0, conv:0 });
      S.stats = { file:L.map(function(f){ return f.name; }).join(', '), at:new Date().toISOString(), rows:rows.slice(0, 20000), sum:sum }; save(); go('stats'); toast('Загружено строк: ' + rows.length);
    }).catch(function(e){ toast(e.message || 'Не удалось прочитать файл'); });
  }
  w.appendChild(h('div', { class:'card' }, [h('h3', { text:'Загрузить отчёт Директа' }), h('div', { class:'hint b', html:
    'В Директе: <b>Статистика → Мастер отчётов</b>, период — последние 7–30 дней. Срезы: <b>«Поисковый запрос»</b> (для минус-слов), <b>«Условие показа»</b> (для ставок), <b>«Площадка»</b> (для РСЯ). Столбцы: Показы, Клики, Расход, Конверсии по цели «Заявка». Скачайте в XLSX и загрузите сюда — можно все три файла сразу.' }), drop, fi,
    h('div', { class:'grid3' }, [field('Целевая цена заявки, ₽', inp(S, 'target', 'number'), 'всё, что дороже, — кандидаты на отключение')])]));
  if (!S.stats || !S.stats.rows || !S.stats.rows.length){ w.appendChild(h('div', { class:'card' }, [h('p', { class:'muted', text:'Пока нет загруженной статистики.' })])); return; }
  var R = S.stats.rows, s = S.stats.sum, T = +S.target || 3500;
  w.appendChild(h('div', { class:'grid4' }, [kpi(rub(s.cost), 'расход'), kpi(num(s.clk), 'кликов · CTR ' + num(s.imp ? s.clk / s.imp * 100 : 0, 2) + '%'), kpi(num(s.conv), 'заявок', s.conv ? 'g' : 'r'), kpi(s.conv ? rub(s.cost / s.conv) : '—', 'цена заявки', s.conv && s.cost / s.conv <= T ? 'g' : 'r')]));
  w.appendChild(h('p', { class:'muted sm', text:'Файл: ' + S.stats.file + ' · строк: ' + R.length + ' · средняя цена клика ' + rub(s.clk ? s.cost / s.clk : 0) }));
  var agg = function(key){ var m = {}; R.forEach(function(r){ var k = r[key]; if (!k) return; var o = m[k] || (m[k] = { k:k, imp:0, clk:0, cost:0, conv:0 }); o.imp += r.imp; o.clk += r.clk; o.cost += r.cost; o.conv += r.conv; }); return Object.keys(m).map(function(k){ return m[k]; }); };
  /* 1. минус-слова из запросов */
  var Q = agg('q');
  if (Q.length){
    var core = {}; S.niches.forEach(function(n){ (n.core || []).forEach(function(c){ core[stem(norm(c))] = 1; }); n.groups.forEach(function(g){ g.phrases.forEach(function(p){ stems(p).forEach(function(x){ core[x] = (core[x] || 0) + 1; }); }); }); });
    var have = {}; allMinus().forEach(function(x){ have[stem(x)] = 1; });
    var W = {}; Q.forEach(function(q){ var ws = words(q.k).filter(function(x){ return x.length > 2 && !STOP[x] && !/^\d+$/.test(x); }); var seen = {}; ws.forEach(function(x){ var st = stem(x); if (seen[st]) return; seen[st] = 1; var o = W[st] || (W[st] = { w:x, clk:0, cost:0, conv:0, q:0 }); o.clk += q.clk; o.cost += q.cost; o.conv += q.conv; o.q++; }); });
    var cand = Object.keys(W).map(function(k){ W[k].st = k; return W[k]; }).filter(function(o){ return !o.conv && o.clk >= 2 && !have[o.st] && !(core[o.st] >= 2) && o.cost >= Math.min(300, T * 0.1); }).sort(function(a, b){ return b.cost - a.cost; }).slice(0, 80);
    var sel = {};
    var tb = table(['', 'Слово', 'Запросов', 'Клики', 'Расход', 'Заявки'], cand.map(function(o){ var c = h('input', { type:'checkbox' }); c.checked = o.cost >= T * 0.2; sel[o.w] = c; return [c, o.w, o.q, num(o.clk), rub(o.cost), o.conv]; }), [2, 3, 4, 5]);
    var waste = cand.reduce(function(a, o){ return a + o.cost; }, 0);
    w.appendChild(h('div', { class:'card' }, [h('h3', {}, ['Минус-слова из поисковых запросов', h('span', { class:'badge r', text:'слили ' + rub(waste) })]),
      h('div', { class:'hint y', html:'Слова, по которым были клики и расход, но ни одной заявки. Проверьте глазами — некоторые могут быть целевыми (тогда снимите галочку). Отмеченные можно сразу добавить в минус-слова.' }),
      cand.length ? tb : h('p', { class:'ok', text:'Явного мусора не найдено — отличная семантика.' }),
      cand.length ? h('div', { class:'row' }, [h('button', { class:'btn', text:'Добавить отмеченные в минус-слова', onclick:function(){ var add = Object.keys(sel).filter(function(k){ return sel[k].checked; }); S.minus['Из статистики'] = (S.minus['Из статистики'] || []).concat(add.filter(function(x){ return (S.minus['Из статистики'] || []).indexOf(x) < 0; })); save(); toast('Добавлено в минус-слова: ' + add.length); } }),
        h('button', { class:'btn lt', text:'Скопировать отмеченные', onclick:function(){ copy(Object.keys(sel).filter(function(k){ return sel[k].checked; }).join(' '), 'минус-слова'); } })]) : null]));
    /* запросы с заявками — добавить фразами */
    var ex = {}; S.niches.forEach(function(n){ n.groups.forEach(function(g){ g.phrases.forEach(function(p){ ex[stems(p).sort().join(' ')] = 1; }); }); }); var good = Q.filter(function(q){ return q.conv > 0 && !ex[stems(q.k).sort().join(' ')]; }).sort(function(a, b){ return b.conv - a.conv; }).slice(0, 50);
    if (good.length) w.appendChild(h('div', { class:'card' }, [h('h3', { text:'Запросы с заявками — добавьте их фразами' }), h('div', { class:'hint', html:'По этим запросам люди оставляли заявки, но отдельной фразы под них нет. Добавьте — объявление станет точнее, а цена клика ниже.' }),
      table(['Запрос', 'Клики', 'Расход', 'Заявки', 'Цена заявки'], good.map(function(q){ return [q.k, num(q.clk), rub(q.cost), q.conv, rub(q.cost / q.conv)]; }), [1, 2, 3, 4]),
      h('button', { class:'btn lt', text:'Скопировать списком', onclick:function(){ copy(good.map(function(q){ return q.k; }).join('\n'), 'запросы'); } })]));
  }
  /* 2. фразы */
  var K = agg('kw');
  if (K.length){
    var stop = K.filter(function(k){ return (!k.conv && k.cost >= T) || (k.conv && k.cost / k.conv > T * 1.5); }).sort(function(a, b){ return b.cost - a.cost; });
    var scale = K.filter(function(k){ return k.conv >= 2 && k.cost / k.conv <= T * 0.7; }).sort(function(a, b){ return a.cost / a.conv - b.cost / b.conv; });
    var lowCtr = K.filter(function(k){ return k.imp >= 300 && k.clk / k.imp < 0.02; }).sort(function(a, b){ return b.imp - a.imp; }).slice(0, 30);
    w.appendChild(h('div', { class:'card' }, [h('h3', {}, ['Фразы: что выключить', h('span', { class:'badge r', text:stop.length })]),
      stop.length ? table(['Фраза', 'Клики', 'Расход', 'Заявки', 'Цена заявки', 'Что делать'], stop.map(function(k){ return [k.k, num(k.clk), rub(k.cost), k.conv, k.conv ? rub(k.cost / k.conv) : '—', k.conv ? 'снизить ставку на 30%' : 'остановить или минусовать запросы']; }), [1, 2, 3, 4]) : h('p', { class:'ok', text:'Дорогих фраз без заявок нет.' })]));
    w.appendChild(h('div', { class:'card' }, [h('h3', {}, ['Фразы: что усилить', h('span', { class:'badge g', text:scale.length })]),
      scale.length ? table(['Фраза', 'Клики', 'Расход', 'Заявки', 'Цена заявки', 'Что делать'], scale.map(function(k){ return [k.k, num(k.clk), rub(k.cost), k.conv, rub(k.cost / k.conv), 'поднять ставку на 20–30%, вынести в отдельную группу']; }), [1, 2, 3, 4]) : h('p', { class:'muted', text:'Нужно больше данных: хотя бы 2 заявки на фразу.' })]));
    if (lowCtr.length) w.appendChild(h('div', { class:'card' }, [h('h3', { text:'Низкий CTR (меньше 2%)' }), h('div', { class:'hint y', text:'Объявление не цепляет по этим фразам: перенесите фразу в отдельную группу с заголовком из этой фразы или усилите оффер.' }),
      table(['Фраза', 'Показы', 'Клики', 'CTR'], lowCtr.map(function(k){ return [k.k, num(k.imp), num(k.clk), num(k.clk / k.imp * 100, 2) + '%']; }), [1, 2, 3])]));
  }
  /* 3. площадки РСЯ */
  var P = agg('pl');
  if (P.length){
    var bad = P.filter(function(p){ return !p.conv && (p.clk >= 8 || (p.imp >= 50 && p.clk / Math.max(p.imp, 1) > 0.08 && p.clk >= 4)); }).sort(function(a, b){ return b.cost - a.cost; });
    w.appendChild(h('div', { class:'card' }, [h('h3', {}, ['Площадки РСЯ: запретить', h('span', { class:'badge r', text:bad.length })]),
      h('div', { class:'hint y', html:'Много кликов без заявок или подозрительно высокий CTR (больше 8%) — частые признаки скликивания и случайных нажатий в играх. Скопируйте список и вставьте в настройках кампании: <b>Запрещённые площадки</b>.' }),
      bad.length ? table(['Площадка', 'Показы', 'Клики', 'CTR', 'Расход'], bad.map(function(p){ return [p.k, num(p.imp), num(p.clk), num(p.clk / Math.max(p.imp, 1) * 100, 1) + '%', rub(p.cost)]; }), [1, 2, 3, 4]) : h('p', { class:'ok', text:'Подозрительных площадок нет.' }),
      bad.length ? h('button', { class:'btn', text:'Скопировать список площадок', onclick:function(){ copy(bad.map(function(p){ return p.k; }).join('\n'), 'площадки'); } }) : null]));
  }
  /* 4. устройства и кампании */
  var D = agg('dev'), Cm = agg('camp');
  [[D, 'Устройства'], [Cm, 'Кампании']].forEach(function(x){ if (x[0].length > 1) w.appendChild(h('div', { class:'card' }, [h('h3', { text:x[1] }), table([x[1], 'Клики', 'Расход', 'Заявки', 'Цена заявки', 'CR'], x[0].sort(function(a, b){ return b.cost - a.cost; }).map(function(o){ return [o.k, num(o.clk), rub(o.cost), o.conv, o.conv ? rub(o.cost / o.conv) : '—', num(o.clk ? o.conv / o.clk * 100 : 0, 1) + '%']; }), [1, 2, 3, 4, 5])])); });
  w.appendChild(h('button', { class:'btn red', text:'Удалить загруженную статистику', onclick:function(){ if (confirm('Удалить статистику?')){ S.stats = null; save(); go('stats'); } } }));
};
function table(head, rows, numCols){
  var t = h('table', { class:'t' }), tr = h('tr'); head.forEach(function(x, i){ tr.appendChild(h('th', { class:(numCols || []).indexOf(i) > -1 ? 'n' : '', text:x })); }); t.appendChild(h('thead', {}, [tr]));
  var tb = h('tbody'); rows.forEach(function(r){ var row = h('tr'); r.forEach(function(c, i){ var td = h('td', { class:(numCols || []).indexOf(i) > -1 ? 'n' : '' }); if (c && c.nodeType) td.appendChild(c); else td.textContent = c == null ? '' : c; row.appendChild(td); }); tb.appendChild(row); }); t.appendChild(tb);
  /* сортировка по клику на заголовок */
  $$('th', t).forEach(function(th, ci){ var dir = -1; th.onclick = function(){ dir = -dir; var rs = $$('tr', tb); rs.sort(function(a, b){ var x = a.children[ci].textContent, y = b.children[ci].textContent; var nx = pnum(x), ny = pnum(y); var r = (numCols || []).indexOf(ci) > -1 ? nx - ny : x.localeCompare(y, 'ru'); return r * dir; }); rs.forEach(function(r){ tb.appendChild(r); }); }; });
  return h('div', { class:'tw' }, [t]);
}

/* ---------- Конкуренты ---------- */
var OFFERS = [['Цена «от» за м²', /от\s*\d[\d\s]*\s*(₽|руб|р\.?)\s*\/?\s*(м|кв)/i], ['Фиксированная цена / договор', /фикс|договор|не изменит/i], ['Дизайн-проект в подарок', /дизайн[- ]?проект[а-яё]*\s*(в подарок|бесплатн)|подар[а-яё]*\s*дизайн/i], ['Гарантия', /гаранти/i], ['Скидка / акция', /скидк|акци|-\d+%|выгод/i],
  ['Бесплатный замер / выезд', /бесплатн[а-яё]*\s*(замер|выезд)|замер[а-яё]*\s*бесплатн/i], ['Смета / расчёт', /смет|расч[её]т|калькулятор/i], ['Сроки', /\d+\s*(дн|недел|мес)|в срок|сроки/i], ['Оплата по этапам / без предоплаты', /поэтапн|по этапам|без предоплат|оплата после/i],
  ['Опыт / годы', /\d+\s*лет|с\s*20\d\d|опыт/i], ['Отзывы / рейтинг', /отзыв|рейтинг|★|\d[,.]\d\s*из/i], ['Рассрочка', /рассрочк|кредит/i], ['3D / визуализация', /3d|визуализац/i], ['Под ключ', /под ключ/i], ['Материалы / закупка', /материал|закупк/i], ['Своя бригада / мастера', /бригад|мастер/i]];
var OURS = { 'Цена «от» за м²':1, 'Фиксированная цена / договор':1, 'Дизайн-проект в подарок':1, 'Гарантия':1, 'Бесплатный замер / выезд':1, 'Смета / расчёт':1, 'Оплата по этапам / без предоплаты':1, 'Под ключ':1, '3D / визуализация':1 };
V.comp = function(w){
  title('Конкуренты');
  /* разбор объявлений */
  var ta = h('textarea', { placeholder:'Откройте поиск Яндекса по запросу (кнопки ниже), скопируйте рекламные объявления — заголовок, текст, уточнения — и вставьте сюда. Объявления разделяйте пустой строкой.' }); ta.value = S.compAds || ''; ta.oninput = function(){ S.compAds = ta.value; save(); };
  var out = h('div', { class:'list' });
  var qs = []; S.niches.filter(function(n){ return n.on; }).forEach(function(n){ n.groups.slice(0, 3).forEach(function(g){ if (g.phrases[0]) qs.push(g.phrases[0]); }); });
  var qb = h('div', { class:'row' }); qs.slice(0, 10).forEach(function(q){ qb.appendChild(h('a', { class:'btn lt xs', href:'https://yandex.ru/search/?lr=54&text=' + encodeURIComponent(q), target:'_blank', rel:'noopener', text:q + ' ↗' })); });
  function analyze(){
    out.innerHTML = ''; var ads = String(ta.value || '').split(/\n\s*\n/).map(function(x){ return x.trim(); }).filter(Boolean);
    if (!ads.length) return;
    var stat = OFFERS.map(function(o){ var c = ads.filter(function(a){ return o[1].test(a); }).length; return { n:o[0], c:c, p:c / ads.length }; }).sort(function(a, b){ return b.c - a.c; });
    var prices = []; ads.forEach(function(a){ (a.match(/от\s*\d[\d\s]{2,}(?=\s*(₽|руб|р\b))/gi) || []).forEach(function(m){ var v = +m.replace(/\D/g, ''); if (v >= 500 && v <= 100000) prices.push(v); }); });
    prices.sort(function(a, b){ return a - b; });
    var bars = h('div', { class:'bars' }); stat.forEach(function(s){ bars.appendChild(h('div', { class:'barl' }, [h('span', { text:s.n }), h('div', {}, [h('i', { class:s.p >= .5 ? 'r' : s.p >= .25 ? 'y' : '', style:'width:' + Math.max(2, Math.round(s.p * 100)) + '%' })]), h('b', { text:s.c + ' из ' + ads.length })])); });
    var crowded = stat.filter(function(s){ return s.p >= .5; }).map(function(s){ return s.n; }), rare = stat.filter(function(s){ return s.p < .25 && OURS[s.n]; }).map(function(s){ return s.n; });
    var tips = [];
    if (crowded.length) tips.push('<b>У всех:</b> ' + crowded.join(', ') + '. Этим уже не выделиться — не ставьте это в первый заголовок, только в уточнения.');
    if (rare.length) tips.push('<b>Почти ни у кого:</b> ' + rare.join(', ') + '. Это есть у вас — выносите во второй заголовок.');
    tips.push('Добавьте то, чего нет у конкурентов: <b>«Расчёт стоимости за 1 минуту»</b>, <b>«Ответим за 15 минут»</b>, <b>«Итоговые сметы объектов на сайте»</b>, <b>«Косметика от 8 000 ₽/м²»</b> (АтомСтройРемонт косметику не берёт).');
    if (prices.length){ var med = prices[Math.floor(prices.length / 2)]; tips.push('<b>Цены в объявлениях:</b> от ' + num(prices[0]) + ' до ' + num(prices[prices.length - 1]) + ' ₽/м², медиана ' + num(med) + ' ₽. Ваша цена «от 19 000 ₽/м² под ключ» ' + (19000 <= med ? 'ниже или на уровне рынка — пишите её прямо в заголовке.' : 'выше медианы — делайте упор на «цена в договоре» и итоговые сметы, а не на «от».')); }
    out.appendChild(h('div', { class:'hint', html:tips.join('<br><br>') })); out.appendChild(bars);
  }
  ta.addEventListener('change', analyze);
  w.appendChild(h('div', { class:'card' }, [h('h3', { text:'Разбор объявлений конкурентов в поиске' }), h('div', { class:'muted sm', text:'Быстрый переход в поиск Яндекса по Екатеринбургу:' }), qb, ta, h('button', { class:'btn', text:'Разобрать', onclick:analyze }), out]));
  analyze();
  /* таблица конкурентов */
  var F = [['name', 'Компания'], ['site', 'Сайт'], ['price', 'Цены'], ['offer', 'Оффер / что обещают'], ['guarantee', 'Гарантия'], ['reviews', 'Отзывы'], ['weak', 'Слабые места'], ['notes', 'Заметки']];
  var t = h('table', { class:'t' }), tr = h('tr'); F.forEach(function(f){ tr.appendChild(h('th', { text:f[1] })); }); tr.appendChild(h('th', { text:'' })); t.appendChild(h('thead', {}, [tr]));
  var tb = h('tbody'); t.appendChild(tb);
  var filter = h('input', { type:'text', placeholder:'Поиск по таблице' });
  function draw(){
    tb.innerHTML = ''; var q = norm(filter.value);
    S.comps.forEach(function(c, i){
      if (q && norm(F.map(function(f){ return c[f[0]] || ''; }).join(' ')).indexOf(q) < 0) return;
      var row = h('tr');
      F.forEach(function(f){ var td = h('td'); if (f[0] === 'site' && c.site){ td.appendChild(h('a', { href:/^https?:/.test(c.site) ? c.site : 'https://' + c.site, target:'_blank', rel:'noopener', text:'открыть ↗', class:'sm' })); }
        var e = h('div', { contenteditable:'true', style:'min-width:' + (f[0] === 'name' ? 130 : 150) + 'px;outline:none' }); e.textContent = c[f[0]] || ''; e.oninput = function(){ c[f[0]] = e.textContent; save(); }; td.appendChild(e); row.appendChild(td); });
      row.appendChild(h('td', {}, [h('button', { class:'btn red xs', text:'×', title:'Удалить', onclick:function(){ if (confirm('Удалить «' + c.name + '»?')){ S.comps.splice(i, 1); save(); draw(); } } })]));
      tb.appendChild(row);
    });
  }
  filter.oninput = draw; draw();
  w.appendChild(h('div', { class:'card' }, [h('h3', {}, ['Конкуренты в Екатеринбурге', h('span', { class:'badge', text:S.comps.length }), h('span', { class:'sp' }), h('button', { class:'btn lt xs', text:'+ Конкурент', onclick:function(){ S.comps.unshift({ name:'Новый конкурент', site:'', price:'', offer:'', guarantee:'', reviews:'', weak:'', notes:'' }); save(); draw(); } })]),
    h('div', { class:'muted sm', text:'Данные из разбора 30 компаний (4 ноября 2026) и АтомСтройРемонта (15 ноября). Кликните в ячейку, чтобы изменить.' }), filter, h('div', { class:'tw', style:'max-height:620px' }, [t])]));
  /* выводы */
  w.appendChild(h('div', { class:'card' }, [h('h3', { text:'Где обгонять конкурентов' }), h('ol', { class:'steps', html:
    '<li><b>Не воевать в общем аукционе</b> «ремонт квартир екатеринбург» — там лидеры с 150–500 отзывами. Брать узкие группы: районы, «ремонт двухкомнатной под ключ цена», «ремонт новостройки white box», косметика, ванные.</li>' +
    '<li><b>Цена в объявлении</b> — у большинства «от 1 990 ₽», которому не верят. Ваш козырь — одна честная цена и итоговые сметы объектов.</li>' +
    '<li><b>Расчёт за минуту</b> на лендинге — почти ни у кого нет. Выносить в заголовок 2 и быструю ссылку «Рассчитать стоимость».</li>' +
    '<li><b>Скорость ответа</b>: лучшее на рынке — 15 минут (Лиман-М). Обещайте и выполняйте «перезвоним за 10 минут» — это сильнее любой скидки.</li>' +
    '<li><b>Отзывы</b> — главная слабость всех, кроме четырёх лидеров. Собирайте отзывы на Яндекс Картах с каждого объекта: от рейтинга зависит и CTR рекламы.</li>' +
    '<li><b>Дизайн-проект</b> как отдельный продукт между частниками (от 500 ₽/м²) и студиями (3 200–6 550 ₽/м²), стоимость засчитывается в ремонт.</li>' })]));
};

/* ---------- Запуск и стратегия ---------- */
var TODO = [
  ['metrika', 'Создать счётчик Метрики для remont.domilia.ru и вписать номер в админке лендинга', 'Без Метрики Директ не видит заявки и не может учиться'],
  ['goal', 'В Метрике добавить цель «Заявка»: посещение страницы, URL содержит /spasibo/', 'Сделать её ключевой целью'],
  ['formsubmit', 'Активировать FormSubmit (письмо «Activate Form») и отправить тестовую заявку', 'Проверить, что заявка пришла на почту и открылась страница «Спасибо»'],
  ['sem', 'Проверить группы и фразы в «Семантике», добавить фразы из Вордстата', 'Каждая группа — один смысл, 5–15 фраз'],
  ['minus', 'Проверить минус-слова', 'Отключить категории, которые вам не подходят'],
  ['ads', 'Исправить все ошибки в «Объявлениях»', 'Счётчик ошибок на «Обзоре» должен быть 0'],
  ['upload', 'Выгрузить кампании и загрузить через Коммандер', 'Начать с «Ремонт квартир» и «Ремонт ванной»'],
  ['geo', 'Регион: только Екатеринбург', 'Без области и пригородов — вы там не работаете'],
  ['sched', 'Расписание: 8:00–22:00 каждый день', 'Ночью — дорогие случайные клики и звонки, на которые некому ответить'],
  ['strat1', 'Старт: стратегия «Максимум кликов» с ограничением цены клика (~150–200 ₽) и недельным бюджетом', 'Первые 2–3 недели — набрать статистику и 10+ заявок'],
  ['strat2', 'После 10+ заявок в неделю: «Максимум конверсий» с оплатой за конверсии (цель «Заявка»)', 'Платите только за заявки; ставьте цену заявки на 20% выше фактической и снижайте шагами'],
  ['rsya', 'РСЯ — отдельной кампанией и не раньше, чем через 2–3 недели', 'С запретом мобильных приложений-игр и регулярной чисткой площадок'],
  ['vcard', 'Подключить визитку: телефон, адрес, часы работы', 'Телефон в объявлении даёт звонки сразу из поиска'],
  ['maps', 'Завести карточки на Яндекс Картах и 2ГИС, начать собирать отзывы', 'Рейтинг показывается в объявлении и поднимает CTR'],
  ['call', 'Договориться в команде: перезваниваем на заявку за 10 минут', 'Скорость ответа решает больше, чем цена клика'],
  ['week', 'Каждую неделю: загрузить отчёт в «Анализ статистики», добавить минус-слова, запретить площадки', '15 минут в неделю экономят до трети бюджета']
];
V.plan = function(w){
  title('Запуск и стратегия');
  var box = h('div', { class:'card' }, [h('h3', { text:'Чек-лист запуска' })]);
  TODO.forEach(function(t){ var c = h('input', { type:'checkbox' }); c.checked = !!S.todo[t[0]]; var row = h('label', { class:'todo' + (c.checked ? ' done' : '') }, [c, h('span', {}, [t[1], h('small', { text:t[2] })])]); c.onchange = function(){ S.todo[t[0]] = c.checked; row.classList.toggle('done', c.checked); save(); }; box.appendChild(row); });
  w.appendChild(box);
  w.appendChild(h('div', { class:'card' }, [h('h3', { text:'Как работает схема «максимум заявок»' }), h('ol', { class:'steps', html:
    '<li><b>Узкие группы под каждый смысл запроса</b> → заголовок повторяет запрос → CTR выше → Директ снижает цену клика.</li>' +
    '<li><b>Лендинг с квизом</b> (remont.domilia.ru) → конверсия в заявку 3–8% против 1–2% у обычного сайта.</li>' +
    '<li><b>Цель «Заявка» в Метрике</b> → стратегия с оплатой за конверсии → Директ сам ищет людей, которые оставляют заявки.</li>' +
    '<li><b>Еженедельная чистка</b>: минус-слова из запросов, запрет мусорных площадок, отключение дорогих фраз → бюджет уходит только на целевые клики.</li>' +
    '<li><b>Скорость ответа и честная цена</b> → больше заявок превращается в договоры.</li>' })]));
};

/* ---------- Данные ---------- */
V.data = function(w){
  title('Данные и резервная копия');
  w.appendChild(h('div', { class:'hint', html:'Все данные программы хранятся <b>в этом браузере</b>. Чтобы перенести их на другой компьютер или не потерять — скачайте резервную копию и загрузите её там.' }));
  var fi = h('input', { type:'file', accept:'.json', hidden:true });
  fi.onchange = function(){ var f = fi.files[0]; if (!f) return; var r = new FileReader(); r.onload = function(){ try { var d = JSON.parse(r.result); if (!d.niches) throw 0; if (confirm('Заменить текущие данные данными из файла?')){ S = d; save(); go('dash'); toast('Данные загружены'); } } catch(e){ toast('Это не файл копии программы'); } }; r.readAsText(f); };
  w.appendChild(h('div', { class:'card' }, [h('h3', { text:'Резервная копия' }), h('div', { class:'row' }, [
    h('button', { class:'btn', text:'Скачать копию (.json)', onclick:function(){ download('direkt-domilia-' + new Date().toISOString().slice(0, 10) + '.json', JSON.stringify(S, null, 1), 'application/json'); } }),
    h('button', { class:'btn lt', text:'Загрузить копию', onclick:function(){ fi.click(); } }), fi])]));
  w.appendChild(h('div', { class:'card' }, [h('h3', { text:'Сброс' }), h('p', { class:'muted', text:'Вернуть фразы, минус-слова, конкурентов и настройки к начальным. Статистика и ваши правки удалятся.' }),
    h('button', { class:'btn red', text:'Сбросить всё к начальным', onclick:function(){ if (confirm('Точно сбросить? Сначала лучше скачать копию.')){ S = fresh(); save(); go('dash'); } } })]));
};

var h0 = (location.hash || '').slice(1); go(V[h0] ? h0 : 'dash');
})();
