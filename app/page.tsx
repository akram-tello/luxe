import { redirect } from "next/navigation";
import { readSession } from "@/lib/auth/session";

export default async function RootPage() {
  const user = await readSession();
  if (!user) redirect("/login");
  if (user.role === "MANAGER") redirect("/manager");
  redirect("/associate");
}
