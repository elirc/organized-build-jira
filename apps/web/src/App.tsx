// Archived pre-.NET migration. Kept for future review; not active.
// import { AlertTriangle, BarChart3, CheckCircle2, LayoutDashboard, Loader2, Search, ShieldCheck } from "lucide-react";
// import { useEffect, useMemo, useState } from "react";
// import type { BoardResponse, Issue, IssuePriority, IssueStatus, ProjectSummary, UpdateIssueInput } from "@buildjira/shared";
// import { getBoard, getProjects, updateIssue } from "./lib/api";
// 
// const statusTone: Record<IssueStatus, string> = {
//   BACKLOG: "neutral",
//   TODO: "blue",
//   IN_PROGRESS: "amber",
//   IN_REVIEW: "purple",
//   DONE: "green"
// };
// 
// const priorityLabel: Record<IssuePriority, string> = {
//   LOW: "Low",
//   MEDIUM: "Medium",
//   HIGH: "High",
//   CRITICAL: "Critical"
// };
// 
// export function App() {
//   const [projects, setProjects] = useState<ProjectSummary[]>([]);
//   const [selectedProjectKey, setSelectedProjectKey] = useState("ATLAS");
//   const [board, setBoard] = useState<BoardResponse | null>(null);
//   const [query, setQuery] = useState("");
//   const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
//   const [isLoading, setIsLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);
// 
//   useEffect(() => {
//     let isMounted = true;
// 
//     async function loadPortfolio() {
//       try {
//         const nextProjects = await getProjects();
//         if (isMounted) {
//           setProjects(nextProjects);
//           setSelectedProjectKey((current) => nextProjects.find((project) => project.key === current)?.key ?? nextProjects[0]?.key ?? "ATLAS");
//         }
//       } catch (loadError) {
//         if (isMounted) setError(loadError instanceof Error ? loadError.message : "Unable to load portfolio.");
//       }
//     }
// 
//     loadPortfolio();
//     return () => {
//       isMounted = false;
//     };
//   }, []);
// 
//   useEffect(() => {
//     let isMounted = true;
// 
//     async function loadBoard() {
//       setIsLoading(true);
//       setError(null);
//       try {
//         const nextBoard = await getBoard(selectedProjectKey);
//         if (isMounted) {
//           setBoard(nextBoard);
//           setSelectedIssue(nextBoard.issues[0] ?? null);
//         }
//       } catch (loadError) {
//         if (isMounted) setError(loadError instanceof Error ? loadError.message : "Unable to load board.");
//       } finally {
//         if (isMounted) setIsLoading(false);
//       }
//     }
// 
//     loadBoard();
//     return () => {
//       isMounted = false;
//     };
//   }, [selectedProjectKey]);
// 
//   const filteredIssues = useMemo(() => {
//     const normalized = query.trim().toLowerCase();
//     if (!board || !normalized) return board?.issues ?? [];
//     return board.issues.filter((issue) => `${issue.key} ${issue.title} ${issue.assignee?.name ?? ""}`.toLowerCase().includes(normalized));
//   }, [board, query]);
// 
//   async function mutateIssue(issueId: string, input: UpdateIssueInput) {
//     const nextIssue = await updateIssue(issueId, input);
//     setBoard((current) => {
//       if (!current) return current;
//       return {
//         ...current,
//         issues: current.issues.map((issue) => (issue.id === nextIssue.id ? nextIssue : issue)),
//         project: {
//           ...current.project,
//           doneCount:
//             input.status === undefined
//               ? current.project.doneCount
//               : current.issues.map((issue) => (issue.id === nextIssue.id ? nextIssue : issue)).filter((issue) => issue.status === "DONE").length
//         }
//       };
//     });
//     setSelectedIssue(nextIssue);
//   }
// 
//   const selectedProject = projects.find((project) => project.key === selectedProjectKey);
// 
//   return (
//     <div className="app-shell">
//       <aside className="sidebar">
//         <div className="brand">
//           <div className="brand-mark">BJ</div>
//           <div>
//             <strong>BuildJira</strong>
//             <span>Enterprise delivery</span>
//           </div>
//         </div>
// 
//         <nav className="nav-list" aria-label="Primary">
//           <button className="nav-item active">
//             <LayoutDashboard size={17} />
//             Board
//           </button>
//           <button className="nav-item">
//             <BarChart3 size={17} />
//             Reports
//           </button>
//           <button className="nav-item">
//             <ShieldCheck size={17} />
//             Governance
//           </button>
//         </nav>
// 
//         <div className="project-switcher">
//           <span className="section-label">Projects</span>
//           {projects.map((project) => (
//             <button
//               key={project.id}
//               className={`project-pill ${project.key === selectedProjectKey ? "selected" : ""}`}
//               onClick={() => setSelectedProjectKey(project.key)}
//             >
//               <span>{project.key}</span>
//               <small>{project.health.replace("_", " ")}</small>
//             </button>
//           ))}
//         </div>
//       </aside>
// 
//       <main className="workspace">
//         <header className="topbar">
//           <div>
//             <span className="breadcrumb">Projects / {selectedProject?.key ?? selectedProjectKey}</span>
//             <h1>{selectedProject?.name ?? "Project board"}</h1>
//           </div>
//           <label className="search-box">
//             <Search size={17} />
//             <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search issues" />
//           </label>
//         </header>
// 
//         {error ? <ErrorState message={error} /> : null}
//         {isLoading ? <LoadingState /> : null}
// 
//         {board && !isLoading ? (
//           <>
//             <section className="metrics-row" aria-label="Project metrics">
//               <Metric label="Issues" value={board.project.issueCount.toString()} />
//               <Metric label="Done" value={board.project.doneCount.toString()} />
//               <Metric label="Lead" value={board.project.lead.name} />
//               <Metric label="Sprint" value={board.activeSprint?.name ?? "Planning"} />
//             </section>
// 
//             <section className="board-layout">
//               <div className="kanban" aria-label="Issue board">
//                 {board.columns.map((column) => {
//                   const issues = filteredIssues.filter((issue) => issue.status === column.status);
//                   return (
//                     <section className="column" key={column.id}>
//                       <div className="column-header">
//                         <div>
//                           <h2>{column.name}</h2>
//                           <span>{issues.length} issues</span>
//                         </div>
//                         {column.wipLimit ? <span className={issues.length > column.wipLimit ? "wip danger" : "wip"}>{column.wipLimit}</span> : null}
//                       </div>
// 
//                       <div className="issue-stack">
//                         {issues.map((issue) => (
//                           <IssueCard key={issue.id} issue={issue} selected={selectedIssue?.id === issue.id} onSelect={setSelectedIssue} />
//                         ))}
//                       </div>
//                     </section>
//                   );
//                 })}
//               </div>
// 
//               <IssuePanel board={board} issue={selectedIssue} onChange={mutateIssue} />
//             </section>
//           </>
//         ) : null}
//       </main>
//     </div>
//   );
// }
// 
// function Metric({ label, value }: { label: string; value: string }) {
//   return (
//     <div className="metric">
//       <span>{label}</span>
//       <strong>{value}</strong>
//     </div>
//   );
// }
// 
// function IssueCard({ issue, selected, onSelect }: { issue: Issue; selected: boolean; onSelect: (issue: Issue) => void }) {
//   return (
//     <button className={`issue-card ${selected ? "selected" : ""}`} onClick={() => onSelect(issue)}>
//       <div className="issue-card-header">
//         <span className={`status-dot ${statusTone[issue.status]}`} />
//         <span>{issue.key}</span>
//         <strong>{priorityLabel[issue.priority]}</strong>
//       </div>
//       <h3>{issue.title}</h3>
//       <div className="issue-meta">
//         <span>{issue.type}</span>
//         <span>{issue.storyPoints ?? 0} pts</span>
//         <span>{issue.assignee?.name ?? "Unassigned"}</span>
//       </div>
//     </button>
//   );
// }
// 
// function IssuePanel({
//   board,
//   issue,
//   onChange
// }: {
//   board: BoardResponse;
//   issue: Issue | null;
//   onChange: (issueId: string, input: UpdateIssueInput) => Promise<void>;
// }) {
//   const [isSaving, setIsSaving] = useState(false);
// 
//   useEffect(() => {
//     setIsSaving(false);
//   }, [issue?.id]);
// 
//   if (!issue) {
//     return (
//       <aside className="issue-panel empty">
//         <CheckCircle2 size={24} />
//         <span>Select an issue</span>
//       </aside>
//     );
//   }
// 
//   async function save(input: UpdateIssueInput) {
//     if (!issue) return;
//     setIsSaving(true);
//     try {
//       await onChange(issue.id, input);
//     } finally {
//       setIsSaving(false);
//     }
//   }
// 
//   return (
//     <aside className="issue-panel">
//       <div className="panel-heading">
//         <span>{issue.key}</span>
//         {isSaving ? <Loader2 className="spin" size={16} /> : null}
//       </div>
//       <h2>{issue.title}</h2>
//       <p>{issue.description}</p>
// 
//       <label>
//         Status
//         <select value={issue.status} onChange={(event) => save({ status: event.target.value as IssueStatus })}>
//           {board.columns.map((column) => (
//             <option key={column.status} value={column.status}>
//               {column.name}
//             </option>
//           ))}
//         </select>
//       </label>
// 
//       <label>
//         Assignee
//         <select value={issue.assignee?.id ?? ""} onChange={(event) => save({ assigneeId: event.target.value || null })}>
//           <option value="">Unassigned</option>
//           {board.team.map((user) => (
//             <option key={user.id} value={user.id}>
//               {user.name}
//             </option>
//           ))}
//         </select>
//       </label>
// 
//       <label>
//         Priority
//         <select value={issue.priority} onChange={(event) => save({ priority: event.target.value as IssuePriority })}>
//           {Object.keys(priorityLabel).map((priority) => (
//             <option key={priority} value={priority}>
//               {priorityLabel[priority as IssuePriority]}
//             </option>
//           ))}
//         </select>
//       </label>
// 
//       <label>
//         Story points
//         <input
//           type="number"
//           min={0}
//           max={100}
//           value={issue.storyPoints ?? 0}
//           onChange={(event) => save({ storyPoints: Number(event.target.value) })}
//         />
//       </label>
//     </aside>
//   );
// }
// 
// function LoadingState() {
//   return (
//     <div className="state-row">
//       <Loader2 className="spin" size={18} />
//       <span>Loading workspace</span>
//     </div>
//   );
// }
// 
// function ErrorState({ message }: { message: string }) {
//   return (
//     <div className="error-row">
//       <AlertTriangle size={18} />
//       <span>{message}</span>
//     </div>
//   );
// }
// 