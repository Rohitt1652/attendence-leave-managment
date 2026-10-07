const Role = require('../models/Role');
const Permission = require('../models/Permission');
const AuditService = require('../services/AuditService');
const { ALL_PERMISSIONS } = require('../constants/permissions');

// @route   GET /api/v1/permissions
const getPermissions = async (req, res, next) => {
  try {
    const permissions = await Permission.find().sort({ module: 1, name: 1 });
    res.status(200).json({ success: true, data: permissions });
  } catch (error) {
    next(error);
  }
};

// @route   GET /api/v1/roles
const getRoles = async (req, res, next) => {
  try {
    const roles = await Role.find().sort({ isSystemRole: -1, name: 1 });
    res.status(200).json({ success: true, data: roles });
  } catch (error) {
    next(error);
  }
};

// @route   POST /api/v1/roles
const createRole = async (req, res, next) => {
  try {
    const role = await Role.create(req.body);
    await AuditService.log({
      userId: req.user._id,
      userEmail: req.user.email,
      action: 'ROLE_CREATED',
      module: 'Role',
      recordId: role._id,
      newData: role,
      req,
    });
    res.status(201).json({ success: true, message: 'Role created successfully', data: role });
  } catch (error) {
    next(error);
  }
};

// @route   PUT /api/v1/roles/:id
const updateRole = async (req, res, next) => {
  try {
    const role = await Role.findById(req.params.id);
    if (!role) {
      return res.status(404).json({ success: false, message: 'Role not found' });
    }

    const oldData = role.toObject();
    const updated = await Role.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );

    await AuditService.log({
      userId: req.user._id,
      userEmail: req.user.email,
      action: 'ROLE_UPDATED',
      module: 'Role',
      recordId: role._id,
      oldData,
      newData: updated,
      req,
    });

    res.status(200).json({ success: true, message: 'Role updated successfully', data: updated });
  } catch (error) {
    next(error);
  }
};

// @route   DELETE /api/v1/roles/:id
const deleteRole = async (req, res, next) => {
  try {
    const role = await Role.findById(req.params.id);
    if (!role) {
      return res.status(404).json({ success: false, message: 'Role not found' });
    }

    if (role.isSystemRole) {
      return res.status(400).json({
        success: false,
        message: 'System default roles cannot be deleted.',
      });
    }

    await Role.findByIdAndDelete(req.params.id);
    await AuditService.log({
      userId: req.user._id,
      userEmail: req.user.email,
      action: 'ROLE_DELETED',
      module: 'Role',
      recordId: req.params.id,
      oldData: role,
      req,
    });

    res.status(200).json({ success: true, message: 'Role deleted successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getPermissions,
  getRoles,
  createRole,
  updateRole,
  deleteRole,
};
