const Designation = require('../models/Designation');
const AuditService = require('../services/AuditService');

// @route   GET /api/v1/designations
const getDesignations = async (req, res, next) => {
  try {
    const { departmentId } = req.query;
    const query = {};
    if (departmentId) query.departmentId = departmentId;

    const designations = await Designation.find(query)
      .populate('departmentId', 'name code')
      .sort({ name: 1 });
    res.status(200).json({ success: true, data: designations });
  } catch (error) {
    next(error);
  }
};

// @route   POST /api/v1/designations
const createDesignation = async (req, res, next) => {
  try {
    const designation = await Designation.create(req.body);
    await AuditService.log({
      userId: req.user._id,
      userEmail: req.user.email,
      action: 'DESIGNATION_CREATED',
      module: 'Designation',
      recordId: designation._id,
      newData: designation,
      req,
    });
    res.status(201).json({ success: true, message: 'Designation created', data: designation });
  } catch (error) {
    next(error);
  }
};

// @route   PUT /api/v1/designations/:id
const updateDesignation = async (req, res, next) => {
  try {
    const oldData = await Designation.findById(req.params.id);
    const updated = await Designation.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );
    await AuditService.log({
      userId: req.user._id,
      userEmail: req.user.email,
      action: 'DESIGNATION_UPDATED',
      module: 'Designation',
      recordId: req.params.id,
      oldData,
      newData: updated,
      req,
    });
    res.status(200).json({ success: true, message: 'Designation updated', data: updated });
  } catch (error) {
    next(error);
  }
};

// @route   DELETE /api/v1/designations/:id
const deleteDesignation = async (req, res, next) => {
  try {
    const desig = await Designation.findByIdAndDelete(req.params.id);
    await AuditService.log({
      userId: req.user._id,
      userEmail: req.user.email,
      action: 'DESIGNATION_DELETED',
      module: 'Designation',
      recordId: req.params.id,
      oldData: desig,
      req,
    });
    res.status(200).json({ success: true, message: 'Designation deleted' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDesignations,
  createDesignation,
  updateDesignation,
  deleteDesignation,
};
