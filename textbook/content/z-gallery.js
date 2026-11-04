// 그림 기능 견본 (시험용) — 개념서에 쓸 수 있는 그래프·지도·표를 한 번씩 보여 줍니다.
// node build.mjs z-gallery b png
// 출처를 확인한 자료 말고는 모두 "가상 자료"입니다.

export default {
  subject: '그림 기능 견본',
  chapter: { no: '✦', title: '그래프·지도·표' },
  units: [
    {
      no: '00',
      title: '개념서에 넣을 수 있는 그림 자료',
      questions: ['어떤 그래프와 지도를 그릴 수 있을까?', '표는 어디까지 꾸밀 수 있을까?'],
      point: '모든 그림은 숫자 데이터로 그리므로, 숫자만 바꾸면 그림이 바로 바뀐다. 색은 시안 색을 따른다.',
      concept: [
        { t: 'sec', mark: '1', title: '막대그래프' },
        {
          t: 'chart', kind: 'hbar', title: '세계 행복 보고서(2024) 주요 국가 점수',
          categories: ['핀란드 (1위)', '덴마크 (2위)', '아이슬란드 (3위)', '영국 (20위)', '미국 (23위)', '일본 (51위)', '대한민국 (52위)', '중국 (60위)'],
          series: [{ name: '점수', values: [7.741, 7.583, 7.525, 6.749, 6.725, 6.06, 6.058, 5.973] }],
          x: { min: 0, max: 8 }, highlight: [6],
          source: '자료: 지속가능발전해법네트워크(SDSN), 2024',
        },
        {
          t: 'chart', kind: 'bar', title: '지역별 학생 수 변화 (가상 자료)', h: 280,
          categories: ['A 지역', 'B 지역', 'C 지역', 'D 지역'],
          series: [{ name: '2010년', values: [42, 35, 28, 19] }, { name: '2020년', values: [33, 38, 21, 12] }],
          y: { min: 0, max: 50, step: 10, label: '(천 명)' },
          source: '가상 자료',
        },
        {
          t: 'chart', kind: 'stack100', title: '월 소득에 따른 행복 응답 비율 (가상 자료)',
          categories: ['200만 원 미만', '200~400만 원', '400~600만 원', '600만 원 이상'],
          series: [
            { name: '행복하다', values: [36, 50, 60, 68] },
            { name: '보통이다', values: [40, 30, 22, 17] },
            { name: '불행하다', values: [24, 20, 18, 15] },
          ],
          source: '가상 자료',
        },

        { t: 'sec', mark: '2', title: '꺾은선 · 개념 그래프' },
        {
          t: 'chart', kind: 'line', title: '이스털린의 역설 (개념도)', schematic: true, h: 270,
          x: { min: 0, max: 10, label: '시간' }, y: { min: 0, max: 10, label: '소득·행복' },
          series: [
            { name: '소득(단기)', points: [[0, 2.2], [1.5, 3.4], [3, 2.8], [4.5, 4.6], [6, 4], [7.5, 7], [9, 6.8], [10, 8.2]], smooth: true, color: 2 },
            { name: '소득(장기)', points: [[0, 2], [10, 8.4]], dash: true, color: 2, end: '소득' },
            { name: '행복(단기)', points: [[0, 4.8], [1.5, 5.9], [3, 5.2], [4.5, 6.2], [6, 5.3], [7.5, 6.3], [9, 5.4], [10, 5.8]], smooth: true, color: 3 },
            { name: '행복(장기)', points: [[0, 5.6], [10, 5.6]], dash: true, color: 3, end: '행복' },
          ],
          legend: false,
          note: '실선: 단기적인 변동, 점선: 장기적인 추세',
        },
        {
          t: 'chart', kind: 'line', title: '연간 소득과 행복의 관계 (개념도)', h: 280, schematic: true,
          x: { min: 0, max: 160, label: '연간 소득(천 달러)', ticks: [{ v: 75, label: '7.5만' }, { v: 95, label: '9.5만' }] },
          y: { min: 0, max: 10, label: '높음' },
          series: [
            { name: '정서적 행복감', points: [[0, 1], [25, 4.8], [50, 6.6], [75, 7.3], [110, 7.0], [160, 6.3]], smooth: true, color: 1, end: '정서적 행복감' },
            { name: '삶의 만족도', points: [[0, 0.6], [30, 4], [60, 6.4], [95, 7.9], [130, 7.7], [160, 7.4]], smooth: true, color: 3, end: '삶의 만족도' },
          ],
          vlines: [{ x: 75 }, { x: 95 }],
          note: '일정 소득을 넘으면 더 이상 늘지 않거나 조금 줄어든다.',
          source: '미국 퍼듀대 연구(2018)를 바탕으로 그린 개념도',
        },

        { t: 'sec', mark: '3', title: '산점도 · 원그래프 · 기후 그래프' },
        {
          t: 'chart', kind: 'scatter', title: '민주주의 지수와 행복 지수 (가상 자료)', h: 300,
          x: { min: 0, max: 10, step: 2, label: '민주주의 지수' }, y: { min: 2, max: 8, step: 1, label: '행복 지수' },
          groups: [
            { name: '권위주의', points: [[1.2, 3.1], [2, 4.2], [2.6, 3.6], [3.1, 4.6], [1.6, 2.6]] },
            { name: '혼합', points: [[4.2, 4.4], [4.8, 5.1], [5.3, 4.7], [5.6, 5.5]] },
            { name: '결함 있는 민주주의', points: [[6.3, 5.4], [6.9, 6.1], [7.3, 5.8], [7.8, 6.5]] },
            { name: '완전한 민주주의', points: [[8.4, 6.9], [8.9, 7.1], [9.3, 7.4], [9.7, 7.3]] },
          ],
          trend: true, source: '가상 자료',
        },
        {
          t: 'chart', kind: 'pie', donut: true, center: '행복에\n필요한 것', h: 230,
          title: '청소년이 꼽은 행복의 조건 (가상 자료)',
          slices: [{ label: '물질적 가치', value: 40 }, { label: '관계적 가치', value: 34 }, { label: '개인적 가치', value: 26 }],
          source: '가상 자료',
        },
        {
          t: 'chart', kind: 'climate', title: '기후 그래프 예시 (가상 자료)', h: 250,
          label: '(가) 지역',
          temp: [-3, 0, 6, 12, 18, 22, 25, 26, 21, 14, 7, 0],
          precip: [20, 25, 40, 75, 100, 130, 390, 340, 140, 50, 45, 20],
          tMin: -10, tMax: 30, tStep: 10, pMax: 400,
          source: '가상 자료',
        },

        { t: 'sec', mark: '4', title: '벤 다이어그램' },
        {
          t: 'venn', title: '아리스토텔레스와 에피쿠로스의 행복론', h: 260,
          left: { label: '아리스토텔레스', items: ['이성적 활동', '덕의 습관화'] },
          both: { items: ['이성의 역할', '중시'] },
          right: { label: '에피쿠로스', items: ['아타락시아', '욕구의 절제'] },
        },

        { t: 'sec', mark: '5', title: '지도' },
        {
          t: 'map', view: 'world', title: '세계 지도: 나라 색칠 + 지점 표시',
          highlight: [
            { country: 'Finland', cls: 'h1' }, { country: 'Denmark', cls: 'h1' }, { country: 'Iceland', cls: 'h1' }, { country: 'Sweden', cls: 'h1' },
            { country: 'Afghanistan', cls: 'h2' },
          ],
          markers: [{ lon: 126.98, lat: 37.57, label: '서울' }, { lon: 24.94, lat: 60.17, label: '헬싱키', pos: 'top' }],
          equator: true,
          legend: [{ cls: 'hl h1', label: '행복 지수 상위 국가' }, { cls: 'hl h2', label: '행복 지수 최하위권' }],
          source: '지도 자료: Natural Earth',
        },
        {
          t: 'map', view: [58, 21, 98, 41], title: '지역 지도: 카슈미르 주변', h: 330,
          highlight: [
            { country: 'India', cls: 'h4', label: '인도', at: [79, 24] },
            { country: 'Pakistan', cls: 'h3', label: '파키스탄', at: [67.5, 28.5] },
            { country: 'China', cls: 'h1', label: '중국', at: [88, 35.5] },
            { country: 'Afghanistan', label: '아프가니스탄', at: [65.5, 34] },
          ],
          markers: [{ lon: 75.5, lat: 34.6, ring: 22, label: '카슈미르', pos: 'right' }],
          source: '지도 자료: Natural Earth',
        },

        { t: 'sec', mark: '6', title: '표 (칸 합치기 · 강조 · 빈칸)' },
        {
          t: 'table', title: '행복을 재는 지표 비교',
          head: [[{ text: '지표', rs: 2 }, { text: '발표 기관', rs: 2 }, { text: '반영 요소', cs: 2 }], ['객관적', '주관적']],
          widths: [24, 28, 24, 24], align: [null, null, 'center', 'center'],
          rows: [
            ['더 나은 삶 지수', '경제 협력 개발 기구(OECD)', { text: 'O', cls: 'hl' }, { text: 'O', cls: 'hl' }],
            ['국민 삶의 질 지표', '통계청', 'O', 'O'],
            ['국내 총생산(GDP)', '각국 정부', 'O', { text: '', cls: 'hatch' }],
          ],
          note: '빗금 칸은 학생이 채우는 칸이다.', source: '견본 표',
        },
        {
          t: 'table', title: '세로로 칸 합치기',
          head: ['구분', '사상가', '행복이란'],
          widths: [18, 22, 60],
          rows: [
            [{ text: '서양', rs: 3 }, '아리스토텔레스', '이성적 활동을 덕에 따라 탁월하게 발휘하는 삶'],
            ['에피쿠로스', '몸의 고통과 마음의 불안이 없는 상태(아타락시아)'],
            ['스토아학파', '정념에서 벗어난 부동심(아파테이아)'],
            [{ text: '동양', rs: 2 }, '공자', '인(仁)을 실천하는 도덕적인 삶'],
            ['노자', '도에 따르는 무위자연의 삶'],
          ],
        },
      ],
      check: { ox: [], blank: [] },
      exam: [],
    },
  ],
};
