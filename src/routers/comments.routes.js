import express from "express";
import { prisma } from "../utils/index.js";
import "dotenv/config";

const router = express.Router();

router.post("/comments/:postId", async (req, res, next) => {
  try {
    const { userId } = req.user;
    const { postId } = req.params;
    const { content } = req.body;
    if (!content) {
      return res
        .status(400)
        .json({
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
    return res
      .status(201)
      .json({ success: true, message: "댓글이 성공적으로 작성되었습니다." });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, message: "댓글 작성 중 오류가 발생했습니다" });
  }
});

router.post("/comments/:postId", async (req, res, next) => {
  const { userId } = req.user;
  const { postId } = req.params;
  const { content } = req.body;
  if (!content) {
    return res
      .status(400)
      .json({ success: false, message: "댓글 내용은 반드시 작성해야 합니다." });
  }
  const comment = await prisma.comment.create({
    data: {
      userId,
      postId,
      content,
    },
  });
  return res
    .status(201)
    .json({ success: true, message: "댓글이 성공적으로 작성되었습니다." });
});

export default router;
