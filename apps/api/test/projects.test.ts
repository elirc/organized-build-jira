// Archived pre-.NET migration. Kept for future review; not active.
// import request from "supertest";
// import { beforeAll, describe, expect, it } from "vitest";
// import { createApp } from "../src/app.js";
// import { prisma } from "../src/lib/prisma.js";
// 
// const app = createApp();
// 
// beforeAll(async () => {
//   const userCount = await prisma.user.count();
//   if (userCount === 0) {
//     throw new Error("Test database is empty. Run npm run db:seed before tests.");
//   }
// });
// 
// describe("project API", () => {
//   it("returns portfolio projects", async () => {
//     const response = await request(app).get("/api/projects").expect(200);
//     expect(response.body.length).toBeGreaterThan(0);
//     expect(response.body[0]).toHaveProperty("key");
//   });
// 
//   it("returns a board for a project key", async () => {
//     const response = await request(app).get("/api/projects/ATLAS/board").expect(200);
//     expect(response.body.columns.length).toBe(5);
//     expect(response.body.issues.length).toBeGreaterThan(0);
//   });
// 
//   it("validates issue updates", async () => {
//     const board = await request(app).get("/api/projects/ATLAS/board");
//     const issueId = board.body.issues[0].id;
// 
//     await request(app).patch(`/api/issues/${issueId}`).send({ storyPoints: 1000 }).expect(400);
//   });
// });
// 