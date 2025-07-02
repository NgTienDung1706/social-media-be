const userService = require("../services/userService");

const login = async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: "Vui lòng cung cấp username và password" });
    }

    try {
        const result = await userService.loginUser(username, password);
        return res.status(result.status).json(result.data);
    } catch (error) {
        console.error("Lỗi khi đăng nhập:", error);
        return res.status(500).json({ message: "Đã xảy ra lỗi, vui lòng thử lại sau" });
    }
};

module.exports = {
    login
};