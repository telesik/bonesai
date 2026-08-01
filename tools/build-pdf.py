#!/usr/bin/env python3
"""Собирает PDF правил Bonesai из RULES.md.

Использование:  python3 tools/build-pdf.py
Результат:      build/bonesai-rules.pdf

Требуется установленный Google Chrome (используется headless-печать).
Markdown конвертируется встроенным конвертером — внешних зависимостей нет.
"""

import html
import re
import shutil
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT_DIR = ROOT / "build"
CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"

# --- Метаданные публикации ---------------------------------------------------

TITLE = "Bonesai"
SUBTITLE = "Настольная игра на обычном наборе домино"
TAGLINE = "Правила игры вдвоём"
AUTHOR = "Alexey Kiselyov"
AUTHOR_ALT = "Алексей Киселёв · Oleksii Kiselov"
DATE = "1 августа 2026"
VERSION = "Версия 1.0"
LICENSE = "CC BY 4.0"
LICENSE_URL = "https://creativecommons.org/licenses/by/4.0/"

ABSTRACT = """
**Bonesai** — настольная игра для двоих на обычном наборе домино (28 костей, дубль-шесть).
Дополнительных компонентов не требуется.

Правила не имеют отношения к классическому домино. Партия начинается с дубля — **корня**, от
которого растёт дерево. Обычная кость, поставленная под 90°, создаёт **развилку** и добавляет
новый открытый конец. Дубль, поставленный поперёк, **закрывает** ветку навсегда.

Партия заканчивается, когда поставить кость не может никто («рыба») или когда игрок выложил
последнюю кость. Очки получает тот, у кого на руках осталось больше, а проигрывает в матче тот,
кто первым наберёт 100. Отсюда основной конфликт игры: игрок с лёгкой рукой стремится оборвать
партию закрытиями, игрок с тяжёлой — растянуть её развилками, чтобы успеть сбросить кости.
Длина партии становится предметом прямой борьбы.

Вторая особенность — **открытые руки**: кости обоих игроков лежат лицом вверх, как фигуры
в шахматах. Единственный источник случайности — закрытый базар.
"""

APPENDIX = """
## Приложение. Место в семействе домино-игр

Bonesai принадлежит к семейству ветвящихся домино-игр — Pagat относит их к категории *tree games*.
Ниже перечислены известные прецеденты для каждой механики и отличия Bonesai от них. Ни одна из
перечисленных игр не совпадает с Bonesai целиком: оригинальна не отдельная механика, а их сочетание.

| Механика | Прецедент | Отличие Bonesai |
|---|---|---|
| Ветвление, «деревья» | Chicken Foot, Cross Dominoes, Sebastopol, Double Nine Cross, Mexican Train с ветвлением | Там ветку создаёт **дубль** (spinner). Здесь наоборот: развилку делает **обычная кость** под 90°, а дубль ветку **закрывает** |
| Закрытие ветки дублем | Русская «закрывашка»: выставивший дубль вправе перевернуть его лицом вниз, с этой стороны ставить нельзя | Здесь это не привилегия, а штатный способ постановки (поперёк), плюс ограничение свежего конца |
| Открытые руки | Contack (Parker Brothers, 1939) — треугольные фишки, руки лицом вверх | На стандартном наборе домино аналог не найден. Асимметрия раскрытия на первом ходе (первый игрок открыт до хода, второй после) не встречается |
| Счёт до порога, проигрывает набравший | Русский «Козёл» — до 101 | Здесь до 100; очки получает тот, у кого сумма **больше**, а не победитель получает сумму соперника; при равных суммах платят оба |
| Дорогой дубль 0:0 | Chicken Foot — кость 0-0 всегда стоит 50 очков | Здесь 25 и только когда она осталась **единственной** костью на руке |

Своим в Bonesai выглядит следующее сочетание: развилку создаёт обычная кость, а дубль её закрывает
(в известных tree-играх ветвящим элементом служит как раз дубль); свежий конец защищён от
немедленного закрытия и повторного поворота; и вытекающая отсюда борьба за длину партии между
поворотом и закрытием.

### Источники

- Pagat, Domino Tree Games — https://www.pagat.com/domino/tree/
- Pagat, Chicken Foot — https://www.pagat.com/domino/tree/chickenfoot.html
- Contack (Parker Brothers, 1939) — https://en.wikipedia.org/wiki/Contack
- Правила домино, вариант «закрывашка» — https://minigames.mail.ru/info/article/domino_pravila
"""

# --- Минимальный конвертер Markdown -----------------------------------------


