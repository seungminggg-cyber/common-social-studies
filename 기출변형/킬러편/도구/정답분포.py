# 킬러편 정답 번호 고르게 펴기 (기출변형 폴더에서: python3 킬러편/도구/정답분포.py)
# - 문장 선지형: 정답 문장과 다른 문장의 자리를 바꾸고 해설의 ①~⑤를 함께 바꾼다.
#   (자료에 ①②가 있는 문항, 예: 헌법 조문은 해설 번호가 꼬일 수 있으니 실행 뒤 그 문항을 꼭 본다)
# - <보기> 조합형: 오답 조합을 다시 골라 정답 자리를 옮긴다(조합은 크기순·가나다순, 보기마다 1~4번 나오게).
#   세 개짜리 조합이 정답이면 ①·②로는 옮길 수 없다.
# - 스킬특강 예제(EX)는 건드리지 않는다. 예제를 바꾸면 아래 목록도 고친다.
# - 실행 뒤 node tools/check.mjs k, node tools/explain-check.mjs k 로 확인하고 고친 문항은 다시 풀어 본다.
import re,glob,json,itertools,sys
from collections import Counter
base='content/k/'
EX=set('t1-03-k-004 t2-05-k-007 t2-16-k-001 t2-02-k-003 t2-15-k-002 t2-16-k-002 t2-01-k-004 t2-12-k-001 t2-16-k-004 t2-14-k-001 t2-13-k-005 t2-14-k-007 t2-14-k-002 t2-09-k-007 t1-07-k-001 t2-15-k-001 t2-14-k-003 t2-15-k-003 t2-15-k-004 t2-12-k-004 t1-05-k-009 t2-08-k-002 t2-10-k-001 t2-15-k-005 t2-13-k-001 t2-13-k-004 t2-07-k-002 t2-14-k-005 t2-14-k-009 t2-12-k-003 t2-01-k-006'.split())
CIRC='①②③④⑤'; L='ㄱㄴㄷㄹㅁ'
BLK=re.compile(r"^  \{\n    id: '([^']+)'.*?^  \},$",re.S|re.M)
files={f:open(f).read() for f in sorted(glob.glob(base+'*.js'))}
def items():
    out=[]
    for f,s in files.items():
        for m in BLK.finditer(s):
            b=m.group(0); a=int(re.search(r"\n    answer: (\d)",b).group(1))
            out.append(dict(f=f,id=m.group(1),ans=a,B='\n    bogi:' in b,unit=m.group(1)[:5]))
    return out
def key(c): return (len(c),c)
def parse(ch): return [tuple(x.strip() for x in c.split(',')) for c in ch]
def newset(old,ans,target,nb):
    letters=L[:nb]
    allc=[c for r in range(1,nb+1) for c in itertools.combinations(letters,r)]
    a=old[ans-1]; oldset=set(old)
    sizes=sorted(len(c) for c in old)
    cands=[c for c in allc if c!=a]
    best=None
    for ds in itertools.combinations(cands,4):
        cs=sorted(list(ds)+[a],key=key)
        if cs.index(a)!=target-1: continue
        sz=sorted(len(c) for c in cs)
        if sz[0]<min(sizes) or sz[-1]>max(sizes): continue
        if sum(1 for c in cs if len(c)==nb)>0 and max(sizes)<nb: continue
        if sz.count(3)+sz.count(4)>3: continue
        cnt=Counter(x for c in cs for x in c)
        if any(cnt[x]==0 or cnt[x]==5 for x in letters): continue
        keep=sum(1 for c in ds if c in oldset)
        near=sum(len(set(c)^set(a)) for c in ds)
        spread=max(cnt.values())-min(cnt.values())
        score=(keep*3-near-spread)
        if best is None or score>best[0]: best=(score,cs)
    return best[1] if best else None
def apply(it,target):
    s=files[it['f']]; m=re.search(r"^  \{\n    id: '"+re.escape(it['id'])+r"'.*?^  \},$",s,re.S|re.M); b=m.group(0)
    if it['B']:
        cm=re.search(r"\n    choices: \[(.*?)\],\n",b); old=parse(re.findall(r"'([^']*)'",cm.group(1)))
        nb=len(re.findall(r"^      '",re.search(r"\n    bogi: \[\n(.*?)\n    \],",b,re.S).group(1),re.M))
        cs=newset(old,it['ans'],target,nb)
        if not cs: return False
        nb2=b[:cm.start()]+"\n    choices: ["+', '.join("'"+', '.join(c)+"'" for c in cs)+"],\n"+b[cm.end():]
    else:
        cm=re.search(r"\n    choices: \[\n(.*?)\n    \],\n",b,re.S)
        lines=cm.group(1).split('\n')
        if len(lines)!=5: return False
        a=it['ans']-1; t=target-1
        lines[a],lines[t]=lines[t],lines[a]
        nb2=b[:cm.start()]+"\n    choices: [\n"+'\n'.join(lines)+"\n    ],\n"+b[cm.end():]
        em=re.search(r"\n    explain: '(.*)',\n",nb2)
        e=em.group(1); mp={CIRC[a]:CIRC[t],CIRC[t]:CIRC[a]}
        e2=''.join(mp.get(ch,ch) for ch in e)
        nb2=nb2[:em.start(1)]+e2+nb2[em.end(1):]
    nb2=re.sub(r"\n    answer: \d",f"\n    answer: {target}",nb2,count=1)
    files[it['f']]=s[:m.start()]+nb2+s[m.end():]
    return True
def cost(its):
    tot=Counter(i['ans'] for i in its); c=sum(abs(tot[a]-40) for a in range(1,6))
    for u in sorted(set(i['unit'] for i in its)):
        cc=Counter(i['ans'] for i in its if i['unit']==u); v=[cc[a] for a in range(1,6)]
        sp=max(v)-min(v); c+=6*max(0,sp-2)
        seq=[i['ans'] for i in its if i['unit']==u]
        c+=4*sum(1 for k in range(len(seq)-2) if seq[k]==seq[k+1]==seq[k+2])
    for kind in (True,False):
        sub=[i for i in its if i['B']==kind]; cc=Counter(i['ans'] for i in sub); n=len(sub)/5
        c+=1.5*sum(max(0,abs(cc[a]-n)-2) for a in range(1,6))
    return c
log=[]
for rnd in range(150):
    its=items(); c0=cost(its)
    if c0==0: break
    best=None
    for idx,it in enumerate(its):
        if it['id'] in EX: continue
        for t in range(1,6):
            if t==it['ans']: continue
            old=it['ans']; it['ans']=t; c1=cost(its); it['ans']=old
            pen=0 if not it['B'] else 0.5   # 같은 값이면 문장 선지 문항부터
            if best is None or c1+pen<best[0]: best=(c1+pen,idx,t)
    if best is None or best[0]>=c0: break
    it=its[best[1]]; snapshot=dict(files)
    if apply(it,best[2]): log.append((it['id'],it['ans'],best[2],'B' if it['B'] else 'S'))
    else:
        files.update(snapshot); EX.add(it['id'])
for f,s in files.items(): open(f,'w').write(s)
its=items(); print('남은 비용',cost(its), sorted(Counter(i['ans'] for i in its).items()))
for l in log: print(*l)
