"""One-page capital-letter practice, drawn to exact four-line coordinates."""
from pathlib import Path
from math import cos, sin, pi, sqrt
from reportlab.pdfgen import canvas
from reportlab.lib import colors
from reportlab.lib.units import mm
from reportlab.lib.pagesizes import A4
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.cidfonts import UnicodeCIDFont

pdfmetrics.registerFont(UnicodeCIDFont('STSong-Light'))
OUT = Path(__file__).resolve().parents[1] / 'output/pdf/大写英语字母练习字帖.pdf'
INK = colors.HexColor('#31445D')
# Stroke centres stay in [.04,.96]; the .08-wide rounded stroke has
# visible bounds exactly at 0 and 1. All capitals share this geometry.
OVAL = 'M .76 .5 C .76 .75405 .59882 .96 .4 .96 C .20118 .96 .04 .75405 .04 .5 C .04 .24595 .20118 .04 .4 .04 C .59882 .04 .76 .24595 .76 .5'
SHAPES = {
 'A':'M .04 .04 L .4 .96 L .76 .04 M .18 .4 L .62 .4',
 'B':'M .04 .04 L .04 .96 L .38 .96 C .86 .96 .86 .5 .38 .5 L .04 .5 M .38 .5 C .9 .5 .9 .04 .38 .04 L .04 .04',
 'C':'M .73 .82 C .6 .96 .48 .96 .38 .96 C -.073333 .96 -.073333 .04 .38 .04 C .48 .04 .6 .04 .73 .18',
 'D':'M .04 .04 L .04 .96 L .28 .96 C .92 .96 .92 .04 .28 .04 L .04 .04',
 'E':'M .72 .96 L .04 .96 L .04 .04 L .72 .04 M .04 .5 L .6 .5',
 'F':'M .04 .04 L .04 .96 L .72 .96 M .04 .5 L .6 .5',
 'G':'M .73 .82 C .6 .96 .48 .96 .38 .96 C -.073333 .96 -.073333 .04 .38 .04 C .56 .04 .7 .12 .73 .2 L .73 .48 L .43 .48',
 'H':'M .04 .96 L .04 .04 M .76 .96 L .76 .04 M .04 .5 L .76 .5',
 'I':'M .12 .96 L .68 .96 M .4 .96 L .4 .04 M .12 .04 L .68 .04',
 'J':'M .2 .96 L .72 .96 M .58 .96 L .58 .28 C .58 -.04 .04 -.04 .04 .28',
 'K':'M .04 .96 L .04 .04 M .74 .96 L .04 .38 M .3 .6 L .76 .04',
 'L':'M .04 .96 L .04 .04 L .72 .04',
 'M':'M .04 .04 L .04 .96 L .4 .42 L .76 .96 L .76 .04',
 'N':'M .04 .04 L .04 .96 L .76 .04 L .76 .96',
 'O':OVAL,
 'P':'M .04 .04 L .04 .96 L .35 .96 C .9 .96 .9 .48 .35 .48 L .04 .48',
 'Q':OVAL + ' M .46 .28 L .76 .04',
 'R':'M .04 .04 L .04 .96 L .35 .96 C .9 .96 .9 .48 .35 .48 L .04 .48 M .37 .48 L .76 .04',
 'S':'M .72 .78 C .6 1.02 .05 1.02 .05 .74 C .05 .46 .75 .54 .75 .26 C .75 -.02 .2 -.02 .04 .22',
 'T':'M .04 .96 L .76 .96 M .4 .96 L .4 .04',
 'U':'M .04 .96 L .04 .36 C .04 -.0666667 .76 -.0666667 .76 .36 L .76 .96',
 'V':'M .04 .96 L .4 .04 L .76 .96',
 'W':'M .04 .96 L .19 .04 L .4 .62 L .61 .04 L .76 .96',
 'X':'M .04 .96 L .76 .04 M .76 .96 L .04 .04',
 'Y':'M .04 .96 L .4 .5 L .76 .96 M .4 .5 L .4 .04',
 'Z':'M .04 .96 L .76 .96 L .04 .04 L .76 .04',
}

def capital(c, letter, cx, baseline, height):
    tokens = SHAPES[letter].split()
    commands, bounds = [], []
    while tokens:
        op = tokens.pop(0)
        values = [float(tokens.pop(0)) for _ in range(6 if op == 'C' else 2)]
        if op == 'C':
            a,b,d,e = last_y,values[1],values[3],values[5]
            aa,bb,cc = -a+3*b-3*d+e,2*(a-2*b+d),b-a
            roots=[]
            if abs(aa)<1e-12:
                if abs(bb)>1e-12:
                    roots=[-cc/bb]
            elif bb*bb-4*aa*cc>=0:
                delta=sqrt(bb*bb-4*aa*cc)
                roots=[(-bb+delta)/(2*aa),(-bb-delta)/(2*aa)]
            for t in roots:
                if 0<t<1:
                    bounds.append((1-t)**3*a+3*(1-t)**2*t*b+3*(1-t)*t*t*d+t**3*e)
        last_y=values[-1]
        bounds.append(last_y)
        commands.append((op,values))
    lo,hi=min(bounds),max(bounds)
    # Normalize actual curve extrema; compensate for the stroke radius.
    factor=.92/(hi-lo)
    c.saveState()
    c.translate(cx - .4 * height, baseline)
    c.scale(height, height)
    c.setLineWidth(.08)
    c.setLineCap(1)
    c.setLineJoin(1)
    p = c.beginPath()
    for op,original in commands:
        values=[v if i%2==0 else .04+(v-lo)*factor for i,v in enumerate(original)]
        {'M':p.moveTo, 'L':p.lineTo, 'C':p.curveTo}[op](*values)
    c.drawPath(p, stroke=1, fill=0)
    c.restoreState()

