import { headers } from "next/headers";
import { getClientIpFromHeaders } from "@/lib/security/client-ip";

export async function getRequestIp() {
  const headerStore = await headers();
  return getClientIpFromHeaders(headerStore);
}
