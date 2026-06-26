export const simplifyDebts = (balances) => {
  const creditors = [];
  const debtors = [];

  for (const [userId, amount] of Object.entries(balances)) {
    const rounded = Math.round(amount * 100) / 100;
    if (rounded > 0) creditors.push({ userId, amount: rounded });
    if (rounded < 0) debtors.push({ userId, amount: rounded });
  }

  const transactions = [];

  while (creditors.length > 0 && debtors.length > 0) {
    creditors.sort((a, b) => b.amount - a.amount);
    debtors.sort((a, b) => a.amount - b.amount);

    const creditor = creditors[0];
    const debtor = debtors[0];

    const settleAmount = Math.min(creditor.amount, Math.abs(debtor.amount));
    const rounded = Math.round(settleAmount * 100) / 100;

    transactions.push({
      from: debtor.userId,
      to: creditor.userId,
      amount: rounded,
    });

    creditor.amount = Math.round((creditor.amount - rounded) * 100) / 100;
    debtor.amount = Math.round((debtor.amount + rounded) * 100) / 100;

    if (creditor.amount === 0) creditors.shift();
    if (debtor.amount === 0) debtors.shift();
  }

  return transactions;
};
