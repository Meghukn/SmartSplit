const express = require("express");
const router = express.Router();

const auth = require("../middleware/authMiddleware");

const {
  addExpense,
  getGroupExpenses,
  calculateBalances,
  getExpenseDetails,
  settleExpenses,
  deleteExpense,
  updateExpense
} = require("../controllers/expenseController");

// Add expense
router.post("/add-expense", auth, addExpense);

// Get all expenses in a group
router.get("/group/:groupId", auth, getGroupExpenses);

// Calculate balances
router.get("/balances/:groupId", auth, calculateBalances);

// Get single expense
router.get("/:expenseId", auth, getExpenseDetails);

// Settle expenses
router.get("/settle/:groupId", auth, settleExpenses);

router.delete("/:expenseId", auth, deleteExpense);
router.put("/:expenseId", auth, updateExpense);

module.exports = router;