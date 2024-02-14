import express from "express";
import { prisma } from "../utils/index.js";
import { Prisma } from "@prisma/client";
import authMiddleware from "../middleware/auth.middleware.js";

const router = express.Router();
//유저 팔로우 하기
router.post("/follow/:followId", authMiddleware, async (req, res, next) => {
  const { followId } = req.params; //팔로우 당하는 사람
  const { userId } = req.user; //팔로우 하는 사람
  if (followId == userId) {
    return res.status(400).json({ message: "자기 자신을 팔로우 할수 없습니다." });
  }
  try {
    const follower = await prisma.user.findFirst({
      where: { userId: Number(followId) },
    });
    if (!follower) {
      return res.status(404).json({ message: "팔로우할 대상이 없습니다." });
    }
    //팔로우 할 대상이 있다면 팔로워로 등록(생성)
    const searchFollow = await prisma.follow.findFirst({
      where: {
        follower: Number(userId),
        following: Number(followId),
      },
    });
    // 만약 팔로우를 하지 않았다면
    if (!searchFollow) {
      const result = await prisma.$transaction(async (tx) => {
        const follow = await tx.follow.create({
          data: {
            follower: Number(userId),
            following: Number(followId),
          },
        });
        const incFollower = await tx.user.update({
          where: { userId: Number(followId) },
          data: { follower: { increment: 1 } },
        });
        return [follow, incFollower];
      });
      return res.status(201).json({ message: "팔로우 성공" });
    } else {
      //팔로우가 되어있다면
      const result = await prisma.$transaction(async (tx) => {
        const follow = await tx.follow.delete({
          where: {
            follower_following: {
              follower: Number(userId),
              following: Number(followId),
            },
          },
        });
        const decFollower = await tx.user.update({
          where: { userId: Number(followId) },
          data: { follower: { decrement: 1 } },
        });
        return [follow, decFollower];
      });
      return res.status(201).json({ message: "팔로우 취소 성공" });
    }
  } catch (err) {
    console.log(err.message);
    return res.status(500).json({ message: "팔로우 중 문제가 발생했습니다." });
  }
});

//팔로우한 유저의 게시물 조회

router.post("/follow/:followId/posts", authMiddleware, async (req, res, next) => {
  const { followId } = req.params; //팔로우 한 유저
  const { userId } = req.user; //나

  if (followId == userId) {
    return res.status(400).json({ message: "자기 자신을 팔로우 할수 없습니다." });
  }

  const searchFollow = await prisma.follow.findFirst({
    where: {
      follower: Number(userId),
      following: Number(followId),
    },
  });
  if (!searchFollow) {
    return res.status(400).json({ message: "대상을 팔로우 하지 않았습니다." });
  }
  //만약 팔로우가 되어있다면,
  console.log(searchFollow);
  const searchPost = await prisma.post.findMany({
    where: { userId: Number(followId) },
  });
  if (!searchPost) {
    return res.status(400).json({ message: "게시물을 찾을 수 없습니다." });
  }
  res.status(200).json({ data: searchPost });
});

//누가 날 팔로우했는지 한번에 보기
router.get("/follow/users", authMiddleware, async (req, res, next) => {
  const { userId } = req.user; //나

  const searchFollow = await prisma.follow.findMany({
    where: {
      following: Number(userId),
    },
    select: {
      follower: true,
    },
  });
  if (searchFollow.length === 0) {
    return res.status(400).json({ message: "당신을 팔로우 한 사람이 아무도 없습니다." });
  }
  //만약 팔로우한 사람이 있다면,
  res.status(200).json({ data: searchFollow });
});

//내가 팔로우한 사람 한번에 보기
router.get("/follow/users/me", authMiddleware, async (req, res, next) => {
  const { userId } = req.user; //나

  const searchFollow = await prisma.follow.findMany({
    where: {
      follower: Number(userId),
    },
    select: { following: true },
  });
  if (searchFollow.length === 0) {
    return res.status(400).json({ message: "당신이 팔로우 한 사람이 아무도 없습니다." });
  }
  //만약 팔로우한 사람이 있다면,
  res.status(200).json({ data: searchFollow });
});

export default router;
