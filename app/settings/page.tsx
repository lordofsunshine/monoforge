import { redirect } from "next/navigation";

export default async function TokensPage() {
  redirect("/settings/profile");
}
