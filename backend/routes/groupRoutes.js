const express = require("express");
const router = express.Router();

const auth = require("../middleware/authMiddleware");

const {
  createGroup,
  addMember,
  getMyGroups,
  getGroupDetails,
  deleteGroup,
  joinByCode,
  removeMember
} = require("../controllers/groupController");

router.post("/create-group", auth, createGroup);
router.post("/join-code", auth, joinByCode);
router.post("/add-member", auth, addMember);
router.get("/my-groups", auth, getMyGroups);
router.get("/:groupId", auth, getGroupDetails);
router.delete("/delete/:groupId", auth, deleteGroup);
router.post("/remove-member", auth, removeMember);

module.exports = router;