const express = require("express");
const router = express.Router();
const relationshipController = require("../controllers/relationshipController");
const auth = require("../middleware/auth");

// Lấy danh sách followers của user
router.get("/:userId/followers", auth, relationshipController.getFollowers);
router.get("/:username/following", auth, relationshipController.getFollowings);
// Nhận danh sách userIds, trả về relationship statuses
router.post("/statuses", auth, relationshipController.getRelationshipStatuses);

module.exports = router;