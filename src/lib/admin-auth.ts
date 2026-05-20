import type { NextRequest } from "next/server";

function decodeBasicAuth(authHeader: string): { user: string; pass: string } | null {
  if (!authHeader.startsWith("Basic ")) return null;
  const b64 = authHeader.slice(6).trim();
  try {
    const decoded = atob(b64);
    const idx = decoded.indexOf(":");
    if (idx < 0) return null;
    return { user: decoded.slice(0, idx), pass: decoded.slice(idx + 1) };
  } catch {
    return null;
  }
}

export function isAdminAuthorized(req: NextRequest): boolean {
  const expectedUser = process.env.ADMIN_USERNAME;
  const expectedPass = process.env.ADMIN_PASSWORD;

  if (!expectedUser || !expectedPass) {
    return false;
  }

  const auth = req.headers.get("authorization") ?? "";
  const parsed = decodeBasicAuth(auth);
  if (!parsed) return false;

  return parsed.user === expectedUser && parsed.pass === expectedPass;
}
