// 처음 시작할 때 넣는 샘플 데이터 (강사 관리 화면의 [샘플 데이터로 시작하기] 버튼)
import { doc, writeBatch, collection } from 'firebase/firestore';
import { db } from './firebase.js';

const SCHOOLS = [
  {
    id: 'gyeyang', order: 1, name: '계양고', schedule: '매주 토요일 14:00~17:00',
    examName: '기말고사', examDate: '2026-12-03',
    notice: '이번 주 롤스·노직 분배적 정의 부교재 변형 테스트를 진행합니다.',
    scope: 'Ⅳ. 인권 보장과 헌법 ~ Ⅶ. 문화와 다양성',
  },
  {
    id: 'jakjeon', order: 2, name: '작전고', schedule: '매주 토요일 18:00~21:00',
    examName: '기말고사', examDate: '2026-12-02',
    notice: '시장경제와 금융 파트 고난도 기출 선지 정리본 배부 완료!',
    scope: 'Ⅴ. 시장 경제와 금융 ~ Ⅷ. 세계화와 평화',
  },
  {
    id: 'icintl', order: 3, name: '인천국제고', schedule: '매주 일요일 10:00~13:00',
    examName: '기말고사', examDate: '2026-12-01',
    notice: '심화 지문 대비 사상가 원전 텍스트 분석 주간입니다.',
    scope: '전 범위 심화',
  },
  {
    id: 'seoun', order: 4, name: '서운고', schedule: '매주 일요일 14:00~17:00',
    examName: '기말고사', examDate: '2026-12-04',
    notice: '문화 상대주의와 보편 윤리 단원 수행평가 대비 자료를 올렸습니다.',
    scope: 'Ⅵ. 사회 정의와 불평등 ~ Ⅶ. 문화와 다양성',
  },
  {
    id: 'gyesan', order: 5, name: '계산여고', schedule: '매주 일요일 18:00~21:00',
    examName: '기말고사', examDate: '2026-12-03',
    notice: '헌법상의 기본권과 국가기관 역할 백지 테스트 예고!',
    scope: 'Ⅳ. 인권 보장과 헌법',
  },
];

const MATERIALS = {
  gyeyang: [
    { title: '계양고 학교 프린트 빈칸 복습 테스트지', tag: '필수자료' },
    { title: '계양고 수행평가 서술형 감점 방지 가이드', tag: '수행대비' },
  ],
  jakjeon: [{ title: '작전고 최근 3개년 기출 선지 O/X 모음집', tag: '기출분석' }],
  icintl: [{ title: '인천국제고 고난도 사상가 원전 선지 분석집', tag: '심화자료' }],
  seoun: [{ title: '서운고 교과서 날개 질문 총정리 노트', tag: '내신직결' }],
  gyesan: [{ title: '계산여고 기본권 유형 분류 핵심 요약표', tag: '암기필수' }],
};

// 예전 샘플 문제 (이전 교육과정 단원명). 지금은 새로 넣지 않고,
// 문제 팩이 처음 들어갈 때 이미 들어 있던 샘플만 골라서 지우는 데 사용합니다.
const QUIZZES = [
  {
    type: 'ox', unit: 'Ⅵ. 사회 정의와 불평등',
    question: '롤스는 천부적 재능의 분포 그 자체를 정의롭다거나 부정의하다고 보지 않으며, 이를 공동의 자산으로 간주한다.',
    answer: 'O',
    explanation: '롤스는 천부적 재능 자체는 우연적 사실로 보고, 그로 인한 이익은 최소 수혜자에게 최대 이익이 되도록(차등의 원칙) 공동의 자산으로 활용해야 한다고 보았습니다.',
  },
  {
    type: 'ox', unit: 'Ⅵ. 사회 정의와 불평등',
    question: '노직은 결과적 평등을 실현하기 위해 국가가 과세를 통해 부를 재분배하는 것을 정당하다고 본다.',
    answer: 'X',
    explanation: '노직은 소유 권리론 입장에서 근로 소득에 대한 재분배 과세는 강제 노동과 같다고 비판하며 최소 국가론을 주장했습니다.',
  },
  {
    type: 'ox', unit: 'Ⅴ. 시장 경제와 금융',
    question: '합리적 선택을 할 때는 이미 지출하여 회수할 수 없는 매몰 비용까지 모두 고려해야 한다.',
    answer: 'X',
    explanation: '매몰 비용은 이미 발생하여 회수할 수 없는 비용이므로 합리적 선택 시 고려하지 않습니다.',
  },
  {
    type: 'ox', unit: 'Ⅶ. 문화와 다양성',
    question: '극단적 문화 상대주의는 인류의 보편적 가치를 부정하는 윤리적 회의주의에 빠질 우려가 있다.',
    answer: 'O',
    explanation: '모든 문화를 무조건 인정하는 극단적 문화 상대주의는 인권 침해 문화까지 용인할 수 있어 보편 윤리 차원의 성찰이 필요합니다.',
  },
  {
    type: 'blank', unit: 'Ⅵ. 사회 정의와 불평등',
    question: '롤스는 정의의 원칙을 도출하기 위해 당사자들이 자신의 사회적 지위나 능력을 모르는 가상 상황인 [    ]의 베일을 쓴 원초적 입장을 가정한다.',
    answer: '무지', hint: 'ㅁㅈ (2글자)',
  },
  {
    type: 'blank', unit: 'Ⅴ. 시장 경제와 금융',
    question: '어떤 대안을 선택함으로써 포기하게 되는 대안들 중 가장 가치가 큰 것의 가치를 [    ](이)라고 한다.',
    answer: '기회비용/기회 비용', hint: 'ㄱㅎㅂㅇ (4글자)',
  },
  {
    type: 'blank', unit: 'Ⅳ. 인권 보장과 헌법',
    question: '국민의 기본권은 국가 안전보장·질서유지·[    ]을(를) 위하여 필요한 경우에 한하여 법률로써 제한할 수 있다.',
    answer: '공공복리', hint: 'ㄱㄱㅂㄹ (4글자)',
  },
];

