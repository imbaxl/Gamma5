from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.cidfonts import UnicodeCIDFont
from reportlab.pdfgen import canvas


ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "output" / "pdf"
OUT.mkdir(parents=True, exist_ok=True)

PAGE_W, PAGE_H = A4
MARGIN = 16 * mm
GRID = colors.HexColor("#B9D7E8")
MID = colors.HexColor("#D5E8F2")
INK = colors.HexColor("#163B5C")
ACCENT = colors.HexColor("#F4A261")

pdfmetrics.registerFont(UnicodeCIDFont("STSong-Light"))


def title(c, main, subtitle, page):
    c.setFillColor(INK)
    c.setFont("STSong-Light", 20)
    c.drawString(MARGIN, PAGE_H - 18 * mm, main)
    c.setFont("STSong-Light", 9)
    c.setFillColor(colors.HexColor("#59758D"))
    c.drawRightString(PAGE_W - MARGIN, PAGE_H - 16.5 * mm, subtitle)
    c.setStrokeColor(ACCENT)
    c.setLineWidth(1.5)
    c.line(MARGIN, PAGE_H - 22 * mm, PAGE_W - MARGIN, PAGE_H - 22 * mm)
    c.setFillColor(colors.HexColor("#6E879A"))
    c.setFont("Helvetica", 8)
    c.drawRightString(PAGE_W - MARGIN, 11 * mm, f"Page {page}")


def guide_square(c, x, y, size):
    c.setStrokeColor(GRID)
    c.setLineWidth(0.6)
    c.rect(x, y, size, size, stroke=1, fill=0)
    c.setStrokeColor(MID)
    c.setDash(1.2, 1.2)
    c.line(x + size / 2, y, x + size / 2, y + size)
    c.line(x, y + size / 2, x + size, y + size / 2)
    c.setDash()


def draw_sheet(filename, title_text, subtitle, letters, page_size):
    c = canvas.Canvas(str(filename), pagesize=A4)
    per_page = 12 if page_size == "pinyin" else 13
    for page, start in enumerate(range(0, len(letters), per_page), 1):
        title(c, title_text, subtitle, page)
        items = letters[start:start + per_page]
        cols = 3 if page_size == "pinyin" else 1
        rows = 4 if page_size == "pinyin" else len(items)
        available_h = PAGE_H - 43 * mm
        row_h = available_h / rows
        content_w = PAGE_W - 2 * MARGIN
        col_w = content_w / cols
        for i, letter in enumerate(items):
            col = i % cols if page_size == "pinyin" else 0
            row = i // cols if page_size == "pinyin" else i
            x = MARGIN + col * col_w
            y_top = PAGE_H - 29 * mm - row * row_h
            if page_size == "pinyin":
                cell = min(13.5 * mm, (col_w - 18 * mm) / 3)
                glyph_x = x + 1 * mm
                glyph_y = y_top - 14.2 * mm
                c.setFillColor(INK)
                c.setFont("Helvetica-Bold", 20)
                c.drawString(glyph_x, glyph_y, letter)
                start_x = x + 15 * mm
                grid_y = y_top - 18 * mm
                for n in range(3):
                    guide_square(c, start_x + n * (cell + 2.2 * mm), grid_y, cell)
            else:
                # A large model letter plus four child-friendly practice boxes on each line.
                cell = 13.2 * mm
                c.setStrokeColor(colors.HexColor("#E2EDF3"))
                c.setLineWidth(0.35)
                c.line(x, y_top - row_h + 1.5 * mm, x + content_w, y_top - row_h + 1.5 * mm)
                c.setFillColor(INK)
                c.setFont("Helvetica-Bold", 18)
                c.drawString(x + 1 * mm, y_top - 12 * mm, letter)
                c.setFillColor(colors.HexColor("#6E879A"))
                c.setFont("Helvetica", 7.5)
                c.drawString(x + 10 * mm, y_top - 10.7 * mm, "Trace and write")
                start_x = x + 37 * mm
                grid_y = y_top - 14.8 * mm
                for n in range(4):
                    guide_square(c, start_x + n * (cell + 4.2 * mm), grid_y, cell)
        c.showPage()
    c.save()


INITIALS = ["b", "p", "m", "f", "d", "t", "n", "l", "g", "k", "h", "j", "q", "x", "zh", "ch", "sh", "r", "z", "c", "s", "y", "w"]
INITIAL_GROUPS = [
    ["b", "p", "m", "f"], ["d", "t", "n", "l"], ["g", "k", "h"],
    ["j", "q", "x"], ["zh", "ch", "sh", "r"], ["z", "c", "s"], ["y", "w"],
]