def inline(text):
    """Инлайновая разметка. HTML экранируется, код защищается от дальнейшей обработки."""
    placeholders = []

    def stash(match):
        placeholders.append(html.escape(match.group(1)))
        return f"\x00{len(placeholders) - 1}\x00"

    text = re.sub(r"`([^`]+)`", stash, text)
    text = html.escape(text)
    text = re.sub(r"\[([^\]]+)\]\(([^)]+)\)", r'<a href="\2">\1</a>', text)
    text = re.sub(r"\*\*([^*]+)\*\*", r"<strong>\1</strong>", text)
    text = re.sub(r"(?<!\*)\*([^*]+)\*(?!\*)", r"<em>\1</em>", text)
    text = re.sub(r"\x00(\d+)\x00", lambda m: f"<code>{placeholders[int(m.group(1))]}</code>", text)
    return text


def is_block_start(line):
    return (
        line.startswith("```")
        or line.startswith("|")
        or line.startswith(">")
        or re.match(r"^#{1,6} ", line)
        or re.match(r"^[-*] ", line)
        or re.match(r"^\d+\.\s", line)
        or not line.strip()
    )


def md_to_html(md):
    lines = md.split("\n")
    out, i = [], 0

    while i < len(lines):
        line = lines[i]

        if not line.strip():
            i += 1
            continue

        # Блок кода
        if line.startswith("```"):
            i += 1
            block = []
            while i < len(lines) and not lines[i].startswith("```"):
                block.append(lines[i])
                i += 1
            i += 1
            out.append(f"<pre><code>{html.escape(chr(10).join(block))}</code></pre>")
            continue

        # Таблица
        if line.startswith("|") and i + 1 < len(lines) and re.match(r"^\|[\s:|-]+\|\s*$", lines[i + 1]):
            def cells(row):
                return [c.strip() for c in row.strip().strip("|").split("|")]

            header = cells(line)
            i += 2
            body = []
            while i < len(lines) and lines[i].startswith("|"):
                body.append(cells(lines[i]))
                i += 1
            th = "".join(f"<th>{inline(c)}</th>" for c in header)
            trs = "".join(
                "<tr>" + "".join(f"<td>{inline(c)}</td>" for c in row) + "</tr>" for row in body
            )
            out.append(f"<table><thead><tr>{th}</tr></thead><tbody>{trs}</tbody></table>")
            continue

        # Цитата
        if line.startswith(">"):
            block = []
            while i < len(lines) and lines[i].startswith(">"):
                block.append(lines[i].lstrip(">").strip())
                i += 1
            out.append(f"<blockquote>{inline(' '.join(block))}</blockquote>")
            continue

        # Заголовок
        heading = re.match(r"^(#{1,6}) (.+)$", line)
        if heading:
            level = len(heading.group(1))
            out.append(f"<h{level}>{inline(heading.group(2))}</h{level}>")
            i += 1
            continue

        # Списки
        list_match = re.match(r"^([-*]) (.+)$", line) or re.match(r"^(\d+)\.\s+(.+)$", line)
        if list_match:
            ordered = line[0].isdigit()
            items = []
            while i < len(lines):
                m = re.match(r"^[-*] (.+)$", lines[i]) if not ordered else re.match(r"^\d+\.\s+(.+)$", lines[i])
                if not m:
                    break
                item = [m.group(1)]
                i += 1
                # Продолжение пункта — строки с отступом
                while i < len(lines) and lines[i].startswith("  ") and lines[i].strip():
                    item.append(lines[i].strip())
                    i += 1
                items.append(" ".join(item))
            tag = "ol" if ordered else "ul"
            lis = "".join(f"<li>{inline(x)}</li>" for x in items)
            out.append(f"<{tag}>{lis}</{tag}>")
            continue

        # Абзац
        para = [line]
        i += 1
        while i < len(lines) and not is_block_start(lines[i]):
            para.append(lines[i])
            i += 1
        out.append(f"<p>{inline(' '.join(para))}</p>")

    return "\n".join(out)


# --- Сборка страницы ---------------------------------------------------------

