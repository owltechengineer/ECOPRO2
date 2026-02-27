"use client";

import { use, useState, useEffect } from "react";
import { notFound } from "next/navigation";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { getProjects } from "@/actions/projects";
import { getTasks } from "@/actions/tasks";
import { useActivity } from "@/hooks/useActivity";
import { ActivityActions } from "@/components/dashboard/ActivityActions";
import {
  cn,
  formatCurrency,
  formatDate,
  getStatusBg,
  getPriorityBg,
  formatHours,
  daysUntil,
} from "@/lib/utils";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { ProjectForm } from "@/components/forms/ProjectForm";
import { TaskForm } from "@/components/forms/TaskForm";
import { deleteProject } from "@/actions/projects";
import { deleteTask, updateTaskStatus } from "@/actions/tasks";
import type { Project, Task } from "@/types";
import {
  BarChart2,
  Clock,
  CheckSquare,
  AlertTriangle,
  Plus,
  Pencil,
  Trash2,
  ChevronDown,
  ChevronUp,
  Calendar,
  CheckCircle2,
} from "lucide-react";

// ─────────────────────────────────────────────
// Gantt-like timeline component
// ─────────────────────────────────────────────

function GanttChart({ projects }: { projects: Project[] }) {
  const now = new Date();

  const allDates = projects.flatMap((p) => [
    new Date(p.startDate),
    new Date(p.endDate),
  ]);
  const minDate = new Date(Math.min(...allDates.map((d) => d.getTime())));
  const maxDate = new Date(Math.max(...allDates.map((d) => d.getTime())));

  const totalDays = Math.max(
    1,
    (maxDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  function getOffset(date: Date): number {
    return (
      ((date.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24) /
        totalDays) *
      100
    );
  }

  function getWidth(start: Date, end: Date): number {
    return (
      ((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24) / totalDays) *
      100
    );
  }

  const months: string[] = [];
  const cursor = new Date(minDate);
  cursor.setDate(1);
  while (cursor <= maxDate) {
    months.push(
      cursor.toLocaleDateString("it-IT", { month: "short", year: "2-digit" })
    );
    cursor.setMonth(cursor.getMonth() + 1);
  }

  const todayOffset = getOffset(now);

  const statusColors: Record<string, string> = {
    in_progress: "#6366f1",
    planning: "#8b5cf6",
    completed: "#10b981",
    on_hold: "#f59e0b",
    backlog: "#64748b",
    cancelled: "#f43f5e",
  };

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[600px]">
        {/* Month headers */}
        <div className="flex mb-2 pl-44">
          {months.map((m) => (
            <div
              key={m}
              className="flex-1 text-center text-[10px] text-muted-foreground border-l border-border/30 pl-1"
            >
              {m}
            </div>
          ))}
        </div>

        {/* Gantt rows */}
        <div className="space-y-2">
          {projects.map((project) => {
            const start = new Date(project.startDate);
            const end = new Date(project.endDate);
            const offset = getOffset(start);
            const width = Math.max(1, getWidth(start, end));
            const color =
              statusColors[project.status] ?? "#6366f1";

            return (
              <div key={project.id} className="flex items-center gap-3">
                {/* Project label */}
                <div className="w-40 shrink-0">
                  <p className="text-xs font-medium truncate">{project.name}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {project.completionPct}% complete
                  </p>
                </div>

                {/* Bar area */}
                <div className="flex-1 relative h-7 bg-secondary/30 rounded-md overflow-hidden">
                  {/* Today marker */}
                  {todayOffset >= 0 && todayOffset <= 100 && (
                    <div
                      className="absolute top-0 bottom-0 w-px bg-red-400/60 z-10"
                      style={{ left: `${todayOffset}%` }}
                    />
                  )}

                  {/* Project bar */}
                  <div
                    className="absolute top-1 bottom-1 rounded-sm flex items-center px-2"
                    style={{
                      left: `${Math.max(0, offset)}%`,
                      width: `${Math.min(100 - Math.max(0, offset), width)}%`,
                      backgroundColor: `${color}25`,
                      border: `1px solid ${color}50`,
                    }}
                  >
                    {/* Progress fill */}
                    <div
                      className="absolute left-0 top-0 bottom-0 rounded-sm"
                      style={{
                        width: `${project.completionPct}%`,
                        backgroundColor: `${color}40`,
                      }}
                    />
                    <span
                      className="relative text-[10px] font-medium truncate z-10"
                      style={{ color }}
                    >
                      {project.name}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Task table
// ─────────────────────────────────────────────

function TaskTable({
  tasks,
  projects,
  onEdit,
  onDelete,
  onStatusChange,
}: {
  tasks: Task[];
  projects: Project[];
  onEdit?: (t: Task) => void;
  onDelete?: (t: Task) => void;
  onStatusChange?: (t: Task, status: Task["status"]) => void;
}) {
  const [filter, setFilter] = useState<string>("all");
  const [sortKey, setSortKey] = useState<"deadline" | "priority">("deadline");

  const projectMap = Object.fromEntries(projects.map((p) => [p.id, p.name]));

  const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };

  const filtered = tasks
    .filter((t) => {
      if (filter === "all") return true;
      if (filter === "overdue")
        return new Date(t.deadline) < new Date() && t.status !== "done";
      return t.status === filter;
    })
    .sort((a, b) => {
      if (sortKey === "deadline") {
        return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
      }
      return (
        (priorityOrder[a.priority as keyof typeof priorityOrder] ?? 2) -
        (priorityOrder[b.priority as keyof typeof priorityOrder] ?? 2)
      );
    });

  const filters = [
    { key: "all", label: "Tutti" },
    { key: "in_progress", label: "In corso" },
    { key: "todo", label: "Da fare" },
    { key: "done", label: "Completati" },
    { key: "blocked", label: "Bloccati" },
    { key: "overdue", label: "In ritardo" },
  ];

  return (
    <div>
      {/* Filter bar */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        {filters.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={cn(
              "px-3 py-1 rounded-lg text-xs font-medium transition-colors",
              filter === f.key
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-accent"
            )}
          >
            {f.label}
          </button>
        ))}

        <div className="ml-auto flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Ordina:</span>
          <button
            onClick={() => setSortKey(sortKey === "deadline" ? "priority" : "deadline")}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            {sortKey === "deadline" ? "Deadline" : "Priorità"}
            <ChevronDown className="h-3 w-3" />
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-lg border border-border/50 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border/50 bg-secondary/30">
              <th className="text-left text-[11px] font-semibold text-muted-foreground px-4 py-2.5">
                Task
              </th>
              <th className="text-left text-[11px] font-semibold text-muted-foreground px-3 py-2.5 hidden sm:table-cell">
                Progetto
              </th>
              <th className="text-left text-[11px] font-semibold text-muted-foreground px-3 py-2.5">
                Status
              </th>
              <th className="text-left text-[11px] font-semibold text-muted-foreground px-3 py-2.5">
                Priorità
              </th>
              <th className="text-left text-[11px] font-semibold text-muted-foreground px-3 py-2.5 hidden md:table-cell">
                Ore
              </th>
              <th className="text-left text-[11px] font-semibold text-muted-foreground px-3 py-2.5">
                Deadline
              </th>
              <th className="text-left text-[11px] font-semibold text-muted-foreground px-3 py-2.5">
                %
              </th>
              <th className="w-16 px-3 py-2.5" />
            </tr>
          </thead>
          <tbody>
            {filtered.map((task) => {
              const days = daysUntil(task.deadline);
              const isOverdue = days < 0 && task.status !== "done";
              return (
                <tr
                  key={task.id}
                  className="table-row group/row"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div
                        className={cn(
                          "h-1.5 w-1.5 rounded-full shrink-0",
                          task.priority === "critical"
                            ? "bg-red-500"
                            : task.priority === "high"
                            ? "bg-orange-500"
                            : task.priority === "medium"
                            ? "bg-amber-500"
                            : "bg-slate-500"
                        )}
                      />
                      <span className="text-sm font-medium">{task.name}</span>
                    </div>
                    {task.owner && (
                      <p className="text-[10px] text-muted-foreground mt-0.5 ml-3.5">
                        @{task.owner}
                      </p>
                    )}
                  </td>
                  <td className="px-3 py-3 hidden sm:table-cell">
                    <span className="text-xs text-muted-foreground">
                      {projectMap[task.projectId] ?? "—"}
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    <span className={cn("badge", getStatusBg(task.status))}>
                      {task.status.replace("_", " ")}
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    <span className={cn("badge", getPriorityBg(task.priority))}>
                      {task.priority}
                    </span>
                  </td>
                  <td className="px-3 py-3 hidden md:table-cell">
                    <span className="text-xs tabular-nums text-muted-foreground">
                      {formatHours(task.actualHours)}/{formatHours(task.estimatedHours)}
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    <span
                      className={cn(
                        "text-xs font-medium tabular-nums",
                        isOverdue
                          ? "text-red-400"
                          : days <= 3
                          ? "text-amber-400"
                          : "text-muted-foreground"
                      )}
                    >
                      {formatDate(task.deadline)}
                      {isOverdue && (
                        <span className="ml-1">
                          ({Math.abs(days)}g scad.)
                        </span>
                      )}
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-2">
                      <Progress
                        value={task.completionPct}
                        size="xs"
                        className="w-14"
                      />
                      <span className="text-[10px] tabular-nums text-muted-foreground">
                        {task.completionPct}%
                      </span>
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-1 opacity-0 group-hover/row:opacity-100 transition-opacity">
                      {task.status !== "done" && onStatusChange && (
                        <button
                          onClick={() => onStatusChange(task, "done")}
                          className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground hover:text-emerald-400 hover:bg-emerald-500/10 transition-colors"
                          title="Segna completato"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                      {onEdit && (
                        <button
                          onClick={() => onEdit(task)}
                          className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                        >
                          <Pencil className="h-3 w-3" />
                        </button>
                      )}
                      {onDelete && (
                        <button
                          onClick={() => onDelete(task)}
                          className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-colors"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {filtered.length === 0 && (
          <div className="py-8 text-center text-sm text-muted-foreground">
            Nessun task trovato
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Project detail expandable card
// ─────────────────────────────────────────────

function ProjectCard({
  project,
  tasks,
}: {
  project: Project;
  tasks: Task[];
}) {
  const [expanded, setExpanded] = useState(false);
  const projectTasks = tasks.filter((t) => t.projectId === project.id);
  const budgetVariance = project.budgetActual - project.budgetEstimated;
  const revenueVariance = project.revenueActual - project.revenueEstimated;

  return (
    <div className="rounded-xl border border-border/50 overflow-hidden">
      <div
        className="flex items-center gap-4 p-4 cursor-pointer hover:bg-accent/20 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-sm font-semibold truncate">{project.name}</h3>
            <span className={cn("badge text-[10px]", getStatusBg(project.status))}>
              {project.status.replace("_", " ")}
            </span>
            <span className={cn("badge text-[10px]", getPriorityBg(project.priority))}>
              {project.priority}
            </span>
          </div>
          <Progress value={project.completionPct} size="sm" showLabel className="mb-1.5" />
          <div className="flex items-center gap-4 text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {formatDate(project.startDate)} → {formatDate(project.endDate)}
            </span>
            <span className={cn(budgetVariance > 0 ? "text-red-400" : "text-emerald-400")}>
              Budget: {formatCurrency(project.budgetActual, "EUR", true)}/
              {formatCurrency(project.budgetEstimated, "EUR", true)}
              {budgetVariance > 0 ? (
                <span className="ml-1 text-red-400">
                  (+{formatCurrency(budgetVariance, "EUR", true)})
                </span>
              ) : (
                <span className="ml-1 text-emerald-400">
                  ({formatCurrency(Math.abs(budgetVariance), "EUR", true)} risparmiato)
                </span>
              )}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="text-right hidden sm:block">
            <p className="text-xs text-muted-foreground">Revenue</p>
            <p className="text-sm font-bold">
              {formatCurrency(project.revenueActual, "EUR", true)}
            </p>
            <p className="text-[10px] text-muted-foreground">
              / {formatCurrency(project.revenueEstimated, "EUR", true)}
            </p>
          </div>
          <div className="text-right hidden sm:block">
            <p className="text-xs text-muted-foreground">Task</p>
            <p className="text-sm font-bold">{projectTasks.length}</p>
          </div>
          {expanded ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
      </div>

      {/* Expanded content */}
      {expanded && (
        <div className="border-t border-border/50 p-4 bg-secondary/10 space-y-4">
          {project.description && (
            <p className="text-xs text-muted-foreground">{project.description}</p>
          )}

          {/* KPI row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-2.5 rounded-lg bg-card border border-border/50 text-center">
              <p className="text-[10px] text-muted-foreground">Budget Variance</p>
              <p className={cn("text-sm font-bold", budgetVariance > 0 ? "text-red-400" : "text-emerald-400")}>
                {budgetVariance > 0 ? "+" : ""}
                {formatCurrency(budgetVariance, "EUR", true)}
              </p>
            </div>
            <div className="p-2.5 rounded-lg bg-card border border-border/50 text-center">
              <p className="text-[10px] text-muted-foreground">Revenue Variance</p>
              <p className={cn("text-sm font-bold", revenueVariance >= 0 ? "text-emerald-400" : "text-red-400")}>
                {revenueVariance > 0 ? "+" : ""}
                {formatCurrency(revenueVariance, "EUR", true)}
              </p>
            </div>
            <div className="p-2.5 rounded-lg bg-card border border-border/50 text-center">
              <p className="text-[10px] text-muted-foreground">Metodologia</p>
              <p className="text-sm font-bold capitalize">{project.methodology}</p>
            </div>
            <div className="p-2.5 rounded-lg bg-card border border-border/50 text-center">
              <p className="text-[10px] text-muted-foreground">Giorni rimanenti</p>
              <p className={cn("text-sm font-bold", daysUntil(project.endDate) < 0 ? "text-red-400" : daysUntil(project.endDate) < 14 ? "text-amber-400" : "")}>
                {daysUntil(project.endDate) < 0
                  ? `${Math.abs(daysUntil(project.endDate))}g in ritardo`
                  : `${daysUntil(project.endDate)}g`}
              </p>
            </div>
          </div>

          {/* Tasks mini table */}
          {projectTasks.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-2">Task</p>
              <div className="space-y-1.5">
                {projectTasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center gap-3 p-2 rounded-lg bg-card/50"
                  >
                    <div
                      className={cn(
                        "h-1.5 w-1.5 rounded-full shrink-0",
                        task.status === "done" ? "bg-emerald-500" :
                        task.status === "in_progress" ? "bg-blue-500" :
                        task.status === "blocked" ? "bg-red-500" : "bg-slate-500"
                      )}
                    />
                    <p className="text-xs flex-1 truncate">{task.name}</p>
                    <span className={cn("badge text-[10px]", getStatusBg(task.status))}>
                      {task.status.replace("_", " ")}
                    </span>
                    <span className="text-[10px] text-muted-foreground tabular-nums">
                      {formatDate(task.deadline)}
                    </span>
                    <Progress value={task.completionPct} size="xs" className="w-12" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tags */}
          {project.tags.length > 0 && (
            <div className="flex gap-1.5">
              {project.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-0.5 rounded text-[10px] bg-secondary text-muted-foreground"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// Main page
// ─────────────────────────────────────────────

export default function ProjectsPage({
  params,
}: {
  params: Promise<{ activityId: string }>;
}) {
  const { activityId } = use(params);
  const activity = useActivity(activityId);
  if (!activity) return notFound();

  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [view, setView] = useState<"list" | "gantt" | "tasks">("list");

  useEffect(() => {
    Promise.all([getProjects(activityId), getTasks(activityId)]).then(
      ([pr, ta]) => {
        if (pr.ok) setProjects(pr.data);
        if (ta.ok) setTasks(ta.data);
        setLoadingData(false);
      }
    );
  }, [activityId]);

  // Modal state
  const [createProjectOpen, setCreateProjectOpen] = useState(false);
  const [editProject, setEditProject] = useState<Project | null>(null);
  const [deleteProject_, setDeleteProject_] = useState<Project | null>(null);
  const [deletingProjectId, setDeletingProjectId] = useState<string | null>(null);
  const [createTaskOpen, setCreateTaskOpen] = useState(false);
  const [editTask, setEditTask] = useState<Task | null>(null);
  const [deleteTask_, setDeleteTask_] = useState<Task | null>(null);
  const [deletingTaskId, setDeletingTaskId] = useState<string | null>(null);

  // ── Delete project ──
  async function handleDeleteProject() {
    if (!deleteProject_) return;
    setDeletingProjectId(deleteProject_.id);
    const result = await deleteProject(deleteProject_.id, activityId);
    setDeletingProjectId(null);
    setDeleteProject_(null);
    if (!result.ok) { toast.error(result.error); return; }
    setProjects((prev) => prev.filter((p) => p.id !== deleteProject_.id));
    toast.success("Progetto eliminato");
  }

  // ── Delete task ──
  async function handleDeleteTask() {
    if (!deleteTask_) return;
    setDeletingTaskId(deleteTask_.id);
    const result = await deleteTask(deleteTask_.id, activityId);
    setDeletingTaskId(null);
    setDeleteTask_(null);
    if (!result.ok) { toast.error(result.error); return; }
    setTasks((prev) => prev.filter((t) => t.id !== deleteTask_.id));
    toast.success("Task eliminato");
  }

  // ── Quick task status ──
  async function handleTaskStatus(task: Task, status: Task["status"]) {
    const result = await updateTaskStatus(task.id, status, activityId);
    if (!result.ok) { toast.error(result.error); return; }
    setTasks((prev) => prev.map((t) => t.id === task.id ? { ...t, status, completionPct: status === "done" ? 100 : t.completionPct } : t));
  }

  const activeProjects = projects.filter((p) => ["in_progress", "planning"].includes(p.status));
  const completedProjects = projects.filter((p) => p.status === "completed");
  const overdueTasks = tasks.filter((t) => t.status !== "done" && new Date(t.deadline) < new Date());
  const totalBudget = projects.reduce((s, p) => s + p.budgetEstimated, 0);
  const totalActual = projects.reduce((s, p) => s + p.budgetActual, 0);

  if (loadingData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground text-sm animate-pulse">Caricamento in corso...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Activity header with CRUD actions */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{activity.name} — Progetti</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{activity.sector}</p>
        </div>
        <ActivityActions activity={activity} showLabels />
      </div>

      {/* KPI bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="kpi-card">
          <div className="flex items-center gap-2">
            <BarChart2 className="h-4 w-4 text-muted-foreground" />
            <span className="data-label">Progetti totali</span>
          </div>
          <span className="text-2xl font-bold">{projects.length}</span>
          <span className="text-xs text-muted-foreground">
            {activeProjects.length} attivi · {completedProjects.length} completati
          </span>
        </div>
        <div className="kpi-card">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="data-label">Budget usato</span>
          </div>
          <span className="text-2xl font-bold">
            {formatCurrency(totalActual, "EUR", true)}
          </span>
          <Progress
            value={totalActual}
            max={totalBudget || 1}
            size="xs"
            color={totalActual > totalBudget ? "bg-red-500" : "bg-blue-500"}
            showLabel
          />
        </div>
        <div className="kpi-card">
          <div className="flex items-center gap-2">
            <CheckSquare className="h-4 w-4 text-muted-foreground" />
            <span className="data-label">Task totali</span>
          </div>
          <span className="text-2xl font-bold">{tasks.length}</span>
          <span className="text-xs text-muted-foreground">
            {tasks.filter((t) => t.status === "done").length} completati
          </span>
        </div>
        <div className="kpi-card">
          <div className="flex items-center gap-2">
            <AlertTriangle
              className={cn(
                "h-4 w-4",
                overdueTasks.length > 0 ? "text-red-400" : "text-muted-foreground"
              )}
            />
            <span className="data-label">Task in ritardo</span>
          </div>
          <span
            className={cn(
              "text-2xl font-bold",
              overdueTasks.length > 0 ? "text-red-400" : "text-emerald-400"
            )}
          >
            {overdueTasks.length}
          </span>
          <span className="text-xs text-muted-foreground">
            {overdueTasks.length === 0
              ? "Tutto nei tempi"
              : "Azione richiesta"}
          </span>
        </div>
      </div>

      {/* View switcher */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1 p-1 rounded-lg bg-secondary/50">
          {(["list", "gantt", "tasks"] as const).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={cn(
                "px-3 py-1.5 rounded-md text-xs font-medium transition-colors capitalize",
                view === v
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {v === "list" ? "Progetti" : v === "gantt" ? "Timeline" : "Task"}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          {view === "tasks" ? (
            <Button size="sm" onClick={() => setCreateTaskOpen(true)}>
              <Plus className="h-3.5 w-3.5" />
              Nuovo Task
            </Button>
          ) : (
            <Button size="sm" onClick={() => setCreateProjectOpen(true)}>
              <Plus className="h-3.5 w-3.5" />
              Nuovo Progetto
            </Button>
          )}
        </div>
      </div>

      {/* Content */}
      {view === "list" && (
        <div className="space-y-3">
          {projects.map((project) => (
            <div key={project.id} className="group relative">
              <ProjectCard project={project} tasks={tasks} />
              {/* Edit / Delete overlay buttons */}
              <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={(e) => { e.stopPropagation(); setEditProject(project); }}
                  className="flex h-7 w-7 items-center justify-center rounded-lg bg-secondary text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); setDeleteProject_(project); }}
                  className="flex h-7 w-7 items-center justify-center rounded-lg bg-secondary text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
          {projects.length === 0 && (
            <Card className="py-12 text-center">
              <p className="text-muted-foreground mb-4">
                Nessun progetto. Crea il tuo primo progetto.
              </p>
              <Button onClick={() => setCreateProjectOpen(true)}>
                <Plus className="h-4 w-4" />
                Crea primo progetto
              </Button>
            </Card>
          )}
        </div>
      )}

      {view === "gantt" && (
        <Card>
          <CardHeader>
            <CardTitle>Timeline Progetti</CardTitle>
            <span className="text-xs text-muted-foreground">La linea rossa indica oggi</span>
          </CardHeader>
          {projects.length > 0 ? (
            <GanttChart projects={projects} />
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">Nessun progetto</p>
          )}
        </Card>
      )}

      {view === "tasks" && (
        <Card>
          <CardHeader>
            <CardTitle>Task Management</CardTitle>
            <Badge variant="neutral">{tasks.length} task</Badge>
          </CardHeader>
          <TaskTableWithCrud
            tasks={tasks}
            projects={projects}
            onEdit={(t) => setEditTask(t)}
            onDelete={(t) => setDeleteTask_(t)}
            onStatusChange={handleTaskStatus}
          />
        </Card>
      )}

      {/* ── CRUD Modals ── */}
      <ProjectForm
        open={createProjectOpen}
        onClose={() => setCreateProjectOpen(false)}
        activityId={activityId}
        activity={activity}
        onSuccess={(p) => setProjects((prev) => [p, ...prev])}
      />
      <ProjectForm
        open={!!editProject}
        onClose={() => setEditProject(null)}
        activityId={activityId}
        activity={activity}
        project={editProject ?? undefined}
        onSuccess={(p) => setProjects((prev) => prev.map((x) => x.id === p.id ? p : x))}
      />
      <ConfirmDialog
        open={!!deleteProject_}
        onClose={() => setDeleteProject_(null)}
        onConfirm={handleDeleteProject}
        title={`Elimina progetto`}
        description={`Stai per eliminare "${deleteProject_?.name}" e tutti i task associati. Azione irreversibile.`}
        loading={deletingProjectId === deleteProject_?.id}
      />

      <TaskForm
        open={createTaskOpen}
        onClose={() => setCreateTaskOpen(false)}
        activityId={activityId}
        projects={projects}
        onSuccess={(t) => setTasks((prev) => [t, ...prev])}
      />
      <TaskForm
        open={!!editTask}
        onClose={() => setEditTask(null)}
        activityId={activityId}
        projects={projects}
        task={editTask ?? undefined}
        onSuccess={(t) => setTasks((prev) => prev.map((x) => x.id === t.id ? t : x))}
      />
      <ConfirmDialog
        open={!!deleteTask_}
        onClose={() => setDeleteTask_(null)}
        onConfirm={handleDeleteTask}
        title={`Elimina task`}
        description={`Stai per eliminare "${deleteTask_?.name}". Azione irreversibile.`}
        loading={deletingTaskId === deleteTask_?.id}
      />
    </div>
  );
}

// TaskTable with CRUD actions
function TaskTableWithCrud({
  tasks,
  projects,
  onEdit,
  onDelete,
  onStatusChange,
}: {
  tasks: Task[];
  projects: Project[];
  onEdit: (t: Task) => void;
  onDelete: (t: Task) => void;
  onStatusChange: (t: Task, status: Task["status"]) => void;
}) {
  return <TaskTable tasks={tasks} projects={projects} onEdit={onEdit} onDelete={onDelete} onStatusChange={onStatusChange} />;
}
