const Expense = require("../models/Expense");
const Group = require("../models/Group");

// ADD EXPENSE
exports.addExpense = async (req, res) => {
  try {
    const { description, amount, paidBy, splitBetween, groupId } = req.body;

    if (!description || !paidBy || !splitBetween || splitBetween.length === 0 || !groupId) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (!amount || amount <= 0) {
      return res.status(400).json({
        message: "Amount must be greater than 0",
      });
    }

    // ✅ Remove duplicate users
    const uniqueSplit = [...new Set(splitBetween.map(id => id.toString()))];

    const group = await Group.findById(groupId);

    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    const groupMemberIds = group.members.map(m => m.toString());

    // ✅ Validate split users
    const invalidUsers = uniqueSplit.filter(
      userId => !groupMemberIds.includes(userId)
    );

    if (invalidUsers.length > 0) {
      return res.status(400).json({
        message: "Some selected members are not part of this group",
      });
    }

    // ✅ Validate payer
    if (!groupMemberIds.includes(paidBy.toString())) {
      return res.status(400).json({
        message: "Payer is not part of this group",
      });
    }

    const expense = await Expense.create({
      description,
      amount,
      paidBy,
      splitBetween: uniqueSplit,
      groupId,
    });

    res.status(201).json(expense);
  } catch (err) {
    res.status(500).json({ message: "Error adding expense" });
  }
};

// GET GROUP EXPENSES
exports.getGroupExpenses = async (req, res) => {
  try {
    const expenses = await Expense.find({
      groupId: req.params.groupId,
    })
      .populate("paidBy", "name")
      .populate("splitBetween", "name");

    res.json(expenses);
  } catch (err) {
    res.status(500).json({ message: "Error fetching expenses" });
  }
};

// CALCULATE BALANCES
exports.calculateBalances = async (req, res) => {
  try {
    const groupId = req.params.groupId;

    const expenses = await Expense.find({ groupId });

    let balances = {};

    expenses.forEach((exp) => {
      const share = parseFloat((exp.amount / exp.splitBetween.length).toFixed(2));
      const payer = exp.paidBy.toString();

      exp.splitBetween.forEach((user) => {
        const userId = user.toString();

        if (userId !== payer) {
          const key = `${userId}_${payer}`;

          if (!balances[key]) {
            balances[key] = 0;
          }

          balances[key] += share;
        }
      });
    });

    res.json(balances);
  } catch (err) {
    res.status(500).json({ message: "Error calculating balances" });
  }
};

// GET EXPENSE DETAILS
exports.getExpenseDetails = async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.expenseId)
      .populate("paidBy", "name")
      .populate("splitBetween", "name");

    if (!expense) {
      return res.status(404).json({
        message: "Expense not found",
      });
    }

    const share = parseFloat((expense.amount / expense.splitBetween.length).toFixed(2));

    const breakdown = [];

    expense.splitBetween.forEach((member) => {
      if (member._id.toString() !== expense.paidBy._id.toString()) {
        breakdown.push({
          from: member.name,
          to: expense.paidBy.name,
          amount: share,
        });
      }
    });

    res.json({
      description: expense.description,
      amount: expense.amount,
      paidBy: expense.paidBy.name,
      splitBetween: expense.splitBetween.map((m) => m.name),
      groupId: expense.groupId,
      breakdown,
    });
  } catch (err) {
    res.status(500).json({ message: "Error fetching expense details" });
  }
};

// DELETE EXPENSE
exports.deleteExpense = async (req, res) => {
  try {
    const { expenseId } = req.params;

    const expense = await Expense.findById(expenseId);

    if (!expense) {
      return res.status(404).json({ message: "Expense not found" });
    }

    await Expense.findByIdAndDelete(expenseId);

    res.json({ message: "Expense deleted" });

  } catch (err) {
    res.status(500).json({ message: "Error deleting expense" });
  }
};

// UPDATE EXPENSE
exports.updateExpense = async (req, res) => {
  try {
    const { expenseId } = req.params;
    const { description, amount, paidBy, splitBetween } = req.body;

    const expense = await Expense.findById(expenseId);

    if (!expense) {
      return res.status(404).json({ message: "Expense not found" });
    }

    const group = await Group.findById(expense.groupId);

    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    const groupMemberIds = group.members.map(m => m.toString());

    // ✅ Validate splitBetween (if provided)
    let uniqueSplit = expense.splitBetween;

    if (splitBetween && splitBetween.length > 0) {
      uniqueSplit = [...new Set(splitBetween.map(id => id.toString()))];

      const invalidUsers = uniqueSplit.filter(
        userId => !groupMemberIds.includes(userId)
      );

      if (invalidUsers.length > 0) {
        return res.status(400).json({
          message: "Some selected members are not part of this group",
        });
      }
    }

    // ✅ Validate paidBy (if provided)
    if (paidBy && !groupMemberIds.includes(paidBy.toString())) {
      return res.status(400).json({
        message: "Payer is not part of this group",
      });
    }

    // ✅ Update fields
    if (description) expense.description = description;

    if (amount && amount > 0) {
      expense.amount = amount;
    }

    if (paidBy) {
      expense.paidBy = paidBy;
    }

    if (splitBetween && splitBetween.length > 0) {
      expense.splitBetween = uniqueSplit;
    }

    await expense.save();

    res.json({
      message: "Expense updated successfully",
      expense
    });

  } catch (err) {
    res.status(500).json({ message: "Error updating expense" });
  }
};

// SETTLE EXPENSES
exports.settleExpenses = async (req, res) => {
  try {
    const groupId = req.params.groupId;

    const expenses = await Expense.find({ groupId });

    let paid = {};
    let shouldPay = {};

    expenses.forEach((exp) => {
      const share = parseFloat((exp.amount / exp.splitBetween.length).toFixed(2));
      const payer = exp.paidBy.toString();

      // Paid
      if (!paid[payer]) {
        paid[payer] = 0;
      }
      paid[payer] += exp.amount;

      // Should Pay
      exp.splitBetween.forEach((user) => {
        const userId = user.toString();

        if (!shouldPay[userId]) {
          shouldPay[userId] = 0;
        }

        shouldPay[userId] += share;
      });
    });

    let balance = {};
    let summary = [];

    const users = new Set([
      ...Object.keys(paid),
      ...Object.keys(shouldPay),
    ]);

    users.forEach((user) => {
      const totalPaid = paid[user] || 0;
      const totalShould = shouldPay[user] || 0;

      const net = parseFloat((totalPaid - totalShould).toFixed(2));

      balance[user] = net;

      summary.push({
        user,
        paid: totalPaid,
        shouldPay: totalShould,
        balance: net,
      });
    });

    let creditors = [];
    let debtors = [];

    for (let user in balance) {
      if (balance[user] > 0) {
        creditors.push({ user, amount: balance[user] });
      } else if (balance[user] < 0) {
        debtors.push({ user, amount: -balance[user] });
      }
    }

    let result = [];

    let i = 0, j = 0;

    while (i < debtors.length && j < creditors.length) {
      let debt = debtors[i];
      let credit = creditors[j];

      let settledAmount = Math.min(debt.amount, credit.amount);

      result.push({
        from: debt.user,
        to: credit.user,
        amount: settledAmount,
      });

      debt.amount -= settledAmount;
      credit.amount -= settledAmount;

      if (debt.amount === 0) i++;
      if (credit.amount === 0) j++;
    }

    res.json({
      summary,
      settlements: result,
    });
  } catch (err) {
    res.status(500).json({ message: "Error settling expenses" });
  }
};