CSS = """
@page { size: A4; margin: 20mm 18mm; }
* { box-sizing: border-box; }
body {
  font: 10.5pt/1.55 Georgia, "Times New Roman", serif;
  color: #1a1a1a; margin: 0; hyphens: auto;
}
h1, h2, h3, h4 {
  font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
  line-height: 1.25; break-after: avoid; margin: 1.6em 0 0.5em;
}
h1 { font-size: 19pt; margin-top: 0; }
h2 { font-size: 14pt; border-bottom: 1px solid #d8d8d8; padding-bottom: 0.25em; }
h3 { font-size: 11.5pt; }
p, ul, ol, table, pre, blockquote { break-inside: avoid-page; }
p { margin: 0 0 0.75em; text-align: justify; }
ul, ol { margin: 0 0 0.9em; padding-left: 1.4em; }
li { margin-bottom: 0.3em; }
code { font-family: Menlo, Monaco, monospace; font-size: 0.85em; background: #f2f2f2;
       padding: 0.1em 0.3em; border-radius: 3px; }
pre {
  font-family: Menlo, Monaco, monospace; font-size: 8.5pt; line-height: 1.4;
  background: #f7f7f5; border: 1px solid #e2e2de; border-radius: 4px;
  padding: 0.8em 1em; overflow: visible; white-space: pre; margin: 0 0 1em;
}
pre code { background: none; padding: 0; font-size: inherit; }
blockquote {
  margin: 0 0 1em; padding: 0.6em 1em; background: #f7f7f5;
  border-left: 3px solid #b8b8b0; font-size: 0.95em;
}
blockquote p { margin: 0; }
table { border-collapse: collapse; width: 100%; margin: 0 0 1.1em; font-size: 9pt; }
th, td { border: 1px solid #d8d8d8; padding: 0.45em 0.6em; text-align: left; vertical-align: top; }
th { background: #f2f2f0; font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
     font-size: 8.5pt; }
a { color: #1a1a1a; text-decoration: none; border-bottom: 1px solid #c4c4c4; }

.title-page { height: 247mm; display: flex; flex-direction: column; justify-content: center;
              text-align: center; break-after: page; }
.title-page .name {
  font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
  font-size: 46pt; font-weight: 300; letter-spacing: 0.06em; margin: 0 0 0.35em;
}
.title-page .rule { width: 60px; height: 2px; background: #1a1a1a; margin: 0 auto 1.6em; }
.title-page .sub { font-size: 13pt; margin: 0 0 0.3em; }
.title-page .tag { font-size: 11pt; color: #5a5a5a; font-style: italic; margin: 0 0 3.5em; }
.title-page .author { font-size: 12.5pt; margin: 0 0 0.2em; }
.title-page .author-alt { font-size: 9.5pt; color: #6a6a6a; margin: 0 0 2.8em; }
.title-page .meta { font-size: 9pt; color: #6a6a6a; line-height: 1.9; }
.abstract { margin-bottom: 2.5em; }
.abstract h2 { border: none; font-size: 12pt; }
.abstract p { font-size: 10pt; }
.doi-note { font-size: 8.5pt; color: #8a8a8a; margin-top: 1.2em; }
.appendix { break-before: page; }
.appendix h2 { margin-top: 0; }
"""


def build():
    rules = (ROOT / "RULES.md").read_text(encoding="utf-8")
    # Первый заголовок и служебная сводка статуса в PDF не нужны — их заменяет титул
    rules = re.sub(r"^# .*?\n", "", rules, count=1)
    rules = re.sub(r"^>.*?(?=\n[^>])", "", rules, count=1, flags=re.S).lstrip()

    page = f"""<!doctype html>
<html lang="ru"><head><meta charset="utf-8">
<title>{TITLE} — {TAGLINE}</title><style>{CSS}</style></head><body>

<section class="title-page">
  <div class="name">{TITLE}</div>
  <div class="rule"></div>
  <div class="sub">{SUBTITLE}</div>
  <div class="tag">{TAGLINE}</div>
  <div class="author">{AUTHOR}</div>
  <div class="author-alt">{AUTHOR_ALT}</div>
  <div class="meta">
    {DATE}<br>{VERSION}<br>
    Лицензия <a href="{LICENSE_URL}">{LICENSE}</a>
  </div>
</section>

<section class="abstract">
<h1>{TITLE} — {TAGLINE}</h1>
<h2>Аннотация</h2>
{md_to_html(ABSTRACT.strip())}
<p class="doi-note">Документ опубликован под лицензией Creative Commons Attribution 4.0
International. Лицензия распространяется на текст и схемы; игровые механики как система
объектом авторского права не являются.</p>
</section>

{md_to_html(rules)}

<section class="appendix">
{md_to_html(APPENDIX.strip())}
</section>

</body></html>"""

    OUT_DIR.mkdir(exist_ok=True)
    html_path = OUT_DIR / "bonesai-rules.html"
    pdf_path = OUT_DIR / "bonesai-rules.pdf"
    html_path.write_text(page, encoding="utf-8")

    if not Path(CHROME).exists():
        sys.exit(f"Не найден Chrome: {CHROME}")

    subprocess.run(
        [CHROME, "--headless", "--disable-gpu", "--no-pdf-header-footer",
         "--virtual-time-budget=4000",
         f"--print-to-pdf={pdf_path}", html_path.as_uri()],
        check=True, capture_output=True,
    )
    print(f"Готово: {pdf_path.relative_to(ROOT)} ({pdf_path.stat().st_size // 1024} КБ)")


if __name__ == "__main__":
    if shutil.which("python3") is None:
        sys.exit("Нужен python3")
    build()
