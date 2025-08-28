const express = require("express");
const router = express.Router();
const relationshipController = require("../controllers/relationshipController");
const auth = require("../middleware/auth");

// Lấy danh sách followers của user
router.get("/:username/followers", auth, relationshipController.getFollowers);
router.get("/:username/followings", auth, relationshipController.getFollowings);
// Nhận danh sách userIds, trả về relationship statuses
router.post("/statuses", auth, relationshipController.getRelationshipStatuses);

router.post("/:userId/follow", auth, relationshipController.followUser);
router.delete("/:userId/unfollow", auth, relationshipController.unfollowUser);
router.delete(
  "/:userId/remove-follower",
  auth,
  relationshipController.removeFollower
);
module.exports = router;
