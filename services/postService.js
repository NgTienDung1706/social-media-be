const Post = require('../models/postModel');
const User = require('../models/userModel');
const Comment = require('../models/commentModel');

// Lấy danh sách bài viết theo userId, trả về dữ liệu phù hợp cho FE
const getPostsByUser = async (userId) => {
  // Lấy bài viết, populate author
  const posts = await Post.find({ author: userId })
    .sort({ createdAt: -1 })
    .populate({
      path: 'author',
      select: 'username profile.avatar profile.firstname profile.lastname',
    })
    .lean();

  // Lấy tất cả postId
  const postIds = posts.map(p => p._id);

  // Lấy tổng số comment cho từng post
  const commentCounts = await Comment.aggregate([
    { $match: { postId: { $in: postIds }, isDeleted: false } },
    { $group: { _id: "$postId", count: { $sum: 1 } } }
  ]);
  const commentCountMap = {};
  commentCounts.forEach(c => { commentCountMap[c._id] = c.count; });

  // Trả về dữ liệu phù hợp cho layout FE
  return posts.map(post => {
    // Lấy avatar, username, time, ...
    const author = post.author || {};
    return {
      _id: post._id,
      avatar: author.profile?.avatar || '',
      username: author.username || '',
      time: post.createdAt,
      caption: post.content.caption,
      hashtags: post.content.hashtags,
      imgList: post.content.pictures,
      createdAt: post.createdAt,
      reactions: post.reactions,
      likes: post.reactions?.love?.length || 0,
      commentCount: commentCountMap[post._id] || 0,
    };
  });
};
const getUserPostsByUsername = async (username) => {
  // Tìm user theo username
  const user = await User.findOne({ username }).select('_id').lean();
  if (!user) {
    throw new Error('User not found');
  }
  // Lấy bài viết của user
  const posts = await Post.find({ author: user._id })
    .sort({ createdAt: -1 })
    .populate({
      path: 'author',
      select: 'username profile.avatar profile.firstname profile.lastname',
    })
    .lean();
  // Lấy tất cả postId
  const postIds = posts.map(p => p._id);
  // Lấy tổng số comment cho từng post
  const commentCounts = await Comment.aggregate([
    { $match: { postId: { $in: postIds }, isDeleted: false } },
    { $group: { _id: "$postId", count: { $sum: 1 } } }
  ]);
  const commentCountMap = {};
  commentCounts.forEach(c => { commentCountMap[c._id] = c.count; });
  // Trả về dữ liệu phù hợp cho layout FE
  return posts.map(post => {
    // Lấy avatar, username, time, ...
    const author = post.author || {};
    return {
      _id: post._id,
      avatar: author.profile?.avatar || '',
      username: author.username || '',
      time: post.createdAt,
      caption: post.content.caption,
      hashtags: post.content.hashtags,
      imgList: post.content.pictures,
      createdAt: post.createdAt,
      reactions: post.reactions,
      likes: post.reactions?.love?.length || 0,
      commentCount: commentCountMap[post._id] || 0,
    };
  });
}


module.exports = {
  getPostsByUser,
  getUserPostsByUsername
};