const postService = require('../services/postService');

// Lấy danh sách bài viết của user hiện tại
exports.getMyPosts = async (req, res) => {
  try {
    const userId = req.user.id;
    const posts = await postService.getPostsByUser(userId);
    res.json({ posts });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi server khi lấy bài viết', error: err.message });
  }
};
