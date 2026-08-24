import Redis from "ioredis";

const redis = new Redis(process.env.REDIS_URL);

export async function setSession(userId, data) {
  await redis.setex(`tg:session:${userId}`, 3600, JSON.stringify(data));
}

export async function getSession(userId) {
  const data = await redis.get(`tg:session:${userId}`);
  return data ? JSON.parse(data) : null;
}

export async function requireAuth(userId) {
  const session = await getSession(userId);
  if (!session) throw new Error("Unauthorized");
  return session;
}
