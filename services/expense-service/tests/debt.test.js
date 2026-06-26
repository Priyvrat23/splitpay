import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { simplifyDebts } from '../src/utils/debt.utils.js';

describe('simplifyDebts', () => {
  it('returns empty array when all balances are zero', () => {
    const result = simplifyDebts({ u1: 0, u2: 0 });
    assert.equal(result.length, 0);
  });

  it('creates one transaction for two people', () => {
    const result = simplifyDebts({ u1: 300, u2: -300 });
    assert.equal(result.length, 1);
    assert.equal(result[0].from, 'u2');
    assert.equal(result[0].to, 'u1');
    assert.equal(result[0].amount, 300);
  });

  it('simplifies three-way debt into two transactions', () => {
    const balances = { u1: 600, u2: -200, u3: -400 };
    const result = simplifyDebts(balances);
    const totalSettled = result.reduce((s, t) => s + t.amount, 0);
    assert.equal(totalSettled, 600);
  });
});
