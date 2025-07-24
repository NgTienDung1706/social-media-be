const userService = require("../services/userService");


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

module.exports = {
    login,
    getProfile,
    register,
    verifyOTP
};