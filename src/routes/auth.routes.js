import express from "express";
import { prisma } from "../utils/index.js";
import "dotenv/config";
import authMiddleware from "../middleware/auth.middleware.js";
import passport from "passport";
import { Strategy as KakaoStrategy } from "passport-kakao";
import jwt from "jsonwebtoken";

const router = express.Router();

passport.use(
  new KakaoStrategy(
    {
      clientID: process.env.KAKAO_REST_API_KEY,
      callbackURL: "http://localhost:3000/auth/kakao/callback",
    },
    async (accessToken, refreshToken, profile, done) => {
      const email = profile._json.kakao_account && profile._json.kakao_account.email;
      const findKakaoUser = await prisma.user.findFirst({
        where: {
          snsId: String(profile.id),
          provider: "kakao",
        },
      });
      if (findKakaoUser) {
        //만약 카카오로 가입한 적이 있다면
        const token = jwt.sign({ id: findKakaoUser.id }, "your_secret_key", { expiresIn: "8h" });
        return done(null, findKakaoUser, { message: "Authentication successful", token });
      } else {
        //가입한 적이 없다면 가입시키고 로그인시켜주기
        const registKakao = await prisma.user.create({
          data: {
            email: email,
            name: profile.username,
            snsId: String(profile.id),
            provider: "kakao",
          },
        });
        const token = jwt.sign({ id: registKakao.id }, "your_secret_key", { expiresIn: "8h" });
        console.log(registKakao);
        return done(null, findKakaoUser, { message: "Authentication successful", token });
      }
    }
  )
);

router.get("/kakao", passport.authenticate("kakao"));

router.get(
  "/auth/kakao/callback",
  passport.authenticate("kakao", {
    failureRedirect: "/",
    session: false,
  }),
  (req, res) => {
    if (req.user) {
      const token = jwt.sign({ id: req.user.id }, "your_secret_key", { expiresIn: "8h" });
      res.cookie("authorization", `Bearer ${token}`);
      res.redirect("/"); // 또는 인증 성공 후 사용자를 리다이렉트할 다른 경로
    } else {
      // 인증 실패 혹은 사용자 정보가 없는 경우 처리
      res.redirect("/login");
    }
  }
);

export default router;