def four_line_guide(c, x, y, width, height):
    """A standard four-line handwriting band: top, upper-mid, mid, and baseline."""
    offsets = (0, height / 3, height * 2 / 3, height)
    c.setStrokeColor(colors.HexColor("#A9D4E8"))
    c.setLineWidth(0.7)
    for offset in offsets:
        c.line(x, y + offset, x + width, y + offset)
    c.setStrokeColor(colors.HexColor("#D9ECF5"))
    c.setLineWidth(0.35)
    step = width / 10
    for n in range(1, 10):
        c.line(x + n * step, y, x + n * step, y + height)


def progress_strip(c, page_initials):
    c.setFont("STSong-Light", 8.5)
    c.setFillColor(colors.HexColor("#59758D"))
    c.drawString(MARGIN, 17.2 * mm, "声母表位置（分段练习）")
    x = MARGIN
    y = 9.5 * mm
    group_gap = 3.2 * mm
    usable_w = PAGE_W - 2 * MARGIN - 23 * mm
    cell_w = (usable_w - group_gap * (len(INITIAL_GROUPS) - 1)) / len(INITIALS)
    for group_index, group in enumerate(INITIAL_GROUPS):
        group_w = len(group) * cell_w
        c.setFillColor(colors.HexColor("#EEF4F7"))
        c.roundRect(x, y, group_w, 5.8 * mm, 1.6, stroke=0, fill=1)
        for index, initial in enumerate(group):
            active = initial in page_initials
            token_x = x + index * cell_w
            if active:
                c.setFillColor(colors.HexColor("#F6C978"))
                c.roundRect(token_x + 0.5, y + 0.5, cell_w - 1, 5.8 * mm - 1, 1.2, stroke=0, fill=1)
            c.setFillColor(INK if active else colors.HexColor("#8098AA"))
            c.setFont("Helvetica-Bold" if active else "Helvetica", 7)
            c.drawCentredString(token_x + cell_w / 2, y + 1.85 * mm, initial)
        x += group_w + group_gap


# Handwriting paths in middle-band units. The ink (not merely the path
# centre) touches y=0 and y=1: round strokes have radius 0.05.
# Ascenders and descenders leave intentional room at the outer guidelines.
OVAL = "M .7 .5 C .7 1.1 .05 1.1 .05 .5 C .05 -.1 .7 -.1 .7 .5"
GLYPHS = {
    "b": "M .05 1.7 L .05 .05 " + OVAL,
    "p": "M .05 .95 L .05 -.7 " + OVAL,
    "m": "M .05 .05 L .05 .95 M .05 .6 C .05 1.0666667 .5 1.0666667 .5 .6 L .5 .05 M .5 .6 C .5 1.0666667 .95 1.0666667 .95 .6 L .95 .05",
    "f": "M .12 .05 L .12 1.35 C .12 1.65 .36 1.8 .55 1.6 M .05 .95 L .55 .95",
    "d": OVAL + " M .7 .05 L .7 1.7",
    "t": "M .2 1.6 L .2 .25 C .2 .05 .36 .05 .55 .05 M .05 .95 L .55 .95",
    "n": "M .05 .05 L .05 .95 M .05 .6 C .05 1.0666667 .7 1.0666667 .7 .6 L .7 .05",
    "l": "M .12 1.7 L .12 .05",
    "g": OVAL + " M .7 .95 L .7 -.4 C .7 -.75 .3 -.75 .12 -.55",
    "k": "M .05 1.7 L .05 .05 M .65 .95 L .05 .45 M .25 .62 L .7 .05",
    "h": "M .05 1.7 L .05 .05 M .05 .6 C .05 1.0666667 .7 1.0666667 .7 .6 L .7 .05",
    "j": "M .35 .95 L .35 -.4 C .35 -.75 .05 -.75 -.1 -.55 M .35 1.52 L .35 1.58",
    "q": OVAL + " M .7 .95 L .7 -.7",
    "x": "M .05 .95 L .7 .05 M .7 .95 L .05 .05",
    "r": "M .05 .05 L .05 .95 M .05 .6 C .05 .95 .35 1.0666667 .6 .85",
    "z": "M .05 .95 L .7 .95 L .05 .05 L .7 .05",
    "c": "M .65 .82 C .35 1.15 .05 .82 .05 .5 C .05 .18 .35 -.15 .65 .18",
    "s": "M .65 .8 C .55 1.05 .05 1.0 .05 .72 C .05 .45 .7 .5 .7 .25 C .7 -.02 .15 -.02 .05 .2",
    "y": "M .05 .95 L .46875 .05 M .75 .95 L .25 -.65",
    "w": "M .05 .95 L .28 .05 L .5 .65 L .72 .05 L .95 .95",
}


