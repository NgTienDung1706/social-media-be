const postService = require('../services/postService');

// Lấy danh sách bài viết của user hiện tại
const getMyPosts = async (req, res) => {
  try {
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;
    const posts = await postService.getPostsByUser(userId, page, limit);
    res.json(posts);
  } catch (err) {
    res.status(500).json({ message: 'Lỗi server khi lấy bài viết', error: err.message });
  }
};

// Lấy danh sách bài viết của user theo username
const getUserPostsByUsername = async (req, res) => {
  try {
    const username = req.params.username;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;
    const posts = await postService.getUserPostsByUsername(username, page, limit);
    res.json(posts);
  } catch (err) {
    res.status(500).json({ message: 'Lỗi server khi lấy bài viết', error: err.message });
  }
}


module.exports = {
  getMyPosts,
  getUserPostsByUsername,
}
