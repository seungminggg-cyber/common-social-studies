# 백지도 테스트 — 나라·지역 이름 사전 (표준 이름, 종류, 다른 이름)
# kind: country(주권 국가) / ambiguous(지위 애매) / other(나라 아님, otherType 따로)
import json, os
HERE = os.path.dirname(os.path.abspath(__file__))
GEO = os.path.join(HERE, '..', '..', 'textbook', 'data', 'geo', 'countries-kor-50m.json')

# 주권 국가가 아닌 Natural Earth 항목(속령·기지 등)은 뺀다
NOT_SOV = set('ESB MAF SXM USG GIB HKG WSB BRT ATA GRL NCL CUW ABW TCA SPM PCN PYF ATF UMI MSR VIR BLM PRI AIA VGB CYM BMU HMD SHN JEY GGY IMN ALA FRO IOT NFK COK WLF SGS FLK NIU ASM GUM MNP PGA MAC SCR ESH PSE KOS TWN'.split())
STD = {'중화인민공화국': '중국', '대한민국': '한국', '조선민주주의인민공화국': '북한', '터키': '튀르키예',
       '바티칸 시국': '바티칸', '오스트레일리아': '오스트레일리아(호주)', '남아프리카': '남아프리카 공화국'}
ALIAS = {
  '미국': ['미합중국', '미 합중국'], '중국': ['중화 인민 공화국'], '한국': ['대한민국', '대한 민국', '남한', '우리나라'],
  '북한': ['조선 민주주의 인민 공화국', '조선민주주의인민공화국'], '튀르키예': ['터키'],
  '오스트레일리아(호주)': ['오스트레일리아', '호주'], '러시아': ['러시아 연방'],
  '남아프리카 공화국': ['남아공', '남아프리카공화국'], '아랍에미리트': ['아랍 에미리트', '아랍 에미리트 연합', 'UAE'],
  '사우디아라비아': ['사우디 아라비아', '사우디'], '콩고 민주 공화국': ['콩고민주공화국', '민주 콩고', 'DR콩고', '콩고 민주공화국'],
  '콩고 공화국': [], '영국': [], '체코': ['체코 공화국'], '스페인': ['에스파냐'], '에스와티니': ['스와질란드'], '북마케도니아': ['마케도니아'],
  '보스니아 헤르체고비나': ['보스니아'], '미얀마': ['버마'], '코트디부아르': ['아이보리코스트'], '조지아': ['그루지야'],
  '스리랑카': ['실론'], '동티모르': ['동 티모르'], '뉴질랜드': [], '베트남': ['월남'], '이란': [],
}
AMBIG = {'대만': ['타이완', '중화민국'], '팔레스타인': [], '코소보': [], '서사하라': ['서 사하라'],
         '소말릴란드': [], '북키프로스': []}
# 나라 아님: 이름 → 종류 (자주 나오는 것 위주, 학교 에이전트 결과는 그대로 합친다)
OTHER = {
 '지역·분쟁지역': '카슈미르 잠무 난사_군도 스프래틀리 시사_군도 파라셀 센카쿠 댜오위다오 쿠릴_열도 북방_도서 북방_4도 독도 다케시마 '
   '북극해 남중국해 카스피해 기니만 페르시아만 호르무즈 말라카_해협 가자_지구 서안_지구 요르단강_서안 골란_고원 크림반도 크림_반도 '
   '나고르노카라바흐 다르푸르 티베트 신장_위구르 체첸 쿠르디스탄 포클랜드 말비나스 그린란드 홍콩 마카오 '
   '사헬_지대 사헬 오가덴 동부_지중해 북극 아마존 시베리아 중동 '
   '서남아시아 동남아시아 동아시아 남아시아 중앙아시아 서아시아 북아프리카 사하라_이남_아프리카 서부_유럽 동유럽 서유럽 북유럽 남유럽 '
   '라틴_아메리카 중남미 중앙아메리카 카리브해 발칸반도 발칸_반도 한반도 만주 간도 이어도 '
   '오호츠크해 동해 서해 황해 남해 메콩강 나일강 인더스강 유프라테스강 티그리스강 아랄해',
 '대륙·바다': '아시아 아프리카 유럽 북아메리카 남아메리카 오세아니아 남극_대륙 태평양 대서양 인도양 지중해',
 '민족': '쿠르드족 로힝야족 위구르족 타밀족 후투족 투치족 바스크족 체첸족 팔레스타인인 유대인 아랍인',
 '옛 나라': '소련 소비에트_연방 유고슬라비아 동독 서독 오스만_제국 체코슬로바키아 로마_제국 대한_제국',
 '국가 묶음·기구': '유럽_연합 EU 아세안 ASEAN NAFTA USMCA 메르코수르 MERCOSUR APEC 국제_연합 UN 유엔 NATO 북대서양_조약_기구 OPEC 석유_수출국_기구 '
   'G20 G7 브릭스 BRICS',
 '도시': '뉴욕 런던 도쿄 파리 베이징 상하이 서울 시카고 로스앤젤레스 프랑크푸르트 시드니 두바이 뭄바이 '
   '모스크바 베를린 로마 교토 리우데자네이루 몬트리올 바젤 람사르 스톡홀름 제네바 헤이그 브뤼셀 워싱턴 예루살렘 메카 판문점 개성 평양 '
   '부산 인천 마스트리흐트 마라케시 리마 코펜하겐 글래스고 두바이 카이로',
}

def load():
    g = list(json.load(open(GEO))['objects'].values())[0]['geometries']
    names = {}  # 표기 → (표준, kind)
    for x in g:
        p = x['properties']; ko = p['ko']; iso = p['iso']
        if iso in NOT_SOV or ko in ('브라질리안 아일랜드', '호주령 인도양 지역', '산호해 제도', '애시모어 카르티에 제도', '클리퍼턴섬'): continue
        std = STD.get(ko, ko); names[ko] = (std, 'country'); names[std] = (std, 'country')
    names.pop('남아프리카', None)
    for std, al in ALIAS.items():
        names[std] = (std, 'country')
        for a in al: names[a] = (std, 'country')
    for std, al in AMBIG.items():
        names[std] = (std, 'ambiguous')
        for a in al: names[a] = (std, 'ambiguous')
    return names

COUNTRY_SET = None
def kinds():
    return load()

def others():
    out = {}
    for typ, words in OTHER.items():
        for w in words.split():
            out[w.replace('_', ' ')] = typ
    return out
