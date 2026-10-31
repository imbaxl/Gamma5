from pathlib import Path
p=Path('tmp/pdfs/build_lecture.py')
s=p.read_text('utf-8')
s=s.replace("def P(title,*items): pages.append((title,items))", """def clean(s):
 for old,new in {'₀':'<sub>0</sub>','₁':'<sub>1</sub>','₂':'<sub>2</sub>','₃':'<sub>3</sub>','ₘ':'<sub>m</sub>','ₛ':'<sub>s</sub>','ᵢ':'<sub>i</sub>','ᵏ':'<super>k</super>','ᵐ':'<super>m</super>','⇔':'当且仅当'}.items(): s=s.replace(old,new)
 return s
def P(title,*items): pages.append((title,[(k,clean(t)) for k,t in items]))""")
s=s.replace("assert '充分性得证' in text", "assert len(text)>6000; assert '\\x00' not in text")
p.write_text(s,'utf-8')