// Ⅳ단원 지도 재료: 나라 묶음 → 지도 색칠
//
// 모든 분포도는 "나라별로 가장 두드러진 특징"만 칠한 **개념도**이다.
// 실제로는 한 나라 안에서도 지역마다 다르고, 여러 요소가 섞여 나타난다.

// { k1: [나라들], k2: [...] } → 지도 highlight 목록
export const HL = (groups) =>
  Object.entries(groups).flatMap(([cls, list]) => list.map((country) => ({ country, cls: `hl ${cls}` })));

const EUROPE_W = ['United Kingdom', 'Ireland', 'France', 'Belgium', 'Netherlands', 'Luxembourg', 'Germany', 'Switzerland', 'Austria', 'Denmark', 'Norway', 'Sweden', 'Finland', 'Iceland'];
const EUROPE_S = ['Spain', 'Portugal', 'Italy', 'Greece', 'Slovenia', 'Croatia', 'Bosnia and Herz.', 'Montenegro', 'Albania', 'Macedonia', 'Kosovo', 'Cyprus', 'N. Cyprus'];
// 조지아·아르메니아(캅카스)는 크리스트교 나라라서 유럽 문화권에 넣는다(화폐 자료의 아르메니아 = 유럽 문화권과 맞춤)
const EUROPE_E = ['Poland', 'Czechia', 'Slovakia', 'Hungary', 'Romania', 'Bulgaria', 'Serbia', 'Moldova', 'Ukraine', 'Belarus', 'Lithuania', 'Latvia', 'Estonia', 'Russia', 'Georgia', 'Armenia'];
export const EUROPE = [...EUROPE_W, ...EUROPE_S, ...EUROPE_E];
const N_AFRICA = ['Morocco', 'W. Sahara', 'Algeria', 'Tunisia', 'Libya', 'Egypt', 'Mauritania', 'Mali', 'Niger', 'Chad', 'Sudan'];
const SW_ASIA = ['Saudi Arabia', 'Yemen', 'Oman', 'United Arab Emirates', 'Qatar', 'Kuwait', 'Iraq', 'Syria', 'Jordan', 'Lebanon', 'Israel', 'Palestine', 'Iran', 'Turkey'];
const C_ASIA = ['Kazakhstan', 'Uzbekistan', 'Turkmenistan', 'Kyrgyzstan', 'Tajikistan', 'Afghanistan', 'Azerbaijan'];
export const DRY = [...N_AFRICA, ...SW_ASIA, ...C_ASIA];
export const AFRICA = ['Senegal', 'Gambia', 'Guinea-Bissau', 'Guinea', 'Sierra Leone', 'Liberia', "Côte d'Ivoire", 'Burkina Faso', 'Ghana', 'Togo', 'Benin', 'Nigeria', 'Cameroon', 'Central African Rep.', 'S. Sudan', 'Ethiopia', 'Eritrea', 'Djibouti', 'Somalia', 'Somaliland', 'Kenya', 'Uganda', 'Rwanda', 'Burundi', 'Tanzania', 'Dem. Rep. Congo', 'Congo', 'Gabon', 'Eq. Guinea', 'Angola', 'Zambia', 'Malawi', 'Mozambique', 'Zimbabwe', 'Botswana', 'Namibia', 'South Africa', 'Lesotho', 'eSwatini', 'Madagascar'];
export const E_ASIA = ['China', 'Taiwan', 'South Korea', 'North Korea', 'Japan'];
export const SE_ASIA = ['Vietnam', 'Laos', 'Cambodia', 'Thailand', 'Myanmar', 'Malaysia', 'Indonesia', 'Philippines', 'Brunei', 'Timor-Leste'];
export const S_ASIA = ['India', 'Pakistan', 'Bangladesh', 'Nepal', 'Bhutan', 'Sri Lanka'];
export const OCEANIA = ['Australia', 'New Zealand', 'Papua New Guinea', 'Fiji', 'Solomon Is.', 'Vanuatu', 'New Caledonia'];
export const ANGLO = ['United States of America', 'Canada'];
export const LATIN = ['Mexico', 'Guatemala', 'Belize', 'Honduras', 'El Salvador', 'Nicaragua', 'Costa Rica', 'Panama', 'Cuba', 'Jamaica', 'Haiti', 'Dominican Rep.', 'Puerto Rico', 'Bahamas', 'Trinidad and Tobago', 'Colombia', 'Venezuela', 'Guyana', 'Suriname', 'Ecuador', 'Peru', 'Bolivia', 'Brazil', 'Paraguay', 'Uruguay', 'Argentina', 'Chile'];

// ── 세계의 문화권 ──
export const REGIONS = HL({ k4: EUROPE, k2: DRY, k3: AFRICA, k1: E_ASIA, k5: SE_ASIA, k8: S_ASIA, k7: [...OCEANIA, ...LATIN], k6: ANGLO });

