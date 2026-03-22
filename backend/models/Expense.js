const mongoose = require("mongoose");

const expenseSchema = new mongoose.Schema({
  description:{
    type:String,
    required:true
  },
  amount:{
  type:Number,
  required:true,
  min:[1,"Amount must be greater than 0"]
},
  paidBy:{
    type:mongoose.Schema.Types.ObjectId,
    ref:"User",
    required:true
  },
  splitBetween:[
  {
    type:mongoose.Schema.Types.ObjectId,
    ref:"User",
    required:true
  }
],
  groupId:{
    type:mongoose.Schema.Types.ObjectId,
    ref:"Group",
    required:true
  }
},{
  timestamps:true
});

module.exports = mongoose.model("Expense", expenseSchema);