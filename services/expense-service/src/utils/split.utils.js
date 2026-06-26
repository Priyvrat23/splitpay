export const calculateSplits = (amount, splitType, members, splits) => {
  if (splitType === 'equal') {
    const share = Math.round((amount / members.length) * 100) / 100;
    const remainder = Math.round((amount - share * members.length) * 100) / 100;
    return members.map((userId, index) => ({
      user_id: userId,
      amount: index === 0 ? share + remainder : share,
    }));
  }

  if (splitType === 'exact') {
    const total = splits.reduce((sum, s) => sum + s.amount, 0);
    const roundedTotal = Math.round(total * 100) / 100;
    const roundedAmount = Math.round(amount * 100) / 100;
    if (roundedTotal !== roundedAmount) {
      throw new Error(`Exact splits sum (${roundedTotal}) must equal expense amount (${roundedAmount})`);
    }
    return splits;
  }

  if (splitType === 'percentage') {
    const totalPct = splits.reduce((sum, s) => sum + s.amount, 0);
    const roundedPct = Math.round(totalPct * 100) / 100;
    if (roundedPct !== 100) {
      throw new Error(`Percentages must sum to 100, got ${roundedPct}`);
    }
    return splits.map((s) => ({
      user_id: s.user_id,
      amount: Math.round((amount * s.amount) / 100 * 100) / 100,
    }));
  }

  throw new Error(`Unknown split type: ${splitType}`);
};
