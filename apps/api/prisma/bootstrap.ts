// Archived pre-.NET migration. Kept for future review; not active.
// import { PrismaClient } from "@prisma/client";
// 
// const prisma = new PrismaClient();
// 
// async function main() {
//   await prisma.$executeRawUnsafe("PRAGMA foreign_keys = ON;");
// 
//   await prisma.$executeRawUnsafe(`
//     CREATE TABLE IF NOT EXISTS "User" (
//       "id" TEXT NOT NULL PRIMARY KEY,
//       "name" TEXT NOT NULL,
//       "email" TEXT NOT NULL UNIQUE,
//       "avatarUrl" TEXT,
//       "role" TEXT NOT NULL DEFAULT 'ENGINEER',
//       "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
//     );
//   `);
// 
//   await prisma.$executeRawUnsafe(`
//     CREATE TABLE IF NOT EXISTS "Project" (
//       "id" TEXT NOT NULL PRIMARY KEY,
//       "key" TEXT NOT NULL UNIQUE,
//       "name" TEXT NOT NULL,
//       "description" TEXT NOT NULL,
//       "health" TEXT NOT NULL DEFAULT 'ON_TRACK',
//       "leadId" TEXT NOT NULL,
//       "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
//       "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
//       CONSTRAINT "Project_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "User" ("id")
//     );
//   `);
// 
//   await prisma.$executeRawUnsafe(`
//     CREATE TABLE IF NOT EXISTS "BoardColumn" (
//       "id" TEXT NOT NULL PRIMARY KEY,
//       "name" TEXT NOT NULL,
//       "status" TEXT NOT NULL,
//       "order" INTEGER NOT NULL,
//       "wipLimit" INTEGER,
//       "projectId" TEXT NOT NULL,
//       CONSTRAINT "BoardColumn_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE
//     );
//   `);
//   await prisma.$executeRawUnsafe(
//     `CREATE UNIQUE INDEX IF NOT EXISTS "BoardColumn_projectId_status_key" ON "BoardColumn" ("projectId", "status");`
//   );
// 
//   await prisma.$executeRawUnsafe(`
//     CREATE TABLE IF NOT EXISTS "Sprint" (
//       "id" TEXT NOT NULL PRIMARY KEY,
//       "name" TEXT NOT NULL,
//       "goal" TEXT NOT NULL,
//       "startsAt" DATETIME NOT NULL,
//       "endsAt" DATETIME NOT NULL,
//       "projectId" TEXT NOT NULL,
//       CONSTRAINT "Sprint_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE
//     );
//   `);
// 
//   await prisma.$executeRawUnsafe(`
//     CREATE TABLE IF NOT EXISTS "Issue" (
//       "id" TEXT NOT NULL PRIMARY KEY,
//       "key" TEXT NOT NULL UNIQUE,
//       "title" TEXT NOT NULL,
//       "description" TEXT,
//       "status" TEXT NOT NULL DEFAULT 'TODO',
//       "type" TEXT NOT NULL DEFAULT 'TASK',
//       "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
//       "storyPoints" INTEGER,
//       "rank" INTEGER NOT NULL DEFAULT 0,
//       "dueDate" DATETIME,
//       "projectId" TEXT NOT NULL,
//       "sprintId" TEXT,
//       "assigneeId" TEXT,
//       "reporterId" TEXT NOT NULL,
//       "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
//       "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
//       CONSTRAINT "Issue_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE,
//       CONSTRAINT "Issue_sprintId_fkey" FOREIGN KEY ("sprintId") REFERENCES "Sprint" ("id") ON DELETE SET NULL,
//       CONSTRAINT "Issue_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "User" ("id") ON DELETE SET NULL,
//       CONSTRAINT "Issue_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "User" ("id")
//     );
//   `);
// 
//   await prisma.$executeRawUnsafe(`
//     CREATE TABLE IF NOT EXISTS "AuditEvent" (
//       "id" TEXT NOT NULL PRIMARY KEY,
//       "actorId" TEXT,
//       "action" TEXT NOT NULL,
//       "entity" TEXT NOT NULL,
//       "entityId" TEXT NOT NULL,
//       "metadata" TEXT,
//       "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
//       CONSTRAINT "AuditEvent_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User" ("id") ON DELETE SET NULL
//     );
//   `);
// }
// 
// main()
//   .then(async () => {
//     await prisma.$disconnect();
//   })
//   .catch(async (error) => {
//     console.error(error);
//     await prisma.$disconnect();
//     process.exit(1);
//   });
// 