import express from "express";
import { prisma } from "../utils/index.js";
import "dotenv/config";
import authMiddleware from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/comments/:postId", authMiddleware, async (req, res, next) => {
  try {
    const { userId } = req.user;
    const { postId } = req.params;
    const { content } = req.body;
    const findPost = await prisma.post.findFirst({
      where: { postId: Number(postId) },
    });
    if (!findPost) {
      return res.status(400).json({ message: "해당 게시물을 찾을 수 없습니다." });
    }
    if (!content) {
      return res.status(400).json({
        success: false,
        message: "댓글 내용은 반드시 작성해야 합니다.",
      });
    }

    const comment = await prisma.comment.create({
      data: {
        userId,
        postId: Number(postId),
        content,
      },
    });
    return res.status(201).json({ success: true, message: "댓글이 성공적으로 작성되었습니다." });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

router.delete("/comments/:commentId", async (req, res, next) => {
  const { commentId } = req.params;
  if (!contentId) {
    return res.status(400).json({ success: false, message: "댓글 내용은 반드시 작성해야 합니다." });
  }
  await prisma.comment.delete({
    where: {
      commentId: Number(commentId),
    },
  });
  return res.status(201).json({ success: true, message: "댓글이 성공적으로 작성되었습니다." });
});

router.patch("/comments/:commentId", async (req, res, next) => {
  try {
    const { commentId } = req.params;
    const { content } = req.body;
    if (!content) {
      return res.status(400).json({ success: false, message: "수정 내용을 반드시 적어야 합니다." });
    }
    const comment = await prisma.comment.findFirst({
      where: {
        commentId: +commentId,
      },
    });
    if (!comment) {
      return res.status(400).json({ success: false, message: "해당 댓글을 찾을 수 없습니다." });
    }
    await prisma.comment.update({
      where: {
        commentId: Number(commentId),
      },
      data: {
        content,
      },
    });
    return res.status(201).json({ success: true, message: "댓글이 성공적으로 수정되었습니다." });
  } catch (err) {
    return res.status(500).json({ success: false, message: "댓글 수정 중 오류가 발생했습니다" });
  }
});

export default router;
