import express from "express";
import { prisma } from "../utils/index.js";
import { Prisma } from "@prisma/client";
import authMiddleware from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/posts/:postId/like", authMiddleware, async (req, res, next) => {
  const { postId } = req.params;
  const { userId } = req.user;
  const like = await prisma.like.findFirst({
    where: {
      userId: Number(userId),
      postId: Number(postId),
    },
  });
  if (!like) {
    // 해당 게시물에 유저가 좋아요를 누른 적이 없다면
    await prisma.like.create({
      data: {
        userId: Number(userId),
        postId: Number(postId),
      },
    });
    await prisma.post.update({
      where: {
        postId,
      },
      data: {
        like: {
          increment: 1,
        },
      },
    });
  } else {
    await prisma.like.delete({
      where: {
        likeId: like.likeId,
      },
    });
    await prisma.post.update({
      where: {
        postId,
      },
      data: {
        like: {
          decrement: 1,
        },
      },
    });
  }
  return res.status(204).json({ success: true });
});

router.post(
  "/comments/:commentId/like",
  authMiddleware,
  async (req, res, next) => {
    const { commentId } = req.params;
    const { userId } = req.user;
    const like = await prisma.like.findFirst({
      where: {
        userId: Number(userId),
        commentId: Number(commentId),
      },
    });
    if (!like) {
      // 해당 댓글에 유저가 좋아요를 누른 적이 없다면
      await prisma.like.create({
        data: {
          userId: Number(userId),
          commentId: Number(commentId),
        },
      });
      await prisma.comment.update({
        where: {
          commentId: Number(commentId),
        },
        data: {
          like: {
            increment: 1,
          },
        },
      });
    } else {
      await prisma.like.delete({
        where: {
          likeId: like.likeId,
        },
      });
      await prisma.comment.update({
        where: {
          commentId: +commentId,
        },
        data: {
          like: {
            decrement: 1,
          },
        },
      });
    }
    return res.status(204).json({ success: true });
  }
);
export default router;
