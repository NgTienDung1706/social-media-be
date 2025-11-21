import Post from "../models/postModel.js";
import User from "../models/userModel.js";
import Comment from "../models/commentModel.js";
import cloudinary from "../config/cloudinary.js";

// Lấy danh sách bài viết theo userId, trả về dữ liệu phù hợp cho FE
const getPostsByUser = async (userId, page, limit) => {
  // Lấy bài viết, populate author
  const posts = await Post.find({ author: userId })
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .populate({
      path: "author",
      select: "username profile.avatar profile.firstname profile.lastname",
    })
    .populate({
      path: "tagged_users",
      select: "username profile.avatar profile.firstname profile.lastname",
    })
    .lean();

  // Lấy tổng số post để tính hasMore
  const totalPosts = await Post.countDocuments({ author: userId });
  // Lấy tất cả postId
  const postIds = posts.map((p) => p._id);

  // Lấy tổng số comment cho từng post
  const commentCounts = await Comment.aggregate([
    { $match: { postId: { $in: postIds }, isDeleted: false } },
    { $group: { _id: "$postId", count: { $sum: 1 } } },
  ]);
  const commentCountMap = {};
  commentCounts.forEach((c) => {
    commentCountMap[c._id] = c.count;
  });

  // Format dữ liệu cho FE
  const formattedPosts = posts.map((post) => {
    const author = post.author || {};

    // Xác định media: mảng url (cho ảnh) hoặc chuỗi url (cho video)
    let media;
    const mediaItems = post.content.media || [];
    if (mediaItems.length > 0) {
      const isVideo = mediaItems[0].type === "video";
      if (isVideo) {
        // Nếu là video, trả về url của video duy nhất
        media = mediaItems[0].url;
      } else {
        // Nếu là ảnh, trả về mảng các url
        media = mediaItems.map((item) => item.url);
      }
    } else {
      media = [];
    }

    return {
      _id: post._id,
      avatar: author.profile?.avatar || "",
      username: author.username || "",
      time: post.createdAt,
      caption: post.content.caption || "",
      hashtags: post.content.hashtags || [],
      media,
      emotion: post.emotion || {},
      tagged_users:
        post.tagged_users.map((user) => ({
          _id: user._id,
          username: user.username || "",
          avatar: user.profile?.avatar || "",
          fullname: `${user.profile?.firstname || ""} ${
            user.profile?.lastname || ""
          }`.trim(),
        })) || [],
      //imgList: post.content.pictures,
      createdAt: post.createdAt,
      reactions: post.reactions || {},
      likes: post.reactions?.love?.length || 0,
      commentCount: commentCountMap[post._id] || 0,
      visibility: post.visibility || "public",
    };
  });

  // Trả về dữ liệu phù hợp cho layout FE
  return {
    posts: formattedPosts,
    hasMore: page * limit < totalPosts,
  };
};

