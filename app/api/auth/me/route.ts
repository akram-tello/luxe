import { readSession } from "@/lib/auth/session";
import { handleRouteError, jsonOk } from "@/lib/http";

export async function GET() {
  try {
    const actor = await readSession();
    return jsonOk({ user: actor });
  } catch (err) {
    return handleRouteError(err);
  }
}
