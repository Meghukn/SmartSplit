const Group = require("../models/Group");
const User = require("../models/User");
const Expense = require("../models/Expense");

exports.createGroup = async(req,res)=>{
 try{

  const { groupName, members } = req.body;

  // creator
  const creatorId = req.user;

  let memberIds = [];

  // find users from emails
  if(members && members.length > 0){

   const users = await User.find({
    email: { $in: members }
   });

   memberIds = users.map(u => u._id);
  }

  // add creator if not already
  if(!memberIds.includes(creatorId)){
   memberIds.push(creatorId);
  }

  const group = await Group.create({
   groupName,
   createdBy: creatorId,
   members: memberIds
  });

  res.json(group);

 }catch(err){
  res.status(500).json({message:err.message});
 }
};



exports.addMember = async(req,res)=>{

 try{

  const {groupId,email} = req.body;

  const user = await User.findOne({email});

  if(!user){

   return res.status(404).json({
    message:"User not registered"
   });

  }

  const group = await Group.findById(groupId);

  if(!group){

   return res.status(404).json({
    message:"Group not found"
   });

  }

  const alreadyMember = group.members.some(
  member => member.toString() === user._id.toString()
  );

  if(alreadyMember){

  return res.status(400).json({
    message:"User already in group"
  });

  }

  group.members.push(user._id);

  await group.save();

  res.json(group);

 }catch(err){

  res.status(500).json({message:err.message});

 }

};



exports.getMyGroups = async (req, res) => {
  try {
    const groups = await Group.find({
      members: req.user,
    })
      .populate("createdBy", "name")
      .sort({ createdAt: -1 });

    // 🔥 ADD TOTAL CALCULATION
    const groupsWithTotals = await Promise.all(
      groups.map(async (group) => {
        const expenses = await Expense.find({
          groupId: group._id,
        });

        const totalAmount = expenses.reduce(
          (sum, e) => sum + e.amount,
          0
        );

        return {
          ...group._doc,
          totalAmount,
        };
      })
    );

    res.json(groupsWithTotals);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.deleteGroup = async (req,res)=>{

 try{

  const {groupId} = req.params;

  const group = await Group.findById(groupId);

  if(!group){
   return res.status(404).json({message:"Group not found"});
  }

  await Group.findByIdAndDelete(groupId);

  res.json({message:"Group deleted"});

 }catch(err){
  res.status(500).json({message:"Error deleting group"});
 }

};



exports.getGroupDetails = async(req,res)=>{

 try{

  const group = await Group.findById(req.params.groupId)
  .populate("members","name email");

  res.json(group);

 }catch(err){

  res.status(500).json({message:err.message});

 }

};