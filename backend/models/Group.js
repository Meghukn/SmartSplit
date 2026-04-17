const mongoose = require("mongoose");

const groupSchema = new mongoose.Schema({

  groupName: {
    type: String,
    required: true
  },

  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  members: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  }],

  joinCode: {
    type: String,
    unique: true
  }

}, { timestamps: true });

module.exports = mongoose.model("Group", groupSchema);