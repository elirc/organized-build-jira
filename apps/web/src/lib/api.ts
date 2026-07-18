// Archived pre-.NET migration. Kept for future review; not active.
// import {
//   boardResponseSchema,
//   projectSummarySchema,
//   type BoardResponse,
//   type Issue,
//   type ProjectSummary,
//   type UpdateIssueInput
// } from "@buildjira/shared";
// import { z } from "zod";
// 
// const apiUrl = import.meta.env.VITE_API_URL ?? "http://localhost:4000";
// 
// async function request<T>(path: string, schema: z.ZodType<T>, init?: RequestInit): Promise<T> {
//   const response = await fetch(`${apiUrl}${path}`, {
//     ...init,
//     headers: {
//       "content-type": "application/json",
//       ...(init?.headers ?? {})
//     }
//   });
// 
//   const payload = await response.json();
// 
//   if (!response.ok) {
//     throw new Error(payload.error?.message ?? "Request failed");
//   }
// 
//   return schema.parse(payload);
// }
// 
// export function getProjects(): Promise<ProjectSummary[]> {
//   return request("/api/projects", z.array(projectSummarySchema));
// }
// 
// export function getBoard(projectKey: string): Promise<BoardResponse> {
//   return request(`/api/projects/${projectKey}/board`, boardResponseSchema);
// }
// 
// export function updateIssue(issueId: string, input: UpdateIssueInput): Promise<Issue> {
//   return request(`/api/issues/${issueId}`, boardResponseSchema.shape.issues.element, {
//     method: "PATCH",
//     body: JSON.stringify(input)
//   });
// }
// 