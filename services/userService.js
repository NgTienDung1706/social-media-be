require("dotenv").config();
const User = require("../models/userModel");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

//📌 Hàm tạo JWT
const generateToken = (userId) => {
    return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN || "7d",
    });
};

// 📌 Xử lý logic đăng nhập
const loginUser = async (username, password) => {
    const user = await User.findOne({ username });

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

module.exports = {
    loginUser
};
