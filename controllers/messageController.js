import * as messageService from "../services/messageService.js";

const sendDirectMessage = async (req, res) => {
  try {
    const { recipientId, content, images, conversationId } = req.body;
    const senderId = req.user.id;

    const message = await messageService.sendDirectMessage(
      recipientId,
      content,
      images,
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

const sendGroupMessage = async (req, res) => {
  try {
    const { conversationId, content, images } = req.body;
    const senderId = req.user.id;
    const conversation = req.conversation;
    const message = await messageService.sendGroupMessage(
      conversationId,
      content,
      images,
      senderId,
      conversation
    );
    return res.status(201).json({ message });
  } catch (error) {
    console.error("Lỗi xảy ra khi gửi tin nhắn nhóm:", error);
    return res
      .status(500)
      .json({ error: "Lỗi máy chủ, vui lòng thử lại sau." });
  }
};

const uploadSignatureMessage = async (req, res) => {
  try {
    const signatureData = await messageService.uploadSignatureMessage();
    res.json(signatureData);
  } catch (err) {
    res.status(500).json({
      message: "Lỗi server khi lấy upload signature",
      error: err.message,
    });
  }
};

export { sendDirectMessage, sendGroupMessage, uploadSignatureMessage };
