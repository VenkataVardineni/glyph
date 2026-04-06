import { z } from "zod";

const uuid = z.string().uuid();

export const authenticateSchema = z.object({
  userId: z.string().trim().max(512).optional(),
});

export const joinQueueSchema = z.object({
  tags: z.array(z.string().max(80)).max(3).optional(),
  language: z.string().max(32).optional(),
  drawingOnly: z.boolean().optional(),
  userId: z.string().max(512).optional(),
  excludeUserIds: z.array(z.string().max(512)).max(200).optional(),
});

export const signalSchema = z.object({
  matchId: uuid,
  type: z.enum(["offer", "answer", "candidate"]),
  sdp: z.string().max(200_000).optional(),
  candidate: z.unknown().optional(),
});

const pointSchema = z.object({
  x: z.number().finite(),
  y: z.number().finite(),
});

export const strokeSchema = z.object({
  matchId: uuid,
  strokeId: z.string().max(256),
  points: z.array(pointSchema).min(1).max(8000),
  color: z.string().max(64),
  width: z.number().finite().min(0).max(256),
  brush: z.string().max(64),
});

export const waveReadySchema = z.object({
  matchId: uuid,
  ready: z.boolean(),
});

export const blockUserSchema = z.object({
  matchId: uuid,
  peerUserId: z.string().min(1).max(512),
});

export const icebreakerRequestSchema = z.object({
  matchId: uuid,
});

export const moderationFrameSchema = z.object({
  frameId: z.string().min(1).max(256),
});

export const moderationAudioSchema = z.object({
  text: z.string().max(4000),
});

export const reportSchema = z.object({
  matchId: uuid.optional(),
  reason: z.string().min(1).max(2000),
  reportedUserId: z.string().max(512).optional(),
});

export function validationErrorMessage(err: z.ZodError): string {
  const first = err.issues[0];
  return first ? `${first.path.join(".") || "payload"}: ${first.message}` : "Invalid payload";
}
