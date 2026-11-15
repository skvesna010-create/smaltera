#!/usr/bin/env python3
"""Собирает отдельную страницу для каждого объекта: /obekty/<id>/index.html.
Запуск из корня сайта:  python3 tools/build_objects.py
Шаблон — obekt.html. Данные — assets/data.js (раздел projects).
Объекты с "demo": true получают noindex и не попадают в sitemap."""
import json, re, os, html, shutil

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SITE = 'https://domilia.ru/'
os.chdir(ROOT)

s = open('assets/data.js', encoding='utf-8').read()
data = json.loads(s[s.index('{'):s.rindex('}') + 1])
projects = data.get('projects', [])
tpl = open('obekt.html', encoding='utf-8').read()

# убираем редирект-скрипт шаблона (он нужен только для старых ссылок obekt.html?id=)
tpl = re.sub(r'<script id="obj-redirect">.*?</script>\n?', '', tpl, flags=re.S)

def rel(m):
    attr, q, url = m.group(1), m.group(2), m.group(3)
    if re.match(r'(https?:|//|/|#|data:|tel:|mailto:|javascript:)', url):
        return m.group(0)
    if url in ('./', ''):
        url = ''
    return f'{attr}={q}../../{url}{q}'

def esc(t): return html.escape(str(t), quote=True)

out_ids = []
if os.path.isdir('obekty'):
    for d in os.listdir('obekty'):
        p = os.path.join('obekty', d)
        if os.path.isdir(p) and os.path.exists(os.path.join(p, '.generated')):
            shutil.rmtree(p)

for p in projects:
    pid = p.get('id')
    if not pid or not re.fullmatch(r'[a-z0-9-]+', pid):
        continue
    url = f'{SITE}obekty/{pid}/'
    title = f"{p['title']} — {p.get('type','ремонт')}, {p.get('area','')} м², {p.get('price','')} | Домилия"
    desc = f"{p.get('type','Ремонт')} в Екатеринбурге: {p['title'].lower()}, {p.get('area','')} м², срок {p.get('days','')} дней, стоимость работ {p.get('price','')}. Фото, смета и этапы."
    h = tpl
    h = re.sub(r'\b(href|src)=(["\'])([^"\']*)\2', rel, h)
    h = re.sub(r'<title>.*?</title>', f'<title>{esc(title)}</title>', h, flags=re.S)
    h = re.sub(r'<meta name="description" content="[^"]*">', f'<meta name="description" content="{esc(desc)}">', h)
    h = re.sub(r'<link rel="canonical" href="[^"]*">', f'<link rel="canonical" href="{url}">', h)
    h = re.sub(r'<meta property="og:title" content="[^"]*">', f'<meta property="og:title" content="{esc(p["title"])}">', h)
    h = re.sub(r'<meta property="og:description" content="[^"]*">', f'<meta property="og:description" content="{esc(desc)}">', h)
    h = re.sub(r'<meta property="og:url" content="[^"]*">', f'<meta property="og:url" content="{url}">', h)
    h = h.replace('https://domilia.ru/obekt.html', url)
    h = re.sub(r'<meta name="robots"[^>]*>(<!--.*?-->)?', '<meta name="robots" content="noindex, follow">' if p.get('demo') else '', h)
    h = h.replace('<span class="cur">Объект</span>', f'<span class="cur">{esc(p["title"])}</span>')
    h = h.replace('<h1>Объект</h1>', f'<h1>{esc(p["title"])}</h1>')
    h = h.replace('<div data-sm="project"></div>', f'<div data-sm="project" data-id="{pid}"></div>')
    os.makedirs(f'obekty/{pid}', exist_ok=True)
    open(f'obekty/{pid}/index.html', 'w', encoding='utf-8').write(h)
    open(f'obekty/{pid}/.generated', 'w').write('')
    if not p.get('demo'):
        out_ids.append(pid)

# sitemap: добавляем настоящие объекты
sm = open('sitemap.xml', encoding='utf-8').read()
sm = re.sub(r'\s*<url><loc>https://domilia\.ru/obekty/[a-z0-9-]+/</loc>.*?</url>', '', sm, flags=re.S)
sm = re.sub(r'\s*<url>\s*<loc>https://domilia\.ru/obekt\.html</loc>.*?</url>', '', sm, flags=re.S)
add = ''.join(f'\n  <url><loc>{SITE}obekty/{i}/</loc><changefreq>monthly</changefreq><priority>0.6</priority></url>' for i in out_ids)
sm = sm.replace('</urlset>', add + '\n</urlset>')
open('sitemap.xml', 'w', encoding='utf-8').write(sm)
print('страниц объектов:', len(projects), '· в sitemap:', len(out_ids))
