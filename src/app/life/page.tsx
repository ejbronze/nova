"use client";
import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import { generateId, todayStr } from "@/lib/utils";
import { Card, CardHeader, CardTitle, PageHeader, Badge, Button, EmptyState } from "@/components/ui";
import { Plus, ExternalLink, CheckSquare, Square } from "lucide-react";
import type { Task, TaskCategory } from "@/types";

const TABS = ["Dashboard", "Tasks", "Quick Links", "House Manual", "Contacts", "Notes"] as const;
type Tab = typeof TABS[number];

const PRIORITY_COLORS = { low: "muted", medium: "warning", high: "danger" } as const;
const CAT_EMOJI: Record<string, string> = { home: "🏠", health: "💊", work: "💼", finance: "💰", personal: "👤", other: "📌" };

function TaskList() {
  const [showAdd, setShowAdd] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newCat, setNewCat] = useState<TaskCategory>("personal");
  const [newPriority, setNewPriority] = useState<"low" | "medium" | "high">("medium");
  const [filter, setFilter] = useState<"all" | "active" | "done">("active");

  const tasks = useLiveQuery(() => db.tasks.orderBy("createdAt").reverse().toArray(), []);

  const filtered = (tasks ?? []).filter(t => {
    if (filter === "active") return !t.completed;
    if (filter === "done") return t.completed;
    return true;
  });

  const toggle = async (task: Task) => {
    await db.tasks.update(task.id, {
      completed: !task.completed,
      completedAt: !task.completed ? new Date().toISOString() : undefined,
    });
  };

  const addTask = async () => {
    if (!newTitle.trim()) return;
    await db.tasks.add({
      id: generateId(),
      title: newTitle.trim(),
      category: newCat,
      priority: newPriority,
      completed: false,
      isRecurring: false,
      createdAt: new Date().toISOString(),
    });
    setNewTitle("");
    setShowAdd(false);
  };

  const active = (tasks ?? []).filter(t => !t.completed).length;
  const done = (tasks ?? []).filter(t => t.completed).length;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tasks <span className="text-sm font-normal text-nova-muted">({active} open)</span></CardTitle>
        <div className="flex items-center gap-2">
          <div className="flex gap-1">
            {(["active", "all", "done"] as const).map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-3 py-1 rounded-full text-xs font-medium capitalize transition-all ${filter === f ? "bg-life text-white" : "bg-nova-bg text-nova-muted"}`}>
                {f}
              </button>
            ))}
          </div>
          <Button variant="primary" icon={<Plus size={14} />} onClick={() => setShowAdd(true)}>Add</Button>
        </div>
      </CardHeader>

      {showAdd && (
        <div className="mb-4 p-4 bg-nova-bg rounded-xl space-y-3">
          <input
            autoFocus
            value={newTitle}
            onChange={e => setNewTitle(e.target.value)}
            onKeyDown={e => e.key === "Enter" && addTask()}
            placeholder="Task title…"
            className="w-full px-3 py-2 rounded-lg border border-nova-border text-sm outline-none focus:border-life"
          />
          <div className="flex gap-2">
            <select value={newCat} onChange={e => setNewCat(e.target.value as TaskCategory)}
              className="px-3 py-1.5 rounded-lg border border-nova-border text-sm outline-none flex-1">
              {(["home", "health", "work", "finance", "personal", "other"] as TaskCategory[]).map(c => (
                <option key={c} value={c}>{CAT_EMOJI[c]} {c}</option>
              ))}
            </select>
            <select value={newPriority} onChange={e => setNewPriority(e.target.value as "low" | "medium" | "high")}
              className="px-3 py-1.5 rounded-lg border border-nova-border text-sm outline-none">
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
            <Button variant="primary" onClick={addTask}>Save</Button>
            <Button variant="ghost" onClick={() => setShowAdd(false)}>Cancel</Button>
          </div>
        </div>
      )}

      <div className="space-y-1">
        {filtered.map(task => (
          <div key={task.id} className={`flex items-center gap-3 py-2.5 border-b border-nova-border last:border-0 group transition-opacity ${task.completed ? "opacity-50" : ""}`}>
            <button onClick={() => toggle(task)} className="text-nova-muted hover:text-life flex-shrink-0">
              {task.completed ? <CheckSquare size={18} className="text-life" /> : <Square size={18} />}
            </button>
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-medium ${task.completed ? "line-through text-nova-muted" : ""}`}>{task.title}</p>
              <p className="text-xs text-nova-muted">{CAT_EMOJI[task.category]} {task.category}{task.dueDate ? ` · Due ${task.dueDate}` : ""}</p>
            </div>
            <Badge variant={PRIORITY_COLORS[task.priority]}>{task.priority}</Badge>
          </div>
        ))}
        {!filtered.length && (
          <EmptyState emoji={filter === "done" ? "✅" : "🎯"} title={filter === "done" ? "Nothing completed yet" : "All caught up!"} subtitle={filter === "active" ? "Add tasks to stay organized" : ""} />
        )}
      </div>
    </Card>
  );
}

