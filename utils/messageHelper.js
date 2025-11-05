const updateConversationAfterCreateMessage = (
  conversation,
  message,
  senderId
) => {
  conversation.set({
    seenBy: [],
    lastMessageAt: message.createdAt,
    lastMessage: {
      _id: message._id,
      content: message.content,
      imgUrl: message.imgUrl,
      senderId,
      createdAt: message.createdAt,
    },
  });

  conversation.participants.forEach((p) => {
    const memberId = p.userId.toString();
    const isSender = memberId === senderId.toString();
    const prevCount = conversation.unreadCount.get(memberId) || 0;
    conversation.unreadCount.set(memberId, isSender ? 0 : prevCount + 1);
  });
};

module.exports = { updateConversationAfterCreateMessage };
