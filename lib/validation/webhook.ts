import { z } from "zod";
import { webhookEvents } from "@/server/storage/webhooks";

const webhookUrlSchema = z.string().url().refine((value) => {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.hostname === "localhost" || url.hostname === "127.0.0.1";
  } catch {
    return false;
  }
}, "Webhook URL must use HTTPS.");

export const webhookSchema = z.object({
  url: webhookUrlSchema,
  events: z.array(z.enum(["*", ...webhookEvents])).default(["*"]),
});
