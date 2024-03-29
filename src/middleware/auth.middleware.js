import jwt from "jsonwebtoken";
import { prisma } from "../utils/index.js";

export default async function (req, res, next) {
  try {
    const { authorization } = req.cookies;
    if (!authorization) return res.status(400).json({ message: "요청한 사용자의 토큰이 존재하지 않습니다." });
    const [tokenType, token] = authorization.split(" ");
    if (tokenType !== "Bearer") return res.status(400).json({ message: "토큰 타입이 일치하지 않습니다." });
    if (!token) return res.status(400).json({ message: "인증 정보가 올바르지 않습니다" });
    const decodedToken = jwt.verify(token, "custom-secret-key");
    const userId = decodedToken.userId;
    
    const user = await prisma.user.findFirst({
      where: { userId: +userId },
    });

    //유저 정보를 레디스에 저장해두고
    if (!user) {
      res.clearCookie("authorization");
      return res.status(400).json({ message: "토큰 사용자가 존재하지 않습니다." });
    }
    req.user = user;
    next();
  } catch (error) {
    return res.status(400).json({
      message: error.message,
    });
  }
}
