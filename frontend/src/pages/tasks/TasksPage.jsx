import React, { useState, useEffect } from 'react';
import apiClient from '../../api/client';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import { TableSkeleton } from '../../components/common/Skeleton';
import EmptyState from '../../components/common/EmptyState';
import { CheckSquare, Plus, MessageSquare, Clock, User, AlertCircle } from 'lucide-react';

const TasksPage = () => {
  const [tasks, setTasks] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    title: '',
    description: '',
    assignedTo: '',
    priority: 'Medium',
    dueDate: '',
  });

  const [selectedTask, setSelectedTask] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [newComment, setNewComment] = useState('');

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/tasks', {
        params: { status: statusFilter, priority: priorityFilter },
      });
      setTasks(res.data.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const res = await apiClient.get('/employees', { params: { limit: 100 } });
      setEmployees(res.data.data);
      if (res.data.data.length > 0) {
        setCreateForm((prev) => ({ ...prev, assignedTo: res.data.data[0]._id }));
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [statusFilter, priorityFilter]);

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    try {
      await apiClient.post('/tasks', createForm);
      setIsCreateModalOpen(false);
      fetchTasks();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create task');
    }
  };

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      await apiClient.put(`/tasks/${taskId}`, { status: newStatus });
      fetchTasks();
      if (selectedTask?._id === taskId) {
        setSelectedTask((prev) => ({ ...prev, status: newStatus }));
      }
    } catch (err) {
      alert('Failed to update status');
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    try {
      const res = await apiClient.post(`/tasks/${selectedTask._id}/comments`, {
        text: newComment,
      });
      setSelectedTask(res.data.data);
      setNewComment('');
      fetchTasks();
    } catch (err) {
      alert('Failed to add comment');
    }
  };

  const getPriorityBadgeVariant = (p) => {
    switch (p) {
      case 'Urgent': return 'danger';
      case 'High': return 'warning';
      case 'Medium': return 'primary';
      case 'Low':
      default: return 'neutral';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Office Tasks & Deliverables</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Coordinate operations, team priorities, tracking deadlines and discussions.
          </p>
        </div>

        <Button variant="primary" size="sm" icon={Plus} onClick={() => setIsCreateModalOpen(true)}>
          Assign New Task
        </Button>
      </div>

      {/* Filter Bar */}
      <Card className="p-3!">
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            {['', 'Pending', 'In Progress', 'Completed', 'On Hold'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  statusFilter === st
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {st || 'All Statuses'}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
            >
              <option value="">All Priorities</option>
              <option value="Urgent">Urgent</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Tasks Grid */}
      {loading ? (
        <TableSkeleton rows={4} cols={3} />
      ) : tasks.length === 0 ? (
        <EmptyState title="No office tasks found" actionLabel="Assign Task" onAction={() => setIsCreateModalOpen(true)} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tasks.map((task) => (
            <div
              key={task._id}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between hover:border-indigo-200 transition-colors"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <Badge variant={getPriorityBadgeVariant(task.priority)} size="xs">
                    {task.priority} Priority
                  </Badge>

                  <select
                    value={task.status}
                    onChange={(e) => handleStatusChange(task._id, e.target.value)}
                    className="text-[11px] font-semibold bg-slate-50 border border-slate-200 rounded-md px-2 py-0.5 text-slate-700"
                  >
                    <option value="Pending">Pending</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                    <option value="On Hold">On Hold</option>
                  </select>
                </div>

                <h3
                  onClick={() => { setSelectedTask(task); setIsDetailModalOpen(true); }}
                  className="font-bold text-sm text-slate-900 cursor-pointer hover:text-indigo-600 line-clamp-1 mt-1"
                >
                  {task.title}
                </h3>
                <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                  {task.description || 'No detailed instructions specified.'}
                </p>
              </div>

              <div className="pt-4 border-t border-slate-100 mt-4 flex items-center justify-between text-xs text-slate-500">
                <div className="flex items-center gap-2">
                  <div className="h-6 w-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-[10px] font-bold">
                    {task.assignedTo?.firstName?.[0] || 'U'}
                  </div>
                  <span className="text-[11px] font-medium text-slate-700 truncate max-w-[100px]">
                    {task.assignedTo ? `${task.assignedTo.firstName} ${task.assignedTo.lastName}` : 'Unassigned'}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  {task.dueDate && (
                    <span className="text-[10px] text-slate-400 font-mono">
                      Due: {new Date(task.dueDate).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                    </span>
                  )}
                  <button
                    onClick={() => { setSelectedTask(task); setIsDetailModalOpen(true); }}
                    className="flex items-center gap-1 text-[11px] text-indigo-600 hover:text-indigo-800 font-semibold"
                  >
                    <MessageSquare className="h-3 w-3" /> {task.comments?.length || 0}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Task Modal */}
      <Modal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} title="Assign New Office Task">
        <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-medium text-slate-700 mb-1">Task Title *</label>
            <input
              type="text"
              required
              value={createForm.title}
              onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
            />
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">Description</label>
            <textarea
              rows={3}
              value={createForm.description}
              onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-medium text-slate-700 mb-1">Assigned To *</label>
              <select
                required
                value={createForm.assignedTo}
                onChange={(e) => setCreateForm({ ...createForm, assignedTo: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
              >
                {employees.map((emp) => (
                  <option key={emp._id} value={emp._id}>
                    {emp.firstName} {emp.lastName} ({emp.employeeCode})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">Priority</label>
              <select
                value={createForm.priority}
                onChange={(e) => setCreateForm({ ...createForm, priority: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Urgent">Urgent</option>
              </select>
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">Due Date</label>
              <input
                type="date"
                value={createForm.dueDate}
                onChange={(e) => setCreateForm({ ...createForm, dueDate: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <Button variant="outline" size="sm" onClick={() => setIsCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit">
              Assign Task
            </Button>
          </div>
        </form>
      </Modal>

      {/* Task Details & Comments Modal */}
      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        title={selectedTask?.title || 'Task Details'}
        subtitle={`Priority: ${selectedTask?.priority} • Status: ${selectedTask?.status}`}
      >
        <div className="space-y-4 text-xs">
          <p className="text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
            {selectedTask?.description || 'No description provided.'}
          </p>

          {/* Comments list */}
          <div>
            <h4 className="font-semibold text-slate-800 mb-2">Discussion & Progress Notes</h4>
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {selectedTask?.comments?.length > 0 ? (
                selectedTask.comments.map((c, i) => (
                  <div key={i} className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 text-xs">
                    <div className="flex items-center justify-between text-[11px] mb-1">
                      <span className="font-semibold text-slate-900">{c.authorName || c.authorEmail}</span>
                      <span className="text-[10px] text-slate-400">
                        {new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-slate-700">{c.text}</p>
                  </div>
                ))
              ) : (
                <p className="text-slate-400 italic">No notes yet</p>
              )}
            </div>

            <form onSubmit={handleAddComment} className="flex gap-2 mt-3">
              <input
                type="text"
                placeholder="Write an update comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="flex-1 px-3 py-1.5 border border-slate-200 rounded-lg text-xs"
              />
              <Button size="xs" variant="primary" type="submit">
                Post
              </Button>
            </form>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default TasksPage;