const CARDS = [
  {
    type: 'concept', title: '롤스 (공정으로서의 정의)', tag: '복지 자본주의',
    body: '원초적 입장에서 [무지의 베일]을 쓰고 합의 → 제1원칙 평등한 자유, 제2원칙 기회균등 및 [차등의 원칙](최소 수혜자 최대 이익)',
  },
  {
    type: 'concept', title: '노직 (소유 권리로서의 정의)', tag: '자유 지상주의',
    body: '취득·양도·교정의 과정이 정당하면 그 결과는 정의로움 → 국가의 재분배 반대 및 [최소 국가론] 주장',
  },
  { type: 'flash', unit: '사회 정의', front: '롤스가 말한 천부적 재능의 성격은?', back: '천부적 재능의 분포는 우연적이며, 그로 인한 이익은 [공동의 자산]으로 보아 최소 수혜자에게 유리해야 한다.' },
  { type: 'flash', unit: '시장 경제', front: '기회비용 = ?', back: '[명시적 비용](실제 지출한 돈) + [암묵적 비용](포기한 대안의 가치)' },
  { type: 'flash', unit: '인권과 헌법', front: '바이마르 헌법(1919)에서 처음 명시된 기본권은?', back: '인간다운 생활을 할 권리인 [사회권]' },
];

export async function seedSampleData() {
  const batch = writeBatch(db);
  let t = Date.now();

  batch.set(doc(db, 'config', 'app'), {
    appTitle: '승민T 통합사회 클래스',
    appSubtitle: '작전고 · 계양고 · 인천국제고 · 서운고 · 계산여고',
    teacherName: '승민T',
    noticeHeadline: '이번 주는 2학기 기말 대비 핵심 선지 정복 주간!',
    noticeSubtext: '등하교 시간 3분만 투자해서 O/X와 빈칸 퀴즈를 풀어보세요. 틀린 문제는 오답 노트에 자동으로 모입니다.',
  }, { merge: true });

  SCHOOLS.forEach(({ id, ...data }) => {
    batch.set(doc(db, 'schools', id), data);
    (MATERIALS[id] || []).forEach((m) => {
      batch.set(doc(collection(db, 'schools', id, 'materials')), { ...m, url: '', createdAt: t++ });
    });
  });

  batch.set(doc(collection(db, 'schools', 'gyeyang', 'videos')), {
    title: '[계양고 기말 1강] 롤스 vs 노직 핵심 선지 비교 (샘플 영상)',
    youtubeUrl: 'https://www.youtube.com/watch?v=jfKfPfyJRdk',
    date: '11/01',
    createdAt: t++,
  });

  // 퀴즈와 카드는 문제 팩(src/content)에서 자동으로 들어갑니다.

  await batch.commit();
}

// 예전 샘플인지 확인하는 데 쓰는 문장 목록
export const LEGACY_SAMPLE_TEXTS = new Set([
  ...QUIZZES.map((q) => q.question),
  ...CARDS.map((c) => c.body || c.front),
]);
