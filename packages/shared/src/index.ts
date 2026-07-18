// Archived pre-.NET migration. Kept for future review; not active.
// import { z } from "zod";
// 
// export const issueStatusSchema = z.enum(["BACKLOG", "TODO", "IN_PROGRESS", "IN_REVIEW", "DONE"]);
// export const issuePrioritySchema = z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]);
// export const issueTypeSchema = z.enum(["STORY", "TASK", "BUG", "EPIC"]);
// export const userRoleSchema = z.enum(["ADMIN", "PROJECT_MANAGER", "ENGINEER", "VIEWER"]);
// export const projectHealthSchema = z.enum(["ON_TRACK", "AT_RISK", "OFF_TRACK"]);
// 
// export const userSchema = z.object({
//   id: z.string(),
//   name: z.string(),
//   email: z.string().email(),
//   avatarUrl: z.string().nullable(),
//   role: userRoleSchema
// });
// 
// export const projectSummarySchema = z.object({
//   id: z.string(),
//   key: z.string(),
//   name: z.string(),
//   description: z.string(),
//   health: projectHealthSchema,
//   lead: userSchema,
//   issueCount: z.number(),
//   doneCount: z.number(),
//   updatedAt: z.string()
// });
// 
// export const boardColumnSchema = z.object({
//   id: z.string(),
//   name: z.string(),
//   status: issueStatusSchema,
//   order: z.number(),
//   wipLimit: z.number().nullable()
// });
// 
// export const issueSchema = z.object({
//   id: z.string(),
//   key: z.string(),
//   title: z.string(),
//   description: z.string().nullable(),
//   status: issueStatusSchema,
//   type: issueTypeSchema,
//   priority: issuePrioritySchema,
//   storyPoints: z.number().nullable(),
//   rank: z.number(),
//   dueDate: z.string().nullable(),
//   assignee: userSchema.nullable(),
//   reporter: userSchema,
//   updatedAt: z.string()
// });
// 
// export const boardResponseSchema = z.object({
//   project: projectSummarySchema,
//   columns: z.array(boardColumnSchema),
//   issues: z.array(issueSchema),
//   team: z.array(userSchema),
//   activeSprint: z
//     .object({
//       id: z.string(),
//       name: z.string(),
//       goal: z.string(),
//       startsAt: z.string(),
//       endsAt: z.string()
//     })
//     .nullable()
// });
// 
// export const updateIssueSchema = z.object({
//   title: z.string().min(3).max(160).optional(),
//   description: z.string().max(4000).nullable().optional(),
//   status: issueStatusSchema.optional(),
//   priority: issuePrioritySchema.optional(),
//   assigneeId: z.string().nullable().optional(),
//   storyPoints: z.number().int().min(0).max(100).nullable().optional(),
//   rank: z.number().int().min(0).optional(),
//   dueDate: z.string().datetime().nullable().optional()
// });
// 
// export const createIssueSchema = z.object({
//   projectId: z.string(),
//   title: z.string().min(3).max(160),
//   description: z.string().max(4000).optional(),
//   type: issueTypeSchema.default("TASK"),
//   priority: issuePrioritySchema.default("MEDIUM"),
//   assigneeId: z.string().nullable().optional(),
//   storyPoints: z.number().int().min(0).max(100).nullable().optional()
// });
// 
// export type IssueStatus = z.infer<typeof issueStatusSchema>;
// export type IssuePriority = z.infer<typeof issuePrioritySchema>;
// export type IssueType = z.infer<typeof issueTypeSchema>;
// export type UserRole = z.infer<typeof userRoleSchema>;
// export type ProjectHealth = z.infer<typeof projectHealthSchema>;
// export type User = z.infer<typeof userSchema>;
// export type ProjectSummary = z.infer<typeof projectSummarySchema>;
// export type BoardColumn = z.infer<typeof boardColumnSchema>;
// export type Issue = z.infer<typeof issueSchema>;
// export type BoardResponse = z.infer<typeof boardResponseSchema>;
// export type UpdateIssueInput = z.infer<typeof updateIssueSchema>;
// export type CreateIssueInput = z.infer<typeof createIssueSchema>;
// 