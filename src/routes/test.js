import { redisCli } from "../../app.js";
import express from "express";
import { prisma } from "../utils/index.js";
import "dotenv/config";
import authMiddleware from "../middleware/auth.middleware.js";
import axios from "axios";
import jwt from "jsonwebtoken";

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

router.get("/google-login", (req, res) => {
  let url = "https://accounts.google.com/o/oauth2/v2/auth";
  // client_id는 위 스크린샷을 보면 발급 받았음을 알 수 있음
  // 단, 스크린샷에 있는 ID가 아닌 당신이 직접 발급 받은 ID를 사용해야 함.
  url += `?client_id=${process.env.GOOGLE_CLIENT_ID}`;
  // 아까 등록한 redirect_uri
  // 로그인 창에서 계정을 선택하면 구글 서버가 이 redirect_uri로 redirect 시켜줌
  url += `&redirect_uri=${process.env.GOOGLE_LOGIN_REDIRECT_URI}`;
  // 필수 옵션.
  url += "&response_type=code";
  // 구글에 등록된 유저 정보 email, profile을 가져오겠다 명시
  url += "&scope=email profile";
  // 완성된 url로 이동
  // 이 url이 위에서 본 구글 계정을 선택하는 화면임.
  res.redirect(url);
});

router.get("/google-login/redirect", async (req, res) => {
  const { code } = req.query;
  console.log(`code: ${code}`);
  console.log(1);

  const response = await axios.post("https://oauth2.googleapis.com/token", {
    code,
    client_id: process.env.GOOGLE_CLIENT_ID,
    client_secret: process.env.CLIENT_SECRET,
    redirect_uri: process.env.GOOGLE_LOGIN_REDIRECT_URI,
    grant_type: "authorization_code",
  }); //여기서 토큰을 가져옴
  console.log(response);
  const response2 = await axios.get("https://www.googleapis.com/oauth2/v2/userinfo", {
    headers: {
      Authorization: `Bearer ${response.data.access_token}`,
    },
  });
  const { name, email, id } = response2.data;
  const search = await prisma.user.findFirst({
    where: {
      email,
    },
  });
  if (search) {
    //이미 가입한 이메일이 있다면 바로 로그인 시켜버리기
    const token = jwt.sign({ userId: search.userId }, "custom-secret-key", { expiresIn: "1h" });
    res.cookie("authorization", `Bearer ${token}`);
    return res.redirect("/");
  }
  //이메일이 없다면
  const signUp = await prisma.user.create({
    data: {
      name,
      email,
      snsId: id,
      provider: "google",
    },
  });
  const token = jwt.sign({ userId: signUp.userId }, "custom-secret-key", { expiresIn: "1h" });
  res.cookie("authorization", `Bearer ${token}`);
  return res.redirect("/");
});
export default router;
