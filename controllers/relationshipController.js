const relationshipService = require("../services/relationshipService");

/**
 * API 1: Lấy danh sách followers của user
 */
const getFollowers = async (req, res) => {
  try {
    const { username } = req.params ;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;
    const followers = await relationshipService.getFollowers(username, page, limit);
    res.status(200).json(followers);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Lỗi server" });
  }
};

const getFollowings = async (req, res) => {
  try {
    const { username } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;
    const followings = await relationshipService.getFollowings(username, page, limit);
    res.status(200).json(followings);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Lỗi server" });
  }
} 

/**
 * API 2: Nhận danh sách userIds, trả về relationship statuses
 */
const getRelationshipStatuses = async (req, res) => {
  try {
    const currentUserId = req.user.id; // từ JWT
    const { userIds } = req.body;      // array userId

    if (!Array.isArray(userIds)) {
      return res.status(400).json({ message: "userIds phải là mảng" });
    }

    const relationship_status = await relationshipService.getRelationshipStatuses(currentUserId, userIds);
    res.status(200).json(relationship_status);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Lỗi server" });
  }
};

module.exports = {
  getFollowers,
  getFollowings,
  getRelationshipStatuses,
};
