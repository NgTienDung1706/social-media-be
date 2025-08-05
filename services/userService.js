require("dotenv").config();
const User = require("../models/userModel");
const Post = require('../models/postModel');
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { sendMail } = require("../utils/mail");
// 📌 Xử lý logic đăng ký
const registerUser = async (body) => {
    const {
        username ,
        firstName ,
        lastName ,
        birthDate,
        gender ,
        email ,
        password
    } = body;

    console.log("Body: ", body);

    // Kiểm tra dữ liệu đầu vào
    if (!username || !email || !password) {
        return {
            status: 400,
            data: { message: "Vui lòng cung cấp đầy đủ thông tin" }
        };
    }

    // Kiểm tra username hoặc email đã tồn tại
    const existingUser = await User.findOne({ $or: [{ username }, { email }] });
    if (existingUser) {
        return {
            status: 400,
            data: { message: "Username hoặc email đã tồn tại" }
        };
    }

    // Tạo OTP và mã hóa mật khẩu
    const otp = crypto.randomInt(100000, 999999).toString();
    const hashedPassword = await bcrypt.hash(password, 10);

    // Tạo user mới với đầy đủ thông tin
    const newUser = new User({
        username,
        email,
        password: hashedPassword,
        otp,
        otpExpiresAt: new Date(Date.now() + 10 * 60 * 1000),
        profile: {
            firstname: firstName,
            lastname: lastName,
            gender: gender || "",
            birthday: birthDate ? new Date(birthDate) : null,
            bio: "",
            avatar: ""
        },
        friends: {
            pending: [],
            accepted: [],
            blocked: []
        }
    });

    await newUser.save();
    await sendMail(email, "Xác minh tài khoản", `Mã OTP của bạn là: ${otp}`);

    return {
        status: 200,
        data: {
            message: "Đăng ký thành công. Vui lòng kiểm tra email để xác minh tài khoản.",
        }
    };
};

//📌 Hàm tạo JWT
const generateToken = (userId) => {
    return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN || "7d",
    });
};

// 📌 Xử lý logic đăng nhập
const loginUser = async (email, password) => {
    const user = await User.findOne({ email });

    if (!user || !(await bcrypt.compare(password, user.password))) {
        return {
            status: 401,
            data: { message: "Sai username hoặc password" }
        };
    }

    const token = generateToken(user._id);

    return {
        status: 200,
        data: {
            message: "Đăng nhập thành công",
            token,
            user: {
                _id: user._id,
                username: user.username,
                email: user.email,
                name: user.profile.name,
                avatar: user.profile.avatar,
            }
        }
    };
};

// 📌 Lấy thông tin người dùng theo ID
const getUserProfile = async (userId) => {
  const userDoc = await User.findById(userId).select("-password");
  if (!userDoc) {
    return {
      status: 404,
      data: { message: "Không tìm thấy người dùng" }
    };
  }

  const user = userDoc.toObject();

  // Lấy số lượng bài viết, follower, following

  const postCount = await Post.countDocuments({ author: user._id });
  // followerCount: số người theo dõi user này
  const followerCount = Array.isArray(user.friends.follower) ? user.friends.follower.length : (user.friends.follower ? user.friends.follower : 0);
  // followingCount: số người user này đang theo dõi
  const followingCount = Array.isArray(user.friends.following) ? user.friends.following.length : (user.friends.following ? user.friends.following : 0);

  // Gắn trực tiếp vào user
  user.postCount = postCount;
  user.followerCount = followerCount;
  user.followingCount = followingCount;

  return {
    status: 200,
    data: {
      message: "Lấy thông tin người dùng thành công",
      user
    }
  };
};

// 📌 Xác thực OTP
const verifyOTP = async (email, otp) => {
    if (!email || !otp) {
        return {
            status: 400,
            data: { message: "Vui lòng cung cấp email và mã OTP" }
        };
    }
    const user = await User.findOne({ email });
    if (!user) {
        return {
            status: 404,
            data: { message: "Không tìm thấy người dùng" }
        };
    }
    if (user.isVerified) {
        return {
            status: 400,
            data: { message: "Tài khoản đã được xác thực" }
        };
    }
    if (user.otp !== otp) {
        return {
            status: 400,
            data: { message: "Mã OTP không đúng" }
        };
    }
    if (!user.otpExpiresAt || user.otpExpiresAt < new Date()) {
        return {
            status: 400,
            data: { message: "Mã OTP đã hết hạn" }
        };
    }
    user.isVerified = true;
    user.otp = null;
    user.otpExpiresAt = null;
    await user.save();
    return {
        status: 200,
        data: { message: "Xác thực OTP thành công" }
    };
};

