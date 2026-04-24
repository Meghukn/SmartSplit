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

router.post("/add-expense", auth, addExpense);
router.get("/group/:groupId", auth, getGroupExpenses);
router.get("/balances/:groupId", auth, calculateBalances);
router.get("/:expenseId", auth, getExpenseDetails);
router.get("/settle/:groupId", auth, settleExpenses);
router.delete("/:expenseId", auth, deleteExpense);
router.put("/:expenseId", auth, updateExpense);

module.exports = router;