const mongoose = require("mongoose");

const postSchema = new mongoose.Schema(
  {
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    content: {
      caption: { type: String, trim: true },
      hashtags: { type: [String], default: [] }, // mặc định mảng rỗng
      media: {
        type: [
          {
            url: { type: String, required: true },
            type: { type: String, enum: ["image", "video"], required: true },
            public_id: { type: String, required: true }, // để xóa trên Cloudinary
            _id: false, // không cần _id riêng cho mỗi media
          },
        ],
        default: [], // mặc định mảng rỗng
      },
    },
    emotion: {
      label: { type: String, default: null }, // "hạnh phúc"
      key: { type: String, default: null }, // "happy"
      icon: { type: String, default: null }, // "😊"
    },
    tagged_users: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
      default: [], // mặc định mảng rỗng
    },
    location: { type: String, default: "" }, // mặc định chuỗi rỗng
    reactions: {
      love: {
        type: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
        default: [],
      },
    },
    isStory: { type: Boolean, default: false },
    visibility: {
      type: String,
      enum: ["public", "friends", "private"],
      default: "public",
    },
  },
  { timestamps: true }
);

const Post = mongoose.model("Post", postSchema);

module.exports = Post;
