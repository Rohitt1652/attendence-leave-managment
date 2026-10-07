const Department = require('../models/Department');
const AuditService = require('../services/AuditService');

// @route   GET /api/v1/departments
const getDepartments = async (req, res, next) => {
  try {
    const departments = await Department.find()
      .populate('managerId', 'firstName lastName employeeCode email')
      .sort({ name: 1 });
    res.status(200).json({ success: true, data: departments });
  } catch (error) {
    next(error);
  }
};

// @route   POST /api/v1/departments
const createDepartment = async (req, res, next) => {
  try {
    const department = await Department.create(req.body);
    await AuditService.log({
      userId: req.user._id,
      userEmail: req.user.email,
      action: 'DEPARTMENT_CREATED',
      module: 'Department',
      recordId: department._id,
      newData: department,
      req,
    });
    res.status(201).json({ success: true, message: 'Department created', data: department });
  } catch (error) {
    next(error);
  }
};

// @route   PUT /api/v1/departments/:id
const updateDepartment = async (req, res, next) => {
  try {
    const oldData = await Department.findById(req.params.id);
    const updated = await Department.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );
    await AuditService.log({
      userId: req.user._id,
      userEmail: req.user.email,
      action: 'DEPARTMENT_UPDATED',
      module: 'Department',
      recordId: req.params.id,
      oldData,
      newData: updated,
      req,
    });
    res.status(200).json({ success: true, message: 'Department updated', data: updated });
  } catch (error) {
    next(error);
  }
};

// @route   DELETE /api/v1/departments/:id
const deleteDepartment = async (req, res, next) => {
  try {
    const dept = await Department.findByIdAndDelete(req.params.id);
    await AuditService.log({
      userId: req.user._id,
      userEmail: req.user.email,
      action: 'DEPARTMENT_DELETED',
      module: 'Department',
      recordId: req.params.id,
      oldData: dept,
      req,
    });
    res.status(200).json({ success: true, message: 'Department deleted' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment,
};
