// 총정리 공통 지도(통합사회2 Ⅳ·Ⅴ) — 학교마다 원고에서 가져다 쓴다(강사 2026-11-28: 이해에 지도가 필요한 곳에 지도).
// 개념서 지도 그리기(textbook/lib/maps.js)를 그대로 쓰고, 위치는 대략. 국경은 우리 정부 시각(Natural Earth 한국 관점).

// 12 세계의 주요 분쟁 지역
export const CONFLICT_MAP = {
  t: 'map', view: 'world', title: '세계의 주요 분쟁 지역', style: 'political', seas: false, h: 300,
  markers: [
    { lon: 75.5, lat: 34.3, label: '카슈미르', pos: 'right', cls: 'k3' },
    { lon: 35.0, lat: 31.6, label: '팔레스타인', pos: 'left', cls: 'k3' },
    { lon: 43.5, lat: 37.3, label: '쿠르드족', pos: 'top', cls: 'k3' },
    { lon: 32.0, lat: 48.8, label: '우크라이나', pos: 'top', cls: 'k3' },
    { lon: 114.0, lat: 12.0, label: '남중국해', pos: 'right', cls: 'k3' },
    { lon: -59.0, lat: -51.7, label: '포클랜드 제도', pos: 'right', cls: 'k3' },
  ],
  legend: [{ pin: 'k3', label: '분쟁 지역(위치는 대략)' }],
  source: '지도 자료: Natural Earth',
};

// 13 동아시아의 영토 분쟁 지역과 독도 (개념서 13 지도와 같은 설정 — 지형 바탕을 함께 씀)
export const EAST_ASIA_MAP = {
  t: 'map', view: [103, 4, 152, 49], title: '동아시아의 영토 분쟁 지역과 독도', h: 400, width: 70, style: 'terrain',
  markers: [
    { lon: 147.0, lat: 44.2, label: '쿠릴 열도 남부', pos: 'top', cls: 'k2', ring: 8.5 },
    { lon: 123.5, lat: 25.75, label: '센카쿠 열도(댜오위다오)', pos: 'right', cls: 'k2', ring: 8.5 },
    { lon: 112.0, lat: 16.5, label: '시사 군도', pos: 'left', cls: 'k2', ring: 8.5 },
    { lon: 114.5, lat: 10.0, label: '난사 군도', pos: 'right', cls: 'k2', ring: 8.5 },
    { lon: 131.87, lat: 37.24, label: '독도', pos: 'right', cls: 'k8', ring: 8.5 },
  ],
  seas: [['동해', 134.5, 40.2, 13], ['황해', 123.6, 35.6, 13], ['동중국해', 125.5, 29.5, 12], ['남중국해', 114.5, 14.0, 13],
    ['필리핀해', 133.0, 20.0, 13], ['태 평 양', 145.0, 30.0, 15], ['오호츠크해', 148.5, 47.2, 12]],
  labels: [
    { at: [110, 33], text: '중국', size: 15, cls: 'country' }, { at: [106.5, 46.6], text: '몽골', size: 12.5, cls: 'country' },
    { at: [132, 47.3], text: '러시아', size: 13, cls: 'country' }, { at: [140.2, 38.9], text: '일본', size: 14, cls: 'country' },
    { at: [126.9, 40.3], text: '북한', size: 11, cls: 'country' }, { at: [127.8, 36.1], text: '한국', size: 11, cls: 'country' },
    { at: [121, 23.7], text: '타이완', size: 10, cls: 'country' }, { at: [122.2, 12], text: '필리핀', size: 12, cls: 'country' },
    { at: [106.4, 12.6], text: '베트남', size: 11.5, cls: 'country' }, { at: [103.8, 19.0], text: '라오스', size: 10, cls: 'country' },
    { at: [126.5, 45.2], text: '동북 3성', size: 11, cls: 'region' },
  ],
  legend: [{ pin: 'k2', label: '영토 분쟁 지역' }, { pin: 'k8', label: '우리 고유 영토' }, { line: 'border', label: '국경' }, { line: 'river', label: '하천' }],
  note: '쿠릴 열도 남부는 러시아가, 센카쿠 열도는 일본이, 시사 군도는 중국이 실제로 지배한다. 난사 군도는 여러 나라가 영유권을 다툰다. 동북 3성은 중국 동북공정의 연구 대상 지역이다.',
  source: '지도 자료: Natural Earth, 고도 AWS Terrain Tiles (위치는 대략)',
};

