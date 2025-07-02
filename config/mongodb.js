const mongoose = require("mongoose");
require("dotenv").config();

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI, {
            serverSelectionTimeoutMS: 5000, // Giảm timeout xuống 5 giây để bắt lỗi nhanh hơn
        });
        console.log("✅ Kết nối MongoDB thành công!");
    } catch (error) {
        console.error("❌ Lỗi kết nối MongoDB:", error.message);
        process.exit(1);
    }
};

module.exports = connectDB;
