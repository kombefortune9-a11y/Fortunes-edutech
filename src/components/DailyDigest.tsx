import { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, addDoc, updateDoc, doc, serverTimestamp, deleteDoc } from 'firebase/firestore';
import { useAuth } from './FirebaseProvider';
import { db } from '../lib/firebase';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, Circle, Calendar, Plus, Trash2, Clock, BookOpen } from 'lucide-react';
import { cn } from '../lib/utils';

export interface Task {
  id: string;
  title: string;
  dueDate: Date;
  completed: boolean;
  type: 'task' | 'curriculum_deadline';
  createdAt: Date;
}

export function DailyDigest() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskType, setNewTaskType] = useState<'task' | 'curriculum_deadline'>('task');
  const [newTaskDate, setNewTaskDate] = useState('');

  useEffect(() => {
    if (!user?.uid) return;

    const tasksRef = collection(db, 'users', user.uid, 'tasks');
    const q = query(tasksRef, orderBy('dueDate', 'asc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedTasks = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          dueDate: data.dueDate?.toDate() || new Date(),
          createdAt: data.createdAt?.toDate() || new Date(),
        } as Task;
      });
      setTasks(fetchedTasks);
    }, (error) => {
      console.error('Error fetching tasks:', error);
    });

    return () => unsubscribe();
  }, [user?.uid]);

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.uid || !newTaskTitle.trim() || !newTaskDate) return;

    try {
      const tasksRef = collection(db, 'users', user.uid, 'tasks');
      await addDoc(tasksRef, {
        userId: user.uid,
        title: newTaskTitle.trim(),
        dueDate: new Date(newTaskDate),
        completed: false,
        type: newTaskType,
        createdAt: serverTimestamp()
      });
      setIsAdding(false);
      setNewTaskTitle('');
      setNewTaskDate('');
    } catch (error) {
      console.error('Error adding task:', error);
    }
  };

  const toggleTask = async (taskId: string, currentStatus: boolean) => {
    if (!user?.uid) return;
    try {
      const taskRef = doc(db, 'users', user.uid, 'tasks', taskId);
      await updateDoc(taskRef, {
        completed: !currentStatus
      });
    } catch (error) {
      console.error('Error toggling task:', error);
    }
  };

  const deleteTask = async (taskId: string) => {
    if (!user?.uid) return;
    try {
      const taskRef = doc(db, 'users', user.uid, 'tasks', taskId);
      await deleteDoc(taskRef);
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const upcomingTasks = tasks.filter(t => !t.completed);
  const completedTasks = tasks.filter(t => t.completed);

  return (
    <div className="bg-white rounded-3xl p-5 shadow-lg border border-slate-100 flex flex-col w-full">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Calendar size={18} />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Daily Digest</h3>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </p>
          </div>
        </div>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="w-8 h-8 rounded-full bg-slate-50 hover:bg-slate-100 text-slate-600 flex items-center justify-center transition-colors"
        >
          {isAdding ? <Plus size={16} className="rotate-45" /> : <Plus size={16} />}
        </button>
      </div>

      <AnimatePresence>
        {isAdding && (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            onSubmit={handleAddTask}
            className="mb-4 space-y-3 overflow-hidden"
          >
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-3">
              <input
                type="text"
                placeholder="What needs to be done?"
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                required
              />
              <div className="flex gap-2">
                <input
                  type="date"
                  value={newTaskDate}
                  onChange={(e) => setNewTaskDate(e.target.value)}
                  className="flex-1 px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  required
                />
                <select
                  value={newTaskType}
                  onChange={(e) => setNewTaskType(e.target.value as any)}
                  className="flex-1 px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                >
                  <option value="task">General Task</option>
                  <option value="curriculum_deadline">Curriculum Deadline</option>
                </select>
              </div>
              <button
                type="submit"
                disabled={!newTaskTitle.trim() || !newTaskDate}
                className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-colors disabled:opacity-50"
              >
                Add to Digest
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      <div className="flex-1 overflow-y-auto space-y-4 max-h-[400px] pr-2 custom-scrollbar">
        {upcomingTasks.length === 0 && completedTasks.length === 0 ? (
          <div className="text-center py-8 text-slate-400">
            <Clock size={32} className="mx-auto mb-3 opacity-20" />
            <p className="text-xs font-bold uppercase tracking-wider">No tasks scheduled</p>
            <p className="text-[10px] mt-1">Enjoy your day or add a new task!</p>
          </div>
        ) : (
          <>
            {upcomingTasks.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Upcoming</h4>
                <div className="space-y-2">
                  {upcomingTasks.map(task => (
                    <motion.div
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      key={task.id}
                      className={cn(
                        "group flex items-start gap-3 p-3 rounded-2xl border transition-all",
                        task.type === 'curriculum_deadline' ? "bg-orange-50/50 border-orange-100 hover:border-orange-200" : "bg-white border-slate-100 hover:border-slate-200"
                      )}
                    >
                      <button onClick={() => toggleTask(task.id, task.completed)} className="mt-0.5 shrink-0 text-slate-300 hover:text-blue-500 transition-colors">
                        <Circle size={18} />
                      </button>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-slate-700 line-clamp-2">{task.title}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={cn(
                            "text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded",
                            task.type === 'curriculum_deadline' ? "bg-orange-100 text-orange-600" : "bg-slate-100 text-slate-500"
                          )}>
                            {task.type === 'curriculum_deadline' ? 'Deadline' : 'Task'}
                          </span>
                          <span className="text-[10px] text-slate-400 font-semibold flex items-center gap-1">
                            <Clock size={10} />
                            {task.dueDate.toLocaleDateString([], { month: 'short', day: 'numeric' })}
                          </span>
                        </div>
                      </div>
                      <button onClick={() => deleteTask(task.id)} className="opacity-0 group-hover:opacity-100 p-1 text-slate-300 hover:text-red-500 transition-all shrink-0">
                        <Trash2 size={14} />
                      </button>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {completedTasks.length > 0 && (
              <div className="space-y-2 pt-2">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Completed</h4>
                <div className="space-y-2">
                  {completedTasks.map(task => (
                    <motion.div
                      layout
                      key={task.id}
                      className="group flex items-start gap-3 p-3 rounded-2xl bg-slate-50/50 border border-transparent opacity-60 hover:opacity-100 transition-all"
                    >
                      <button onClick={() => toggleTask(task.id, task.completed)} className="mt-0.5 shrink-0 text-emerald-500">
                        <CheckCircle2 size={18} />
                      </button>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-slate-500 line-through">{task.title}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          {task.type === 'curriculum_deadline' ? 'Curriculum Deadline' : 'General Task'}
                        </p>
                      </div>
                      <button onClick={() => deleteTask(task.id)} className="opacity-0 group-hover:opacity-100 p-1 text-slate-300 hover:text-red-500 transition-all shrink-0">
                        <Trash2 size={14} />
                      </button>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
