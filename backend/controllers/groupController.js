const Group = require("../models/Group");

exports.createGroup = async (req, res) => {

  try {

    const { groupName, createdBy } = req.body;

    const group = await Group.create({
      groupName,
      createdBy,
      members: [createdBy]
    });

    res.status(201).json(group);

  } catch (error) {

    res.status(500).json({ message: error.message });

  }

};