import express from "express";
import { prisma } from "../utils/index.js";
import "dotenv/config";
import authMiddleware from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/reply/:commentId", authMiddleware, async (req, res, next) => {
  try {
    const { userId } = req.user;
    const { commentId } = req.params;
    const { content } = req.body;
    if (!content) {
      return res.status(400).json({
        success: false,
        message: "답글 내용은 반드시 작성해야 합니다.",
      });
    }
    const reply = await prisma.reply.create({
      data: {
        commentId: Number(commentId),
        content,
        userId,
      },
    });
    return res
      .status(201)
      .json({ success: true, message: "답글이 성공적으로 작성되었습니다." });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

export default router;
