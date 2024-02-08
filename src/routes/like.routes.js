import express from "express";
import { prisma } from "../utils/index.js";
import { Prisma } from "@prisma/client";
import authMiddleware from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/posts/:postId/like", authMiddleware, async (req, res, next) => {
  const { postId } = req.params;
  const { userId } = req.user;
  const post = await prisma.post.findFirst({
    where: {
      postId: Number(postId),
    },
  });
  if (!post) {
    return res.status(404).json({ message: "게시물을 찾을 수 없습니다." });
  }
  const like = await prisma.like.findFirst({
    where: {
      userId: Number(userId),
      postId: Number(postId),
    },
  });
  if (userId === post.userId) {
    return res
      .status(400)
      .json({ message: "자신이 만든 게시물은 좋아요를 누를 수 없습니다." });
  }
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
        postId: Number(postId),
      },
      data: {
        like: {
          increment: 1,
        },
      },
    });
  } else {
    if (userId === like.userId)
      await prisma.like.delete({
        where: {
          likeId: like.likeId,
        },
      });
    await prisma.post.update({
      where: {
        postId: Number(postId),
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
    const comment = await prisma.comment.findFirst({
      where: {
        commentId: Number(commentId),
      },
    });
    if (!comment) {
      return res.status(404).json({ message: "해당 답글을 찾을 수 없습니다." });
    }
    const { userId } = req.user;
    const like = await prisma.like.findFirst({
      where: {
        userId: Number(userId),
        commentId: Number(commentId),
      },
    });

    if (userId === comment.userId) {
      return res
        .status(400)
        .json({ message: "자신이 만든 답글은 좋아요를 누를 수 없습니다." });
    }
    if (!like) {
      // 해당 답글에 유저가 좋아요를 누른 적이 없다면
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
//답글 좋아요
router.post("/reply/:replyId/like", authMiddleware, async (req, res, next) => {
  const { replyId } = req.params;
  const { userId } = req.user;
  const reply = await prisma.reply.findFirst({
    where: {
      replyId: Number(replyId),
    },
  });
  if (!reply) {
    return res.status(404).json({ message: "해당 답글을 찾을 수 없습니다." });
  }
  const like = await prisma.like.findFirst({
    where: {
      userId: Number(userId),
      replyId: Number(replyId),
    },
  });
  if (userId === reply.userId) {
    return res
      .status(400)
      .json({ message: "자신이 만든 답글은 좋아요를 누를 수 없습니다." });
  }
  if (!like) {
    // 해당 답글에 유저가 좋아요를 누른 적이 없다면
    await prisma.like.create({
      data: {
        userId: Number(userId),
        replyId: Number(replyId),
      },
    });
    await prisma.reply.update({
      where: {
        replyId: Number(replyId),
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
    await prisma.reply.update({
      where: {
        replyId: +replyId,
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
export default router;
