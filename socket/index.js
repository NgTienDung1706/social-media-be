import { Server } from "socket.io";
import http from "http";
import express from "express";
import { socketAuthMiddleware } from "../middleware/socketMiddleware.js";
import { getUserConversationsForSocketIOController } from "../controllers/conversationController.js";

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    // methods: ["GET", "POST"],
    credentials: true,
  },
});

io.use(socketAuthMiddleware);

const onlineUsers = new Map(); // {userId: socketId}

io.on("connection", async (socket) => {
  const user = socket.user;
  console.log(`${user.username} online với socket ${socket.id}`);

  onlineUsers.set(user._id, socket.id);

  io.emit("online-users", Array.from(onlineUsers.keys()));

  const conversattionIds = await getUserConversationsForSocketIOController(
    user._id
  );
  conversattionIds.forEach((conversationId) => {
    socket.join(conversationId);
  });

  socket.on("disconnect", () => {
    onlineUsers.delete(user._id);
    io.emit("online-users", Array.from(onlineUsers.keys()));
    console.log("User disconnected socket:", socket.id);
  });
});

// Middleware attach io (sau khi tạo io)
app.use((req, res, next) => {
  req.io = io;
  next();
});

export { io, app, server };
