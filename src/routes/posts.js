import express from "express";
import { prisma } from "../utils/index.js";
import authMiddleware from "../middleware/auth.middleware.js";
import { redisCli } from "../../app.js";

const router = express.Router();

//쿼리 데이터 집계
//예 : dc
//메모리를 쓰지 안흥면 = 게시판 -> 모든 데이터 조회수를 가지고 join
//폴링

router.get("/mainpage", async (req, res) => {
  //// 뉴스 피드 모든 목록 조회
  const countLike = await redisCli.zCard(`post:like:${postId}`);
  try {
    const user = await prisma.post.findMany({
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

    return res.status(201).json({ data: user });
  } catch (error) {
    console.error(error.message);
  }
});

router.get("/posts/:postId", async (req, res) => {
  try {
    const { postId } = req.params;
    const { uid } = req.cookies;
    
    const uidExists = await redisCli.exists(uid);
    console.log(uidExists);
    //유효성검사를 실시하고 통과하면 로직 실행
    //토큰이 사라졌어
    // 눌렀을때 조회수 1 증가
    const increaseView = await redisCli.incr(`post:${postId}:view`);
    //눌렀던 유저 추적(1분간)
    const expireKey = `post:view:${postId}`;
    const result = await redisCli.zAdd(`post:view:${postId}`, [{ score: timestamp, value: "4" }]);
    const user = await prisma.post.findFirst({
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

    if (user === null) {
      return res.status(400).json({ message: "원하는 목록이 존재하지 않습니다." });
    }
    return res.status(201).json({ data: user });
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
