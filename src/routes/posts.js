import express from "express";
import { prisma } from "../utils/index.js";
import authMiddleware from "../middleware/auth.middleware.js";
import { redisCli } from "../../app.js";

const router = express.Router();

//쿼리 데이터 집계
//예 : dc
//메모리를 쓰지 안흥면 = 게시판 -> 모든 데이터 조회수를 가지고 join
//폴링

router.get("/", async (req, res) => {
  try {
    const cache = "mainPageCache";
    const CachedPosts = await redisCli.get(cache);
    if (CachedPosts) {
      res.render("index", { post: JSON.parse(CachedPosts) });
    } else {
      const posts = await prisma.post.findMany({
        select: {
          postId: true,
          title: true,
          content: true,

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
    }
    await redisCli.setex(cache,3600,JSON.stringify())

    res.render("index", { posts: JSON.stringify(posts) });
  } catch (error) {
    console.error(error.message);
  }
});

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
        postId: +postId,
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

    if (post === null) {
      return res.status(400).json({ message: "원하는 목록이 존재하지 않습니다." });
    }
    return res.status(201).json({ data: post });
  } catch (error) {
    console.error(error.message);
  }
});

router.post("/posts", authMiddleware, async (req, res) => {
  //// 뉴스 피드 작성
  try {
    const { userId } = req.user;
    const { title, content } = req.body;

    const user = await prisma.user.findFirst({
      where: { userId: +userId },
    });

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

    return res.status(201).json({ data: posts });
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

    const user = await prisma.user.findFirst({
      where: { userId: +userId },
    });

    if (!userId) {
      return res.status(400).json({ message: "유저가 존재하지 않습니다." });
    }

    if (!postId) {
      return res.status(400).json({ message: "게시글이 존재하지 않습니다." });
    }

    if (!title) {
      return res.status(400).json({ message: "게시글의 제목을 작성해주세요." });
    }

    if (!content) {
      return res.status(400).json({ message: "자기소개란을 작성해주세요." });
    }

    if (user !== userId) {
      return res.status(400).json({ message: "수정할 권한이 없습니다." });
    }

    const postput = await prisma.post.update({
      where: { postId: +postId },
      data: {
        title,
        content,
      },
    });

    return res.status(201).json({ data: postput });
  } catch (error) {
    console.error(error.message);
  }
});

router.delete("/posts/:postId", authMiddleware, async (req, res) => {
  //// 뉴스 피드 삭제
  try {
    const { userId } = req.user;
    const { postId } = req.params;

    const user = await prisma.user.findFirst({
      where: { userId: +userId },
    });

    const post = await prisma.post.findFirst({
      where: { postId: +postId },
    });

    if (!userId) {
      return res.status(400).json({ message: "유저가 존재하지 않습니다." });
    }

    if (!postId) {
      return res.status(400).json({ message: "게시글이 존재하지 않습니다." });
    }

    if (user !== userId) {
      return res.status(400).json({ message: "삭제할 권한이 없습니다." });
    }

    if (post === null) {
      return res.status(400).json({ message: "게시글이 존재하지 않습니다." });
    }

    await prisma.post.delete({
      where: { postId: +postId },
    });

    return res.status(201).json({ message: "삭제 완료" });
  } catch (error) {
    console.error(error.message);
  }
});

export default router;
