import Expense from "../models/Expense";
import User from "../models/User";

// Computes per-traveler {totalPaid, totalOwed, net} for a trip's expenses.
// Shared by app/api/trips/[id]/expenses/summary/route.js and (once built)
// the Trip Readiness dashboard, so the balance math lives in exactly one place.
export async function computeExpenseSummary(tripId) {
  const expenses = await Expense.find({ trip: tripId }).lean();

  const balances = new Map(); // userId -> { totalPaid, totalOwed }

  const ensure = (userId) => {
    const key = userId.toString();
    if (!balances.has(key)) {
      balances.set(key, { totalPaid: 0, totalOwed: 0 });
    }
    return balances.get(key);
  };

  let totalSpent = 0;

  for (const expense of expenses) {
    totalSpent += expense.amount || 0;

    ensure(expense.paidBy).totalPaid += expense.amount || 0;

    for (const split of expense.splitBetween || []) {
      if (!split.user) continue;
      ensure(split.user).totalOwed += split.share || 0;
    }
  }

  const userIds = Array.from(balances.keys());
  const users = await User.find({ _id: { $in: userIds } }).select("name image").lean();
  const userById = new Map(users.map((u) => [u._id.toString(), u]));

  const perTraveler = userIds.map((userId) => {
    const { totalPaid, totalOwed } = balances.get(userId);
    const user = userById.get(userId);
    return {
      user: user ? { id: user._id.toString(), name: user.name, image: user.image } : { id: userId },
      totalPaid,
      totalOwed,
      net: totalPaid - totalOwed,
    };
  });

  return { totalSpent, perTraveler };
}
