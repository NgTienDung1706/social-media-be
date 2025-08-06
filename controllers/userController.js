const userService = require("../services/userService");
const User = require('../models/userModel');
const { tokenize } = require("../utils/searchHelper");


// Lấy profile user theo username
const getUserProfileByUsername = async (req, res) => {
  try {
    const username = req.params.username;
    const result = await userService.getUserProfileByUsername(username);
    return res.status(result.status).json(result.data);
  } catch (error) {
    return res.status(500).json({ message: "Lỗi server" });
  }
};

const login = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: "Vui lòng cung cấp email và password" });
    }

    try {
        const result = await userService.loginUser(email, password);
        return res.status(result.status).json(result.data);
    } catch (error) {
        console.error("Lỗi khi đăng nhập:", error);
        return res.status(500).json({ message: "Đã xảy ra lỗi, vui lòng thử lại sau" });
    }
};


const getProfile = async (req, res) => {
  try {
    const result = await userService.getUserProfile(req.user.id);
    return res.status(result.status).json(result.data);
  } catch (error) {
    console.error("Lỗi khi lấy profile:", error);
    return res.status(500).json({ message: "Lỗi server" });
  }
}


// 📌 Đăng ký người dùng
const register = async (req, res) => {
    try {
        const result = await userService.registerUser(req.body);
        return res.status(result.status).json(result.data);
    } catch (error) {
        console.error("Lỗi đăng ký:", error);
        return res.status(500).json({ message: "Đã xảy ra lỗi, vui lòng thử lại." });
    }
};


// 📌 Xác thực OTP
const verifyOTP = async (req, res) => {
    const { email, otp } = req.body;
    if (!email || !otp) {
        return res.status(400).json({ message: "Vui lòng cung cấp email và mã OTP" });
    }
    try {
        const result = await userService.verifyOTP(email, otp);
        return res.status(result.status).json(result.data);
    } catch (error) {
        console.error("Lỗi xác thực OTP:", error);
        return res.status(500).json({ message: "Đã xảy ra lỗi, vui lòng thử lại." });
    }
};

// 📌 Quên mật khẩu
const forgotPassword = async (req, res) => {
    const { email } = req.body;
    if (!email) {
        return res.status(400).json({ message: "Vui lòng nhập email" });
    }
    try {
        const result = await userService.forgotPassword(email);
        return res.status(result.status).json(result.data);
    } catch (error) {
        console.error("Lỗi quên mật khẩu:", error);
        return res.status(500).json({ message: "Đã xảy ra lỗi, vui lòng thử lại." });
    }
};

// 📌 Xác thực OTP quên mật khẩu
const forgotPasswordOTP = async (req, res) => {
    const { email, otp } = req.body;
    if (!email || !otp) {
        return res.status(400).json({ message: "Vui lòng cung cấp email và mã OTP" });
    }
    try {
        const result = await userService.forgotPasswordOTP(email, otp);
        return res.status(result.status).json(result.data);
    } catch (error) {
        console.error("Lỗi xác thực OTP quên mật khẩu:", error);
        return res.status(500).json({ message: "Đã xảy ra lỗi, vui lòng thử lại." });
    }
};

// 📌 Đặt lại mật khẩu
const resetPassword = async (req, res) => {
    const { email, newPassword } = req.body;
    if (!email || !newPassword) {
        return res.status(400).json({ message: "Vui lòng nhập email và mật khẩu mới" });
    }
    try {
        const result = await userService.resetPassword(email, newPassword);
        return res.status(result.status).json(result.data);
    } catch (error) {
        console.error("Lỗi đặt lại mật khẩu:", error);
        return res.status(500).json({ message: "Đã xảy ra lỗi, vui lòng thử lại." });
    }
};

const updateProfile = async (req, res) => {
  try {
    const result = await userService.updateUserProfile(req.user, req.body, req.file);
    return res.status(result.status).json(result.data);
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Cập nhật thất bại', error: err.message });
  }
};

const searchUsers = async (req, res) => {
  const { query } = req.query;
    if (!query) {
        return res.status(400).json({ message: "Vui lòng cung cấp từ khóa tìm kiếm" });
    }

    try {
        const userId = req.user.id;
        const result = await userService.searchUsers(query, userId);
        return res.status(result.status).json(result.data);
    } catch (error) {
        console.error("Lỗi tìm kiếm người dùng:", error);
        return res.status(500).json({ message: "Đã xảy ra lỗi, vui lòng thử lại." });
    }
}



module.exports = {
    login,
    getProfile,
    register,
    verifyOTP,
    forgotPassword,
    forgotPasswordOTP,
    resetPassword,
    updateProfile,
    searchUsers,
    getUserProfileByUsername
};