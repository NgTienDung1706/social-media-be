import Conversation from "../models/conversationModel.js";
import Message from "../models/messageModel.js";
import cloudinary from "../config/cloudinary.js";
import {
  updateConversationAfterCreateMessage,
  emitNewMessage,
} from "../utils/messageHelper.js";
import { io } from "../socket/index.js";

export const sendDirectMessage = async (
  recipientId,
  content,
  images,
  conversationId,
  senderId
) => {
  let conversation = null;

  if (!content && (!images || images.length === 0)) {
    return res
      .status(400)
      .json({ message: "Nội dung tin nhắn không được để trống" });
  }

  if (conversationId) {
    conversation = await Conversation.findById(conversationId);
  }

  if (!conversation) {
    // Tạo cuộc trò chuyện mới nếu không có conversationId hoặc không tìm thấy cuộc trò chuyện
    conversation = await Conversation.create({
      type: "direct",
      participants: [
        { userId: senderId, joinedAt: new Date() },
        { userId: recipientId, joinedAt: new Date() },
      ],
      lastMessageAt: new Date(),
      unreadCount: new Map(),
    });
  }

  const message = await Message.create({
    conversationId: conversation._id,
    senderId,
    content,
    images,
  });

  updateConversationAfterCreateMessage(conversation, message, senderId);

  await conversation.save();

  emitNewMessage(io, conversation, message);

  return message;
};

export const sendGroupMessage = async (
  conversationId,
  content,
  images,
  senderId,
  conversation
) => {
  try {
    if (!content && (!images || images.length === 0)) {
      return res.status(400).json("Thiếu nội dung");
    }
    const message = await Message.create({
      conversationId,
      senderId,
      content,
      images,
    });
    updateConversationAfterCreateMessage(conversation, message, senderId);
    await conversation.save();
    emitNewMessage(io, conversation, message);
    return message;
  } catch (error) {
    throw new Error("Lỗi khi gửi tin nhắn nhóm: " + error.message);
  }
};

export const uploadSignatureMessage = async () => {
  try {
    const timestamp = Math.floor(Date.now() / 1000);
    const signature = cloudinary.utils.api_sign_request(
      { timestamp: timestamp, folder: "messages" },
      process.env.CLOUDINARY_API_SECRET
    );

    return {
      signature,
      timestamp,
      cloudname: process.env.CLOUDINARY_CLOUD_NAME,
      apikey: process.env.CLOUDINARY_API_KEY,
    };
  } catch (err) {
    throw new Error("Error generating upload signature: " + err.message);
  }
};
