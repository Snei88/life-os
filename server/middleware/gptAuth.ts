import { Request, Response, NextFunction } from "express";

export interface GptRequest extends Request {
  userId?: number;
}

function readApiKey(req: Request) {
  const authorization = req.headers.authorization || "";
  if (authorization.toLowerCase().startsWith("bearer ")) {
    return authorization.slice("bearer ".length).trim();
  }
  return String(req.headers["x-gpt-api-key"] || "").trim();
}

export function requireGptAuth(req: GptRequest, res: Response, next: NextFunction) {
  const expectedKey = process.env.LIFEOS_GPT_API_KEY;
  const userId = Number(process.env.LIFEOS_GPT_USER_ID);

  if (!expectedKey || !Number.isInteger(userId)) {
    res.status(503).json({
      message: "GPT integration is not configured. Set LIFEOS_GPT_API_KEY and LIFEOS_GPT_USER_ID.",
    });
    return;
  }

  if (readApiKey(req) !== expectedKey) {
    res.status(401).json({ message: "Invalid GPT API key" });
    return;
  }

  req.userId = userId;
  next();
}
