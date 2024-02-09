import express from "express";
import { prisma } from "../utils/index.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import authMiddleware from "../middleware/auth.middleware.js";
import nodemailer from "nodemailer";

const router = express.Router();

// 랜덤한 4자리 숫자 생성
const generateVerificationCode = () => {
  return Math.floor(1000 + Math.random() * 9000);
};

// 각 사용자에 대한 인증 코드 저장
const verificationCodes = {};

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.SEND_MAIL_ID,
    pass: process.env.SEND_MAIL_PASSWORD,
  },
});

// 회원가입 API
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

  const exitUser = await prisma.user.findFirst({
    where: { email },
  });

  if (exitUser) {
    return res.status(409).json({ message: "이미 존재하는 이메일입니다." });
  }

  if (password !== passwordconfirm) {
    return res
      .status(400)
      .json({ message: "비밀번호가 비밀번호 확인과 다릅니다" });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: { email, password: hashedPassword, name },
  });

  const verificationCode = generateVerificationCode();

  // 사용자에 대한 인증 코드 저장
  verificationCodes[email] = verificationCode;

  const mailsend = {
    from: process.env.SEND_MAIL_ID,
    to: email,
    subject: "이메일 인증",
    text: `계정을 인증하려면 다음 숫자를 입력하세요: ${verificationCode}`,
  };

  transporter.sendMail(mailsend, (error) => {
    if (error) {
      return res.status(500).json({ message: '이메일 전송 중 오류가 발생했습니다.' });
    } else {
      return res.status(201).json({ data: user, message: '이메일을 확인해주세요.' });
    }
  });
});

// 이메일 인증 확인 API
router.post("/verify-email", async (req, res, next) => {
  const { email, verificationCode } = req.body;

  // 인증 코드 일치 여부 확인
  if (verificationCodes[email] && verificationCodes[email] === parseInt(verificationCode)) {
    // 코드 일치 시, 회원가입 프로세스 계속 진행
    delete verificationCodes[email]; // 사용된 인증 코드 삭제
    // ... (사용자 등록 계속 진행)
    return res.status(201).json({ message: '이메일 인증이 성공적으로 완료되었습니다.' });
  } else {
    return res.status(400).json({ message: '이메일 인증이 실패했습니다. 올바른 숫자를 입력하세요.' });
  }
});

// 로그인 api
router.post("/login", async (req, res, next) => {
  const { email, password } = req.body;
  const user = await prisma.user.findFirst({ where: { email } });
  if (!user) {
    return res.status(401).json({ message: "존재하지 않는 이메일입니다" });
  }

  if (!(await bcrypt.compare(password, user.password))) {
    return res.status(403).json({ message: "비밀번호가 일치하지 않습니다" });
  }
  const token = jwt.sign({ userId: user.userId }, "custom-secret-key");
  res.cookie("authorization", `Bearer ${token}`);
  return res.status(200).json({ message: "로그인에 성공하였습니다" });
});

// 로그아웃 api
router.post("/logout", authMiddleware, async (req, res, next) => {
  res.clearCookie("authorization");
  return res.status(200).json({ message: "로그아웃에 성공하였습니다" });
});

// 회원 목록 조회 api
router.get("/users", async (req, res, next) => {
  try {
    const users = await prisma.user.findMany();
    return res.status(200).json({ data: users });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
});

// 회원 삭제 api
router.delete("/user/:userId", async (req, res, next) => {
  const { userId } = req.params;

  try {
    // 회원 삭제
    const deletedUser = await prisma.user.delete({
      where: { userId: parseInt(userId) },
    });

    return res.status(200).json({ data: deletedUser, message: '회원이 삭제되었습니다.' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
});


export default router;