// ── 주식 (개념도) ──
export const STAPLE = HL({
  k1: ['China', 'Taiwan', 'South Korea', 'North Korea', 'Japan', ...SE_ASIA, 'Bangladesh', 'Sri Lanka', 'Madagascar'],
  k2: [...EUROPE, ...N_AFRICA.slice(0, 6), ...SW_ASIA, ...C_ASIA.slice(0, 6), 'Pakistan', 'United States of America', 'Canada', 'Argentina', 'Uruguay', 'Chile', 'Australia', 'New Zealand'],
  k3: ['Mexico', 'Guatemala', 'Honduras', 'El Salvador', 'Nicaragua', 'Kenya', 'Tanzania', 'Zambia', 'Malawi', 'Zimbabwe', 'Mozambique', 'South Africa', 'Lesotho'],
  k6: ['Peru', 'Bolivia', 'Ecuador'],
  k5: ['Nigeria', 'Ghana', "Côte d'Ivoire", 'Togo', 'Benin', 'Cameroon', 'Central African Rep.', 'Dem. Rep. Congo', 'Congo', 'Gabon', 'Angola'],
  k4: ['Mongolia'],
});

// ── 식사 도구 (개념도) ──
export const UTENSIL = HL({
  k1: ['China', 'Taiwan', 'South Korea', 'North Korea', 'Japan', 'Vietnam'],
  k4: [...EUROPE, ...ANGLO, ...LATIN, 'Australia', 'New Zealand'],
  k2: [...DRY, ...AFRICA, ...S_ASIA, 'Indonesia', 'Malaysia', 'Myanmar'],
});

// ── 나라별 다수 종교 (개념도) ──
export const RELIGION = HL({
  k4: [...LATIN.filter((c) => !['Guyana', 'Suriname', 'Jamaica', 'Bahamas', 'Trinidad and Tobago'].includes(c)), 'Spain', 'Portugal', 'France', 'Italy', 'Belgium', 'Luxembourg', 'Austria', 'Ireland', 'Poland', 'Slovakia', 'Hungary', 'Croatia', 'Slovenia', 'Lithuania', 'Philippines', 'Timor-Leste', 'Dem. Rep. Congo', 'Angola', 'Rwanda', 'Burundi', 'Congo', 'Gabon'],
  k5: ['United States of America', 'Canada', 'United Kingdom', 'Iceland', 'Norway', 'Sweden', 'Finland', 'Denmark', 'Latvia', 'Estonia', 'Germany', 'Netherlands', 'Australia', 'New Zealand', 'Papua New Guinea', 'Namibia', 'South Africa', 'Botswana', 'Zambia', 'Zimbabwe', 'Kenya', 'Uganda', 'Ghana', 'Liberia', 'Jamaica', 'Bahamas'],
  k6: ['Russia', 'Ukraine', 'Belarus', 'Moldova', 'Romania', 'Bulgaria', 'Serbia', 'Montenegro', 'Macedonia', 'Greece', 'Cyprus', 'Georgia', 'Armenia', 'Ethiopia', 'Eritrea'],
  k3: [...N_AFRICA, 'Senegal', 'Gambia', 'Guinea', 'Burkina Faso', 'Somalia', 'Somaliland', 'Djibouti', ...SW_ASIA.filter((c) => c !== 'Israel'), 'Kazakhstan', 'Uzbekistan', 'Turkmenistan', 'Kyrgyzstan', 'Tajikistan', 'Afghanistan', 'Azerbaijan', 'Pakistan', 'Bangladesh', 'Malaysia', 'Indonesia', 'Brunei', 'Albania', 'Kosovo', 'N. Cyprus'],
  k2: ['India', 'Nepal'],
  k1: ['Thailand', 'Myanmar', 'Cambodia', 'Laos', 'Sri Lanka', 'Mongolia', 'Bhutan', 'Vietnam', 'China', 'Taiwan', 'South Korea', 'North Korea', 'Japan'],
});

// ── 언어 (공용어·주요 언어, 개념도) ──
export const LANGUAGE = HL({
  k4: ['United States of America', 'Canada', 'United Kingdom', 'Ireland', 'Australia', 'New Zealand'],
  k2: ['Mexico', 'Guatemala', 'Honduras', 'El Salvador', 'Nicaragua', 'Costa Rica', 'Panama', 'Cuba', 'Dominican Rep.', 'Puerto Rico', 'Colombia', 'Venezuela', 'Ecuador', 'Peru', 'Bolivia', 'Chile', 'Argentina', 'Paraguay', 'Uruguay', 'Spain'],
  k3: ['Brazil', 'Portugal', 'Angola', 'Mozambique'],
  k5: ['France', 'Senegal', 'Mali', 'Niger', 'Guinea', "Côte d'Ivoire", 'Burkina Faso', 'Togo', 'Benin', 'Gabon', 'Congo', 'Dem. Rep. Congo', 'Central African Rep.', 'Madagascar'],
  k6: ['Morocco', 'W. Sahara', 'Algeria', 'Tunisia', 'Libya', 'Egypt', 'Mauritania', 'Chad', 'Sudan', 'Saudi Arabia', 'Yemen', 'Oman', 'United Arab Emirates', 'Qatar', 'Kuwait', 'Iraq', 'Syria', 'Jordan', 'Lebanon', 'Palestine'],
  k1: ['Russia', 'Belarus', 'Kazakhstan', 'Kyrgyzstan'],
  k8: ['China', 'Taiwan'],
});
