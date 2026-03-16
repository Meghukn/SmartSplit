const Group = require("../models/Group");
const User = require("../models/User");

exports.createGroup = async(req,res)=>{

 try{

  const {groupName} = req.body;

  const group = await Group.create({

   groupName,

   createdBy:req.user,

   members:[req.user]

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



exports.getMyGroups = async(req,res)=>{

 try{

  const groups = await Group.find({
  members:req.user
  })
  .populate("createdBy","name")
  .sort({createdAt:-1});

  res.json(groups);

 }catch(err){

  res.status(500).json({message:err.message});

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