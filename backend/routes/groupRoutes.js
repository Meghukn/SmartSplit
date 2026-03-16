const express = require("express");

const router = express.Router();

const auth = require("../middleware/authMiddleware");
const {deleteGroup} = require("../controllers/groupController");

const {
 createGroup,
 addMember,
 getMyGroups,
 getGroupDetails
} = require("../controllers/groupController");

router.post("/create-group",auth,createGroup);

router.post("/add-member",auth,addMember);

router.get("/my-groups",auth,getMyGroups);

router.get("/:groupId",auth,getGroupDetails);

router.delete("/delete/:groupId",auth,deleteGroup);

module.exports = router;