function QuickLinks() {
  const links = useLiveQuery(() => db.quickLinks.orderBy("sortOrder").toArray(), []);

  const grouped: Record<string, typeof links> = {};
  (links ?? []).forEach(l => {
    if (!grouped[l.category]) grouped[l.category] = [];
    grouped[l.category]!.push(l);
  });

  return (
    <div className="space-y-5">
      {Object.entries(grouped).map(([cat, items]) => (
        <Card key={cat}>
          <CardHeader><CardTitle>{cat}</CardTitle></CardHeader>
          <div className="grid grid-cols-3 gap-3">
            {(items ?? []).map(link => (
              <a key={link.id} href={link.url} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-nova-border hover:border-life hover:bg-life/5 transition-all group">
                <span className="text-xl">{link.emoji}</span>
                <span className="text-sm font-medium flex-1 truncate">{link.name}</span>
                <ExternalLink size={12} className="text-nova-muted group-hover:text-life opacity-0 group-hover:opacity-100 transition-all" />
              </a>
            ))}
          </div>
        </Card>
      ))}
      {!links?.length && <EmptyState emoji="🔗" title="No quick links" subtitle="Add frequently visited links" />}
    </div>
  );
}

function HouseManual() {
  const entries = useLiveQuery(() => db.houseEntries.toArray(), []);

  const grouped: Record<string, typeof entries> = {};
  (entries ?? []).forEach(e => {
    if (!grouped[e.category]) grouped[e.category] = [];
    grouped[e.category]!.push(e);
  });

  return (
    <div className="space-y-5">
      {Object.entries(grouped).map(([cat, items]) => (
        <Card key={cat}>
          <CardHeader><CardTitle className="capitalize">{cat}</CardTitle></CardHeader>
          <div className="space-y-3">
            {(items ?? []).map(entry => (
              <div key={entry.id} className="flex gap-3">
                <span className="text-2xl">{entry.emoji}</span>
                <div>
                  <p className="font-medium text-sm">{entry.title}</p>
                  <p className="text-sm text-nova-muted whitespace-pre-wrap">{entry.content}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      ))}
      {!entries?.length && <EmptyState emoji="🏠" title="House manual empty" subtitle="Document appliances, rules & utilities" />}
    </div>
  );
}

function ContactList() {
  const contacts = useLiveQuery(() => db.contacts.toArray(), []);

  const grouped: Record<string, typeof contacts> = {};
  (contacts ?? []).forEach(c => {
    if (!grouped[c.category]) grouped[c.category] = [];
    grouped[c.category]!.push(c);
  });

  return (
    <div className="space-y-5">
      {Object.entries(grouped).map(([cat, items]) => (
        <Card key={cat}>
          <CardHeader><CardTitle className="capitalize">{cat}</CardTitle></CardHeader>
          <div className="space-y-3">
            {(items ?? []).map(c => (
              <div key={c.id} className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                  style={{ background: c.color }}>
                  {c.initials}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm">{c.name}</p>
                  <p className="text-xs text-nova-muted">{c.role}</p>
                </div>
                <div className="text-right text-xs text-nova-muted space-y-0.5">
                  {c.phone && <p>{c.phone}</p>}
                  {c.email && <p>{c.email}</p>}
                </div>
              </div>
            ))}
          </div>
        </Card>
      ))}
      {!contacts?.length && <EmptyState emoji="👥" title="No contacts" subtitle="Add important contacts for quick access" />}
    </div>
  );
}

function NotesList() {
  const notes = useLiveQuery(() => db.notes.orderBy("updatedAt").reverse().toArray(), []);

  return (
    <div className="grid grid-cols-2 gap-4">
      {(notes ?? []).map(note => (
        <Card key={note.id} className={note.isPinned ? "border-life" : ""}>
          <CardHeader>
            <div>
              <p className="font-semibold">{note.title}</p>
              <p className="text-xs text-nova-muted">{CAT_EMOJI[note.category]} {note.category} · {note.updatedAt.slice(0, 10)}</p>
            </div>
            {note.isPinned && <span className="text-life text-lg">📌</span>}
          </CardHeader>
          <p className="text-sm text-nova-muted mt-2 line-clamp-4 whitespace-pre-wrap">{note.content}</p>
          {note.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-3">
              {note.tags.map(tag => <Badge key={tag} variant="muted">{tag}</Badge>)}
            </div>
          )}
        </Card>
      ))}
      {!notes?.length && <EmptyState emoji="📝" title="No notes" subtitle="Create notes to capture important information" />}
    </div>
  );
}

function LifeDashboard() {
  const tasks = useLiveQuery(() => db.tasks.where("completed").equals(0).toArray(), []);
  const links = useLiveQuery(() => db.quickLinks.orderBy("sortOrder").limit(6).toArray(), []);
  const contacts = useLiveQuery(() => db.contacts.limit(4).toArray(), []);

  const high = (tasks ?? []).filter(t => t.priority === "high").length;

  return (
    <div className="space-y-5">
      {high > 0 && (
        <div className="p-4 rounded-xl bg-danger/10 border border-danger/20 flex items-center gap-3">
          <span className="text-2xl">🔥</span>
          <div>
            <p className="font-semibold text-danger">{high} high priority task{high > 1 ? "s" : ""}</p>
            <p className="text-sm text-nova-muted">Needs your attention today</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-[2fr_1fr] gap-5">
        <Card>
          <CardHeader><CardTitle>Open Tasks</CardTitle></CardHeader>
          <div className="space-y-2">
            {(tasks ?? []).slice(0, 6).map(task => (
              <div key={task.id} className="flex items-center gap-2 py-1.5 border-b border-nova-border last:border-0">
                <Square size={16} className="text-nova-muted flex-shrink-0" />
                <p className="text-sm flex-1">{task.title}</p>
                <Badge variant={PRIORITY_COLORS[task.priority]}>{task.priority}</Badge>
              </div>
            ))}
            {!tasks?.length && <p className="text-nova-muted text-sm text-center py-4">All done! 🎉</p>}
          </div>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader><CardTitle>Quick Links</CardTitle></CardHeader>
            <div className="grid grid-cols-2 gap-2">
              {(links ?? []).map(l => (
                <a key={l.id} href={l.url} target="_blank" rel="noopener noreferrer"
                  className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-nova-bg transition-all text-center">
                  <span className="text-xl">{l.emoji}</span>
                  <span className="text-xs text-nova-muted">{l.name}</span>
                </a>
              ))}
            </div>
          </Card>

          <Card>
            <CardHeader><CardTitle>Key Contacts</CardTitle></CardHeader>
            <div className="space-y-2">
              {(contacts ?? []).map(c => (
                <div key={c.id} className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold"
                    style={{ background: c.color }}>
                    {c.initials}
                  </div>
                  <div>
                    <p className="text-xs font-medium">{c.name}</p>
                    <p className="text-xs text-nova-muted">{c.role}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default function LifePage() {
  const [tab, setTab] = useState<Tab>("Dashboard");

  return (
    <div className="animate-fadeIn">
      <PageHeader title="🗂 Life Admin" subtitle="Tasks, links & home management" />

      <div className="flex gap-1 mb-6 bg-white border border-nova-border rounded-xl p-1 w-fit flex-wrap">
        {TABS.map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${tab === t ? "bg-life text-white shadow-sm" : "text-nova-muted hover:text-nova-text"}`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "Dashboard" && <LifeDashboard />}
      {tab === "Tasks" && <TaskList />}
      {tab === "Quick Links" && <QuickLinks />}
      {tab === "House Manual" && <HouseManual />}
      {tab === "Contacts" && <ContactList />}
      {tab === "Notes" && <NotesList />}
    </div>
  );
}
