import Conversation from "../models/conversationModel.js";
import Message from "../models/messageModel.js";

export const createConversation = async (userId, type, name, memberIds) => {
  try {
    if (
      !type ||
      (type === "group" && !name) ||
      !memberIds ||
      !Array.isArray(memberIds) ||
      memberIds.length === 0
    ) {
      throw new Error("Tên nhóm và danh sách thành viên là bắt buộc");
    }

    let conversation;

    if (type === "direct") {
      const participantId = memberIds[0];
      conversation = await Conversation.findOne({
        type: "direct",
        "participants.userId": { $all: [userId, participantId] },
      });

      if (!conversation) {
        conversation = new Conversation({
          type: "direct",
          participants: [{ userId: userId }, { userId: participantId }],
          lastMessageAt: new Date(),
        });
        await conversation.save();
      }
    }

    if (type === "group") {
      conversation = new Conversation({
        type: "group",
        participants: [{ userId }, ...memberIds.map((id) => ({ userId: id }))],
        group: {
          name,
          createdBy: userId,
        },
        lastMessageAt: new Date(),
      });
      await conversation.save();
    }

    if (!conversation) {
      throw new Error("Loại cuộc trò chuyện không hợp lệ");
    }

    await conversation.populate([
      { path: "participants.userId", select: "displayName avatarUrl" },
      {
        path: "seenBy",
        select: "displayName avatarUrl",
      },
      { path: "lastMessage.senderId", select: "displayName avatarUrl" },
    ]);

    return conversation;
  } catch (error) {
    throw error;
  }
};

export const getConversations = async (userId) => {
  try {
    const conversations = await Conversation.find({
      "participants.userId": userId,
    })
      .sort({ lastMessageAt: -1, updatedAt: -1 })
      .populate({
        path: "participants.userId",
        select: "profile.lastname profile.firstname profile.avatar username",
      })
      .populate({
        path: "lastMessage.senderId",
        select: "profile.lastname profile.firstname profile.avatar username",
      })
      .populate({
        path: "seenBy",
        select: "profile.lastname profile.firstname profile.avatar username",
      });

    const formattedConversations = conversations.map((convo) => {
      const participants = (convo.participants || []).map((p) => ({
        _id: p.userId?._id,
        fullname: `${p.userId?.profile?.lastname || ""} ${
          p.userId?.profile?.firstname || ""
        }`.trim(),
        username: p.userId?.username || "",
        avatar: p.userId?.profile?.avatar || "",
        joinedAt: p.joinedAt,
      }));

      return {
        ...convo.toObject(),
        participants,
        unreadCount: convo.unreadCount || {},
      };
    });

    return formattedConversations;
  } catch (error) {
    throw error;
  }
};

export const getMessages = async (conversationId, limit, cursor) => {
  try {
    const query = { conversationId };
    if (cursor) {
      query.createdAt = { $lt: new Date(cursor) };
    }

    let messages = await Message.find(query)
      .sort({ createdAt: -1 })
      .limit(Number(limit) + 1);

    let nextCursor = null;

    if (messages.length > Number(limit)) {
      const nextMessage = messages[messages.length - 1];
      nextCursor = nextMessage.createdAt.toISOString();
      messages = messages.pop();
    }
    messages = messages.reverse();

    return {
      messages,
      nextCursor,
    };
  } catch (error) {
    throw error;
  }
};

export const getUserConversationsForSocketIO = async (userId) => {
  try {
    const conversations = await Conversation.find({
      "participants.userId": userId,
    }).select("_id");

    return conversations.map((convo) => convo._id.toString());
  } catch (error) {
    throw error;
  }
};
