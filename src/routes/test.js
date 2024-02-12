import { redisCli } from "../../app.js";
import express from "express";
import { prisma } from "../utils/index.js";
import "dotenv/config";
import authMiddleware from "../middleware/auth.middleware.js";
import axios from "axios";
import jwt from "jsonwebtoken";

const router = express.Router();

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
