import express from "express";
import { prisma } from "../utils/index.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import authMiddleware from "../middleware/auth.middleware.js";

const router = express.Router();

//회원가입api
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
      return res
        .status(400)
        .json({ message: "비밀번호 확인란을 작성해주세요." });
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
      return res
        .status(400)
        .json({ message: "비밀번호가 비밀번호 확인과 다릅니다." });
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
});

// 로그아웃 api
router.post("/logout", authMiddleware, async (req, res, next) => {
  try {
    res.clearCookie("authorization");
    return res.status(200).json({ message: "로그아웃 완료" });
  } catch (error) {
    console.error(error.message);
  }
});

export default router;
