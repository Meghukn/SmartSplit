const express = require("express");
const router = express.Router();

const auth = require("../middleware/authMiddleware");

const {
  createGroup,
  addMember,
  getMyGroups,
  getGroupDetails,
  deleteGroup
} = require("../controllers/groupController");

// Create group
router.post("/create-group", auth, createGroup);

// Add member
router.post("/add-member", auth, addMember);

// Get user's groups
router.get("/my-groups", auth, getMyGroups);

// Get group details
router.get("/:groupId", auth, getGroupDetails);

// Delete group
router.delete("/delete/:groupId", auth, deleteGroup);

module.exports = router;