const mongoose = require("mongoose");

const postSchema = new mongoose.Schema(
    {
        content: {
            caption: { type: String, required: true },
            hashtags: [{ type: String }],
            pictures: [{ type: String, required: true }],
        },
        author: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        isStory: { type: Boolean, default: false },
        location: { type: String },
        reactions: {
            love: [{
              type: mongoose.Schema.Types.ObjectId,
              ref: 'User',
              default: []
            }],
            // Thêm các loại cảm xúc khác nếu muốn
          },
    },
    { timestamps: true } // Thêm timestamps để có createdAt và updatedAt tự động
);

module.exports = mongoose.model("Post", postSchema);
