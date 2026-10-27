// 메뉴 고르기 규칙. 브라우저와 테스트(node)에서 같이 쓴다.

export const MAX_SPINS = 3; // 첫 결과 + 다시 돌리기 2번

export const TYPES = {
  delivery: '배달',
  cvs: '편의점',
  home: '집에서',
};

// 메뉴의 날씨 성향: warm(국물·따뜻한 것), cool(시원한 것), any(상관없음)
export const MOODS = {
  warm: '따뜻한 거',
  cool: '시원한 거',
  any: '상관없음',
};

// Open-Meteo 날씨 코드 중 비·눈·소나기
function isWet(code) {
  return (code >= 51 && code <= 67) || (code >= 71 && code <= 86) || code >= 95;
}

// 날씨를 보고 오늘 어울리는 성향을 정한다. 날씨를 모르면 'any'.
export function weatherMood(weather) {
  if (!weather) return 'any';
  const { temperature, weatherCode, precipitation } = weather;
  if (isWet(weatherCode) || precipitation > 0) return 'warm';
  if (temperature < 10) return 'warm';
  if (temperature >= 25) return 'cool';
  return 'any';
}

export function describeWeather(weather) {
  if (!weather) return null;
  const wet = isWet(weather.weatherCode) || weather.precipitation > 0;
  return `${Math.round(weather.temperature)}°C${wet ? ', 비/눈' : ''}`;
}

// 날씨에 맞는 메뉴는 3배, 상관없는 메뉴는 1배, 반대 성향은 0.5배로 뽑힌다.
export function weightFor(item, mood) {
  if (mood === 'any' || item.mood === 'any') return 1;
  return item.mood === mood ? 3 : 0.5;
}

// 고를 수 있는 후보: 선택한 종류이고, 이번에 이미 나온 메뉴는 뺀다.
export function candidates(menu, { types, shown = [] }) {
  return menu.filter((m) => types.includes(m.type) && !shown.includes(m.id));
}

// random은 0 이상 1 미만 숫자를 주는 함수 (테스트에서 고정값을 넣기 위해 받는다)
export function pick(menu, { types, mood = 'any', shown = [], random = Math.random }) {
  const pool = candidates(menu, { types, shown });
  if (pool.length === 0) return null;
  const weights = pool.map((m) => weightFor(m, mood));
  const total = weights.reduce((a, b) => a + b, 0);
  let r = random() * total;
  for (let i = 0; i < pool.length; i++) {
    r -= weights[i];
    if (r < 0) return pool[i];
  }
  return pool[pool.length - 1];
}

export const DEFAULT_MENU = [
  { id: 'd1', name: '국밥', type: 'delivery', mood: 'warm' },
  { id: 'd2', name: '짬뽕', type: 'delivery', mood: 'warm' },
  { id: 'd3', name: '냉면', type: 'delivery', mood: 'cool' },
  { id: 'd4', name: '치킨', type: 'delivery', mood: 'any' },
  { id: 'd5', name: '돈까스', type: 'delivery', mood: 'any' },
  { id: 'c1', name: '삼각김밥 + 컵라면', type: 'cvs', mood: 'warm' },
  { id: 'c2', name: '편의점 도시락', type: 'cvs', mood: 'any' },
  { id: 'c3', name: '샌드위치 + 롤케이크', type: 'cvs', mood: 'cool' },
  { id: 'h1', name: '라면', type: 'home', mood: 'warm' },
];
