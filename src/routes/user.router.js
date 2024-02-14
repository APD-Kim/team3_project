import express from "express";
import { prisma } from "../utils/index.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import authMiddleware from "../middleware/auth.middleware.js";

import { redisCli } from "../../app.js";

import nodemailer from "nodemailer";
const router = express.Router();
// 랜덤한 4자리 숫자 생성
const randomnumber = () => {
  return Math.floor(1000 + Math.random() * 9000);
};

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.SEND_MAIL_ID,
    pass: process.env.SEND_MAIL_PASSWORD,
  },
});

// 이메일 코드 전송 API
router.post("/verify-email", async (req, res, next) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ message: "이메일을 적지 않았습니다" });
  }
  const verificationCode = randomnumber();
  // 사용자에 대한 인증 코드 저장
  verifiCode[email] = verificationCode;
  // 이메일 내용
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
      return res.status(201).json({ message: '이메일을 확인해주세요.' });
    }
  });
});

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
    const verificationCode = randomnumber();
    const mailsend = {
      from: process.env.SEND_MAIL_ID,
      to: email,
      subject: "이메일 인증",
      text: `계정을 인증하려면 다음 숫자를 입력하세요: ${verificationCode}`,
    };
    const userInfo = {
      email,
      name,
      password,
    };
    console.log(userInfo);

    await redisCli.set(`${verificationCode}`, JSON.stringify(userInfo), { EX: 180 });

    transporter.sendMail(mailsend, (error) => {
      if (error) {
        return res.status(500).json({ message: "이메일 전송 중 오류가 발생했습니다." });
      } else {
        return res.status(201).render("validEmail");
      }
    });
  } catch (err) {
    console.log(err.stack);
    console.log(err.message);
    res.status(400).json({ message: "서버 오류" });
  }
});

// 회원가입 api
router.post("/valid-code", async (req, res, next) => {
  try {
    const { code } = req.body;
    if (!code) {
      res.status(400).json({ messsage: "코드를 반드시 적어주세요" });
    }
    const findCode = await redisCli.get(code);
    if (findCode) {
      const userInfo = JSON.parse(findCode);
      const { email, name, password } = userInfo;
      const hashedPassword = await bcrypt.hash(password, 10);
      await prisma.user.create({
        data: {
          email,
          name,
          password: hashedPassword,
        },
      });
    } else {
      res.status(400).json({ messsage: "코드가 만료되었습니다." });
    }

    return res.status(201).json({ message: "회원가입 완료" });
  } catch (error) {
    console.error(error.message);
  }
});
// 로그인 api
router.post("/login", async (req, res, next) => {
  const { email, password } = req.body;
  const user = await prisma.user.findFirst({ where: { email } });

  if (!user) {
    return res.status(401).json({ message: "존재하지 않는 이메일입니다" });
  }
  if (user.password === null) {
    return res.status(403).json({ message: "비밀번호가 일치하지 않습니다." });
  }
  if (!(await bcrypt.compare(password, user.password))) {
    return res.status(403).json({ message: "비밀번호가 일치하지 않습니다" });
  }

  const token = jwt.sign({ userId: user.userId }, process.env.SECRET_KEY, { expiresIn: "8h" });

  res.cookie("authorization", `Bearer ${token}`, { maxAge: 1000 * 60 * 60 * 8 });
  return res.status(200).redirect("/");

});
// 비밀번호 변경
router.put("/check-change", authMiddleware, async (req, res) => {
  const userId = req.user.userId;
  const { currentPassword, modifyPassword } = req.body;
  const user = await prisma.user.findUnique({ where: { userId: +userId } });
  if (!user) {
    return res.status(404).json({ message: "회원이 없습니다" });
  }
  if (!(await bcrypt.compare(currentPassword, user.password))) {
    return res.status(403).json({ message: "현재 비밀번호가 일치하지 않습니다." });
  }
  const hashedPassword = await bcrypt.hash(modifyPassword, 10);
  await prisma.user.update({
    data: {
      password: hashedPassword,
    },
    where: {
      userId: +userId,
    },
  });
  return res.status(200).json({ message: "비밀번호 수정 완료" });
});
// 사용자 정보 변경

router.put('/edit', authMiddleware, async (req, res) => {
  const userId = req.user.userId;
  const { name, usercontent } = req.body;

  const updatedUser = await prisma.user.update({
    where: { userId: +userId },
    data: {
      name: name,
      usercontent: usercontent,
    },
  });
  return res.status(200).json({ message: "사용자 정보 수정이 완료되었습니다", updatedUser });
});

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

export default router;

