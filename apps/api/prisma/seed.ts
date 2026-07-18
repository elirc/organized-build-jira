// Archived pre-.NET migration. Kept for future review; not active.
// import { PrismaClient } from "@prisma/client";
// 
// const prisma = new PrismaClient();
// 
// const columns = [
//   ["Backlog", "BACKLOG", 20],
//   ["Selected", "TODO", 10],
//   ["In Progress", "IN_PROGRESS", 5],
//   ["Code Review", "IN_REVIEW", 4],
//   ["Done", "DONE", null]
// ] as const;
// 
// async function main() {
//   await prisma.auditEvent.deleteMany();
//   await prisma.issue.deleteMany();
//   await prisma.sprint.deleteMany();
//   await prisma.boardColumn.deleteMany();
//   await prisma.project.deleteMany();
//   await prisma.user.deleteMany();
// 
//   const [alex, priya, mateo] = await Promise.all([
//     prisma.user.create({
//       data: {
//         name: "Alex Morgan",
//         email: "alex@buildjira.test",
//         role: "PROJECT_MANAGER",
//         avatarUrl: "https://api.dicebear.com/8.x/initials/svg?seed=Alex%20Morgan"
//       }
//     }),
//     prisma.user.create({
//       data: {
//         name: "Priya Shah",
//         email: "priya@buildjira.test",
//         role: "ENGINEER",
//         avatarUrl: "https://api.dicebear.com/8.x/initials/svg?seed=Priya%20Shah"
//       }
//     }),
//     prisma.user.create({
//       data: {
//         name: "Mateo Ruiz",
//         email: "mateo@buildjira.test",
//         role: "ENGINEER",
//         avatarUrl: "https://api.dicebear.com/8.x/initials/svg?seed=Mateo%20Ruiz"
//       }
//     }),
//     prisma.user.create({
//       data: {
//         name: "Sam Taylor",
//         email: "sam@buildjira.test",
//         role: "VIEWER",
//         avatarUrl: "https://api.dicebear.com/8.x/initials/svg?seed=Sam%20Taylor"
//       }
//     })
//   ]);
// 
//   const atlas = await prisma.project.create({
//     data: {
//       key: "ATLAS",
//       name: "Atlas Platform",
//       description: "Enterprise work management for product and engineering teams.",
//       health: "ON_TRACK",
//       leadId: alex.id
//     }
//   });
// 
//   const beacon = await prisma.project.create({
//     data: {
//       key: "BEACON",
//       name: "Beacon Rollout",
//       description: "Operational launch planning for customer-facing initiatives.",
//       health: "AT_RISK",
//       leadId: alex.id
//     }
//   });
// 
//   await Promise.all(
//     [atlas, beacon].flatMap((project) =>
//       columns.map(([name, status, wipLimit], order) =>
//         prisma.boardColumn.create({
//           data: { projectId: project.id, name, status, order, wipLimit }
//         })
//       )
//     )
//   );
// 
//   const sprint = await prisma.sprint.create({
//     data: {
//       projectId: atlas.id,
//       name: "Atlas Sprint 12",
//       goal: "Harden workflow visibility for enterprise pilots",
//       startsAt: new Date("2026-05-18T08:00:00.000Z"),
//       endsAt: new Date("2026-05-31T18:00:00.000Z")
//     }
//   });
// 
//   await prisma.issue.createMany({
//     data: [
//       {
//         key: "ATLAS-101",
//         projectId: atlas.id,
//         sprintId: sprint.id,
//         title: "Add portfolio health indicators",
//         description: "Show delivery health and completion ratios on the project portfolio.",
//         status: "DONE",
//         type: "STORY",
//         priority: "HIGH",
//         storyPoints: 5,
//         rank: 10,
//         assigneeId: priya.id,
//         reporterId: alex.id
//       },
//       {
//         key: "ATLAS-102",
//         projectId: atlas.id,
//         sprintId: sprint.id,
//         title: "Support WIP limits on board columns",
//         description: "Surface limits and overloaded states for engineering workflows.",
//         status: "IN_REVIEW",
//         type: "TASK",
//         priority: "MEDIUM",
//         storyPoints: 3,
//         rank: 20,
//         assigneeId: mateo.id,
//         reporterId: alex.id
//       },
//       {
//         key: "ATLAS-103",
//         projectId: atlas.id,
//         sprintId: sprint.id,
//         title: "Fix stale issue counts after status updates",
//         description: "Counts should refresh immediately when an issue changes status.",
//         status: "IN_PROGRESS",
//         type: "BUG",
//         priority: "CRITICAL",
//         storyPoints: 2,
//         rank: 30,
//         assigneeId: priya.id,
//         reporterId: mateo.id
//       },
//       {
//         key: "ATLAS-104",
//         projectId: atlas.id,
//         sprintId: sprint.id,
//         title: "Design audit log data model",
//         description: "Create a minimal audit trail for issue mutations.",
//         status: "TODO",
//         type: "TASK",
//         priority: "HIGH",
//         storyPoints: 5,
//         rank: 40,
//         assigneeId: mateo.id,
//         reporterId: alex.id
//       },
//       {
//         key: "ATLAS-105",
//         projectId: atlas.id,
//         title: "Explore SLA reporting for support queues",
//         description: "Discovery task for later enterprise reporting work.",
//         status: "BACKLOG",
//         type: "EPIC",
//         priority: "LOW",
//         storyPoints: 13,
//         rank: 50,
//         assigneeId: null,
//         reporterId: alex.id
//       },
//       {
//         key: "BEACON-1",
//         projectId: beacon.id,
//         title: "Prepare release readiness checklist",
//         description: "Track launch dependencies for customer operations.",
//         status: "IN_PROGRESS",
//         type: "STORY",
//         priority: "HIGH",
//         storyPoints: 8,
//         rank: 10,
//         assigneeId: priya.id,
//         reporterId: alex.id
//       }
//     ]
//   });
// 
//   await prisma.auditEvent.create({
//     data: {
//       actorId: alex.id,
//       action: "project.seeded",
//       entity: "Project",
//       entityId: atlas.id,
//       metadata: JSON.stringify({ source: "seed" })
//     }
//   });
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