def star(c, x, y, radius, fill):
    c.setFillColor(fill)
    p = c.beginPath()
    for i in range(10):
        a = pi/2 + i*pi/5
        r = radius if i%2 == 0 else radius*.48
        (p.moveTo if i == 0 else p.lineTo)(x+r*cos(a), y+r*sin(a))
    p.close()
    c.drawPath(p, stroke=0, fill=1)

def face(c, x, y, r, fill):
    c.setFillColor(fill)
    c.circle(x,y,r,stroke=0,fill=1)
    c.setFillColor(INK)
    for dx in [-.32,.32]:
        c.circle(x+dx*r,y+.12*r,.07*r,stroke=0,fill=1)
    c.setStrokeColor(INK)
    c.setLineWidth(.7)
    p=c.beginPath()
    p.moveTo(x-.32*r,y-.2*r)
    p.curveTo(x-.15*r,y-.5*r,x+.15*r,y-.5*r,x+.32*r,y-.2*r)
    c.drawPath(p)

def main():
    c=canvas.Canvas(str(OUT),pagesize=A4)
    c.setTitle('大写英语字母练习字帖 - 八组四线格')
    w,h=A4
    c.setFillColor(INK)
    c.setFont('STSong-Light',21)
    c.drawString(12*mm,h-17*mm,'大写字母描描乐')
    c.setFont('Helvetica-Bold',10)
    c.drawString(12*mm,h-23*mm,'MY HAPPY ABC')
    face(c,w-22*mm,h-16*mm,7*mm,colors.HexColor('#FFE3A5'))
    star(c,w-36*mm,h-11*mm,2.6*mm,colors.HexColor('#B7D9E8'))
    c.setFillColor(INK)
    c.setFont('STSong-Light',8.5)
    c.drawString(12*mm,h-30*mm,'看深色示例，描浅色字母。每个字母 6 个，学完一组打个勾！')
    groups=['ABCD','EFGH','IJK','LMN','OPQ','RST','UVW','XYZ']
    palettes=['#E2F0F9','#FCE6DE','#E8EFDA','#EDE5F6','#FFF0D1','#DDF1EB','#FBE4ED','#E5ECFA']
    card_w,card_h,gap=90*mm,60*mm,6*mm
    for index,group in enumerate(groups):
        x=12*mm+(index%2)*(card_w+gap)
        top=h-35*mm-(index//2)*(card_h+3*mm)
        y=top-card_h
        tint=colors.HexColor(palettes[index])
        c.setFillColor(colors.white)
        c.setStrokeColor(tint)
        c.setLineWidth(1.2)
        c.roundRect(x,y,card_w,card_h,4*mm,stroke=1,fill=1)
        c.setFillColor(tint)
        c.roundRect(x+2*mm,top-10*mm,card_w-4*mm,8*mm,3*mm,stroke=0,fill=1)
        c.setFillColor(INK)
        c.setFont('Helvetica-Bold',11)
        c.drawString(x+5*mm,top-7.2*mm,'  '.join(group))
        c.setLineWidth(.6)
        c.setStrokeColor(INK)
        c.roundRect(x+card_w-9*mm,top-7.8*mm,3.6*mm,3.6*mm,.7*mm,stroke=1,fill=0)
        for li,letter in enumerate(group):
            bx=x+4*mm+(li%2)*43*mm
            bt=top-13*mm-(li//2)*23*mm
            for row in range(2):
                bottom=bt-8.4*mm-row*10.3*mm
                unit=2.8*mm
                c.setStrokeColor(colors.HexColor('#B7C9D7'))
                c.setLineWidth(.42)
                for line in range(4):
                    c.line(bx,bottom+line*unit,bx+39*mm,bottom+line*unit)
                for col in range(3):
                    c.setStrokeColor(INK if row==col==0 else colors.HexColor('#B6C0CC'))
                    capital(c,letter,bx+(col+.5)*13*mm,bottom+unit,2*unit)
        if len(group)==3:
            face(c,x+67*mm,y+14*mm,4.3*mm,tint)
            c.setFillColor(INK)
            c.setFont('STSong-Light',8)
            c.drawCentredString(x+67*mm,y+6*mm,'慢慢写，写整齐')
    c.setFillColor(INK)
    c.setFont('STSong-Light',7)
    c.drawString(12*mm,6*mm,'姓名：________________    日期：________________')
    c.drawRightString(w-12*mm,6*mm,'A4 · 按实际大小打印')
    c.showPage()
    c.save()

if __name__=='__main__':
    main()
