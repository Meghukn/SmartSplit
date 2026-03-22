const express = require("express");
const router = express.Router();

const {
 addExpense,
 getGroupExpenses,
 calculateBalances,
 getExpenseDetails,
 settleExpenses
} = require("../controllers/expenseController");

router.post("/add-expense", addExpense);
router.get("/group/:groupId", getGroupExpenses);
router.get("/balances/:groupId", calculateBalances);
router.get("/:expenseId", getExpenseDetails);
router.get("/settle/:groupId", settleExpenses);

module.exports = router;