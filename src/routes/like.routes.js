import express from "express";
import { prisma } from "../utils/index.js";
import { Prisma } from "@prisma/client";
import authMiddleware from "../middleware/auth.middleware.js";
import { handleLike } from "../utils/handleLike.js";

const router = express.Router();

router.post("/posts/:postId/like", authMiddleware, async (req, res, next) => {
  const { postId } = req.params;
  const { userId } = req.user;
  const result = await handleLike(prisma, "post", postId, userId);
  return res.status(result.status).json({ message: result.message });
});

router.post(
  "/comments/:commentId/like",
  authMiddleware,
  async (req, res, next) => {
    const { commentId } = req.params;
    const { userId } = req.user;
    const result = await handleLike(prisma, "comment", commentId, userId);
    return res.status(result.status).json({ message: result.message });
  }
);

router.post("/reply/:replyId/like", authMiddleware, async (req, res, next) => {
  const { replyId } = req.params;
  const { userId } = req.user;
  const result = await handleLike(prisma, "reply", replyId, userId);
  return res.status(result.status).json({ message: result.message });
});

export default router;