// 15 화석 에너지의 주요 생산·수출 지역(대표 자원으로 색칠, 러시아는 세 자원 모두)
export const FOSSIL_MAP = {
  t: 'map', view: 'world', title: '화석 에너지의 주요 생산·수출 지역', style: 'thematic', seas: false, h: 300,
  highlight: [
    { country: 'Saudi Arabia', cls: 'k1' }, { country: 'Iraq', cls: 'k1' }, { country: 'United Arab Emirates', cls: 'k1' }, { country: 'Kuwait', cls: 'k1' }, { country: 'Iran', cls: 'k1' },
    { country: 'Canada', cls: 'k1' }, { country: 'Venezuela', cls: 'k1' },
    { country: 'China', cls: 'k2' }, { country: 'India', cls: 'k2' }, { country: 'Indonesia', cls: 'k2' }, { country: 'Australia', cls: 'k2' },
    { country: 'Qatar', cls: 'k3' }, { country: 'Norway', cls: 'k3' }, { country: 'Turkmenistan', cls: 'k3' },
    { country: 'United States of America', cls: 'k4' }, { country: 'Russia', cls: 'k4' },
  ],
  labels: [
    { at: [45, 24], text: '페르시아만 연안', size: 10, cls: 'strong' }, { at: [-106, 57], text: '캐나다', size: 10, cls: 'country' },
    { at: [104, 35], text: '중국', size: 11, cls: 'country' }, { at: [134, -25], text: '오스트레일리아', size: 10, cls: 'country' },
    { at: [118, -3], text: '인도네시아', size: 9, cls: 'country' },
    { at: [-100, 39], text: '미국', size: 11, cls: 'country' }, { at: [95, 62], text: '러시아', size: 11, cls: 'country' },
  ],
  legend: [{ pin: 'k1', label: '석유' }, { pin: 'k2', label: '석탄' }, { pin: 'k3', label: '천연가스' }, { pin: 'k4', label: '석유·천연가스 모두 많음' }],
  note: '석유는 **페르시아만 연안**에 크게 치우쳐 있고(편재성이 가장 큼), 석탄은 중국·인도에서 많이 생산되지만 대부분 자국에서 쓰여 **인도네시아·오스트레일리아**가 주요 수출국이다. 천연가스는 러시아·미국·카타르가 많다.',
  source: '지도 자료: Natural Earth (주요 나라만 단순화)',
};

// 15 자원을 둘러싼 분쟁 지역
export const RESOURCE_CONFLICT_MAP = {
  t: 'map', view: 'world', title: '자원을 둘러싼 주요 분쟁 지역', style: 'thematic', seas: false, h: 300,
  markers: [
    { lon: 50.5, lat: 41.5, label: '카스피해(석유·가스)', pos: 'right', cls: 'k3' },
    { lon: 40, lat: 80, label: '북극해(석유·가스·항로)', pos: 'right', cls: 'k3' },
    { lon: 114.0, lat: 12.0, label: '남중국해(석유·가스)', pos: 'right', cls: 'k3' },
    { lon: 124.5, lat: 27.5, label: '동중국해', pos: 'right', cls: 'k3' },
    { lon: -59.0, lat: -51.7, label: '포클랜드 제도(석유)', pos: 'right', cls: 'k3' },
    { lon: 4, lat: 2.5, label: '기니만(석유)', pos: 'left', cls: 'k3' },
    { lon: 32.5, lat: 15.5, label: '나일강(물)', pos: 'right', cls: 'k1', shape: 'square' },
    { lon: 42, lat: 35.5, label: '티그리스·유프라테스강(물)', pos: 'bottom', cls: 'k1', shape: 'square' },
    { lon: 104.5, lat: 15.5, label: '메콩강(물)', pos: 'left', cls: 'k1', shape: 'square' },
  ],
  legend: [{ pin: 'k3', label: '에너지 자원 분쟁' }, { shape: 'square', pin: 'k1', label: '물(하천) 분쟁' }],
  source: '지도 자료: Natural Earth (위치는 대략)',
};

// 15 신·재생 에너지 발전이 많은 나라(대표 에너지로 색칠, 중국·미국은 여러 분야 상위)
export const RENEWABLE_MAP = {
  t: 'map', view: 'world', title: '신·재생 에너지 발전이 많은 나라', style: 'thematic', seas: false, h: 300,
  highlight: [
    { country: 'Brazil', cls: 'k1' }, { country: 'Canada', cls: 'k1' }, { country: 'Norway', cls: 'k1' },
    { country: 'Germany', cls: 'k2' }, { country: 'United Kingdom', cls: 'k2' }, { country: 'Denmark', cls: 'k2' },
    { country: 'Japan', cls: 'k3' }, { country: 'India', cls: 'k3' }, { country: 'Spain', cls: 'k3' },
    { country: 'Iceland', cls: 'k4' }, { country: 'Indonesia', cls: 'k4' }, { country: 'Philippines', cls: 'k4' }, { country: 'New Zealand', cls: 'k4' },
    { country: 'China', cls: 'k5' }, { country: 'United States of America', cls: 'k5' },
  ],
  legend: [{ pin: 'k1', label: '수력' }, { pin: 'k2', label: '풍력' }, { pin: 'k3', label: '태양광' }, { pin: 'k4', label: '지열' }, { pin: 'k5', label: '여러 분야 모두 상위(중국·미국)' }],
  note: '수력은 강수량이 많고 낙차가 큰 곳(브라질·캐나다·노르웨이), 풍력은 바람이 강한 편서풍 지역(독일·영국·덴마크), 태양광은 일사량이 많은 곳, 지열은 **판의 경계**(환태평양 조산대·아이슬란드)에 발달한다.',
  source: '지도 자료: Natural Earth (주요 나라만 단순화)',
};

