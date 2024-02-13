import { redisCli } from "../../app.js";
const timestamp = new Date().getTime();

export async function handleLike(prisma, contentType, contentId, userId) {
  try {
    const content = await prisma[contentType].findFirst({
      where: {
        [`${contentType}Id`]: Number(contentId),
      },
    });
    if (!content) {
      return { status: 404, message: "콘텐츠를 찾을 수 없습니다." };
    }
    if (userId === content.userId) {
      return {
        status: 400,
        message: "자신이 만든 콘텐츠는 좋아요를 누를 수 없습니다.",
      };
    }
    const like = await redisCli.zScore(`${contentType}:like:${contentId}`, `${userId}`);
    console.log(like);
    if (!like) {
      const result = await redisCli.zAdd(`${contentType}:like:${contentId}`, [
        { score: timestamp, value: String(userId) },
      ]);
      if (!result) {
        return { status: 500, message: "작업 중 오류가 발생하였습니다." };
      }
      const prismaResult = await prisma[contentType].update({
        where: { [`${contentType}Id`]: Number(contentId) },
        data: { like: { increment: 1 } },
      });
      if (!prismaResult) {
        await redisCli.zRem(`${contentType}:like:${contentId}`, String(userId));
        return { status: 500, message: "작업 중 오류가 발생하였습니다." };
      }
    } else {
      await redisCli.zRem(`${contentType}:like:${contentId}`, String(userId));
      await prisma[contentType].update({
        where: { [`${contentType}Id`]: Number(contentId) },
        data: { like: { decrement: 1 } },
      });
    }
    return { status: 201, message: "성공" };
  } catch (err) {
    return { status: 201, message: err.message };
  }
}