// Lấy bài viết của user theo username với phân trang
// Trả về posts và hasMore
const getUserPostsByUsername = async (username, page, limit) => {
  // Tìm user theo username
  const user = await User.findOne({ username }).select("_id").lean();
  if (!user) {
    throw new Error("User not found");
  }

  // Lấy tổng số post để tính hasMore
  const totalPosts = await Post.countDocuments({ author: user._id });

  // Lấy bài viết của user theo phân trang
  const posts = await Post.find({ author: user._id })
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .populate({
      path: "author",
      select: "username profile.avatar profile.firstname profile.lastname",
    })
    .lean();

  // Lấy tất cả postId trong trang hiện tại
  const postIds = posts.map((p) => p._id);

  // Lấy tổng số comment cho từng post
  const commentCounts = await Comment.aggregate([
    { $match: { postId: { $in: postIds }, isDeleted: false } },
    { $group: { _id: "$postId", count: { $sum: 1 } } },
  ]);

  const commentCountMap = {};
  commentCounts.forEach((c) => {
    commentCountMap[c._id] = c.count;
  });

  // Format dữ liệu cho FE
  const formattedPosts = posts.map((post) => {
    const author = post.author || {};
    return {
      _id: post._id,
      avatar: author.profile?.avatar || "",
      username: author.username || "",
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

  return {
    posts: formattedPosts,
    hasMore: page * limit < totalPosts,
  };
};

const uploadSignature = async () => {
  try {
    const timestamp = Math.floor(Date.now() / 1000);
    const signature = cloudinary.utils.api_sign_request(
      { timestamp: timestamp, folder: "posts" },
      process.env.CLOUDINARY_API_SECRET
    );

    return {
      signature,
      timestamp,
      cloudname: process.env.CLOUDINARY_CLOUD_NAME,
      apikey: process.env.CLOUDINARY_API_KEY,
    };
  } catch (err) {
    throw new Error("Error generating upload signature: " + err.message);
  }
};

const createdPost = async (
  author, // ObjectId từ auth
  content, // { caption, hashtags, media }
  emotion, // { label, key, icon }
  tagged_users, // array usernames
  location,
  isStory,
  visibility
) => {
  try {
    // Validate
    if (!author || (!content.caption && content.media.length === 0)) {
      return res.status(400).json({ error: "Author and content are required" });
    }

    // Map username sang ObjectId cho tagged_users
    let taggedUserIds = [];
    if (tagged_users && tagged_users.length > 0) {
      taggedUserIds = await Promise.all(
        tagged_users.map(async (username) => {
          const user = await User.findOne({ username });
          if (!user) throw new Error(`User ${username} not found`);
          return user._id;
        })
      );
    }
    // Tạo bài viết mới
    const newPost = new Post({
      author,
      content: {
        caption: content.caption || "",
        hashtags: content.hashtags || [],
        media: content.media || [],
      },
      emotion: emotion || undefined,
      tagged_users: taggedUserIds,
      location: location || undefined,
      isStory: isStory || false,
      visibility: visibility || "public",
      reactions: { love: [] }, // Khởi tạo reactions
    });
    await newPost.save();
    return newPost;
  } catch (err) {
    throw new Error("Error creating post: " + err.message);
  }
};

export { getPostsByUser, getUserPostsByUsername, uploadSignature, createdPost };

// API xóa bài viết
// app.delete('/api/posts/:id', async (req, res) => {
//   try {
//     const postId = req.params.id;
//     const post = await Post.findById(postId);
//     if (!post) {
//       return res.status(404).json({ error: 'Post not found' });
//     }

//     // Xóa các file trên Cloudinary
//     const deletePromises = post.content.media.map(async (media) => {
//       if (media.public_id) {
//         await cloudinary.uploader.destroy(media.public_id);
//       }
//     });
//     await Promise.all(deletePromises);

//     // Xóa bài viết khỏi MongoDB
//     await Post.deleteOne({ _id: postId });

//     res.status(200).json({ message: 'Post deleted successfully' });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ error: 'Server error' });
//   }
// });

// const getUserPostsByUsername = async (username, page, limit) => {
//   // Tìm user theo username
//   const user = await User.findOne({ username }).select('_id').lean();
//   if (!user) {
//     throw new Error('User not found');
//   }
//   // Lấy bài viết của user
//   const posts = await Post.find({ author: user._id })
//     .sort({ createdAt: -1, _id: -1 })
//     .populate({
//       path: 'author',
//       select: 'username profile.avatar profile.firstname profile.lastname',
//     })
//     .lean();
//   // Lấy tất cả postId
//   const postIds = posts.map(p => p._id);
//   // Lấy tổng số comment cho từng post
//   const commentCounts = await Comment.aggregate([
//     { $match: { postId: { $in: postIds }, isDeleted: false } },
//     { $group: { _id: "$postId", count: { $sum: 1 } } }
//   ]);
//   const commentCountMap = {};
//   commentCounts.forEach(c => { commentCountMap[c._id] = c.count; });
//   // Trả về dữ liệu phù hợp cho layout FE
//   return posts.map(post => {
//     // Lấy avatar, username, time, ...
//     const author = post.author || {};
//     return {
//       _id: post._id,
//       avatar: author.profile?.avatar || '',
//       username: author.username || '',
//       time: post.createdAt,
//       caption: post.content.caption,
//       hashtags: post.content.hashtags,
//       imgList: post.content.pictures,
//       createdAt: post.createdAt,
//       reactions: post.reactions,
//       likes: post.reactions?.love?.length || 0,
//       commentCount: commentCountMap[post._id] || 0,
//     };
//   });
// }
