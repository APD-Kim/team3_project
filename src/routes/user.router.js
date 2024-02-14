import express from "express";
import { prisma } from "../utils/index.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import authMiddleware from "../middleware/auth.middleware.js";
import { redisCli } from "../../app.js";

const router = express.Router();

//회원가입api

router.get("/sign-up", async (req, res, next) => {
  res.render("signup");
});
router.post("/sign-up", async (req, res, next) => {
  const { email, password, passwordconfirm, name } = req.body;

  try {
    if (!email) {
      return res.status(400).json({ message: "이메일을 작성해주세요." });
    }

    if (!password) {
      return res.status(400).json({ message: "비밀번호를 작성해주세요." });
    }

    if (!passwordconfirm) {
      return res.status(400).json({ message: "비밀번호 확인란을 작성해주세요." });
    }

    if (!name) {
      return res.status(400).json({ message: "이름란을 작성해주세요." });
    }

    const exitUser = await prisma.user.findFirst({
      where: { email },
    });

    if (exitUser) {
      return res.status(409).json({ message: "이미 존재하는 이메일입니다." });
    }

    if (password !== passwordconfirm) {
      return res.status(400).json({ message: "비밀번호가 비밀번호 확인과 다릅니다." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: { email, password: hashedPassword, name },
    });

    return res.status(201).json({ data: user });
  } catch (error) {
    console.error(error.message);
  }
});

// 로그인 api
router.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await prisma.user.findFirst({ where: { email } });
    if (!user) {
      return res.status(400).json({ message: "존재하지 않는 이메일입니다." });
    }

    if (!(await bcrypt.compare(password, user.password))) {
      return res.status(403).json({ message: "비밀번호가 일치하지 않습니다." });
    }
    const token = jwt.sign({ userId: user.userId }, "custom-secret-key");
    res.cookie("authorization", `Bearer ${token}`);
    return res.status(200).json({ message: "로그인 성공" });
  } catch (error) {
    console.error(error.message);
  }

  if (!password) {
    return res.status(400).json({ message: "비밀번호를 적지 않았습니다" });
  }

  if (!passwordconfirm) {
    return res.status(400).json({ message: "비밀번호 확인을 적지 않았습니다" });
  }

  if (!name) {
    return res.status(400).json({ message: "이름을 적지 않았습니다" });
  }

  const existUser = await prisma.user.findFirst({
    where: { email },
  });

  if (existUser) {
    return res.status(409).json({ message: "이미 존재하는 이메일입니다." });
  }

  if (password !== passwordconfirm) {
    return res.status(400).json({ message: "비밀번호가 비밀번호 확인과 다릅니다" });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: { email, password: hashedPassword, name, provider: "user" },
  });

  return res.status(201).json({ data: user });
});

// 로그인 api
router.post("/login1", async (req, res, next) => {
  const { email, password } = req.body;
  console.log(email);
  console.log(password);
  const user = await prisma.user.findFirst({ where: { email } });
  if (user.provider === "kakao" || user.provider === "google") {
    return res.status(401).json({ message: "카카오 혹은 구글로 회원가입되어있습니다." });
  }
  if (!user) {
    return res.status(401).json({ message: "존재하지 않는 이메일입니다" });
  }
  if (user.password === null) {
    return res.status(403).json({ message: "비밀번호가 일치하지 않습니다." });
  }

  if (!(await bcrypt.compare(password, user.password))) {
    return res.status(403).json({ message: "비밀번호가 일치하지 않습니다" });
  }
  const token = jwt.sign({ userId: user.userId }, "custom-secret-key");
  res.cookie("authorization", `Bearer ${token}`, { maxAge: 1000 * 60 * 60 * 8 });
  return res.status(200).json({ message: "로그인에 성공하였습니다" });
});

// 로그아웃 api
router.get("/logout", authMiddleware, async (req, res, next) => {
  res.clearCookie("authorization");
  return res.redirect("/");
});

router.get("/me", authMiddleware, async (req, res, next) => {
  const { userId } = req.user;
  const user = await prisma.user.findFirst({ where: { userId: req.user.userId } });
  if (!user) {
    res.status(404).json({ message: "해당 유저를 찾을 수 없습니다." });
  }
  const searchFollow = await prisma.follow.findMany({
    where: {
      following: Number(userId),
    },
    select: {
      follower: true,
    },
  });
  const following = await prisma.follow.findMany({
    where: {
      follower: Number(userId),
    },
    select: { following: true },
  });
  return res.render("mypage", { user: user, followed: searchFollow, follow: following });
});
//특정 유저 아이디 페이지
router.get("/user/:userId", authMiddleware, async (req, res, next) => {
  const { userId } = req.params;
  const posts = await prisma.post.findMany({
    where: {
      userId: +userId,
    },
  });
  const user = await prisma.user.findUnique({
    where: {
      userId: +userId,
    },
  });
  return res.render("users", { user: user, post: posts });
});

// 로그아웃 api

export default router;