// 06 공공 기관 지방 이전 — 혁신 도시와 세종 (2026-11-28 계산여고 채팅에서 추가, 개념서 06 지도와 같은 설정, 위치는 대략)
export const INNOVATION_MAP = {
  t: 'map', view: [124.9, 32.2, 130.5, 38.7], title: '공공 기관 지방 이전: 혁신 도시와 세종', w: 440, h: 460, width: 58, style: 'terrain', provinces: true, krRivers: 600,
  seas: [['동 해', 130.0, 36.6, 12], ['황 해', 125.4, 36.0, 12], ['남 해', 128.2, 33.9, 11]],
  markers: [
    { lon: 126.98, lat: 37.56, label: '서울', pos: 'left', cls: 'k1' },
    { lon: 127.29, lat: 36.48, label: '세종', pos: 'left', cls: 'k3' },
    { lon: 127.97, lat: 37.33, label: '원주', pos: 'right', cls: 'k2' },
    { lon: 127.53, lat: 36.90, label: '진천·음성', pos: 'right', cls: 'k2' },
    { lon: 128.18, lat: 36.12, label: '김천', pos: 'left', cls: 'k2' },
    { lon: 128.73, lat: 35.88, label: '대구', pos: 'right', cls: 'k2' },
    { lon: 129.32, lat: 35.56, label: '울산', pos: 'right', cls: 'k2' },
    { lon: 129.06, lat: 35.14, label: '부산', pos: 'bottom', cls: 'k2' },
    { lon: 128.13, lat: 35.16, label: '진주', pos: 'bottom', cls: 'k2' },
    { lon: 127.06, lat: 35.83, label: '전주·완주', pos: 'left', cls: 'k2' },
    { lon: 126.79, lat: 35.02, label: '나주', pos: 'left', cls: 'k2' },
    { lon: 126.51, lat: 33.25, label: '서귀포', pos: 'right', cls: 'k2' },
  ],
  legend: [{ pin: 'k2', label: '혁신 도시' }, { pin: 'k3', label: '행정 중심 복합 도시' }, { pin: 'k1', label: '수도권 중심' }], legendV: true, legendAt: [6, 380],
  source: '지도 자료: Natural Earth, 통계청, 고도 AWS Terrain Tiles (위치는 대략)',
};

// 12 세계의 여러 갈등 14곳 (2026-11-28 계산여고 채팅에서 추가 — 학습지 '하나 더 공부하기' 지도의 분쟁 지역, 위치는 대략)
export const CONFLICT_MAP14 = {
  t: 'map', view: 'world', title: '세계의 여러 갈등 지역', style: 'political', seas: false, h: 300,
  markers: [
    { lon: 32.0, lat: 48.8, label: '러시아-우크라이나', pos: 'top', cls: 'k3' },
    { lon: -6.7, lat: 54.6, label: '북아일랜드', pos: 'left', cls: 'k3' },
    { lon: 1.5, lat: 41.6, label: '카탈루냐', pos: 'left', cls: 'k3' },
    { lon: 35.0, lat: 31.6, label: '이스라엘-팔레스타인', pos: 'left', cls: 'k3' },
    { lon: 38.5, lat: 35.2, label: '시리아', pos: 'right', cls: 'k3' },
    { lon: 47.5, lat: 15.5, label: '예멘', pos: 'right', cls: 'k3' },
    { lon: 39.5, lat: 9.0, label: '에티오피아', pos: 'bottom', cls: 'k3' },
    { lon: -2.0, lat: 17.0, label: '말리', pos: 'left', cls: 'k3' },
    { lon: 75.5, lat: 34.3, label: '카슈미르', pos: 'top', cls: 'k3' },
    { lon: 96.0, lat: 21.0, label: '미얀마', pos: 'bottom', cls: 'k3' },
    { lon: 114.0, lat: 12.0, label: '남중국해', pos: 'right', cls: 'k3' },
    { lon: -102.0, lat: 23.0, label: '멕시코', pos: 'left', cls: 'k3' },
    { lon: -74.0, lat: 4.0, label: '콜롬비아', pos: 'right', cls: 'k3' },
    { lon: -59.0, lat: -51.7, label: '포클랜드 제도', pos: 'right', cls: 'k3' },
  ],
  legend: [{ pin: 'k3', label: '분쟁 지역(위치는 대략)' }],
  source: '지도 자료: Natural Earth',
};
