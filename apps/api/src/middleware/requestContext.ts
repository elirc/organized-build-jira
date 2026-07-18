// Archived pre-.NET migration. Kept for future review; not active.
// import type { NextFunction, Request, Response } from "express";
// import { userRoleSchema, type UserRole } from "@buildjira/shared";
// import { prisma } from "../lib/prisma.js";
// 
// declare module "express-serve-static-core" {
//   interface Request {
//     actor?: {
//       id: string;
//       name: string;
//       role: UserRole;
//     };
//   }
// }
// 
// export async function attachActor(req: Request, _res: Response, next: NextFunction) {
//   const requestedUserId = req.header("x-user-id");
//   const actor =
//     (requestedUserId
//       ? await prisma.user.findUnique({ where: { id: requestedUserId } })
//       : await prisma.user.findFirst({ orderBy: { createdAt: "asc" } })) ?? undefined;
// 
//   if (actor) {
//     req.actor = { id: actor.id, name: actor.name, role: userRoleSchema.parse(actor.role) };
//   }
// 
//   next();
// }
// 
// export function requireRole(roles: Array<NonNullable<Request["actor"]>["role"]>) {
//   return (req: Request, res: Response, next: NextFunction) => {
//     if (!req.actor) {
//       res.status(401).json({ error: { code: "UNAUTHENTICATED", message: "No actor is available." } });
//       return;
//     }
// 
//     if (!roles.includes(req.actor.role)) {
//       res.status(403).json({ error: { code: "FORBIDDEN", message: "Insufficient role for this action." } });
//       return;
//     }
// 
//     next();
//   };
// }
// 