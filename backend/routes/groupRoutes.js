const express = require("express");
const router = express.Router();

const { createGroup } = require("../controllers/groupController");

router.post("/create-group", createGroup);

module.exports = router;