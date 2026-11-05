// 도식(인포그래픽) 견본 — 빌드: node build.mjs z-diagrams d student png
export default {
  subject: '견본', chapter: { no: 'Ⅰ', title: '도식 견본' },
  units: [{
    no: '00', title: '도식 견본', questions: [], point: '',
    concept: [
      { t: 'diagram', kind: 'econflow', title: '민간 경제의 순환', gov: false, note: '가계와 기업은 생산물 시장과 생산 요소 시장에서 만나 실물과 화폐를 서로 반대 방향으로 주고받는다.' },
      { t: 'diagram', kind: 'triangle', title: '갈퉁의 폭력의 삼각형', width: 80, split: ['보이는 폭력', '보이지 않는 폭력'], center: '폭력',
        corners: [{ title: '직접적 폭력', text: '전쟁·테러·폭행', icon: 'swords' }, { title: '구조적 폭력', text: '빈곤·차별·억압을 낳는 제도', icon: 'building-community' }, { title: '문화적 폭력', text: '종교·사상·언어로 폭력을 정당화', icon: 'message-language' }] },
      { t: 'diagram', kind: 'cycle', title: '다중 격차의 악순환', center: '빈곤의 대물림',
        nodes: [{ title: '소득 격차', text: '낮은 소득', icon: 'coin' }, { title: '교육 격차', text: '교육 기회 부족', icon: 'school' }, { title: '건강 격차', text: '의료 이용 부족', icon: 'heartbeat' }, { title: '일자리 격차', text: '좋은 일자리 얻기 어려움', icon: 'briefcase' }] },
      { t: 'diagram', kind: 'concentric', title: '도덕적 고려의 범위', label: '안쪽에서 바깥쪽으로 넓어진다',
        rings: [{ short: '1', title: '인간 중심주의', text: '인간만' }, { short: '2', title: '동물 중심주의', text: '고통을 느끼는 동물까지' }, { short: '3', title: '생명 중심주의', text: '모든 생명체까지' }, { short: '4', title: '생태 중심주의', text: '생태계 전체(무생물 포함)' }] },
      { t: 'diagram', kind: 'stairs', title: '경제 통합의 단계', arrow: '통합 수준이 높아짐',
        steps: [{ title: '자유 무역 협정', text: '회원국끼리 관세 철폐', icon: 'arrows-exchange' }, { title: '관세 동맹', text: '+ 비회원국에 공동 관세', icon: 'shield' }, { title: '공동 시장', text: '+ 노동·자본 자유 이동', icon: 'users' }, { title: '경제 동맹', text: '+ 경제 정책 조정', icon: 'scale' }, { title: '완전 경제 통합', text: '+ 단일 통화·초국가 기구', icon: 'world' }] },
      { t: 'diagram', kind: 'timeline', title: '인권의 확장',
        events: [{ year: '1215', title: '대헌장', text: '왕의 권력 제한' }, { year: '1689', title: '권리 장전', text: '의회의 권리 확인' }, { year: '1776', title: '미국 독립 선언', text: '천부 인권' }, { year: '1789', title: '프랑스 인권 선언', text: '자유와 평등' }, { year: '1919', title: '바이마르 헌법', text: '사회권 최초 규정' }, { year: '1948', title: '세계 인권 선언', text: '인권의 국제적 기준' }] },
      { t: 'diagram', kind: 'cards', title: '자원의 특성',
        items: [{ title: '유한성', text: '쓸 수 있는 양이 한정되어 언젠가 바닥난다', icon: 'hourglass' }, { title: '편재성', text: '특정 지역에 치우쳐 분포한다', icon: 'map-pin' }, { title: '가변성', text: '기술·경제 조건에 따라 가치가 달라진다', icon: 'adjustments' }] },
      { t: 'diagram', kind: 'layers', title: '캐럴의 기업의 사회적 책임 피라미드',
        layers: [{ title: '경제적 책임', text: '이윤을 내고 일자리를 만든다(가장 기본)' }, { title: '법적 책임', text: '법과 규칙을 지킨다' }, { title: '윤리적 책임', text: '법이 없어도 옳은 일을 한다' }, { title: '자선적 책임', text: '사회 공헌, 기부' }] },
      { t: 'diagram', kind: 'cultchange', title: '문화 변동의 양상',
        items: [{ title: '문화 동화', text: '한 문화가 다른 문화에 흡수되어 고유성을 잃음' }, { title: '문화 병존', text: '두 문화가 고유성을 지닌 채 함께 존재' }, { title: '문화 융합', text: '두 문화가 섞여 새로운 문화가 생김' }] },
      { t: 'diagram', kind: 'venn3', title: '지속가능발전', sets: ['환경', '경제', '사회'], center: '지속가능발전', width: 90,
        texts: ['생태계를 보전하며 자원을 아껴 씀', '성장과 효율, 일자리', '형평성과 인권, 삶의 질'] },
    ],
  }],
};
