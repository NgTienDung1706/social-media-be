import { get } from "mongoose";
import {
  createConversation,
  getConversations,
  getMessages,
  getUserConversationsForSocketIO,
  markConversationAsRead,
} from "../services/conversationService.js";

export const createConversationController = async (req, res) => {
  try {
    const { type, name, memberIds } = req.body;
    const userId = req.user.id;
    const conversation = await createConversation(
      userId,
      type,
      name,
      memberIds
    );
    res.status(201).json(conversation);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getConversationsController = async (req, res) => {
  try {
    const userId = req.user.id;
    const conversations = await getConversations(userId);
    res.status(200).json(conversations);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getMessagesController = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { limit = 50, cursor } = req.query;
    const messages = await getMessages(conversationId, limit, cursor);
    res.status(200).json(messages);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Lấy danh sách _id các cuộc trò chuyện của user cho Socket.IO
export const getUserConversationsForSocketIOController = async (userId) => {
  try {
    const conversations = await getUserConversationsForSocketIO(userId);
    return conversations;
  } catch (error) {
    throw new Error(
      "Lỗi khi lấy cuộc trò chuyện cho Socket.IO: " + error.message
    );
    return [];
  }
};

export const markConversationAsReadController = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user.id;

    const result = await markConversationAsRead(conversationId, userId);

    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
