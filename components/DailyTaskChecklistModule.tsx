'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  collection, 
  query, 
  where,
  orderBy, 
  limit, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  serverTimestamp 
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '@/lib/firebase';
import { useAuth } from '@/lib/auth-context';
import { 
  DailyTask, 
  TaskCategory, 
  TaskPriority, 
  TaskStatus,
  DEFAULT_ADMIN_EMAIL 
} from '@/lib/types';
import { playNotificationChime } from '@/lib/audio-chime';
import { 
  Check, 
  Plus, 
  Trash2, 
  Edit3, 
  User, 
  Calendar, 
  Sparkles, 
  CheckSquare, 
  MoreVertical, 
  Flame, 
  Shield, 
  Lock, 
  UserCheck, 
  AlertCircle,
  Tag,
  Clock,
  ChevronDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface DailyTaskChecklistModuleProps {
  className?: string;
  isCompact?: boolean;
}

const CATEGORIES: TaskCategory[] = [
  'Design',
  'Shopify Listing',
  'Social Marketing',
  'Fulfillment',
  'General',
];

const PRIORITIES: TaskPriority[] = ['High', 'Medium', 'Low'];

const ASSIGNEES = ['Sachin Barman', 'Suraj Barman', 'Member 3', 'Unassigned'];

export function DailyTaskChecklistModule({ className = '', isCompact = false }: DailyTaskChecklistModuleProps) {
  const { teamMember, isAdmin } = useAuth();
  const [tasks, setTasks] = useState<DailyTask[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter state
  const [activeFilter, setActiveFilter] = useState<'today' | 'mine' | 'high' | 'completed' | 'all'>('today');

  // Quick-Add form state
  const [quickTitle, setQuickTitle] = useState('');
  const [quickCategory, setQuickCategory] = useState<TaskCategory>('Design');
  const [quickAssignee, setQuickAssignee] = useState<string>('Sachin Barman');
  const [quickPriority, setQuickPriority] = useState<TaskPriority>('Medium');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit modal state
  const [editingTask, setEditingTask] = useState<DailyTask | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editCategory, setEditCategory] = useState<TaskCategory>('General');
  const [editAssignee, setEditAssignee] = useState('Sachin Barman');
  const [editPriority, setEditPriority] = useState<TaskPriority>('Medium');
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Action popover per task
  const [openMenuTaskId, setOpenMenuTaskId] = useState<string | null>(null);
  const [reassignSubmenuTaskId, setReassignSubmenuTaskId] = useState<string | null>(null);

  const menuRef = useRef<HTMLDivElement>(null);
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  // Determine if current user is Admin (Sachin Barman)
  const isUserAdmin = 
    isAdmin || 
    teamMember?.email?.toLowerCase() === DEFAULT_ADMIN_EMAIL.toLowerCase() || 
    teamMember?.role === 'admin';

  // Close menus on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpenMenuTaskId(null);
        setReassignSubmenuTaskId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Real-time Firestore sync via onSnapshot scoped strictly to today's dateKey
  useEffect(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    const baseQuery = query(
      collection(db, 'daily_tasks'),
      where('dateKey', '==', todayStr),
      orderBy('createdAt', 'asc')
    );

    let activeUnsubscribe: () => void = () => {};

    const attach = (qToUse: any, isFallback = false) => {
      return onSnapshot(
        qToUse,
        (snapshot: any) => {
          const taskList: DailyTask[] = [];
          snapshot.forEach((docSnap: any) => {
            const d = docSnap.data();
            taskList.push({
              id: docSnap.id,
              title: d.title || 'Untitled Task',
              category: d.category || 'General',
              assignedTo: d.assignedTo || 'Unassigned',
              assignedToEmail: d.assignedToEmail,
              priority: d.priority || 'Medium',
              status: d.status || 'pending',
              dueDate: d.dueDate || d.dateKey || todayStr,
              dateKey: d.dateKey || todayStr,
              createdBy: d.createdBy || 'Trio Team',
              createdByEmail: d.createdByEmail,
              completedAt: d.completedAt || null,
              createdAt: d.createdAt || new Date().toISOString(),
            });
          });

          // Ensure sorted by createdAt ascending
          taskList.sort((a, b) => (a.createdAt || '').localeCompare(b.createdAt || ''));

          setTasks(taskList);
          setLoading(false);
        },
        (error) => {
          // If Firestore reports composite index pending, gracefully fallback to single-field query
          if (!isFallback && (error.message?.includes('index') || error.code === 'failed-precondition')) {
            console.warn('Composite index pending on dateKey+createdAt, using single-field fallback query');
            const fallbackQuery = query(
              collection(db, 'daily_tasks'),
              where('dateKey', '==', todayStr)
            );
            activeUnsubscribe = attach(fallbackQuery, true);
          } else {
            handleFirestoreError(error, OperationType.GET, 'daily_tasks');
            setLoading(false);
          }
        }
      );
    };

    activeUnsubscribe = attach(baseQuery);

    return () => activeUnsubscribe();
  }, [todayStr]);

  // Seed sample tasks if collection is empty
  const handleSeedTasks = async () => {
    const initialTasks: Omit<DailyTask, 'id'>[] = [
      {
        title: 'Design 3 Retro Typography T-shirt Graphics',
        category: 'Design',
        assignedTo: 'Suraj Barman',
        priority: 'High',
        status: 'pending',
        dueDate: todayStr,
        dateKey: todayStr,
        createdBy: teamMember?.displayName || 'Sachin Barman',
        createdByEmail: teamMember?.email || 'sachinbarman20190@gmail.com',
        completedAt: null,
        createdAt: new Date().toISOString(),
      },
      {
        title: 'Audit Qikink DTF Print Samples & Inventory',
        category: 'Fulfillment',
        assignedTo: 'Sachin Barman',
        priority: 'High',
        status: 'in_progress',
        dueDate: todayStr,
        dateKey: todayStr,
        createdBy: teamMember?.displayName || 'Sachin Barman',
        createdByEmail: teamMember?.email || 'sachinbarman20190@gmail.com',
        completedAt: null,
        createdAt: new Date().toISOString(),
      },
      {
        title: 'Upload & Tag 2 Viral Reels for Instagram Ad Campaign',
        category: 'Social Marketing',
        assignedTo: 'Member 3',
        priority: 'Medium',
        status: 'pending',
        dueDate: todayStr,
        dateKey: todayStr,
        createdBy: teamMember?.displayName || 'Sachin Barman',
        createdByEmail: teamMember?.email || 'sachinbarman20190@gmail.com',
        completedAt: null,
        createdAt: new Date().toISOString(),
      },
      {
        title: 'Update Shopify Oversized Hoodies Pricing & Margins',
        category: 'Shopify Listing',
        assignedTo: 'Sachin Barman',
        priority: 'Medium',
        status: 'completed',
        dueDate: todayStr,
        dateKey: todayStr,
        createdBy: teamMember?.displayName || 'Sachin Barman',
        createdByEmail: teamMember?.email || 'sachinbarman20190@gmail.com',
        completedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      },
    ];

    try {
      for (const t of initialTasks) {
        await addDoc(collection(db, 'daily_tasks'), t);
      }
    } catch (err) {
      console.error('Failed to seed tasks:', err);
    }
  };

  // Toggle Task Completion with optimistic UI
  const handleToggleTask = async (task: DailyTask) => {
    const isCompleted = task.status === 'completed';
    const nextStatus: TaskStatus = isCompleted ? 'pending' : 'completed';
    const nextCompletedAt = isCompleted ? null : new Date().toISOString();

    // Optimistic local state update
    setTasks((prev) => 
      prev.map((t) => (t.id === task.id ? { ...t, status: nextStatus, completedAt: nextCompletedAt } : t))
    );

    if (!isCompleted) {
      playNotificationChime('message');
    }

    try {
      const taskRef = doc(db, 'daily_tasks', task.id);
      await updateDoc(taskRef, {
        status: nextStatus,
        completedAt: nextCompletedAt,
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      console.error('Failed to toggle task:', err);
      // Revert on failure
      setTasks((prev) => 
        prev.map((t) => (t.id === task.id ? task : t))
      );
    }
  };

  // Quick Add Task
  const handleAddTask = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!quickTitle.trim() || !teamMember) return;

    const newTaskData = {
      title: quickTitle.trim(),
      category: quickCategory,
      assignedTo: quickAssignee,
      priority: quickPriority,
      status: 'pending' as TaskStatus,
      dueDate: todayStr,
      dateKey: todayStr,
      createdBy: teamMember.displayName || 'Sachin Barman',
      createdByEmail: teamMember.email || 'sachinbarman20190@gmail.com',
      completedAt: null,
      createdAt: new Date().toISOString(),
    };

    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'daily_tasks'), newTaskData);
      setQuickTitle('');
    } catch (err) {
      console.error('Failed to add task:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open Edit Modal
  const startEditTask = (task: DailyTask) => {
    setEditingTask(task);
    setEditTitle(task.title);
    setEditCategory(task.category);
    setEditAssignee(task.assignedTo);
    setEditPriority(task.priority);
    setOpenMenuTaskId(null);
    setReassignSubmenuTaskId(null);
  };

  // Save Edit Task
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTask || !editTitle.trim()) return;

    setIsSavingEdit(true);
    try {
      const taskRef = doc(db, 'daily_tasks', editingTask.id);
      await updateDoc(taskRef, {
        title: editTitle.trim(),
        category: editCategory,
        assignedTo: editAssignee,
        priority: editPriority,
        updatedAt: serverTimestamp(),
      });
      setEditingTask(null);
    } catch (err) {
      console.error('Failed to update task:', err);
    } finally {
      setIsSavingEdit(false);
    }
  };

  // Delete Task (Restricted to Admin or Task Creator)
  const handleDeleteTask = async (task: DailyTask) => {
    const isCreator = 
      Boolean(teamMember?.email && task.createdByEmail && 
      teamMember.email.toLowerCase() === task.createdByEmail.toLowerCase());

    if (!isUserAdmin && !isCreator) {
      return;
    }

    setTasks((prev) => prev.filter((t) => t.id !== task.id));
    setOpenMenuTaskId(null);
    setReassignSubmenuTaskId(null);

    try {
      await deleteDoc(doc(db, 'daily_tasks', task.id));
    } catch (err) {
      console.error('Failed to delete task:', err);
    }
  };

  // Quick Reassign Member
  const handleReassign = async (taskId: string, newAssignee: string) => {
    setOpenMenuTaskId(null);
    setReassignSubmenuTaskId(null);
    setTasks((prev) => 
      prev.map((t) => (t.id === taskId ? { ...t, assignedTo: newAssignee } : t))
    );

    try {
      await updateDoc(doc(db, 'daily_tasks', taskId), {
        assignedTo: newAssignee,
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      console.error('Failed to reassign task:', err);
    }
  };

  // Calculations for Today's Progress Bar
  const todayTasks = useMemo(() => {
    return tasks.filter((t) => t.dueDate === todayStr || !t.dueDate);
  }, [tasks, todayStr]);

  const todayCompletedCount = useMemo(() => {
    return todayTasks.filter((t) => t.status === 'completed').length;
  }, [todayTasks]);

  const todayPercentage = todayTasks.length > 0 
    ? Math.round((todayCompletedCount / todayTasks.length) * 100) 
    : 0;

  const allCompletedToday = todayTasks.length > 0 && todayCompletedCount === todayTasks.length;

  // Filtered Tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      if (activeFilter === 'today') {
        return t.dueDate === todayStr || !t.dueDate;
      }
      if (activeFilter === 'mine') {
        const myName = teamMember?.displayName || '';
        return t.assignedTo.toLowerCase() === myName.toLowerCase() || 
               t.assignedTo.split(' ')[0].toLowerCase() === myName.split(' ')[0].toLowerCase();
      }
      if (activeFilter === 'high') {
        return t.priority === 'High';
      }
      if (activeFilter === 'completed') {
        return t.status === 'completed';
      }
      return true; // 'all'
    });
  }, [tasks, activeFilter, todayStr, teamMember]);

  // Color helper for member avatars
  const getAvatarStyle = (name: string) => {
    if (name.includes('Sachin')) {
      return {
        badge: 'bg-amber-500/10 text-amber-300 border-amber-500/30 ring-1 ring-amber-500/20',
        avatarBg: 'bg-amber-500 text-slate-950 font-bold',
        initial: 'S',
      };
    }
    if (name.includes('Suraj')) {
      return {
        badge: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30 ring-1 ring-emerald-500/20',
        avatarBg: 'bg-emerald-500 text-slate-950 font-bold',
        initial: 'S',
      };
    }
    if (name.includes('Member 3')) {
      return {
        badge: 'bg-sky-500/10 text-sky-300 border-sky-500/30 ring-1 ring-sky-500/20',
        avatarBg: 'bg-sky-500 text-slate-950 font-bold',
        initial: 'M',
      };
    }
    return {
      badge: 'bg-slate-800 text-slate-400 border-slate-700',
      avatarBg: 'bg-slate-700 text-slate-300 font-medium',
      initial: 'U',
    };
  };

  // Color-coded priority pills (Red / Amber / Slate) as requested
  const getPriorityPill = (priority: TaskPriority) => {
    switch (priority) {
      case 'High':
        return {
          pill: 'bg-rose-500/15 text-rose-300 border-rose-500/40',
          dot: 'bg-rose-400 animate-pulse',
        };
      case 'Medium':
        return {
          pill: 'bg-amber-500/15 text-amber-300 border-amber-500/40',
          dot: 'bg-amber-400',
        };
      case 'Low':
        return {
          pill: 'bg-slate-800/80 text-slate-400 border-slate-700',
          dot: 'bg-slate-500',
        };
    }
  };

  // Category tags
  const getCategoryBadge = (category: TaskCategory) => {
    switch (category) {
      case 'Design':
        return 'bg-purple-500/10 text-purple-300 border-purple-500/30';
      case 'Shopify Listing':
        return 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30';
      case 'Social Marketing':
        return 'bg-pink-500/10 text-pink-300 border-pink-500/30';
      case 'Fulfillment':
        return 'bg-amber-500/10 text-amber-300 border-amber-500/30';
      default:
        return 'bg-slate-800 text-slate-400 border-slate-700';
    }
  };

  return (
    <div className={`bg-slate-900/95 border border-slate-800/90 rounded-2xl p-4 sm:p-6 shadow-xl space-y-5 ${className}`}>
      {/* 1. HEADER & DAILY PROGRESS BAR */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 shrink-0 shadow-md shadow-indigo-500/10">
              <CheckSquare className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  Daily Task Checklists
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/30">
                  POD Execution
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Shared 3-member execution pipeline for daily designs, listings, and order audits.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {tasks.length === 0 && !loading && (
              <button
                onClick={handleSeedTasks}
                className="cursor-pointer text-xs bg-slate-800 hover:bg-slate-700 text-sky-400 px-3 py-1.5 rounded-xl border border-slate-700 flex items-center gap-1.5 transition-colors shadow-sm"
                title="Populate with sample daily tasks"
              >
                <Sparkles className="w-3.5 h-3.5" /> Seed Tasks
              </button>
            )}
            <div className="text-right">
              <div className="text-xs font-bold text-white">
                {todayCompletedCount} of {todayTasks.length} Done
              </div>
              <div className="text-[11px] font-semibold text-emerald-400">
                {todayPercentage}% completed
              </div>
            </div>
          </div>
        </div>

        {/* Material 3 Expressive Progress Bar */}
        <div className="space-y-1.5">
          <div className="w-full bg-slate-950 rounded-full h-2.5 overflow-hidden border border-slate-850 p-0.5">
            <div
              className="bg-gradient-to-r from-sky-500 via-indigo-500 to-emerald-400 h-full rounded-full transition-all duration-500 ease-out shadow-sm shadow-indigo-500/50"
              style={{ width: `${todayPercentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* Celebration Banner when all tasks are checked off */}
      <AnimatePresence>
        {allCompletedToday && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -8 }}
            className="p-3.5 rounded-xl bg-gradient-to-r from-emerald-950/70 via-slate-900 to-indigo-950/60 border border-emerald-500/40 flex items-center gap-3 text-xs text-emerald-200 shadow-lg shadow-emerald-950/30"
          >
            <div className="w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-300 shrink-0">
              <Sparkles className="w-4 h-4 animate-spin text-emerald-400" />
            </div>
            <div className="flex-1">
              <span className="font-bold text-white block">
                🎉 All daily POD milestones completed!
              </span>
              <span className="text-[11px] text-emerald-300/80">
                Every task scheduled for today has been checked off. Great work, Sachin, Suraj, and team!
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. FILTER PILLS */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
        <button
          onClick={() => setActiveFilter('today')}
          className={`cursor-pointer min-h-[34px] px-3 py-1 text-xs font-semibold rounded-xl border transition-all shrink-0 flex items-center gap-1.5 ${
            activeFilter === 'today'
              ? 'bg-sky-600 text-white border-sky-500 shadow-sm'
              : 'bg-slate-950/80 text-slate-400 hover:text-white border-slate-800'
          }`}
        >
          <Calendar className="w-3 h-3" />
          <span>Today</span>
          <span className="text-[10px] opacity-80 font-mono">({todayTasks.length})</span>
        </button>

        <button
          onClick={() => setActiveFilter('mine')}
          className={`cursor-pointer min-h-[34px] px-3 py-1 text-xs font-semibold rounded-xl border transition-all shrink-0 flex items-center gap-1.5 ${
            activeFilter === 'mine'
              ? 'bg-sky-600 text-white border-sky-500 shadow-sm'
              : 'bg-slate-950/80 text-slate-400 hover:text-white border-slate-800'
          }`}
        >
          <User className="w-3 h-3" />
          <span>Assigned to Me</span>
        </button>

        <button
          onClick={() => setActiveFilter('high')}
          className={`cursor-pointer min-h-[34px] px-3 py-1 text-xs font-semibold rounded-xl border transition-all shrink-0 flex items-center gap-1.5 ${
            activeFilter === 'high'
              ? 'bg-rose-600 text-white border-rose-500 shadow-sm'
              : 'bg-slate-950/80 text-slate-400 hover:text-white border-slate-800'
          }`}
        >
          <Flame className="w-3 h-3 text-rose-300" />
          <span>High Priority</span>
        </button>

        <button
          onClick={() => setActiveFilter('completed')}
          className={`cursor-pointer min-h-[34px] px-3 py-1 text-xs font-semibold rounded-xl border transition-all shrink-0 flex items-center gap-1.5 ${
            activeFilter === 'completed'
              ? 'bg-emerald-600 text-white border-emerald-500 shadow-sm'
              : 'bg-slate-950/80 text-slate-400 hover:text-white border-slate-800'
          }`}
        >
          <Check className="w-3 h-3 stroke-[3]" />
          <span>Completed</span>
        </button>

        <button
          onClick={() => setActiveFilter('all')}
          className={`cursor-pointer min-h-[34px] px-3 py-1 text-xs font-semibold rounded-xl border transition-all shrink-0 flex items-center gap-1.5 ${
            activeFilter === 'all'
              ? 'bg-sky-600 text-white border-sky-500 shadow-sm'
              : 'bg-slate-950/80 text-slate-400 hover:text-white border-slate-800'
          }`}
        >
          <span>All Tasks</span>
          <span className="text-[10px] opacity-80 font-mono">({tasks.length})</span>
        </button>
      </div>

      {/* 3. QUICK-ADD BAR */}
      <form onSubmit={handleAddTask} className="bg-slate-950/90 border border-slate-800/80 rounded-2xl p-2 sm:p-2.5 flex flex-col md:flex-row items-stretch md:items-center gap-2 shadow-inner">
        <div className="flex-1 flex items-center gap-2 px-2">
          <Plus className="w-4 h-4 text-sky-400 shrink-0" />
          <input
            type="text"
            required
            value={quickTitle}
            onChange={(e) => setQuickTitle(e.target.value)}
            placeholder="Add a daily POD task (e.g. Design 3 Retro T-shirts, Audit Qikink DTF)..."
            className="w-full bg-transparent text-sm text-white placeholder-slate-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-1.5 flex-wrap sm:flex-nowrap border-t md:border-t-0 border-slate-800/80 pt-2 md:pt-0">
          {/* Category Select */}
          <select
            value={quickCategory}
            onChange={(e) => setQuickCategory(e.target.value as TaskCategory)}
            className="cursor-pointer bg-slate-900 border border-slate-800 text-slate-300 text-xs rounded-xl px-2.5 py-1.5 focus:border-sky-500 focus:outline-none"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          {/* Member Select */}
          <select
            value={quickAssignee}
            onChange={(e) => setQuickAssignee(e.target.value)}
            className="cursor-pointer bg-slate-900 border border-slate-800 text-slate-300 text-xs rounded-xl px-2.5 py-1.5 focus:border-sky-500 focus:outline-none"
          >
            {ASSIGNEES.map((a) => (
              <option key={a} value={a}>{a.split(' ')[0]}</option>
            ))}
          </select>

          {/* Priority Select */}
          <select
            value={quickPriority}
            onChange={(e) => setQuickPriority(e.target.value as TaskPriority)}
            className="cursor-pointer bg-slate-900 border border-slate-800 text-slate-300 text-xs rounded-xl px-2.5 py-1.5 focus:border-sky-500 focus:outline-none"
          >
            {PRIORITIES.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>

          {/* Add Task Button */}
          <button
            type="submit"
            disabled={!quickTitle.trim() || isSubmitting}
            className="cursor-pointer min-h-[36px] px-4 py-1.5 bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-all shadow-md flex items-center justify-center gap-1 shrink-0 active:scale-95 touch-manipulation"
          >
            <span>{isSubmitting ? 'Adding...' : 'Add Task'}</span>
          </button>
        </div>
      </form>

      {/* 4. INDIVIDUAL TASK ITEMS (MATERIAL 3 DESIGN) */}
      <div className="space-y-2.5">
        {loading ? (
          <div className="py-12 text-center text-slate-500 text-xs animate-pulse">
            Syncing daily tasks from Firestore...
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="py-10 text-center bg-slate-950/40 border border-slate-850 rounded-2xl p-4">
            <CheckSquare className="w-8 h-8 text-slate-600 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-300">No tasks found</p>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              {activeFilter === 'today' 
                ? 'No pending tasks for today. Use the Quick-Add bar above to schedule assignments!'
                : 'No tasks match the selected filter.'}
            </p>
          </div>
        ) : (
          filteredTasks.map((task) => {
            const isCompleted = task.status === 'completed';
            const isMenuOpen = openMenuTaskId === task.id;
            const isReassignOpen = reassignSubmenuTaskId === task.id;

            // Check admin / creator permission
            const isCreator = Boolean(
              teamMember?.email && 
              task.createdByEmail && 
              teamMember.email.toLowerCase() === task.createdByEmail.toLowerCase()
            );
            const canManage = isUserAdmin || isCreator;

            const avatar = getAvatarStyle(task.assignedTo);
            const priorityPill = getPriorityPill(task.priority);

            return (
              <div
                key={task.id}
                className={`group relative flex items-start sm:items-center justify-between gap-3 p-3.5 sm:p-4 rounded-2xl border transition-all duration-200 ${
                  isCompleted
                    ? 'bg-slate-950/50 border-slate-850/80 opacity-75'
                    : 'bg-slate-950/90 border-slate-800/90 hover:border-slate-700/80 shadow-md shadow-black/20 hover:shadow-lg'
                }`}
              >
                {/* Left: Interactive Checkbox & Content */}
                <div className="flex items-start sm:items-center gap-3.5 min-w-0 flex-1">
                  {/* Material 3 Checkbox with Optimistic Updates */}
                  <button
                    type="button"
                    onClick={() => handleToggleTask(task)}
                    className={`cursor-pointer mt-0.5 sm:mt-0 w-6 h-6 rounded-lg flex items-center justify-center transition-all duration-150 shrink-0 border-2 active:scale-90 touch-manipulation ${
                      isCompleted
                        ? 'bg-emerald-500 border-emerald-500 text-slate-950 shadow-md shadow-emerald-500/25'
                        : 'border-slate-600 bg-slate-900/90 hover:border-sky-400 text-transparent hover:text-sky-400/30'
                    }`}
                    title={isCompleted ? 'Mark pending' : 'Mark completed'}
                    aria-label={isCompleted ? 'Mark pending' : 'Mark completed'}
                  >
                    <Check className={`w-3.5 h-3.5 stroke-[3] ${isCompleted ? 'text-slate-950' : ''}`} />
                  </button>

                  <div className="min-w-0 flex-1">
                    <p
                      className={`text-xs sm:text-sm transition-all duration-150 ${
                        isCompleted
                          ? 'line-through text-slate-500 font-normal'
                          : 'text-slate-100 font-semibold tracking-tight'
                      }`}
                    >
                      {task.title}
                    </p>

                    {/* Metadata tags: Category & Priority */}
                    <div className="flex items-center gap-2 flex-wrap mt-1.5 text-[10px]">
                      {/* Category Badge */}
                      <span className={`px-2 py-0.5 rounded-md border font-medium ${getCategoryBadge(task.category)}`}>
                        {task.category}
                      </span>

                      {/* Color-Coded Priority Pill (Red / Amber / Slate) */}
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border font-bold uppercase tracking-wider text-[9px] ${priorityPill.pill}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${priorityPill.dot}`} />
                        {task.priority}
                      </span>

                      {task.completedAt && (
                        <span className="text-slate-500 text-[10px] hidden sm:inline">
                          &bull; Completed {new Date(task.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Member Avatar Chip & Action Menu */}
                <div className="flex items-center gap-2 shrink-0">
                  {/* Member Avatar Chip (Material 3 Assist/Filter Chip) */}
                  <div
                    className={`inline-flex items-center gap-1.5 pl-1.5 pr-2.5 py-1 rounded-full text-xs font-semibold border ${avatar.badge}`}
                    title={`Assigned to ${task.assignedTo}`}
                  >
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] shadow-sm ${avatar.avatarBg}`}>
                      {avatar.initial}
                    </div>
                    <span className="text-[11px] font-medium hidden sm:inline">
                      {task.assignedTo.split(' ')[0]}
                    </span>
                  </div>

                  {/* Action Menu (Material 3 Dropdown with Permissions Guard) */}
                  <div className="relative" ref={isMenuOpen ? menuRef : undefined}>
                    <button
                      type="button"
                      onClick={() => {
                        setOpenMenuTaskId(isMenuOpen ? null : task.id);
                        setReassignSubmenuTaskId(null);
                      }}
                      className="cursor-pointer min-h-[34px] min-w-[34px] flex items-center justify-center p-1 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
                      title="Task options"
                      aria-label="Task options"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>

                    {/* Action Dropdown Menu */}
                    {isMenuOpen && (
                      <div className="absolute right-0 top-full mt-1.5 w-48 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-1.5 z-40 space-y-1 animate-in fade-in zoom-in-95">
                        {canManage ? (
                          <>
                            {/* Edit Action */}
                            <button
                              type="button"
                              onClick={() => startEditTask(task)}
                              className="cursor-pointer w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-200 hover:text-white hover:bg-slate-800 rounded-xl transition-colors text-left"
                            >
                              <Edit3 className="w-3.5 h-3.5 text-sky-400" />
                              <span>Edit Task</span>
                            </button>

                            {/* Reassign Action Toggle */}
                            <button
                              type="button"
                              onClick={() => setReassignSubmenuTaskId(isReassignOpen ? null : task.id)}
                              className="cursor-pointer w-full flex items-center justify-between px-3 py-2 text-xs font-medium text-slate-200 hover:text-white hover:bg-slate-800 rounded-xl transition-colors text-left"
                            >
                              <span className="flex items-center gap-2">
                                <UserCheck className="w-3.5 h-3.5 text-indigo-400" />
                                <span>Reassign Member</span>
                              </span>
                              <ChevronDown className={`w-3.5 h-3.5 text-slate-500 transition-transform ${isReassignOpen ? 'rotate-180' : ''}`} />
                            </button>

                            {/* Reassign Submenu */}
                            {isReassignOpen && (
                              <div className="bg-slate-950/90 rounded-xl p-1 border border-slate-850 space-y-0.5 my-1">
                                {ASSIGNEES.filter((a) => a !== task.assignedTo).map((assignee) => (
                                  <button
                                    key={assignee}
                                    type="button"
                                    onClick={() => handleReassign(task.id, assignee)}
                                    className="cursor-pointer w-full flex items-center gap-2 px-2.5 py-1.5 text-xs text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors text-left"
                                  >
                                    <div className="w-4 h-4 rounded-full bg-slate-800 text-slate-300 flex items-center justify-center text-[9px]">
                                      {assignee[0]}
                                    </div>
                                    <span>{assignee}</span>
                                  </button>
                                ))}
                              </div>
                            )}

                            {/* Delete Action (Restricted) */}
                            <div className="border-t border-slate-800/80 my-1 pt-1">
                              <button
                                type="button"
                                onClick={() => handleDeleteTask(task)}
                                className="cursor-pointer w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 rounded-xl transition-colors text-left"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>Delete Task</span>
                              </button>
                            </div>
                          </>
                        ) : (
                          /* Non-Admin / Non-Creator View: Permissions Restricted Notice */
                          <div className="p-3 text-left space-y-1.5">
                            <div className="flex items-center gap-1.5 text-amber-400 text-xs font-semibold">
                              <Lock className="w-3.5 h-3.5" />
                              <span>Restricted Action</span>
                            </div>
                            <p className="text-[11px] text-slate-400 leading-tight">
                              Only Admin (<strong className="text-slate-300">Sachin Barman</strong>) or the task creator can edit or delete this task.
                            </p>
                            <div className="text-[10px] text-slate-500 pt-1 border-t border-slate-800">
                              Created by: {task.createdBy}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 5. EDIT TASK MODAL */}
      {editingTask && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-sky-400" />
                Edit Task
              </h3>
              <button
                onClick={() => setEditingTask(null)}
                className="cursor-pointer min-h-[36px] min-w-[36px] flex items-center justify-center text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Task Title
                </label>
                <input
                  type="text"
                  required
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-white text-sm rounded-xl px-3.5 py-2.5 focus:border-sky-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Category
                  </label>
                  <select
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value as TaskCategory)}
                    className="w-full bg-slate-950 border border-slate-800 text-white text-xs rounded-xl px-3 py-2.5 focus:border-sky-500 focus:outline-none"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Priority
                  </label>
                  <select
                    value={editPriority}
                    onChange={(e) => setEditPriority(e.target.value as TaskPriority)}
                    className="w-full bg-slate-950 border border-slate-800 text-white text-xs rounded-xl px-3 py-2.5 focus:border-sky-500 focus:outline-none"
                  >
                    {PRIORITIES.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Assigned Member
                </label>
                <select
                  value={editAssignee}
                  onChange={(e) => setEditAssignee(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-white text-xs rounded-xl px-3 py-2.5 focus:border-sky-500 focus:outline-none"
                >
                  {ASSIGNEES.map((a) => (
                    <option key={a} value={a}>{a}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingTask(null)}
                  className="cursor-pointer min-h-[44px] px-4 py-2 text-xs font-medium text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingEdit || !editTitle.trim()}
                  className="cursor-pointer min-h-[44px] px-5 py-2.5 text-xs font-bold bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white rounded-xl transition-all shadow-md"
                >
                  {isSavingEdit ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// Export widget alias for compatibility
export { DailyTaskChecklistModule as DailyTaskChecklistWidget };
