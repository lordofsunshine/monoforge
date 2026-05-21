import { createHmac, randomBytes } from "node:crypto";
import { WebhookDeliveryStatus, WebhookStatus } from "@/generated/prisma/client";
import { getPrisma } from "@/lib/prisma";

export const webhookEvents = ["file.uploaded", "file.updated", "file.deleted", "issue.opened", "issue.closed", "issue.commented", "repository.starred"] as const;

export type WebhookEvent = (typeof webhookEvents)[number];

export function createWebhookSecret() {
  return randomBytes(24).toString("hex");
}

export function createWebhookSignature(secret: string, payload: string) {
  return `sha256=${createHmac("sha256", secret).update(payload).digest("hex")}`;
}

export function shouldDeliverWebhookEvent(events: string[], event: string) {
  return events.includes("*") || events.includes(event);
}

export function sanitizeWebhookEvents(events: string[]) {
  const allowed = new Set(webhookEvents);
  const selected = events.filter((event) => event === "*" || allowed.has(event as WebhookEvent));
  return selected.length ? Array.from(new Set(selected)) : ["*"];
}

function truncate(value: unknown, max = 180) {
  const text = typeof value === "string" ? value : String(value ?? "");
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

export function isDiscordWebhookUrl(url: string) {
  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname.toLowerCase();
    return (hostname === "discord.com" || hostname === "discordapp.com" || hostname.endsWith(".discord.com") || hostname.endsWith(".discordapp.com")) && parsed.pathname.startsWith("/api/webhooks/");
  } catch {
    return false;
  }
}

function eventTitle(event: WebhookEvent, payload: Record<string, unknown>) {
  if (event === "file.uploaded" || event === "file.updated") {
    const files = Array.isArray(payload.files) ? payload.files.length : null;
    const path = typeof payload.path === "string" ? payload.path : null;
    if (files && files > 1) {
      return `${event === "file.updated" ? "Updated" : "Uploaded"} ${files} files`;
    }
    return `${event === "file.updated" ? "Updated" : "Uploaded"} ${path || "a file"}`;
  }

  if (event === "file.deleted") {
    return `Deleted ${typeof payload.path === "string" ? payload.path : "a file"}`;
  }

  if (event === "issue.opened") {
    return `Opened issue #${typeof payload.number === "number" ? payload.number : "new"}`;
  }

  if (event === "issue.closed") {
    return `Closed issue #${typeof payload.number === "number" ? payload.number : ""}`.trim();
  }

  if (event === "issue.commented") {
    return `New comment on issue #${typeof payload.number === "number" ? payload.number : ""}`.trim();
  }

  return "Repository starred";
}

export function buildDiscordWebhookPayload(input: {
  event: WebhookEvent;
  repository: {
    name: string;
    slug: string;
    description: string | null;
    owner: {
      username: string;
    };
  };
  payload: Record<string, unknown>;
}) {
  const repoPath = `${input.repository.owner.username}/${input.repository.slug}`;
  const repoUrl = `https://monoforge.org/${repoPath}`;
  const title = eventTitle(input.event, input.payload);
  const fields = [
    { name: "Repository", value: `[${repoPath}](${repoUrl})`, inline: true },
    { name: "Event", value: input.event, inline: true },
  ];

  if (typeof input.payload.message === "string" && input.payload.message.trim()) {
    fields.push({ name: "Message", value: truncate(input.payload.message, 900), inline: false });
  }

  if (Array.isArray(input.payload.files) && input.payload.files.length) {
    const paths = input.payload.files
      .slice(0, 8)
      .map((file) => {
        if (file && typeof file === "object" && "path" in file) {
          return `\`${truncate((file as { path?: unknown }).path, 90)}\``;
        }
        return null;
      })
      .filter(Boolean)
      .join("\n");
    if (paths) {
      fields.push({ name: "Files", value: paths, inline: false });
    }
  } else if (typeof input.payload.path === "string") {
    fields.push({ name: "Path", value: `\`${truncate(input.payload.path, 900)}\``, inline: false });
  }

  return {
    username: "MonoForge",
    content: `MonoForge: ${title}`,
    embeds: [
      {
        title,
        description: input.repository.description || input.repository.name,
        url: repoUrl,
        color: 2105376,
        fields,
        timestamp: new Date().toISOString(),
        footer: {
          text: "MonoForge",
        },
      },
    ],
    allowed_mentions: {
      parse: [],
    },
  };
}

