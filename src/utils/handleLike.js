export async function handleLike(prisma, contentType, contentId, userId) {
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
  const like = await prisma.like.findFirst({
    where: {
      userId: Number(userId),
      [`${contentType}Id`]: Number(contentId),
    },
  });
  if (!like) {
    await prisma.$transaction(async (tx) => {
      await tx.like.create({
        data: {
          userId: Number(userId),
          [`${contentType}Id`]: Number(contentId),
        },
      });
      await tx[contentType].update({
        where: { [`${contentType}Id`]: Number(contentId) },
        data: { like: { increment: 1 } },
      });
    });
  } else {
    await prisma.$transaction(async (tx) => {
      await tx.like.delete({ where: { likeId: like.likeId } });
      await tx[contentType].update({
        where: { [`${contentType}Id`]: Number(contentId) },
        data: { like: { decrement: 1 } },
      });
    });
  }
  return { status: 201, message: "성공" };
}
