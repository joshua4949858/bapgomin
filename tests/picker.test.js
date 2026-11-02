import { test } from 'node:test';
import assert from 'node:assert/strict';
import { pick, weatherMood, weightFor, candidates, guessCategory, DEFAULT_MENU } from '../picker.js';

const ALL = ['delivery', 'cvs', 'home'];

test('비 오면 따뜻한 쪽, 더우면 시원한 쪽', () => {
  assert.equal(weatherMood({ temperature: 18, precipitation: 1.2, weatherCode: 61 }), 'warm');
  assert.equal(weatherMood({ temperature: 5, precipitation: 0, weatherCode: 0 }), 'warm');
  assert.equal(weatherMood({ temperature: 30, precipitation: 0, weatherCode: 1 }), 'cool');
  assert.equal(weatherMood({ temperature: 18, precipitation: 0, weatherCode: 2 }), 'any');
  assert.equal(weatherMood(null), 'any');
});

test('날씨에 맞는 메뉴가 더 자주 나온다', () => {
  const total = DEFAULT_MENU.reduce((a, m) => a + weightFor(m, 'warm'), 0);
  const expected = DEFAULT_MENU.filter((m) => m.mood === 'warm').length * 3 / total;
  let warm = 0;
  for (let i = 0; i < 4000; i++) {
    if (pick(DEFAULT_MENU, { types: ALL, mood: 'warm' }).mood === 'warm') warm++;
  }
  const ratio = warm / 4000;
  assert.ok(Math.abs(ratio - expected) < 0.04, `warm 비율 ${ratio}, 기대 ${expected}`);
  const plain = DEFAULT_MENU.filter((m) => m.mood === 'warm').length / DEFAULT_MENU.length;
  assert.ok(ratio > plain + 0.1, '날씨 반영 없이 뽑을 때보다 확실히 많아야 한다');
});

test('선택한 종류만, 이미 나온 메뉴는 빼고 고른다', () => {
  const pool = candidates(DEFAULT_MENU, { types: ['cvs'], shown: ['c1'] });
  assert.ok(pool.length > 0 && pool.every((m) => m.type === 'cvs' && m.id !== 'c1'));
  for (let i = 0; i < 50; i++) {
    const m = pick(DEFAULT_MENU, { types: ['cvs'], shown: ['c1'] });
    assert.notEqual(m.id, 'c1');
    assert.equal(m.type, 'cvs');
  }
});

test('후보가 없으면 null (엣지 케이스)', () => {
  assert.equal(pick([], { types: ALL }), null);
  assert.equal(pick(DEFAULT_MENU, { types: [] }), null);
  const homeIds = DEFAULT_MENU.filter((m) => m.type === 'home').map((m) => m.id);
  assert.equal(pick(DEFAULT_MENU, { types: ['home'], shown: homeIds }), null);
});

test('random 값이 끝에 가까워도 범위를 벗어나지 않는다', () => {
  const m = pick(DEFAULT_MENU, { types: ALL, mood: 'cool', random: () => 0.9999999 });
  assert.ok(m);
  assert.equal(weightFor({ mood: 'any' }, 'warm'), 1);
});

test('메뉴 이름으로 종류와 성향을 짐작한다', () => {
  const cases = [
    ['순대국', 'delivery', 'warm'],
    ['물냉면', 'delivery', 'cool'],
    ['탕수육', 'delivery', 'any'], // '탕'이 들어가도 국물 아님
    ['냉동만두', 'home', 'any'], // '냉'이 들어가도 시원한 메뉴 아님
    ['컵라면', 'cvs', 'warm'], // 라면이지만 편의점
    ['집에서 라면', 'home', 'warm'],
    ['편의점 김밥', 'cvs', 'any'],
    ['콩국수', 'delivery', 'cool'],
    ['파스타', 'delivery', 'any'], // 모르는 메뉴는 배달 · 상관없음
  ];
  for (const [name, type, mood] of cases) {
    assert.deepEqual(guessCategory(name), { type, mood }, name);
  }
});
