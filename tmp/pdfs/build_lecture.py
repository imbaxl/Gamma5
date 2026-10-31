from pathlib import Path
from reportlab.pdfgen import canvas
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import Paragraph
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.colors import HexColor
from pypdf import PdfReader
root=Path(__file__).resolve().parents[2]
out=root/'output/pdf/循环基充分性_手机讲义.pdf'
pdfmetrics.registerFont(TTFont('CN','C:/Windows/Fonts/msyh.ttc'))
pdfmetrics.registerFont(TTFont('CNB','C:/Windows/Fonts/msyhbd.ttc'))
body=ParagraphStyle('b',fontName='CN',fontSize=13,leading=23,wordWrap='CJK',textColor=HexColor('#253247'))
formula=ParagraphStyle('f',parent=body,alignment=1,fontSize=14,leading=25)
head=ParagraphStyle('h',parent=body,fontName='CNB',fontSize=21,leading=30,textColor=HexColor('#153e65'))
pages=[]
def clean(s):
 for old,new in {'₀':'<sub>0</sub>','₁':'<sub>1</sub>','₂':'<sub>2</sub>','₃':'<sub>3</sub>','ₘ':'<sub>m</sub>','ₛ':'<sub>s</sub>','ᵢ':'<sub>i</sub>','ᵏ':'<super>k</super>','ᵐ':'<super>m</super>','⇔':'当且仅当'}.items(): s=s.replace(old,new)
 return s
