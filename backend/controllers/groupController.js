const Group = require("../models/Group");
const User = require("../models/User");
const Expense = require("../models/Expense");

const generateJoinCode = () => {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
};

// CREATE GROUP
exports.createGroup = async (req, res) => {
  try {
    const { groupName, members } = req.body;

    if (!groupName) {
      return res.status(400).json({ message: "Group name is required" });
    }

    const creatorId = req.user;
    let memberIds = [];

    const memberEmails = members?.map(e => e.toLowerCase()) || [];
    const uniqueEmails = [...new Set(memberEmails)];

    if (uniqueEmails.length > 0) {
      const users = await User.find({
        email: { $in: uniqueEmails },
      });

      memberIds = users.map((u) => u._id.toString());
    }

    memberIds = [...new Set(memberIds)];

    if (!memberIds.includes(creatorId.toString())) {
      memberIds.push(creatorId.toString());
    }

    let code;
    let exists = true;

    while (exists) {
      code = generateJoinCode();
      const found = await Group.findOne({ joinCode: code });
      if (!found) exists = false;
    }

    const group = await Group.create({
      groupName,
      createdBy: creatorId,
      members: memberIds,
      joinCode: code
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
          (sum, e) => sum + (e.totalAmount ?? e.amount ?? 0),
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
    .populate("members", "name email")
    .populate("createdBy", "name email");

    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    res.json(group);
  } catch (err) {
    res.status(500).json({ message: "Error fetching group details" });
  }
};

exports.joinByCode = async (req, res) => {
  try {
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({ message: "Code required" });
    }

    const group = await Group.findOne({
      joinCode: code.toUpperCase()
    });

    if (!group) {
      return res.status(404).json({
        message: "Invalid join code"
      });
    }

    const alreadyMember = group.members.some(
      m => m.toString() === req.user
    );

    if (alreadyMember) {
      return res.status(400).json({
        message: "Already joined"
      });
    }

    group.members.push(req.user);
    await group.save();

    res.json({
      message: "Joined successfully",
      groupId: group._id
    });

  } catch (err) {
    res.status(500).json({
      message: "Error joining group"
    });
  }
};

//Remove Member
exports.removeMember = async (req, res) => {
  try {
    const { groupId, memberId } = req.body;
    const group = await Group.findById(groupId);

    if (!group) {
      return res.status(404).json({
        message: "Group not found"
      });
    }

    if (group.createdBy.toString() !== req.user) {
      return res.status(403).json({
        message: "Only creator can remove members"
      });
    }

    if (group.createdBy.toString() === memberId) {
      return res.status(400).json({
        message: "Creator cannot be removed"
      });
    }

    group.members = group.members.filter(
      m => m.toString() !== memberId
    );

    await group.save();

    res.json({
      message: "Member removed"
    });

  } catch (err) {
    res.status(500).json({
      message: "Error removing member"
    });
  }
};