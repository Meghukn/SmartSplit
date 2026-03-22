const Group = require("../models/Group");
const User = require("../models/User");
const Expense = require("../models/Expense");

// CREATE GROUP
exports.createGroup = async (req, res) => {
  try {
    const { groupName, members } = req.body;

    if (!groupName) {
      return res.status(400).json({ message: "Group name is required" });
    }

    const creatorId = req.user;

    let memberIds = [];

    // Normalize emails + remove duplicates
    const memberEmails = members?.map(e => e.toLowerCase()) || [];
    const uniqueEmails = [...new Set(memberEmails)];

    if (uniqueEmails.length > 0) {
      const users = await User.find({
        email: { $in: uniqueEmails },
      });

      memberIds = users.map((u) => u._id.toString());
    }

    // Remove duplicate IDs
    memberIds = [...new Set(memberIds)];

    // Add creator if not present
    if (!memberIds.includes(creatorId.toString())) {
      memberIds.push(creatorId.toString());
    }

    const group = await Group.create({
      groupName,
      createdBy: creatorId,
      members: memberIds,
    });

    res.json(group);
  } catch (err) {
    res.status(500).json({ message: "Error creating group" });
  }
};

// ADD MEMBER
exports.addMember = async (req, res) => {
  try {
    const { groupId, email } = req.body;

    if (!groupId || !email) {
      return res.status(400).json({ message: "Group ID and email required" });
    }

    const emailLower = email.toLowerCase();

    const user = await User.findOne({ email: emailLower });

    if (!user) {
      return res.status(404).json({
        message: "User not registered",
      });
    }

    const group = await Group.findById(groupId);

    if (!group) {
      return res.status(404).json({
        message: "Group not found",
      });
    }

    // 🔥 Only creator can add members
    if (group.createdBy.toString() !== req.user) {
      return res.status(403).json({
        message: "Only group creator can add members",
      });
    }

    const alreadyMember = group.members.some(
      (member) => member.toString() === user._id.toString()
    );

    if (alreadyMember) {
      return res.status(400).json({
        message: "User already in group",
      });
    }

    group.members.push(user._id);

    await group.save();

    res.json(group);
  } catch (err) {
    res.status(500).json({ message: "Error adding member" });
  }
};

// GET MY GROUPS
exports.getMyGroups = async (req, res) => {
  try {
    const groups = await Group.find({
      members: req.user,
    })
      .populate("createdBy", "name")
      .sort({ createdAt: -1 });

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
    res.status(500).json({ message: "Error fetching groups" });
  }
};

// DELETE GROUP
exports.deleteGroup = async (req, res) => {
  try {
    const { groupId } = req.params;

    const group = await Group.findById(groupId);

    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    // 🔥 Only creator can delete
    if (group.createdBy.toString() !== req.user) {
      return res.status(403).json({
        message: "Only creator can delete group",
      });
    }

    await Group.findByIdAndDelete(groupId);

    res.json({ message: "Group deleted" });
  } catch (err) {
    res.status(500).json({ message: "Error deleting group" });
  }
};

// GET GROUP DETAILS
exports.getGroupDetails = async (req, res) => {
  try {
    const group = await Group.findById(req.params.groupId)
      .populate("members", "name email");

    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    res.json(group);
  } catch (err) {
    res.status(500).json({ message: "Error fetching group details" });
  }
};