import express from "express";
import { prisma } from "../utils/index.js";
import { Prisma } from "@prisma/client";

const router = express.Router();

router.post("/posts/:postId/like", async (req, res, next) => {
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
  } else {
    await prisma.like.delete({
      where: {
        likeId: like.likeId,
      },
    });
  }
  return res.status(204).json({ message: "좋아요 " });
});

router.post("/posts/:commentId/like", async (req, res, next) => {
  const { commentId } = req.params;
  const { userId } = req.user;
  const like = await prisma.like.findFirst({
    where: {
      userId: Number(userId),
      commentId: Number(commentId),
    },
  });
  if (!like) {
    // 해당 게시물에 유저가 좋아요를 누른 적이 없다면
    await prisma.like.create({
      data: {
        userId: Number(userId),
        commentId: Number(commentId),
      },
    });
  } else {
    await prisma.like.delete({
      where: {
        likeId: like.likeId,
      },
    });
  }
  return res.status(204).json({ message: "" });
});
export default router;
