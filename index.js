import express from "express";
import "dotenv/config";
import cors from "cors";
import cookieParser from "cookie-parser";
import initRoutes from "./routes/index.js";
import connectDB from "./config/mongodb.js";
import { app, server } from "./socket/index.js";

app.use(
  cors({
    origin: "http://localhost:5173", // FE chạy ở đây
    credentials: true, // Nếu bạn dùng cookie, jwt với header
  })
);
app.use(cookieParser());
app.use(express.json());

// Thêm middleware để attach io vào req
//app.use(attachIO(io));
initRoutes(app);

// Khởi tạo tất cả các socket
//initializeSockets(io);

const PORT = process.env.PORT || 3001;
connectDB().then(() => {
  server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
});
