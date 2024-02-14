import express from "express";
import { prisma } from "../utils/index.js";
import authMiddleware from "../middleware/auth.middleware.js";
import { redisCli } from "../../app.js";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const posts = await prisma.post.findMany({
      select: {
        postId: true,
        title: true,
        content: true,
        like: true,
        view: true,
        User: {
          select: {
            userId: true,
            email: true,
            name: true,
          },
        },
        createdAt: true,
        updatedAt: true,
      },
    });
    res.render("index", { post: posts });
  } catch (error) {
    res.status(500).send("Internal Server Error");
  }
});
//상세 페이지
router.get("/posts/:postId", async (req, res) => {
  try {
    const { postId } = req.params;
    const { uid } = req.cookies;
    //uid는 조회한 게시물 추적용
    const expireKey = `post:view:expire:${postId}:${uid}`;
    const uidExists = await redisCli.get(expireKey);
    if (!uidExists) {
      //해당 uid가 레디스에 없다면
      await redisCli.incr(`post:${postId}:view`);
      await redisCli.set(expireKey, "1", { EX: 60 });
      await prisma.post.update({
        where: { postId: +postId },
        data: {
          view: {
            increment: 1,
          },
        },
      });
    }

    const post = await prisma.post.findFirst({
      where: { postId: +postId },
      select: {
        postId: true,
        title: true,
        content: true,
        like: true,
        postimg: true,
        view: true,
        User: {
          select: {
            userId: true,
            email: true,
            name: true,
          },
        },
        createdAt: true,
        updatedAt: true,
      },
    });

    const comment = await prisma.comment.findMany({
      where: { postId: +postId },
      include: {
        User: {
          select: {
            name: true, // user 테이블에서 name 컬럼만 선택
          },
        },
      },
    });

    if (post === null) {
      return res.status(400).json({ message: "원하는 목록이 존재하지 않습니다." });
    }
    return res.status(201).render("detail", { post: post, comment: comment });
  } catch (error) {
    console.error(error.message);
  }
});

router.post("/posts", authMiddleware, async (req, res) => {
  //// 뉴스 피드 작성
  try {
    const { userId } = req.user;
    const { title, content } = req.body;

    if (!userId) {
      return res.status(400).json({ message: "유저가 존재하지 않습니다." });
    }

    if (!title) {
      return res.status(400).json({ message: "게시글의 제목을 작성해주세요." });
    }

    if (!content) {
      return res.status(400).json({ message: "자기소개란을 작성해주세요." });
    }

    const posts = await prisma.post.create({
      data: {
        title,
        content,
        User: {
          connect: {
            userId: +userId,
          },
        },
      },
    });

    return res.status(200).json({ data: posts });
  } catch (error) {
    console.error(error.message);
  }
});

router.put("/posts/:postId", authMiddleware, async (req, res) => {
  //// 뉴스 피드 수정
  try {
    const { userId } = req.user;
    const { postId } = req.params;
    const { title, content } = req.body;

    const post = await prisma.post.findFirst({
      where: { postId: +postId },
    });

    if (!userId) {
      return res.status(400).json({ message: "유저가 존재하지 않습니다." });
    }

    if (!post) {
      return res.status(400).json({ message: "게시글이 존재하지 않습니다." });
    }

    if (!title) {
      return res.status(400).json({ message: "게시글의 제목을 작성해주세요." });
    }

    if (!content) {
      return res.status(400).json({ message: "자기소개란을 작성해주세요." });
    }

    if (post.userId !== userId) {
      return res.status(401).json({ message: "수정할 권한이 없습니다." });
    }

    const postput = await prisma.post.update({
      where: { postId: +postId },
      data: {
        title,
        content,
      },
    });

    return res.status(200).json({ data: postput });
  } catch (error) {
    console.error(error.message);
  }
});

router.delete("/posts/:postId", authMiddleware, async (req, res) => {
  //// 뉴스 피드 삭제
  try {
    const { userId } = req.user;
    const { postId } = req.params;

    const post = await prisma.post.findFirst({
      where: { postId: +postId },
    });

    if (!userId) {
      return res.status(400).json({ message: "유저가 존재하지 않습니다." });
    }

    if (!post) {
      return res.status(400).json({ message: "게시글이 존재하지 않습니다." });
    }

    if (post.userId !== userId) {
      return res.status(401).json({ message: "삭제할 권한이 없습니다." });

      await prisma.post.delete({
        where: { postId: +postId },
      });
    }

    return res.status(200).json({ message: "삭제 완료" });
  } catch (error) {
    console.error(error.message);
  }
});

export default router;
