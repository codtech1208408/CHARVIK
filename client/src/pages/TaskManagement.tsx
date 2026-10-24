import React, { useState, useEffect } from 'react';
import {
  ClipboardList,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  Bus,
  User,
  Edit,
  Trash2,
  Calendar,
  Check
} from 'lucide-react';
import { Modal } from '../components/common/Modal';
import { useToast } from '../components/common/Toast';
import { api } from '../services/api';

interface TaskItem {
  id: number;
  title: string;
  category: 'Preventive Maintenance' | 'Urgent Repair' | 'Cleaning & Sanitization' | 'Compliance & Documents' | 'Route Duty';
  priority: 'Urgent' | 'High' | 'Medium' | 'Low';
  assigned_to: string;
  bus_number: string;
  due_date: string;
  status: 'To Do' | 'In Progress' | 'Completed';
  notes: string;
}

const STORAGE_KEY = 'charvik_task_management_data';

export const TaskManagement: React.FC = () => {
  const { success, error } = useToast();

  const [tasks, setTasks] = useState<TaskItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [buses, setBuses] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskItem | null>(null);

  const [formData, setFormData] = useState<Partial<TaskItem>>({
    title: '',
    category: 'Preventive Maintenance',
    priority: 'Medium',
    assigned_to: '',
    bus_number: '',
    due_date: new Date().toISOString().split('T')[0],
    status: 'To Do',
    notes: ''
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    } catch {}
  }, [tasks]);

  useEffect(() => {
    async function loadAux() {
      try {
        const [bData, eData] = await Promise.all([
          api.getBuses().catch(() => []),
          api.getEmployees().catch(() => [])
        ]);
        setBuses(Array.isArray(bData) ? bData : []);
        setEmployees(Array.isArray(eData) ? eData : []);
      } catch {}
    }
    loadAux();
  }, []);

  const handleOpenAdd = () => {
    setEditingTask(null);
    setFormData({
      title: '',
      category: 'Preventive Maintenance',
      priority: 'Medium',
      assigned_to: employees[0]?.full_name || 'Fleet Mechanic',
      bus_number: buses[0]?.bus_number || 'Bus #101',
      due_date: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
      status: 'To Do',
      notes: ''
    });
    setIsAddOpen(true);
  };

  const handleOpenEdit = (task: TaskItem) => {
    setEditingTask(task);
    setFormData({ ...task });
    setIsAddOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title) {
      error('Please enter task title.');
      return;
    }

    if (editingTask) {
      const updated = tasks.map((t) =>
        t.id === editingTask.id ? ({ ...t, ...formData } as TaskItem) : t
      );
      setTasks(updated);
      success('Task updated successfully.');
    } else {
      const newItem: TaskItem = {
        id: Date.now(),
        title: formData.title!,
        category: (formData.category as any) || 'Preventive Maintenance',
        priority: (formData.priority as any) || 'Medium',
        assigned_to: formData.assigned_to || 'Assigned Staff',
        bus_number: formData.bus_number || 'General Depot',
        due_date: formData.due_date || new Date().toISOString().split('T')[0],
        status: (formData.status as any) || 'To Do',
        notes: formData.notes || ''
      };
      setTasks([newItem, ...tasks]);
      success('New task created.');
    }
    setIsAddOpen(false);
  };

  const handleToggleComplete = (id: number) => {
    const updated = tasks.map((t) => {
      if (t.id === id) {
        const nextStatus: TaskItem['status'] = t.status === 'Completed' ? 'To Do' : 'Completed';
        return { ...t, status: nextStatus };
      }
      return t;
    });
    setTasks(updated);
    success('Task status updated.');
  };

  const handleDelete = (id: number) => {
    if (!confirm('Are you sure you want to delete this task?')) return;
    setTasks(tasks.filter((t) => t.id !== id));
    success('Task deleted.');
  };

  const filteredTasks = tasks.filter((t) => {
    const matchesSearch =
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      t.assigned_to.toLowerCase().includes(search.toLowerCase()) ||
      t.bus_number.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'All' || t.status === statusFilter;
    const matchesPriority = priorityFilter === 'All' || t.priority === priorityFilter;
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const urgentCount = tasks.filter((t) => t.priority === 'Urgent' && t.status !== 'Completed').length;
  const inProgressCount = tasks.filter((t) => t.status === 'In Progress').length;
  const completedCount = tasks.filter((t) => t.status === 'Completed').length;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-amber-500" />
            <span>Task Management</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Operational action items, preventive service duties, inspections, and assigned team tasks.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Task</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase">Urgent Action Items</p>
            <h3 className="text-2xl font-black text-rose-600 mt-1">{urgentCount} Tasks</h3>
            <p className="text-[11px] text-slate-400 mt-0.5">High priority fleet tasks</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
            <AlertCircle className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase">In Progress</p>
            <h3 className="text-2xl font-black text-amber-600 mt-1">{inProgressCount} Tasks</h3>
            <p className="text-[11px] text-slate-400 mt-0.5">Currently being executed</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase">Completed</p>
            <h3 className="text-2xl font-black text-emerald-600 mt-1">{completedCount} Tasks</h3>
            <p className="text-[11px] text-slate-400 mt-0.5">Closed out successfully</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter Strip */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search tasks by title, assigned staff, bus..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none"
          />
        </div>

        <div className="w-full md:w-44">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full text-xs p-2 rounded-xl border border-slate-200 bg-slate-50 outline-none font-medium"
          >
            <option value="All">All Statuses</option>
            <option value="To Do">To Do</option>
            <option value="In Progress">In Progress</option>
            <option value="Completed">Completed</option>
          </select>
        </div>

        <div className="w-full md:w-44">
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="w-full text-xs p-2 rounded-xl border border-slate-200 bg-slate-50 outline-none font-medium"
          >
            <option value="All">All Priorities</option>
            <option value="Urgent">Urgent</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 text-slate-700 uppercase font-bold tracking-wider text-[11px] border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Done</th>
                <th className="py-3 px-4">Task Title</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Priority</th>
                <th className="py-3 px-4">Bus</th>
                <th className="py-3 px-4">Assigned Person</th>
                <th className="py-3 px-4">Due Date</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredTasks.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    No task management items found. Click &quot;Create New Task&quot; to add.
                  </td>
                </tr>
              ) : (
                filteredTasks.map((t) => (
                  <tr
                    key={t.id}
                    className={`hover:bg-slate-50/70 transition-colors ${
                      t.status === 'Completed' ? 'bg-slate-50/40 opacity-75' : ''
                    }`}
                  >
                    <td className="py-3 px-4">
                      <button
                        onClick={() => handleToggleComplete(t.id)}
                        className={`w-5 h-5 rounded-md flex items-center justify-center border transition-all cursor-pointer ${
                          t.status === 'Completed'
                            ? 'bg-emerald-600 border-emerald-600 text-white'
                            : 'border-slate-300 hover:border-amber-500 text-transparent hover:text-amber-500'
                        }`}
                      >
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </button>
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900">
                      <span className={t.status === 'Completed' ? 'line-through text-slate-500' : ''}>
                        {t.title}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-600">{t.category}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          t.priority === 'Urgent'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : t.priority === 'High'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-blue-50 text-blue-700 border border-blue-200'
                        }`}
                      >
                        {t.priority}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-800">{t.bus_number}</td>
                    <td className="py-3 px-4 text-slate-700">{t.assigned_to}</td>
                    <td className="py-3 px-4 font-medium text-slate-600">{t.due_date}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          t.status === 'Completed'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : t.status === 'In Progress'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-slate-100 text-slate-700 border border-slate-200'
                        }`}
                      >
                        {t.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center space-x-1.5">
                        <button
                          onClick={() => handleOpenEdit(t)}
                          className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                          title="Edit Task"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(t.id)}
                          className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Modal */}
      <Modal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        title={editingTask ? 'Edit Action Task' : 'Create Operational Task'}
        subtitle="Assign tasks to drivers, mechanics, or support staff with priority and due dates"
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Task Title *</label>
            <input
              type="text"
              required
              value={formData.title || ''}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g. Replace front brake liners on Bus #104"
              className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Category *</label>
              <select
                value={formData.category || 'Preventive Maintenance'}
                onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none"
              >
                <option value="Preventive Maintenance">Preventive Maintenance</option>
                <option value="Urgent Repair">Urgent Repair</option>
                <option value="Cleaning & Sanitization">Cleaning & Sanitization</option>
                <option value="Compliance & Documents">Compliance & Documents</option>
                <option value="Route Duty">Route Duty</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Priority Level *</label>
              <select
                value={formData.priority || 'Medium'}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none"
              >
                <option value="Urgent">Urgent (Immediate)</option>
                <option value="High">High Priority</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low / Routine</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Assign To Staff</label>
              <select
                value={formData.assigned_to || ''}
                onChange={(e) => setFormData({ ...formData, assigned_to: e.target.value })}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none"
              >
                <option value="">-- Select Person --</option>
                {employees.map((e) => (
                  <option key={e.id} value={e.full_name}>
                    {e.full_name} ({e.role})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Related Fleet Bus</label>
              <select
                value={formData.bus_number || ''}
                onChange={(e) => setFormData({ ...formData, bus_number: e.target.value })}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none"
              >
                <option value="">General / Depot</option>
                {buses.map((b) => (
                  <option key={b.id} value={b.bus_number}>
                    {b.bus_number} ({b.registration_number})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Target Due Date</label>
              <input
                type="date"
                value={formData.due_date || ''}
                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Current Status</label>
              <select
                value={formData.status || 'To Do'}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none"
              >
                <option value="To Do">To Do</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Task Instructions & Notes</label>
            <textarea
              rows={2}
              value={formData.notes || ''}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Provide specific instructions for the mechanic or driver..."
              className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsAddOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-amber-500 hover:bg-amber-600 transition-colors shadow-xs cursor-pointer"
            >
              {editingTask ? 'Update Task' : 'Create Task'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