export async function createWebhook(input: { repositoryId: string; url: string; events: string[] }) {
  const prisma = getPrisma();
  return prisma.webhook.create({
    data: {
      repositoryId: input.repositoryId,
      url: input.url,
      secret: createWebhookSecret(),
      events: sanitizeWebhookEvents(input.events),
    },
  });
}

export async function deleteWebhook(webhookId: string, repositoryId: string) {
  const prisma = getPrisma();
  return prisma.webhook.deleteMany({
    where: {
      id: webhookId,
      repositoryId,
    },
  });
}

export async function dispatchRepositoryWebhooks(input: {
  repositoryId: string;
  event: WebhookEvent;
  payload: Record<string, unknown>;
}) {
  const prisma = getPrisma();
  const repository = await prisma.repository.findUnique({
    where: { id: input.repositoryId },
    select: {
      name: true,
      slug: true,
      description: true,
      owner: {
        select: {
          username: true,
        },
      },
    },
  });

  if (!repository) {
    return;
  }

  const webhooks = await prisma.webhook.findMany({
    where: {
      repositoryId: input.repositoryId,
      status: WebhookStatus.ACTIVE,
    },
    select: {
      id: true,
      url: true,
      secret: true,
      events: true,
    },
  });

  await Promise.all(
    webhooks
      .filter((webhook) => shouldDeliverWebhookEvent(webhook.events, input.event))
      .map(async (webhook) => {
        const basePayload = {
          event: input.event,
          repositoryId: input.repositoryId,
          repository: {
            name: repository.name,
            slug: repository.slug,
            owner: repository.owner.username,
            url: `https://monoforge.org/${repository.owner.username}/${repository.slug}`,
          },
          createdAt: new Date().toISOString(),
          data: input.payload,
        };
        const requestBody = isDiscordWebhookUrl(webhook.url)
          ? buildDiscordWebhookPayload({ event: input.event, repository, payload: input.payload })
          : basePayload;
        const payload = JSON.stringify(requestBody);
        const delivery = await prisma.webhookDelivery.create({
          data: {
            webhookId: webhook.id,
            event: input.event,
            payload: JSON.parse(payload),
          },
        });

        try {
          const response = await fetch(webhook.url, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "User-Agent": "MonoForge-Webhooks/1.0",
              "X-MonoForge-Event": input.event,
              "X-MonoForge-Signature": createWebhookSignature(webhook.secret, payload),
            },
            body: payload,
            signal: AbortSignal.timeout(8000),
          });
          const ok = response.status >= 200 && response.status < 300;
          const responseText = ok ? "" : await response.text().catch(() => "");
          const errorText = ok ? null : truncate(responseText || `HTTP ${response.status}`, 500);

          await prisma.$transaction([
            prisma.webhookDelivery.update({
              where: { id: delivery.id },
              data: {
                status: ok ? WebhookDeliveryStatus.DELIVERED : WebhookDeliveryStatus.FAILED,
                statusCode: response.status,
                error: errorText,
                deliveredAt: ok ? new Date() : null,
              },
            }),
            prisma.webhook.update({
              where: { id: webhook.id },
              data: {
                lastStatus: response.status,
                lastError: errorText,
                lastSentAt: new Date(),
              },
            }),
          ]);
        } catch (error) {
          const message = error instanceof Error ? error.message : "Delivery failed";
          await prisma.$transaction([
            prisma.webhookDelivery.update({
              where: { id: delivery.id },
              data: {
                status: WebhookDeliveryStatus.FAILED,
                error: message,
              },
            }),
            prisma.webhook.update({
              where: { id: webhook.id },
              data: {
                lastError: message,
                lastSentAt: new Date(),
              },
            }),
          ]);
        }
      }),
  );
}
