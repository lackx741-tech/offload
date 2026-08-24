import { getRedis } from "@/lib/redis";

export type TelegramBotRole = "guest" | "admin" | "affiliate";

export type TelegramBotSession = {
  chatId: string;
  role: TelegramBotRole;
  projectId?: string;
  projectName?: string;
  createdAt: string;
  updatedAt: string;
};

const SESSION_PREFIX = "telegram:bot:session:";

function getSessionKey(chatId: string) {
  return `${SESSION_PREFIX}${chatId}`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isTelegramBotSession(value: unknown): value is TelegramBotSession {
  return (
    isRecord(value) &&
    typeof value.chatId === "string" &&
    (value.role === "guest" || value.role === "admin" || value.role === "affiliate") &&
    typeof value.createdAt === "string" &&
    typeof value.updatedAt === "string" &&
    (value.projectId === undefined || typeof value.projectId === "string") &&
    (value.projectName === undefined || typeof value.projectName === "string")
  );
}

export async function getTelegramBotSession(chatId: string): Promise<TelegramBotSession | null> {
  const redis = await getRedis();
  const raw = await redis.get(getSessionKey(chatId));
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as unknown;
    return isTelegramBotSession(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export async function saveTelegramBotSession(
  chatId: string,
  patch: Omit<TelegramBotSession, "chatId" | "createdAt" | "updatedAt">,
): Promise<TelegramBotSession> {
  const redis = await getRedis();
  const existing = await getTelegramBotSession(chatId);
  const now = new Date().toISOString();
  const next: TelegramBotSession = {
    chatId,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
    role: patch.role,
    projectId: patch.projectId,
    projectName: patch.projectName,
  };
  await redis.set(getSessionKey(chatId), JSON.stringify(next));
  return next;
}

export async function clearTelegramBotSession(chatId: string): Promise<void> {
  const redis = await getRedis();
  await redis.del(getSessionKey(chatId));
}
