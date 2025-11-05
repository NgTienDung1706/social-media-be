const Conversation = require("../models/conversationModel");
const Message = require("../models/messageModel");
const {
  updateConversationAfterCreateMessage,
} = require("../utils/messageHelper");

const sendDirectMessage = async (
  recipientId,
  content,
  imgUrl,
  conversationId,
  senderId
) => {
  let conversation = null;

  if (!content && !imgUrl) {
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
    imgUrl,
  });

  updateConversationAfterCreateMessage(conversation, message, senderId);

  await conversation.save();

  return message;
};

module.exports = { sendDirectMessage };
