const Expense = require("../models/Expense");

exports.addExpense = async (req, res) => {

  try {

    const { description, amount, paidBy, group, splitBetween } = req.body;

    const expense = await Expense.create({
      description,
      amount,
      paidBy,
      group,
      splitBetween
    });

    res.status(201).json(expense);

  } catch (error) {

    res.status(500).json({ message: error.message });

  }

};