def P(title,*items): pages.append((title,[(k,clean(t)) for k,t in items]))
def F(s): return ('f',s)
def B(s): return ('b',s)
P('从几何重数到循环基',B('充分性证明 · 手机阅读讲义'),B('你的核心疑问：特征向量的维数，怎样与“一个向量反复经过变换后形成一组基”联系起来？'),B('本讲义依次解释几何重数、广义特征向量、Jordan 链与块、循环向量，以及构造后的完整证明。'),B('先读概念与具体例子，再读多项式整除的证明。所有公式独立成行，采用窄幅大字排版。'),B('本证明调用 Jordan 标准形定理。讲义解释定理内容及本题所需性质，不展开该结构定理本身的完整证明。'))
P('01 充分性要证明什么',B('已知 V 是复数域上的 n 维线性空间，σ 是 V 上的线性变换，每个特征值的几何重数均为 1。'),B('要构造一个向量 α，使下面 n 个向量成为一组基：'),F('α, σ(α), …, σ<super>n−1</super>(α)'),B('充分性就是从右边的条件推出左边的结论。不能提前假定这组基已经存在。'),B('必要性从已有基出发；充分性必须自己选出 α，并证明它的迭代结果线性无关。'))
P('02 变换的幂与线性',B('线性变换把 V 中的向量送到 V 中的向量，并保持线性组合：'),F('σ(au+bv)=aσ(u)+bσ(v)'),B('幂表示连续作用次数，不是把向量乘方。'),F('σ<super>0</super>=I，σ<super>1</super>=σ'),F('σ<super>2</super>(α)=σ(σ(α))'),B('I 是恒等变换，I(v)=v。从 α 开始，不作用、作用一次、作用两次，得到一个向量序列。'),B('写出序列不保证它是一组基；它可能重复，也可能有线性关系。'))
P('03 基与循环向量',B('一组基既能张成整个空间，又线性无关。张成意味着任意向量都能表示为它们的线性组合；线性无关保证表示唯一。'),B('在 n 维空间中，n 个线性无关向量自动构成一组基。'),B('若 α 的所有迭代结果能张成 V，就称 α 是循环向量：'),F('span{α, σα, σ<super>2</super>α, …}=V'),B('span 表示所有有限线性组合的集合。本题要求前 n 个结果成为基；我们将直接证明它们线性无关。'))
P('04 特征值与几何重数',B('若存在非零向量 v，使'),F('σv=λv'),B('则 λ 是特征值，v 是相应的特征向量。变换只是把这个向量乘以一个数。'),B('对应的特征子空间为'),F('E<sub>λ</sub>=ker(σ−λI)'),B('ker 是核，即被变换送到零向量的所有向量。几何重数定义为'),F('g<sub>λ</sub>=dim E<sub>λ</sub>'),B('几何重数为 1，表示独立特征向量方向只有一个；不表示该特征值相关的整个空间只有一维。'))
P('05 广义特征向量',B('普通特征向量被 σ−λI 作用一次后成为零：'),F('(σ−λI)v=0'),B('广义特征向量只要求存在某个正整数 r，使'),F('(σ−λI)<super>r</super>v=0'),B('有些向量一次作用不为零，两次或更多次才为零。它们能延长由特征向量开始的链。'),B('因此，只有一个普通特征向量方向，也可能有一条很长的广义特征向量链。这解释了“几何重数为 1”为什么仍能与生成多维空间相容。'))
P('06 Jordan 链',B('固定特征值 λ，记 N=σ−λI。如果一组线性无关向量满足'),F('Ne<sub>1</sub>=0'),F('Ne<sub>2</sub>=e<sub>1</sub>，…，Ne<sub>m</sub>=e<sub>m−1</sub>'),B('它们构成长度为 m 的 Jordan 链。N 把后面的向量送到前一个，最后送到零。'),B('对于原变换，有'),F('σe<sub>1</sub>=λe<sub>1</sub>'),F('σe<sub>j</sub>=λe<sub>j</sub>+e<sub>j−1</sub>（j≥2）'),B('务必区分：让链向前走一步的是 N，而 σ 还多出 λ 倍的原向量。'))
P('07 Jordan 块与坐标',B('选定基后，线性变换用矩阵表示。第 j 列记录第 j 个基向量的像的坐标。三阶链对应：'),F('J<sub>3</sub>(λ) = ［ λ　1　0 ］'),F('　　　　　［ 0　λ　1 ］'),F('　　　　　［ 0　0　λ ］'),B('例如第三列表示 σe₃=e₂+λe₃。一般 m 阶块主对角线全为 λ，紧邻其上方全为 1，其余为 0。'),B('矩阵是同一个变换在某组基下的描述。换基不改变是否存在循环向量。'))
P('08 Jordan 标准形定理',B('在有限维复向量空间中，可以选择由 Jordan 链组成的基，使变换矩阵成为若干 Jordan 块的分块对角矩阵。'),B('分块对角意味着每块对应的子空间在 σ 下不变：块内的向量作用后仍在该块内，不同块没有混合项。'),B('整个空间是各块子空间的直和：'),F('V=V<sub>1</sub> ⊕ … ⊕ V<sub>r</sub>'),B('直和意味着向量的分解唯一；各块分量相加为零，就必须每个分量都为零。'),B('复数域使特征多项式完全分裂为一次因子，保证本题可以使用该定理。'))
P('09 几何重数为何数块',B('在属于 λ 的一个块中，N=σ−λI 满足'),F('N(a<sub>1</sub>e<sub>1</sub>+…+a<sub>m</sub>e<sub>m</sub>)'),F('=a<sub>2</sub>e<sub>1</sub>+…+a<sub>m</sub>e<sub>m−1</sub>'),B('结果为零当且仅当 a₂ 到 aₘ 全为零。因此这个块对核只贡献一个方向 e₁。'),B('属于其他特征值 μ 的块，σ−λI 是上三角矩阵，对角线全为非零数 μ−λ，故可逆，不贡献核。'),B('结合直和，得到'),F('dim ker(σ−λI)'),F('= 属于 λ 的 Jordan 块数'),B('所以本题条件保证每个不同特征值恰好只有一个块。'))
P('10 一个块怎样生成',B('取链的末端 β=eₘ，记 N=σ−λI。'),F('β=e<sub>m</sub>，Nβ=e<sub>m−1</sub>，…'),F('N<super>m−1</super>β=e<sub>1</sub>，N<super>m</super>β=0'),B('前 m 个结果就是该块的一组基，只是顺序反了。但题目需要 σ 的迭代结果。由二项式公式，'),F('N<super>k</super>=(σ−λI)<super>k</super>'),F('=Σ<sub>j=0</sub><super>k</super>C(k,j)(−λ)<super>k−j</super>σ<super>j</super>'),B('C(k,j) 为二项式系数。每个 Nᵏβ 都是 β 到 σᵏβ 的线性组合，所以 σ 的前 m 个迭代结果也能生成整块。'))
P('11 三维具体计算',B('取 λ=2 的三阶块：'),F('σe<sub>1</sub>=2e<sub>1</sub>'),F('σe<sub>2</sub>=e<sub>1</sub>+2e<sub>2</sub>'),F('σe<sub>3</sub>=e<sub>2</sub>+2e<sub>3</sub>'),B('取 β=e₃，则'),F('σβ=e<sub>2</sub>+2e<sub>3</sub>'),F('σ<super>2</super>β=e<sub>1</sub>+4e<sub>2</sub>+4e<sub>3</sub>'),B('反过来还原原基：'),F('e<sub>3</sub>=β'),F('e<sub>2</sub>=σβ−2β'),F('e<sub>1</sub>=σ<super>2</super>β−4σβ+4β'),B('三个迭代向量能张成三维空间，因而是一组基。'))
P('12 多个块怎样构造',B('不同特征值记为 λ₁,…,λₛ。每个特征值只有一块，块大小记为 m₁,…,mₛ：'),F('m<sub>1</sub>+…+m<sub>s</sub>=n'),B('第 i 块子空间记 Vᵢ，链的末端向量记 βᵢ。取'),F('α=β<sub>1</sub>+…+β<sub>s</sub>'),B('它在每块都有一个能生成该块的分量。但不能仅凭这一点就断言能生成整个空间。'),B('同一个 σ 同时作用在所有分量上。我们必须证明迭代结果没有低次线性关系，才能完成论证。'))
P('13 将关系写成多项式',B('假设前 n 个迭代向量存在关系：'),F('c<sub>0</sub>α+c<sub>1</sub>σα+…'),F('+c<sub>n−1</sub>σ<super>n−1</super>α=0'),B('把这些系数组成多项式：'),F('p(t)=c<sub>0</sub>+c<sub>1</sub>t+…+c<sub>n−1</sub>t<super>n−1</super>'),B('用 σ 代替变量 t，常数项换成 c₀I，定义'),F('p(σ)=c<sub>0</sub>I+c<sub>1</sub>σ+…+c<sub>n−1</sub>σ<super>n−1</super>'),B('原关系就是 p(σ)α=0。若系数不全为零，p 是次数不超过 n−1 的非零多项式。接下来证明这种 p 不可能存在。'))
P('14 直和把关系拆开',B('各块子空间在 σ 下不变，也在其所有幂以及 p(σ) 下不变。代入 α 的构造：'),F('p(σ)α=Σ<sub>i=1</sub><super>s</super>p(σ)β<sub>i</sub>=0'),B('第 i 项属于 Vᵢ。各块构成直和，分量之和为零必须每项为零：'),F('p(σ)β<sub>i</sub>=0（每个 i）'),B('于是全空间中的关系拆成了每块中的关系。现在只需弄清：什么多项式能把一条链的末端向量送到零？'))
P('15 单块的关键引理',B('一块长度为 m、特征值为 λ，末端向量为 β。我们证明'),F('p(σ)β=0'),F('⇔ (t−λ)<super>m</super> 整除 p(t)'),B('整除意味着存在多项式 q，使'),F('p(t)=(t−λ)<super>m</super>q(t)'),B('先令 u=t−λ，把 p(λ+u) 按 u 的幂展开。这等价于唯一地写成'),F('p(t)=a<sub>0</sub>+a<sub>1</sub>(t−λ)+…'),F('+a<sub>d</sub>(t−λ)<super>d</super>'),B('d 是次数。这是有限多项式恒等式，不涉及无穷级数或收敛性。'))
P('16 引理的全部细节',B('令 N=σ−λI。把展开作用于 β：'),F('p(σ)β=Σ<sub>r=0</sub><super>d</super>a<sub>r</sub>N<super>r</super>β'),B('Nᵐβ=0，所以高次项全消失。若 d 小于 m，缺少的系数记作零。于是'),F('p(σ)β=a<sub>0</sub>β+a<sub>1</sub>Nβ+…'),F('+a<sub>m−1</sub>N<super>m−1</super>β'),B('这 m 个向量是一组基，因此结果为零当且仅当'),F('a<sub>0</sub>=a<sub>1</sub>=…=a<sub>m−1</sub>=0'),B('剩余项全含因子 (t−λ)ᵐ，故它整除 p。反过来，如果含该因子，Nᵐβ=0 也保证 p(σ)β=0。引理证毕。'))
P('17 不同特征值与互素',B('对每块应用引理：'),F('(t−λ<sub>i</sub>)<super>mᵢ</super> 整除 p(t)'),B('λᵢ 两两不同，这些因子两两互素，也就是没有非常数公共因子。'),B('由复数多项式唯一因式分解，p 中每个不同根至少出现 mᵢ 次，所以所有因子可以相乘：'),F('Q(t)=∏<sub>i=1</sub><super>s</super>(t−λ<sub>i</sub>)<super>mᵢ</super>'),F('Q(t) 整除 p(t)'),B('“不同特征值”不可省略。同一特征值的两块，因子不互素，就不能把次数这样相加。'))
P('18 互素整除为何可合并',B('小引理：f 与 g 互素，且都整除 p，则 fg 整除 p。'),B('由 f 整除 p，写 p=fh。由互素性，有多项式 a、b 满足 Bézout 恒等式：'),F('af+bg=1'),B('它可由多项式辗转相除法得到。两边乘 h：'),F('h=afh+bgh=ap+bgh'),B('右侧两项都被 g 整除，因此 g 整除 h。写 h=gk，就有'),F('p=fgk'),B('多个两两互素因子重复这个步骤即可。这也解释了上一页的乘积整除。'))
P('19 次数矛盾得出结论',B('乘积 Q 的次数为'),F('deg Q=m<sub>1</sub>+…+m<sub>s</sub>=n'),B('但前 n 个迭代向量的关系构造的 p，次数最多 n−1。若 p 非零且 Q 整除 p，则 p=Qh，h 非零，因而'),F('deg p=deg Q+deg h≥n'),B('与 deg p≤n−1 矛盾。所以 p 只能为零多项式，所有关系系数为零。'),B('这证明前 n 个迭代向量线性无关。它们处于 n 维空间中，故构成一组基。充分性证毕。'))
P('20 两块的具体例子',B('三维空间中，特征值 0 有二阶块，基为 e₁、e₂；特征值 1 有一阶块，基为 f：'),F('σe<sub>1</sub>=0，σe<sub>2</sub>=e<sub>1</sub>，σf=f'),B('取各块末端之和：'),F('α=e<sub>2</sub>+f'),F('σα=e<sub>1</sub>+f，σ<super>2</super>α=f'),B('从迭代结果还原原基：'),F('f=σ<super>2</super>α'),F('e<sub>1</sub>=σα−σ<super>2</super>α'),F('e<sub>2</sub>=α−σ<super>2</super>α'),B('所以它们确实是一组基。在抽象证明中，p 必须同时含 t² 与 t−1，次数至少三次；二次以下不能有非零关系。'))
P('21 同一特征值多块的障碍',B('若同一 λ 有两块，长度 a、b，对应因子为'),F('(t−λ)<super>a</super> 与 (t−λ)<super>b</super>'),B('它们不互素，只需较大的幂就能同时消去两块上的所有向量：'),F('(σ−λI)<super>max(a,b)</super>=0'),B('这个等式只指限制在这两块的直和上。该次数小于 a+b，意味着存在低次关系，无法由一个向量生成这两块的全部维数。'),B('最简单的例子：二维空间中 σ=λI，任意 α 都满足 σα=λα，迭代永远只有一个方向；该特征值的几何重数为 2。'))
P('22 最小多项式的解释',B('使整个变换为零的最低次首一多项式，称 σ 的最小多项式。首一指最高次项系数为 1。'),F('m<sub>σ</sub>(σ)=0'),B('使某个非零向量 α 被送到零的最低次首一多项式，称向量的消去多项式，也常称向量的最小多项式：'),F('m<sub>α</sub>(σ)α=0'),B('刚才的论证实际证明构造的 α 满足'),F('m<sub>α</sub>(t)=∏<sub>i=1</sub><super>s</super>(t−λ<sub>i</sub>)<super>mᵢ</super>'),B('次数为 n。因此前 n 个迭代结果没有非平凡关系。这是对证明的概括，不是额外需要先背的新前提。'))
P('23 代数重数与几何重数',B('特征多项式定义为'),F('χ<sub>σ</sub>(t)=det(tI−A)'),B('A 是表示矩阵，det 是行列式。换基不改变这个多项式。λ 作为它的根的重数，叫代数重数。'),B('在 Jordan 形式中，同一特征值的全部块大小之和是代数重数，块数是几何重数。'),B('本题每个特征值只有一块，其大小就是代数重数，最小多项式与特征多项式相同，次数为 n。'),B('几何重数为 1 不代表代数重数为 1，也不保证可对角化。三阶单块的这两个重数分别为 1 和 3。'))
P('24 完整证明 · 前半',B('设 σ 的不同特征值为 λ₁,…,λₛ。由 Jordan 标准形及几何重数条件，每个特征值只有一个块，大小 mᵢ，且各块大小之和为 n。'),B('第 i 块取链基 eᵢ,₁,…,eᵢ,ₘᵢ，满足'),F('(σ−λ<sub>i</sub>I)e<sub>i,1</sub>=0'),F('(σ−λ<sub>i</sub>I)e<sub>i,j</sub>=e<sub>i,j−1</sub>（j≥2）'),B('取末端 βᵢ=eᵢ,ₘᵢ，令 α=Σβᵢ。假设前 n 个迭代向量存在关系，写为 p(σ)α=0，其中 deg p≤n−1。'),B('由各块的不变性和直和分解，每个 i 都有 p(σ)βᵢ=0。'))
P('25 完整证明 · 后半',B('将 p 按 t−λᵢ 的幂展开。因为'),F('β<sub>i</sub>, (σ−λ<sub>i</sub>I)β<sub>i</sub>, …'),F('(σ−λ<sub>i</sub>I)<super>mᵢ−1</super>β<sub>i</sub>'),B('是第 i 块的一组基，更高次作用为零，p(σ)βᵢ=0 强制前 mᵢ 个展开系数为零。因此'),F('(t−λ<sub>i</sub>)<super>mᵢ</super> 整除 p(t)'),B('这些因子两两互素，所以乘积整除 p。乘积次数为 n，而 deg p≤n−1，故 p=0。'),B('因此前 n 个迭代向量线性无关，构成 V 的一组基。充分性得证。'))
P('26 回读时抓住四个连接',B('一：几何重数数普通特征向量的独立方向，在 Jordan 形式中等于对应块数。'),B('二：每块末端通过 σ−λI 能走遍整条链，这些作用都能写成 σ 的多项式。'),B('三：取各块末端之和。直和把消去关系拆到各块；不同特征值使各块强制的因子互素。'),B('四：这些因子相乘有 n 次。前 n 个迭代向量的关系至多 n−1 次，所以关系只能为零。'),B('自检：为什么不能直接说“每块能生成，末端相加也能生成”？你应能指出，还需要直和拆分与互素整除两步。'))
c=canvas.Canvas(str(out),pagesize=(360,640)); c.setTitle('循环基充分性：概念、例子与完整证明')
for i,(title,items) in enumerate(pages,1):
 c.setFillColor(HexColor('#f8fafc')); c.rect(0,0,360,640,fill=1,stroke=0)
 c.setFillColor(HexColor('#3c7897')); c.rect(24,610,32,4,fill=1,stroke=0)
 y=592
 p=Paragraph(title,head); _,h=p.wrap(312,640); p.drawOn(c,24,y-h); y-=h+18
 for kind,t in items:
  p=Paragraph(t,formula if kind=='f' else body); _,h=p.wrap(312,640)
  if y-h<43: raise RuntimeError(f'overflow page {i}: {y-h}')
  p.drawOn(c,24,y-h); y-=h+(8 if kind=='f' else 12)
 c.setStrokeColor(HexColor('#d5e0e8')); c.line(24,34,336,34)
 c.setFont('CN',9); c.setFillColor(HexColor('#607287')); c.drawString(24,19,'高等代数 · 线性变换 · 充分性'); c.drawRightString(336,19,f'{i} / {len(pages)}'); c.showPage()
c.save()
r=PdfReader(str(out)); assert len(r.pages)==len(pages)
text='\n'.join(p.extract_text() for p in r.pages); assert len(text)>6000; assert '\x00' not in text
print(f'{out}: {len(r.pages)} pages, {len(text)} characters')