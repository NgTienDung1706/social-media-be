const mongoose = require("mongoose")

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  isVerified: { type: Boolean, default: false },
  isVerifiedForgot: { type: Boolean, default: false }, // Đánh dấu đã xác thực OTP quên mật khẩu
  otp: { type: String, default: null },
  otpExpiresAt: { type: Date, default: null },
  profile: {
    lastname: { type: String, default: "" },
    firstname: { type: String, default: "" },
    gender: { type: String, default: "" }, // Giới tính
    birthday: { type: Date, default: null },  // Ngày sinh
    bio: { type: String, default: "" },
    avatar: { type: String, default: "" }, // Đường dẫn ảnh đại diện
  },

  // Danh sách bạn bè
  // friends: {
  //   follower: [{ type: mongoose.Schema.Types.ObjectId, ref: "User", default: [] }],
  //   following: [{ type: mongoose.Schema.Types.ObjectId, ref: "User", default: [] }],
  // },
  
  refreshToken: { type: String, default: null }, // Lưu refresh token để xác thực lại
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);
module.exports = User;