// 📌 Quên mật khẩu
const forgotPassword = async (email) => {
    if (!email) {
        return {
            status: 400,
            data: { message: "Vui lòng nhập email" }
        };
    }
    const user = await User.findOne({ email });
    if (!user) {
        return {
            status: 404,
            data: { message: "Không tìm thấy người dùng" }
        };
    }
    // Tạo OTP mới cho quên mật khẩu
    const otp = crypto.randomInt(100000, 999999).toString();
    user.otp = otp;
    user.otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();
    await sendMail(email, "Quên mật khẩu", `Mã OTP đặt lại mật khẩu của bạn là: ${otp}`);
    return {
        status: 200,
        data: { message: "Mã OTP đã được gửi tới email của bạn." }
    };
};

// 📌 Xác thực OTP quên mật khẩu
const forgotPasswordOTP = async (email, otp) => {
    if (!email || !otp) {
        return {
            status: 400,
            data: { message: "Vui lòng cung cấp email và mã OTP" }
        };
    }
    const user = await User.findOne({ email });
    if (!user) {
        return {
            status: 404,
            data: { message: "Không tìm thấy người dùng" }
        };
    }
    if (user.otp !== otp) {
        return {
            status: 400,
            data: { message: "Mã OTP không đúng" }
        };
    }
    if (!user.otpExpiresAt || user.otpExpiresAt < new Date()) {
        return {
            status: 400,
            data: { message: "Mã OTP đã hết hạn" }
        };
    }
    // Đánh dấu đã xác thực OTP cho quên mật khẩu
    user.isVerifiedForgot = true;
    await user.save();
    return {
        status: 200,
        data: { message: "Xác thực OTP thành công. Bạn có thể đặt lại mật khẩu mới." }
    };
};

// 📌 Đặt lại mật khẩu
const resetPassword = async (email, newPassword) => {
    if (!email || !newPassword) {
        return {
            status: 400,
            data: { message: "Vui lòng nhập email và mật khẩu mới" }
        };
    }
    const user = await User.findOne({ email });
    if (!user) {
        return {
            status: 404,
            data: { message: "Không tìm thấy người dùng" }
        };
    }
    // Kiểm tra đã xác thực OTP quên mật khẩu chưa
    if (!user.isVerifiedForgot) {
        return {
            status: 400,
            data: { message: "Bạn chưa xác thực OTP quên mật khẩu" }
        };
    }
    user.password = await bcrypt.hash(newPassword, 10);
    user.isVerifiedForgot = false;
    user.otp = null;
    user.otpExpiresAt = null;
    await user.save();
    return {
        status: 200,
        data: { message: "Đổi mật khẩu thành công." }
    };
};


// 📌 Cập nhật thông tin profile người dùng
const updateUserProfile = async (user, body, file) => {
    try {
        const { username, lastname, firstname, birthday, bio } = body;
        // Đảm bảo user.profile tồn tại

        // Chỉ cập nhật avatar nếu có file mới, nếu không thì không gửi trường avatar vào update
        const updateFields = {
            username,
            'profile.lastname': lastname,
            'profile.firstname': firstname,
            'profile.birthday': birthday,
            'profile.bio': bio,
        };
        if (file && file.path) {
            updateFields['profile.avatar'] = file.path;
        }

        await User.findByIdAndUpdate(
            user.id,
            updateFields,
            { new: true }
        );

        // Lấy lại user mới nhất sau khi cập nhật
        const updatedUser = await User.findById(user._id).select('-password');

        return {
            status: 200,
            data: {
                success: true,
                message: 'Cập nhật thông tin cá nhân thành công!',
                user: updatedUser
            }
        };
    } catch (err) {
        return {
            status: 500,
            data: { success: false, message: 'Cập nhật thất bại', error: err.message }
        };
    }
};

module.exports = {
    loginUser,
    getUserProfile,
    registerUser,
    verifyOTP,
    forgotPassword,
    forgotPasswordOTP,
    resetPassword,
    updateUserProfile
};
