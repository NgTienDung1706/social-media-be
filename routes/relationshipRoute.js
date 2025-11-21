import express from "express";
const router = express.Router();
import * as relationshipController from "../controllers/relationshipController.js";
import auth from "../middleware/auth.js";

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
export default router;
