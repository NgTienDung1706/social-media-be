require("dotenv").config();
const User = require("../models/userModel");
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
  const user = await User.findById(userId).select("-password");
  if (!user) {
    return {
      status: 404,
      data: { message: "Không tìm thấy người dùng" }
    };
  }

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

module.exports = {
    loginUser,
    getUserProfile,
    registerUser,
    verifyOTP
};
