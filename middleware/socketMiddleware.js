import jwt from "jsonwebtoken";
import "dotenv/config";
import User from "../models/userModel.js";

export const socketAuthMiddleware = async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error("Unauthorized - Token không tồn tại"));
    }

    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    if (!decoded) {
      return next(
        new Error("Unauthorized - Token không hợp lệ hoặc đã hết hạn")
      );
    }

    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      return next(new Error("User không tồn tại"));
    }

    socket.user = user;
    next();
  } catch (error) {
    console.error("Lỗi xác thực socket:", error);
    return next(new Error("Unauthorized - Lỗi xác thực"));
  }
};
