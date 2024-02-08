import jwt from "jsonwebtoken";
import { prisma } from "../index.js";

export default async function (req, res, next) {
  try {
    const { authorization } = req.cookies;
    if (!authorization)
      throw new Error("요청한 사용자의 토큰이 존재하지 않습니다.");

    const [tokenType, token] = authorization.split(" ");

    if (tokenType !== "Bearer")
      throw new Error("토큰 타입이 일치하지 않습니다.");

    if (!token)
      throw new Error("인증 정보가 올바르지 않습니다");

    const decodedToken = jwt.verify(token, "custom-secret-key");
    const userId = decodedToken.userId;

    const user = await prisma.users.findFirst({
      where: { userId: +userId },
    });
    if (!user) {
      res.clearCookie("authorization");
      throw new Error("토큰 사용자가 존재하지 않습니다.");
    }

    req.user = user;

    next();
  } catch (error) {
    return res.status(400).json({
      message: "오류 발생"
    })
    
  }
}
