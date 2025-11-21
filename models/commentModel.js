import mongoose from "mongoose";

// Định nghĩa schema cho comment
const commentSchema = new mongoose.Schema(
  {
    postId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Post", // Liên kết với model Post
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // Liên kết với model User
      required: true,
    },
    content: {
      type: String,
      required: true,
      minlength: 1, // Đảm bảo rằng comment không rỗng
      maxlength: 5000, // Giới hạn độ dài bình luận
    },
    parent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Comment", // Liên kết với comment cha nếu là reply
      default: null,
    },
    love: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User", // Liên kết với model User để lưu danh sách những người thích
      },
    ],
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
); // Tự động thêm createdAt và updatedAt

// Tạo model từ schema
const Comment = mongoose.model("Comment", commentSchema);

export default Comment;
