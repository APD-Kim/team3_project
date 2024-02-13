import express from "express";
import { prisma } from "../utils/index.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import authMiddleware from "../middleware/auth.middleware.js";

const router = express.Router();

//회원가입api
router.post("/sign-up", async (req, res, next) => {
  const { email, password, passwordconfirm, name } = req.body;

  if (!email) {
    return res.status(400).json({ message: "이메일을 적지 않았습니다" });
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
  const user = await prisma.user.findFirst({ where: { email, provider: "user" } });
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
  res.cookie("authorization", `Bearer ${token}`);
  return res.status(200).json({ message: "로그인에 성공하였습니다" });
});

// 로그아웃 api
router.get("/logout", authMiddleware, async (req, res, next) => {
  res.clearCookie("authorization");
  return res.redirect("/");
});

export default router;
