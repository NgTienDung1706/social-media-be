const Relationship = require("../models/relationshipModel");
const User = require("../models/userModel");

/**
 * Lấy danh sách follower của userId
 */
const getFollowers = async (username, myuserid, page, limit) => {
  // Tìm user theo username để lấy userId
  const user = await User.findOne({ username }).select("_id").lean();
  if (!user) {
    throw new Error("User not found");
  }

  const userId = user._id;

  // Lấy danh sách follower (người follow mình => from)
  const follows = await Relationship.find({ to: userId, type: "follow" })
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .populate({
      path: "from", // sửa chỗ này
      select:
        "_id username profile.avatar profile.firstname profile.lastname createdAt",
    })
    .lean();

  // Đếm tổng số follower
  const totalFollower = await Relationship.countDocuments({
    to: userId,
    type: "follow",
  });

  // Lấy danh sách userId trong followers
  const followerIds = follows.map((f) => f.from?._id).filter(Boolean);

  // Lấy relationship statuses giữa currentUser và danh sách followerIds
  const relationships = await Relationship.find({
    from: myuserid,
    to: { $in: followerIds },
    type: "follow",
  }).lean();

  // Set các user mà currentUser đang follow
  const followingSet = new Set(relationships.map((r) => String(r.to)));

  // Format dữ liệu cho FE
  const formattedList = follows.map((f) => {
    const user = f.from || {};
    const isMe = String(user._id) === String(myuserid);
    return {
      _id: user._id,
      username: user.username || "",
      firstname: user.profile?.firstname || "",
      lastname: user.profile?.lastname || "",
      avatar: user.profile?.avatar || "",
      followedAt: f.createdAt,
      relationship_status: {
        following: followingSet.has(String(user._id)), // mình có follow họ không
        isMe,
      },
    };
  });

  return {
    followers: formattedList,
    hasMore: page * limit < totalFollower,
  };
};

const getFollowings = async (username, myuserid, page, limit) => {
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
      select:
        "_id username profile.avatar profile.firstname profile.lastname createdAt",
    })
    .lean();

  // Đếm tổng số following
  const totalFollowing = await Relationship.countDocuments({
    from: userId,
    type: "follow",
  });

  // Lấy danh sách userId trong followings
  const followingIds = follows.map((f) => f.to?._id).filter(Boolean);

  // Lấy relationship statuses giữa currentUser và danh sách followingIds
  // Giả sử currentUserId được lấy từ JWT, ví dụ: req.user.id
  const relationships = await Relationship.find({
    from: myuserid,
    to: { $in: followingIds },
    type: "follow",
  }).lean();

  const followingSet = new Set(relationships.map((r) => String(r.to)));
  // Format dữ liệu cho FE
  const formattedList = follows.map((f) => {
    const user = f.to || {};
    const isMe = String(user._id) === String(myuserid);
    return {
      _id: user._id,
      username: user.username || "",
      firstname: user.profile?.firstname || "",
      lastname: user.profile?.lastname || "",
      avatar: user.profile?.avatar || "",
      followedAt: f.createdAt,
      relationship_status: {
        following: followingSet.has(String(user._id)),
        isMe,
      },
    };
  });

  return {
    followings: formattedList,
    hasMore: page * limit < totalFollowing,
  };
};

/**
 * Lấy relationship statuses giữa currentUser và danh sách userIds
 */
const getRelationshipStatuses = async (currentUserId, userIds) => {
  const relationships = await Relationship.find({
    $or: [
      { from: currentUserId, to: { $in: userIds }, type: "follow" },
      { from: { $in: userIds }, to: currentUserId, type: "follow" },
    ],
  }).lean();

  const statusMap = {};

  userIds.forEach((uid) => {
    const isFollowing = relationships.some(
      (r) =>
        r.from.toString() === currentUserId.toString() &&
        r.to.toString() === uid
    );
    const isFollower = relationships.some(
      (r) =>
        r.from.toString() === uid &&
        r.to.toString() === currentUserId.toString()
    );

    statusMap[uid] = {
      following: isFollowing,
      //   incoming_request: false,  // nếu có logic request thì xử lý thêm
      //   is_bestie: false,         // để false mặc định, sau này mở rộng
      //   is_private: false,
      //   is_restricted: false,
      follower: isFollower,
    };
  });

  return {
    relationship_status: statusMap,
  };
};

const followUser = async (currentUserId, userIdToFollow) => {
  // Kiểm tra nếu đã follow rồi thì không làm gì
  const existingFollow = await Relationship.findOne({
    from: currentUserId,
    to: userIdToFollow,
    type: "follow",
  });

  if (existingFollow) {
    return { message: "Đã follow người này" };
  }

  // Tạo mới document follow
  const newFollow = new Relationship({
    from: currentUserId,
    to: userIdToFollow,
    type: "follow",
  });

  await newFollow.save();

  return { message: "Follow thành công" };
};

const unfollowUser = async (currentUserId, userIdToUnfollow) => {
  // Xoá document follow nếu tồn tại
  const result = await Relationship.findOneAndDelete({
    from: currentUserId,
    to: userIdToUnfollow,
    type: "follow",
  });
  if (result) {
    return { message: "Unfollow thành công" };
  } else {
    return { message: "Chưa follow người này" };
  }
};

const removeFollower = async (currentUserId, userIdToRemove) => {
  // Xoá document follow nếu tồn tại
  const result = await Relationship.findOneAndDelete({
    from: userIdToRemove,
    to: currentUserId,
    type: "follow",
  });
  if (result) {
    return { message: "Xóa follower thành công" };
  } else {
    return { message: "Người này không phải follower của bạn" };
  }
};
module.exports = {
  getFollowers,
  getFollowings,
  getRelationshipStatuses,
  followUser,
  unfollowUser,
  removeFollower,
};
