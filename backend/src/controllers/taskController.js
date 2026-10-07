const Task = require('../models/Task');
const Employee = require('../models/Employee');
const NotificationService = require('../services/NotificationService');
const AuditService = require('../services/AuditService');

// @route   GET /api/v1/tasks
const getTasks = async (req, res, next) => {
  try {
    const { status, priority, assignedTo, departmentId, myTasks } = req.query;
    const query = {};

    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (departmentId) query.departmentId = departmentId;

    if (myTasks === 'true' && req.employee) {
      query.assignedTo = req.employee._id;
    } else if (assignedTo) {
      query.assignedTo = assignedTo;
    }

    const tasks = await Task.find(query)
      .populate('assignedTo', 'firstName lastName employeeCode profileImage')
      .populate('assignedBy', 'firstName lastName employeeCode')
      .populate('departmentId', 'name')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: tasks });
  } catch (error) {
    next(error);
  }
};

// @route   POST /api/v1/tasks
const createTask = async (req, res, next) => {
  try {
    const taskData = {
      ...req.body,
      assignedBy: req.employee?._id,
    };

    const task = await Task.create(taskData);

    // Notify assigned employee
    const assignee = await Employee.findById(task.assignedTo);
    if (assignee && assignee.userId) {
      await NotificationService.send({
        recipientId: assignee.userId,
        title: 'New Task Assigned',
        message: `You were assigned: "${task.title}" (Priority: ${task.priority})`,
        link: '/tasks',
      });
    }

    res.status(201).json({ success: true, message: 'Task created successfully', data: task });
  } catch (error) {
    next(error);
  }
};

// @route   PUT /api/v1/tasks/:id
const updateTask = async (req, res, next) => {
  try {
    const task = await Task.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    )
      .populate('assignedTo', 'firstName lastName')
      .populate('assignedBy', 'firstName lastName');

    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    res.status(200).json({ success: true, message: 'Task updated successfully', data: task });
  } catch (error) {
    next(error);
  }
};

// @route   POST /api/v1/tasks/:id/comments
const addTaskComment = async (req, res, next) => {
  try {
    const { text } = req.body;
    if (!text) {
      return res.status(400).json({ success: false, message: 'Comment text is required.' });
    }

    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    const comment = {
      authorName: req.employee ? `${req.employee.firstName} ${req.employee.lastName}` : req.user.email,
      authorEmail: req.user.email,
      text,
      createdAt: new Date(),
    };

    task.comments.push(comment);
    await task.save();

    res.status(200).json({ success: true, message: 'Comment added', data: task });
  } catch (error) {
    next(error);
  }
};

// @route   DELETE /api/v1/tasks/:id
const deleteTask = async (req, res, next) => {
  try {
    await Task.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: 'Task deleted successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getTasks,
  createTask,
  updateTask,
  addTaskComment,
  deleteTask,
};
