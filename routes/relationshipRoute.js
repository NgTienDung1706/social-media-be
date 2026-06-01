import express from "express";
const router = express.Router();
import * as relationshipController from "../controllers/relationshipController.js";
import auth from "../middleware/auth.js";

router.use(auth);
// Lấy danh sách followers của user
router.get("/:username/followers", relationshipController.getFollowers);
router.get("/:username/followings", relationshipController.getFollowings);
// Nhận danh sách userIds, trả về relationship statuses
router.post("/statuses", relationshipController.getRelationshipStatuses);

router.post("/:userId/follow", relationshipController.followUser);
router.delete("/:userId/unfollow", relationshipController.unfollowUser);
router.delete(
  "/:userId/remove-follower",
  relationshipController.removeFollower
);
export default router;
