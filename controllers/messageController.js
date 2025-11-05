const messageService = require("../services/messageService");

const sendDirectMessage = async (req, res) => {
  try {
    const { recipientId, content, imgUrl, conversationId } = req.body;
    const senderId = req.user.id;

    const message = await messageService.sendDirectMessage(
      recipientId,
      content,
      imgUrl,
      conversationId,
      senderId
    );

    return res.status(201).json({ message });
  } catch (error) {
    console.error("Lỗi xảy ra khi gửi tin nhắn trực tiếp:", error);
    return res
      .status(500)
      .json({ error: "Lỗi máy chủ, vui lòng thử lại sau." });
  }
};

const sendGroupMessage = async (req, res) => {};

module.exports = { sendDirectMessage, sendGroupMessage };
