import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { calculateSplits } from '../src/utils/split.utils.js';

describe('calculateSplits - equal', () => {
  it('splits equally among members', () => {
    const result = calculateSplits(900, 'equal', ['u1', 'u2', 'u3'], []);
    assert.equal(result.length, 3);
    const total = result.reduce((s, r) => s + r.amount, 0);
    assert.equal(total, 900);
  });

  it('handles remainder correctly for uneven splits', () => {
    const result = calculateSplits(100, 'equal', ['u1', 'u2', 'u3'], []);
    const total = result.reduce((s, r) => s + r.amount, 0);
    assert.equal(Math.round(total * 100) / 100, 100);
  });
});

describe('calculateSplits - exact', () => {
  it('accepts valid exact splits', () => {
    const splits = [{ user_id: 'u1', amount: 500 }, { user_id: 'u2', amount: 400 }];
    const result = calculateSplits(900, 'exact', [], splits);
    assert.equal(result.length, 2);
  });

  it('throws if exact splits do not sum to total', () => {
    const splits = [{ user_id: 'u1', amount: 400 }, { user_id: 'u2', amount: 400 }];
    assert.throws(() => calculateSplits(900, 'exact', [], splits), /must equal/);
  });
});

describe('calculateSplits - percentage', () => {
  it('converts percentages to amounts', () => {
    const splits = [{ user_id: 'u1', amount: 60 }, { user_id: 'u2', amount: 40 }];
    const result = calculateSplits(1000, 'percentage', [], splits);
    assert.equal(result[0].amount, 600);
    assert.equal(result[1].amount, 400);
  });

  it('throws if percentages do not sum to 100', () => {
    const splits = [{ user_id: 'u1', amount: 60 }, { user_id: 'u2', amount: 30 }];
    assert.throws(() => calculateSplits(1000, 'percentage', [], splits), /100/);
  });
});
