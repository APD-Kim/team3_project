import express from "express";
import { prisma } from "../utils/index.js";
import "dotenv/config";
import authMiddleware from "../middleware/auth.middleware.js";
import passport from "passport";
import { Strategy as KakaoStrategy } from "passport-kakao";
import jwt from "jsonwebtoken";
import axios from "axios";

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
        const token = jwt.sign({ userId: findKakaoUser.id }, "custom-secret-key", { expiresIn: "8h" });
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
        const token = jwt.sign({ userId: registKakao.id }, "custom-secret-key", { expiresIn: "8h" });
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
      console.log(req.user);
      const token = jwt.sign({ userId: req.user.userId }, "custom-secret-key", { expiresIn: "8h" });
      res.cookie("authorization", `Bearer ${token}`, { maxAge: 1000 * 60 * 60 * 8 });
      console.log("good");
      res.redirect("/"); // 또는 인증 성공 후 사용자를 리다이렉트할 다른 경로
    } else {
      // 인증 실패 혹은 사용자 정보가 없는 경우 처리
      res.redirect("/login");
    }
  }
);

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
    const token = jwt.sign({ userId: search.userId }, "custom-secret-key", { expiresIn: "8h" });
    res.cookie("authorization", `Bearer ${token}`, { maxAge: 1000 * 60 * 60 * 8 });
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