def handwriting(c, initial, center_x, band_y, band_h):
    unit = band_h / 3
    # Tight bounds are used for c/s/r so their visible bodies also touch
    # both middle guidelines, rather than relying on font metrics.
    from math import sqrt
    paths = []
    advance = 0
    for letter in initial:
        tokens = GLYPHS[letter].split()
        pen = []
        xs, ys = [], []
        while tokens:
            command = tokens.pop(0)
            count = 6 if command == "C" else 2
            numbers = [float(tokens.pop(0)) for _ in range(count)]
            points = list(zip(numbers[::2], numbers[1::2]))
            if command == "C":
                for axis, values in enumerate((xs, ys)):
                    a, b, cc, d = [p[axis] for p in [current] + points]
                    aa, bb, c0 = -a + 3*b - 3*cc + d, 2*(a - 2*b + cc), b-a
                    roots = []
                    if abs(aa) < 1e-12:
                        if abs(bb) > 1e-12:
                            roots = [-c0/bb]
                    elif bb*bb - 4*aa*c0 >= 0:
                        delta = sqrt(bb*bb - 4*aa*c0)
                        roots = [(-bb+delta)/(2*aa), (-bb-delta)/(2*aa)]
                    for t in roots:
                        if 0 < t < 1:
                            values.append((1-t)**3*a + 3*(1-t)**2*t*b + 3*(1-t)*t*t*cc + t**3*d)
            current = points[-1]
            xs.append(current[0])
            ys.append(current[1])
            pen.append(({"M": "moveTo", "L": "lineTo", "C": "curveTo"}[command], points))
        xmin, ymin, xmax, ymax = min(xs), min(ys), max(xs), max(ys)
        sy, ty = 1, 0
        if letter in "mnrcsxzw":
            sy = .9 / (ymax - ymin)
            ty = .05 - ymin * sy
        paths.append((pen, advance - xmin + .05, sy, ty))
        advance += xmax - xmin + .1 + .22
    total = advance - .22
    c.saveState()
    c.translate(center_x - total * unit / 2, band_y + unit)
    c.scale(unit, unit)
    c.setLineWidth(.1)
    c.setLineCap(1)
    c.setLineJoin(1)
    for pen, offset, sy, ty in paths:
        path = c.beginPath()
        for operation, points in pen:
            coords = [value for x, y in points for value in (x + offset, y * sy + ty)]
            {"moveTo": path.moveTo, "lineTo": path.lineTo, "curveTo": path.curveTo}[operation](*coords)
        c.drawPath(path, stroke=1, fill=0)
    c.restoreState()


def draw_pinyin_sheet(filename):
    c = canvas.Canvas(str(filename), pagesize=A4)
    # Two consecutive rows per sound. The final two rows are intentionally free practice.
    rows = [(initial, False) for initial in INITIALS for _ in range(2)]
    rows.extend([(None, True), (None, True)])
    for page, start in enumerate(range(0, len(rows), 8), 1):
        page_rows = rows[start:start + 8]
        page_initials = {letter for letter, free in page_rows if not free}
        range_text = "、".join(dict.fromkeys(letter for letter, free in page_rows if not free))
        title(c, "拼音声母练习字帖", f"第 {page} 页  |  本页：{range_text}", page)
        row_h = 29.8 * mm
        band_h = 15.5 * mm
        guide_x = MARGIN + 1.5 * mm
        guide_w = PAGE_W - 2 * MARGIN - 3 * mm
        for row_index, (initial, free) in enumerate(page_rows):
            top = PAGE_H - 29 * mm - row_index * row_h
            band_y = top - 20.5 * mm
            if free:
                c.setFillColor(colors.HexColor("#6E879A"))
                c.setFont("STSong-Light", 9)
                c.drawString(guide_x, top - 5 * mm, "自由练习")
                four_line_guide(c, guide_x, band_y, guide_w, band_h)
                continue
            c.setFillColor(colors.HexColor("#6E879A"))
            c.setFont("STSong-Light", 7.5)
            c.drawString(guide_x, top - 5 * mm, "看一看，沿着浅色字描一描")
            four_line_guide(c, guide_x, band_y, guide_w, band_h)
            slot_w = guide_w / 10
            for slot in range(10):
                c.setStrokeColor(INK if slot == 0 else colors.HexColor("#75A8C4"))
                c.setStrokeAlpha(1 if slot == 0 else .32)
                handwriting(c, initial, guide_x + (slot + .5) * slot_w, band_y, band_h)
            c.setStrokeAlpha(1)
        progress_strip(c, page_initials)
        c.showPage()
    c.save()


if __name__ == "__main__":
    draw_pinyin_sheet(OUT / "拼音声母练习字帖.pdf")
    if len(__import__("sys").argv) == 1:
        draw_sheet(
            OUT / "大写英语字母练习字帖.pdf",
            "大写英语字母练习字帖",
            "Trace and write capital letters",
            list("ABCDEFGHIJKLMNOPQRSTUVWXYZ"),
            "english",
        )
