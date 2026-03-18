const Expense = require("../models/Expense");
const Group = require("../models/Group");

exports.addExpense = async(req,res)=>{
 try{

  const {description,amount,paidBy,splitBetween,groupId} = req.body;

  // required fields
  if(!description || !paidBy || !splitBetween || splitBetween.length === 0){
   return res.status(400).json({message:"All fields are required"});
  }

  // amount validation
  if(!amount || amount <= 0){
   return res.status(400).json({
    message:"Amount must be greater than 0"
   });
  }

  // ✅ FETCH GROUP
  const group = await Group.findById(groupId);

  if(!group){
   return res.status(404).json({message:"Group not found"});
  }

  // ✅ CHECK IF ALL USERS BELONG TO GROUP
  const groupMemberIds = group.members.map(m => m.toString());

  const invalidUsers = splitBetween.filter(
   userId => !groupMemberIds.includes(userId)
  );

  if(invalidUsers.length > 0){
   return res.status(400).json({
    message:"Some selected members are not part of this group"
   });
  }

  // ✅ ALSO CHECK paidBy is in group
  if(!groupMemberIds.includes(paidBy)){
   return res.status(400).json({
    message:"Payer is not part of this group"
   });
  }

  const expense = await Expense.create({
   description,
   amount,
   paidBy,
   splitBetween,
   groupId
  });

  res.status(201).json(expense);

 }catch(err){
  res.status(500).json({message:err.message});
 }
};

exports.getGroupExpenses = async(req,res)=>{
 try{

  const expenses = await Expense.find({
   groupId:req.params.groupId
  })
  .populate("paidBy","name")
  .populate("splitBetween","name");

  res.json(expenses);

 }catch(err){
  res.status(500).json({message:err.message});
 }
};


exports.calculateBalances = async(req,res)=>{
 try{

  const groupId = req.params.groupId;

  const expenses = await Expense.find({groupId});

  let balances = {};

  expenses.forEach(exp => {

   const share = exp.amount / exp.splitBetween.length;

   exp.splitBetween.forEach(user => {

    if(user.toString() !== exp.paidBy.toString()){

     const key = `${user}_${exp.paidBy}`;

     if(!balances[key]){
      balances[key] = 0;
     }

     balances[key] += share;

    }

   });

  });

  res.json(balances);

 }catch(err){
  res.status(500).json({message:err.message});
 }
};

exports.getExpenseDetails = async(req,res)=>{
 try{

  const expenseId = req.params.expenseId;

  const expense = await Expense.findById(expenseId)
   .populate("paidBy","name")
   .populate("splitBetween","name");

  if(!expense){
   return res.status(404).json({
    message:"Expense not found"
   });
  }

  const share = expense.amount / expense.splitBetween.length;

  const breakdown = [];

  expense.splitBetween.forEach(member => {

   if(member._id.toString() !== expense.paidBy._id.toString()){

    breakdown.push({
     from: member.name,
     to: expense.paidBy.name,
     amount: share
    });

   }

  });

  res.json({
   description: expense.description,
   amount: expense.amount,
   paidBy: expense.paidBy.name,
   splitBetween: expense.splitBetween.map(m=>m.name),
   groupId: expense.groupId,
   breakdown
  });

 }catch(err){
  res.status(500).json({message:err.message});
 }
};