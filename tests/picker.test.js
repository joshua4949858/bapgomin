import { test } from 'node:test';
import assert from 'node:assert/strict';
import { pick, weatherMood, weightFor, candidates, DEFAULT_MENU } from '../picker.js';

const ALL = ['delivery', 'cvs', 'home'];

test('비 오면 따뜻한 쪽, 더우면 시원한 쪽', () => {
  assert.equal(weatherMood({ temperature: 18, precipitation: 1.2, weatherCode: 61 }), 'warm');
  assert.equal(weatherMood({ temperature: 5, precipitation: 0, weatherCode: 0 }), 'warm');
  assert.equal(weatherMood({ temperature: 30, precipitation: 0, weatherCode: 1 }), 'cool');
  assert.equal(weatherMood({ temperature: 18, precipitation: 0, weatherCode: 2 }), 'any');
  assert.equal(weatherMood(null), 'any');
});

test('날씨에 맞는 메뉴가 더 자주 나온다', () => {
  let warm = 0;
  for (let i = 0; i < 2000; i++) {
    if (pick(DEFAULT_MENU, { types: ALL, mood: 'warm' }).mood === 'warm') warm++;
  }
  // 따뜻한 메뉴 4개(x3) / 전체 가중치 4*3 + 3*1 + 2*0.5 = 16 → 약 75%
  assert.ok(warm / 2000 > 0.65, `warm 비율 ${warm / 2000}`);
});

test('선택한 종류만, 이미 나온 메뉴는 빼고 고른다', () => {
  const pool = candidates(DEFAULT_MENU, { types: ['cvs'], shown: ['c1'] });
  assert.deepEqual(pool.map((m) => m.id), ['c2', 'c3']);
  for (let i = 0; i < 50; i++) {
    const m = pick(DEFAULT_MENU, { types: ['cvs'], shown: ['c1'] });
    assert.notEqual(m.id, 'c1');
    assert.equal(m.type, 'cvs');
  }
});

test('후보가 없으면 null (엣지 케이스)', () => {
  assert.equal(pick([], { types: ALL }), null);
  assert.equal(pick(DEFAULT_MENU, { types: [] }), null);
  assert.equal(pick(DEFAULT_MENU, { types: ['home'], shown: ['h1'] }), null);
});

test('random 값이 끝에 가까워도 범위를 벗어나지 않는다', () => {
  const m = pick(DEFAULT_MENU, { types: ALL, mood: 'cool', random: () => 0.9999999 });
  assert.ok(m);
  assert.equal(weightFor({ mood: 'any' }, 'warm'), 1);
});
