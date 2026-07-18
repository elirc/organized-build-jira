// Archived pre-.NET migration. Kept for future review; not active.
// import { Router } from "express";
// import {
//   createIssueSchema,
//   issuePrioritySchema,
//   issueStatusSchema,
//   issueTypeSchema,
//   projectHealthSchema,
//   updateIssueSchema,
//   userRoleSchema
// } from "@buildjira/shared";
// import { prisma } from "../lib/prisma.js";
// import { requireRole } from "../middleware/requestContext.js";
// 
// export const projectRouter = Router();
// 
// const userSelect = {
//   id: true,
//   name: true,
//   email: true,
//   avatarUrl: true,
//   role: true
// } as const;
// 
// function toUser<T extends { role: string }>(user: T) {
//   return { ...user, role: userRoleSchema.parse(user.role) };
// }
// 
// function toProjectHealth(health: string) {
//   return projectHealthSchema.parse(health);
// }
// 
// function toIso<T extends { updatedAt?: Date; dueDate?: Date | null }>(issue: T) {
//   return {
//     ...issue,
//     status: "status" in issue && typeof issue.status === "string" ? issueStatusSchema.parse(issue.status) : undefined,
//     type: "type" in issue && typeof issue.type === "string" ? issueTypeSchema.parse(issue.type) : undefined,
//     priority:
//       "priority" in issue && typeof issue.priority === "string"
//         ? issuePrioritySchema.parse(issue.priority)
//         : undefined,
//     assignee:
//       "assignee" in issue && issue.assignee && typeof issue.assignee === "object"
//         ? toUser(issue.assignee as { role: string })
//         : null,
//     reporter:
//       "reporter" in issue && issue.reporter && typeof issue.reporter === "object"
//         ? toUser(issue.reporter as { role: string })
//         : undefined,
//     updatedAt: issue.updatedAt?.toISOString(),
//     dueDate: issue.dueDate?.toISOString() ?? null
//   };
// }
// 
// projectRouter.get("/projects", async (_req, res) => {
//   const projects = await prisma.project.findMany({
//     orderBy: { updatedAt: "desc" },
//     include: {
//       lead: { select: userSelect },
//       issues: { select: { status: true } }
//     }
//   });
// 
//   res.json(
//     projects.map((project) => ({
//       id: project.id,
//       key: project.key,
//       name: project.name,
//       description: project.description,
//       health: toProjectHealth(project.health),
//       lead: toUser(project.lead),
//       issueCount: project.issues.length,
//       doneCount: project.issues.filter((issue) => issue.status === "DONE").length,
//       updatedAt: project.updatedAt.toISOString()
//     }))
//   );
// });
// 
// projectRouter.get("/projects/:key/board", async (req, res) => {
//   const project = await prisma.project.findUnique({
//     where: { key: req.params.key.toUpperCase() },
//     include: {
//       lead: { select: userSelect },
//       columns: { orderBy: { order: "asc" } },
//       issues: {
//         orderBy: [{ status: "asc" }, { rank: "asc" }],
//         include: {
//           assignee: { select: userSelect },
//           reporter: { select: userSelect }
//         }
//       },
//       sprints: { orderBy: { startsAt: "desc" }, take: 1 }
//     }
//   });
// 
//   if (!project) {
//     res.status(404).json({ error: { code: "PROJECT_NOT_FOUND", message: "Project was not found." } });
//     return;
//   }
// 
//   const team = await prisma.user.findMany({ orderBy: { name: "asc" }, select: userSelect });
// 
//   res.json({
//     project: {
//       id: project.id,
//       key: project.key,
//       name: project.name,
//       description: project.description,
//       health: toProjectHealth(project.health),
//       lead: toUser(project.lead),
//       issueCount: project.issues.length,
//       doneCount: project.issues.filter((issue) => issue.status === "DONE").length,
//       updatedAt: project.updatedAt.toISOString()
//     },
//     columns: project.columns,
//     issues: project.issues.map(toIso),
//     team: team.map(toUser),
//     activeSprint: project.sprints[0]
//       ? {
//           id: project.sprints[0].id,
//           name: project.sprints[0].name,
//           goal: project.sprints[0].goal,
//           startsAt: project.sprints[0].startsAt.toISOString(),
//           endsAt: project.sprints[0].endsAt.toISOString()
//         }
//       : null
//   });
// });
// 
// projectRouter.post(
//   "/issues",
//   requireRole(["ADMIN", "PROJECT_MANAGER", "ENGINEER"]),
//   async (req, res) => {
//     const input = createIssueSchema.parse(req.body);
//     const project = await prisma.project.findUnique({
//       where: { id: input.projectId },
//       include: { issues: { select: { key: true, rank: true } } }
//     });
// 
//     if (!project || !req.actor) {
//       res.status(404).json({ error: { code: "PROJECT_NOT_FOUND", message: "Project was not found." } });
//       return;
//     }
// 
//     const nextNumber =
//       Math.max(
//         0,
//         ...project.issues.map((issue) => Number(issue.key.replace(`${project.key}-`, "")) || 0)
//       ) + 1;
// 
//     const issue = await prisma.issue.create({
//       data: {
//         key: `${project.key}-${nextNumber}`,
//         projectId: input.projectId,
//         title: input.title,
//         description: input.description,
//         type: input.type,
//         priority: input.priority,
//         assigneeId: input.assigneeId,
//         storyPoints: input.storyPoints,
//         reporterId: req.actor.id,
//         rank: Math.max(0, ...project.issues.map((item) => item.rank)) + 10
//       },
//       include: {
//         assignee: { select: userSelect },
//         reporter: { select: userSelect }
//       }
//     });
// 
//     await prisma.auditEvent.create({
//       data: {
//         actorId: req.actor.id,
//         action: "issue.created",
//         entity: "Issue",
//         entityId: issue.id,
//         metadata: JSON.stringify({ key: issue.key })
//       }
//     });
// 
//     res.status(201).json(toIso(issue));
//   }
// );
// 
// projectRouter.patch(
//   "/issues/:id",
//   requireRole(["ADMIN", "PROJECT_MANAGER", "ENGINEER"]),
//   async (req, res) => {
//     const input = updateIssueSchema.parse(req.body);
//     const issueId = String(req.params.id);
// 
//     const existing = await prisma.issue.findUnique({ where: { id: issueId } });
//     if (!existing || !req.actor) {
//       res.status(404).json({ error: { code: "ISSUE_NOT_FOUND", message: "Issue was not found." } });
//       return;
//     }
// 
//     const issue = await prisma.issue.update({
//       where: { id: issueId },
//       data: {
//         ...input,
//         dueDate: input.dueDate === undefined ? undefined : input.dueDate ? new Date(input.dueDate) : null
//       },
//       include: {
//         assignee: { select: userSelect },
//         reporter: { select: userSelect }
//       }
//     });
// 
//     await prisma.auditEvent.create({
//       data: {
//         actorId: req.actor.id,
//         action: "issue.updated",
//         entity: "Issue",
//         entityId: issue.id,
//         metadata: JSON.stringify({ before: existing, after: input })
//       }
//     });
// 
//     res.json(toIso(issue));
//   }
// );
// 
// projectRouter.get("/audit", requireRole(["ADMIN", "PROJECT_MANAGER"]), async (_req, res) => {
//   const events = await prisma.auditEvent.findMany({
//     orderBy: { createdAt: "desc" },
//     take: 50,
//     include: { actor: { select: userSelect } }
//   });
// 
//   res.json(
//     events.map((event) => ({
//       ...event,
//       actor: event.actor ? toUser(event.actor) : null,
//       metadata: event.metadata ? JSON.parse(event.metadata) : null,
//       createdAt: event.createdAt.toISOString()
//     }))
//   );
// });
// 