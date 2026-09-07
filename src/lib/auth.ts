import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import {
  type Role,
  type Permissions,
  resolvePermissions,
  normalizePermsOverrides,
} from "@/lib/permissions";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET ?? "cstmr_portal_jwt_secret_key_2026_super_secure"
);
const TOKEN_EXPIRY = "30m";
const TOKEN_MAX_AGE = 30 * 60;
const IS_PROD = process.env.NODE_ENV === "production";
const COOKIE_FLAGS = `Path=/; HttpOnly; SameSite=Lax${IS_PROD ? "; Secure" : ""}; Max-Age=`;
const TOKEN_COOKIE_SETTINGS = COOKIE_FLAGS + TOKEN_MAX_AGE;
const CLEAR_COOKIE_SETTINGS = COOKIE_FLAGS + "0";

export interface AuthUser {
  id: string;
  email: string;
  name: string | null;
  role: Role;
  permissions: Permissions;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function createToken(user: AuthUser): Promise<string> {
  return new SignJWT({
    sub: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    permissions: user.permissions,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(TOKEN_EXPIRY)
    .sign(JWT_SECRET);
}

export async function verifyToken(
  token: string
): Promise<AuthUser | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return {
      id: payload.sub as string,
      email: payload.email as string,
      name: payload.name as string | null,
      role: (payload.role as Role) ?? "VIEWER",
      permissions: (payload.permissions as Permissions) ?? resolvePermissions("VIEWER"),
    };
  } catch {
    return null;
  }
}

export function setAuthCookie(token: string) {
  return {
    "Set-Cookie": `token=${token}; ${TOKEN_COOKIE_SETTINGS}`,
  };
}

export function clearAuthCookie() {
  return {
    "Set-Cookie": `token=; ${CLEAR_COOKIE_SETTINGS}`,
  };
}

const TOKEN_COOKIE_RE = /token=([^;]+)/;

export async function getCurrentUser(
  request: Request
): Promise<AuthUser | null> {
  const cookieHeader = request.headers.get("cookie");
  if (!cookieHeader) return null;

  const tokenMatch = cookieHeader.match(TOKEN_COOKIE_RE);
  if (!tokenMatch) return null;
  const token = tokenMatch[1];

  const payload = await verifyToken(token);
  if (!payload) return null;

  const user = await prisma.user.findUnique({
    where: { id: payload.id },
  });
  if (!user) return null;

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    permissions: resolvePermissions(
      user.role,
      normalizePermsOverrides(user.permissions)
    ),
  };
}

export function toAuthUser(user: {
  id: string;
  email: string;
  name: string | null;
  role: Role;
  permissions?: unknown;
}): AuthUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    permissions: resolvePermissions(
      user.role,
      normalizePermsOverrides(user.permissions)
    ),
  };
}

export async function getCurrentUserFromToken(
  token: string
): Promise<AuthUser | null> {
  return verifyToken(token);
}