const Expense = require("../models/Expense");
const Group = require("../models/Group");
const mongoose = require("mongoose");

// ADD EXPENSE
exports.addExpense = async (req, res) => {
  try {
    const { description, totalAmount, paidBy, splitBetween, splits, groupId } = req.body;

    if (!description || !paidBy || !groupId) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (!totalAmount || totalAmount <= 0) {
      return res.status(400).json({
        message: "Amount must be greater than 0",
      });
    }

    const group = await Group.findById(groupId);

    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    const groupMemberIds = group.members.map(m => m.toString());

    if (!groupMemberIds.includes(paidBy.toString())) {
      return res.status(400).json({
        message: "Payer is not part of this group",
      });
    }

    let finalSplits = [];

    // ✅ MANUAL MODE
    if (splits && splits.length > 0) {
      const total = splits.reduce((sum, s) => sum + Number(s.amount), 0);

      if (parseFloat(total.toFixed(2)) !== parseFloat(totalAmount.toFixed(2))) {
        return res.status(400).json({
          message: "Split amounts must equal total amount"
        });
      }

      const usersInSplit = splits.map(s => s.user.toString());

      const invalidUsers = usersInSplit.filter(
        userId => !groupMemberIds.includes(userId)
      );

      if (invalidUsers.length > 0) {
        return res.status(400).json({
          message: "Some users are not part of this group"
        });
      }

      finalSplits = splits.map(s => ({
  user: mongoose.Types.ObjectId.isValid(s.user)
    ? new mongoose.Types.ObjectId(s.user)
    : s.user,
  amount: Number(s.amount)
}));
    }

    // ✅ ADVANCED MODE
    else if (splitBetween && splitBetween.length > 0) {
      const uniqueUsers = [...new Set(splitBetween.map(id => id.toString()))];

      const invalidUsers = uniqueUsers.filter(
        userId => !groupMemberIds.includes(userId)
      );

      if (invalidUsers.length > 0) {
        return res.status(400).json({
          message: "Some selected members are not part of this group"
        });
      }

      const splitAmt = parseFloat((totalAmount / uniqueUsers.length).toFixed(2));

      finalSplits = uniqueUsers.map(user => ({
        user: new mongoose.Types.ObjectId(user),
        amount: splitAmt
      }));
    }

    else {
      return res.status(400).json({
        message: "Provide either splits or splitBetween"
      });
    }

    const expense = await Expense.create({
      description,
      totalAmount,
      paidBy,
      splits: finalSplits,
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
      .populate("splits.user", "name");

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
      const payer = exp.paidBy.toString();

      exp.splits.forEach((s) => {
        const userId = s.user.toString();

        if (userId !== payer) {
          const key = `${userId}_${payer}`;

          if (!balances[key]) {
            balances[key] = 0;
          }

          balances[key] += s.amount;
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
      .populate("splits.user", "name")
      .populate("splitBetween", "name");

    if (!expense) {
      return res.status(404).json({
        message: "Expense not found",
      });
    }

    const breakdown = [];

    expense.splits.forEach((s) => {
      if (s.user._id.toString() !== expense.paidBy._id.toString()) {
        breakdown.push({
          from: s.user.name,
          to: expense.paidBy.name,
          amount: s.amount,
        });
      }
    });

    res.json({
      description: expense.description,
      totalAmount: expense.totalAmount,
      paidBy: expense.paidBy.name,
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
    const { description, totalAmount, paidBy, splitBetween, splits } = req.body;

    const expense = await Expense.findById(expenseId);

    if (!expense) {
      return res.status(404).json({ message: "Expense not found" });
    }

    const group = await Group.findById(expense.groupId);

    const groupMemberIds = group.members.map(m => m.toString());

    let finalSplits = expense.splits;

    if (splits && splits.length > 0) {
      const total = splits.reduce((sum, s) => sum + Number(s.amount), 0);

      if (parseFloat(total.toFixed(2)) !== parseFloat(totalAmount.toFixed(2))) {
        return res.status(400).json({
          message: "Split mismatch"
        });
      }

      finalSplits = splits.map(s => ({
  user: new mongoose.Types.ObjectId(s.user),
  amount: Number(s.amount)
}));
    }

    else if (splitBetween && splitBetween.length > 0) {
      const splitAmt = totalAmount / splitBetween.length;

      finalSplits = splitBetween.map(user => ({
        user: new mongoose.Types.ObjectId(user),
        amount: splitAmt
      }));
    }

    if (description) expense.description = description;
    if (totalAmount) expense.totalAmount = totalAmount;
    if (paidBy) expense.paidBy = paidBy;

    expense.splits = finalSplits;

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
      const payer = exp.paidBy.toString();

      paid[payer] = (paid[payer] || 0) + exp.totalAmount;

      exp.splits.forEach((s) => {
        const user = s.user.toString();
        shouldPay[user] = (shouldPay[user] || 0) + s.amount;
      });
    });

    let balance = {};
    let summary = [];

    const users = new Set([
      ...Object.keys(paid),
      ...Object.keys(shouldPay),
    ]);

    users.forEach((user) => {
      const net = Number(
        ((paid[user] || 0) - (shouldPay[user] || 0)).toFixed(2)
      );

      balance[user] = net;

      summary.push({
        user,
        paid: paid[user] || 0,
        shouldPay: shouldPay[user] || 0,
        balance: net,
      });
    });

    let persons = [];

    for (let user in balance) {
      if (Math.abs(balance[user]) > 0.01) {
        persons.push({
          user,
          amount: balance[user]
        });
      }
    }

    let settlements = [];

    // -------- SMALL GROUP = EXACT OPTIMAL --------
    if (persons.length <= 12) {

      const arr = persons.map(p => ({ ...p }));
      let best = null;

      const dfs = (start, path) => {
        while (
          start < arr.length &&
          Math.abs(arr[start].amount) < 0.01
        ) start++;

        if (start === arr.length) {
          if (!best || path.length < best.length) {
            best = [...path];
          }
          return;
        }

        if (best && path.length >= best.length) return;

        for (let i = start + 1; i < arr.length; i++) {
          if (arr[start].amount * arr[i].amount < 0) {

            const a = arr[start].amount;
            const b = arr[i].amount;

            const settleAmt = Math.min(
              Math.abs(a),
              Math.abs(b)
            );

            arr[i].amount = Number((b + a).toFixed(2));
            arr[start].amount = 0;

            path.push({
              from: a < 0 ? arr[start].user : arr[i].user,
              to: a > 0 ? arr[start].user : arr[i].user,
              amount: settleAmt
            });

            dfs(start + 1, path);

            path.pop();
            arr[start].amount = a;
            arr[i].amount = b;
          }
        }
      };

      dfs(0, []);
      settlements = best || [];
    }

    // -------- LARGE GROUP = GREEDY FAST --------
    else {
      let creditors = [];
      let debtors = [];

      persons.forEach((p) => {
        if (p.amount > 0)
          creditors.push({
            user: p.user,
            amount: p.amount
          });
        else
          debtors.push({
            user: p.user,
            amount: -p.amount
          });
      });

      let i = 0, j = 0;

      while (i < debtors.length && j < creditors.length) {
        let amt = Math.min(
          debtors[i].amount,
          creditors[j].amount
        );

        settlements.push({
          from: debtors[i].user,
          to: creditors[j].user,
          amount: Number(amt.toFixed(2))
        });

        debtors[i].amount -= amt;
        creditors[j].amount -= amt;

        if (debtors[i].amount < 0.01) i++;
        if (creditors[j].amount < 0.01) j++;
      }
    }

    res.json({
      summary,
      settlements
    });

  } catch (err) {
    res.status(500).json({
      message: "Error settling expenses"
    });
  }
};

