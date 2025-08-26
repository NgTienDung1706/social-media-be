const Relationship = require("../models/relationshipModel");
const User = require("../models/userModel");

/**
 * Lấy danh sách follower của userId
 */
const getFollowers = async (userId) => {
  return await Relationship.find({ to: userId, type: "follow" })
    .populate("from", "username profile.avatar profile.lastname profile.firstname") // lấy thêm thông tin user theo nhu cầu
    .lean();
};

const getFollowings = async (username, page, limit) => {
  // Tìm user theo username để lấy userId
  const user = await User.findOne({ username }).select("_id").lean();
  if (!user) {
    throw new Error("User not found");
  }

  const userId = user._id;

  // Lấy danh sách following
  const follows = await Relationship.find({ from: userId, type: "follow" })
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .populate({
      path: "to",
      select: "_id username profile.avatar profile.firstname profile.lastname createdAt",
    })
    .lean();

  // Đếm tổng số following
  const totalFollowing = await Relationship.countDocuments({ from: userId, type: "follow" });

  // Format dữ liệu cho FE
  const formattedList = follows.map((f) => {
    const user = f.to || {};
    return {
      _id: user._id,
      username: user.username || "",
      firstname: user.profile?.firstname || "",
      lastname: user.profile?.lastname || "",
      avatar: user.profile?.avatar || "",
      followedAt: f.createdAt,
      relationship_status: {
        following: true,
      }
    };
  });

  return {
    followings: formattedList,
    hasMore: page * limit < totalFollowing,
  };
}

/**
 * Lấy relationship statuses giữa currentUser và danh sách userIds
 */
const getRelationshipStatuses = async (currentUserId, userIds) => {
  const relationships = await Relationship.find({
    $or: [
      { from: currentUserId, to: { $in: userIds }, type: "follow" },
      { from: { $in: userIds }, to: currentUserId, type: "follow" }
    ]
  }).lean();

  const statusMap = {};

  userIds.forEach((uid) => {
    const isFollowing = relationships.some(
      (r) => r.from.toString() === currentUserId.toString() && r.to.toString() === uid
    );
    const isFollower = relationships.some(
      (r) => r.from.toString() === uid && r.to.toString() === currentUserId.toString()
    );

    statusMap[uid] = {
      following: isFollowing,
    //   incoming_request: false,  // nếu có logic request thì xử lý thêm
    //   is_bestie: false,         // để false mặc định, sau này mở rộng
    //   is_private: false,
    //   is_restricted: false,
      follower: isFollower
    };
  });

  return {
    relationship_status: statusMap
  };
};

module.exports = {
  getFollowers,
  getFollowings,
  getRelationshipStatuses,
};
