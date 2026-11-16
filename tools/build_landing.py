#!/usr/bin/env python3
"""Вставляет объекты в лендинг remont/index.html прямо в HTML (без зависимости от скриптов).
Запуск из корня сайта: python3 tools/build_landing.py"""
import json, os, html, re
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__))); os.chdir(ROOT)
s = open('assets/data.js', encoding='utf-8').read()
P = json.loads(s[s.index('{'):s.rindex('}') + 1]).get('projects', [])
P = [p for p in P if p.get('photos')]
P.sort(key=lambda p: 1 if p.get('demo') else 0); P = P[:6]
e = lambda t: html.escape(str(t), quote=True)
def src(ph):
    u = ph if isinstance(ph, str) else (ph.get('src') or ph.get('url') or '')
    if re.fullmatch(r'\d+', u): return f'https://domilia.ru/img/{u}.jpg'
    return 'https://domilia.ru' + u if u.startswith('/') else u
cards = []
for i, p in enumerate(P):
    chips = f'<span>{e(p.get("area",""))} м²</span><span>{e(p.get("days",""))} дней</span>' + (f'<span>{e(p["district"])}</span>' if p.get('district') else '')
    cards.append(f'<button type="button" class="ob rv" data-o="{i}"><span class="ob-i"><img src="{e(src(p["photos"][0]))}" alt="{e(p["title"])}" loading="lazy">'
                 + ('<i class="ob-demo">пример</i>' if p.get('demo') else '') + f'<i class="ob-n">{len(p["photos"])} фото</i></span>'
                 + f'<span class="ob-b"><small>{e(p.get("type",""))}</small><h3>{e(p["title"])}</h3><span class="chips">{chips}</span>'
                 + f'<span class="ob-p"><strong>{e(p.get("price",""))}</strong><em>Смотреть →</em></span></span></button>')
data = [{k: p.get(k) for k in ('id','demo','title','district','type','area','days','price','year','task','done')} | {'photos': [src(x) for x in p['photos']]} for p in P]
h = open('remont/index.html', encoding='utf-8').read()
h = re.sub(r'<div class="objs" id="objList">.*?</div><!--/objList-->', '<div class="objs" id="objList">' + ''.join(cards) + '</div><!--/objList-->', h, flags=re.S)
h = re.sub(r'<script type="application/json" id="objData">.*?</script>', '<script type="application/json" id="objData">' + json.dumps(data, ensure_ascii=False).replace('</', '<\\/') + '</script>', h, flags=re.S)
h = h.replace('<section class="sec" style="padding-top:0" id="objs" hidden>', '<section class="sec" style="padding-top:0" id="objs">')
if not P: h = h.replace('<section class="sec" style="padding-top:0" id="objs">', '<section class="sec" style="padding-top:0" id="objs" hidden>')
open('remont/index.html', 'w', encoding='utf-8').write(h)
print('объектов на лендинге:', len(P))

# копия для отдельного репозитория remont (remont.domilia.ru), если он лежит рядом
import shutil
other = os.path.join(os.path.dirname(ROOT), "remont")
if os.path.isdir(os.path.join(other, ".git")):
    shutil.copy("remont/index.html", os.path.join(other, "index.html")); print("скопировано в", other)
