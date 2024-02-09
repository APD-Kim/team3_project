import { redisCli } from "../../app.js";
import express from "express";
import { prisma } from "../utils/index.js";
import "dotenv/config";
import authMiddleware from "../middleware/auth.middleware.js";

const router = express.Router();
//해당 sorted set의 모든 멤버를 가져옴
router.get("/get-redis", async (req, res, next) => {
  const result = await redisCli.zCard(`like:post:${2}`);
  res.status(200).json({ data: result });
});
//sorted set 내부의 특정 멤버가 있는지 확인, 있으면 score 반환, 아니면 null 반환
router.get("/get-redis/:userId", async (req, res, next) => {
  const result = await redisCli.zScore(`like:post:${2}`, `${req.params.userId}`);
  if (result === null) {
    return res.status(400).json({ message: "애쉽탤" });
  }
  res.status(200).json({ data: result });
});

// POST
router.post("/set-redis", async (req, res, next) => {
  const timestamp = new Date().getTime();
  const result = await redisCli.zAdd(`like:post:${2}`, [{ score: timestamp, value: "4" }]);
  console.log(result);
  res.status(200).json({ message: "저장 완료" });
});

router.delete("/delete-redis", async (req, res, next) => {
  // zrem: Remove one or more members from a sorted set

  const result = await redisCli.zRem(`like:post:${2}`, "1", function (err, res) {
    console.log(res);
  });
  console.log(result);
  if (!result) {
    return res.status(400).json({ message: "삭제하고자 하는 데이터가 없습니다." });
  }
  res.status(200).json({ message: "저장 완료" });
});

// zadd: Add one or more members to a sorted set, or update its score if it already exists

router.post("/posts/:postId/like/redis", authMiddleware, async (req, res, next) => {
  const timestamp = new Date().getTime();
  const { userId } = req.user;
  console.log(userId);
  const { postId } = req.params;
  //post:like:게시물의id를 key로 등록하고 안에 member로 userid를 넣음
  //해당 게시물에 member로 해당 유저가 있는지 확인
  const findUser = await redisCli.zScore(`post:like:${postId}`, `${userId}`);
  console.log(findUser);
  if (findUser === null) {
    //유저가 해당 게시물에 좋아요를 누른적이 없다면
    const result = await redisCli.zAdd(`post:like:${postId}`, [{ score: timestamp, value: String(userId) }]);
  } else if (findUser !== null) {
    //좋아요를 누른적이 있다면
    const result = await redisCli.zRem(`post:like:${postId}`, String(userId));
  }
  //요청할때마다 좋아요 수를 반환
  res.status(200).json({ message: "저장 완료" });
});

router.post("/posts/:postId/like/count", authMiddleware, async (req, res, next) => {
  const { userId } = req.user;
  const { postId } = req.params;
  const countLike = await redisCli.zCard(`post:like:${postId}`);
  
  if (findUser === null) {
    //유저가 해당 게시물에 좋아요를 누른적이 없다면
    const result = await redisCli.zAdd(`post:like:${postId}`, [{ score: timestamp, value: String(userId) }]);
  } else if (findUser !== null) {
    //좋아요를 누른적이 있다면
    const result = await redisCli.zRem(`post:like:${postId}`, String(userId));
  }
  //요청할때마다 좋아요 수를 반환
  res.status(200).json({ message: "저장 완료" });
});
export default router;
