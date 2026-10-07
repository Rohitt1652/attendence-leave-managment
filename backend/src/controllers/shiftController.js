const Shift = require('../models/Shift');
const AuditService = require('../services/AuditService');

// @route   GET /api/v1/shifts
const getShifts = async (req, res, next) => {
  try {
    const shifts = await Shift.find().sort({ name: 1 });
    res.status(200).json({ success: true, data: shifts });
  } catch (error) {
    next(error);
  }
};

// @route   POST /api/v1/shifts
const createShift = async (req, res, next) => {
  try {
    const shift = await Shift.create(req.body);
    await AuditService.log({
      userId: req.user._id,
      userEmail: req.user.email,
      action: 'SHIFT_CREATED',
      module: 'Shift',
      recordId: shift._id,
      newData: shift,
      req,
    });
    res.status(201).json({ success: true, message: 'Shift created', data: shift });
  } catch (error) {
    next(error);
  }
};

// @route   PUT /api/v1/shifts/:id
const updateShift = async (req, res, next) => {
  try {
    const oldData = await Shift.findById(req.params.id);
    const updated = await Shift.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );
    await AuditService.log({
      userId: req.user._id,
      userEmail: req.user.email,
      action: 'SHIFT_UPDATED',
      module: 'Shift',
      recordId: req.params.id,
      oldData,
      newData: updated,
      req,
    });
    res.status(200).json({ success: true, message: 'Shift updated', data: updated });
  } catch (error) {
    next(error);
  }
};

// @route   DELETE /api/v1/shifts/:id
const deleteShift = async (req, res, next) => {
  try {
    const shift = await Shift.findByIdAndDelete(req.params.id);
    await AuditService.log({
      userId: req.user._id,
      userEmail: req.user.email,
      action: 'SHIFT_DELETED',
      module: 'Shift',
      recordId: req.params.id,
      oldData: shift,
      req,
    });
    res.status(200).json({ success: true, message: 'Shift deleted' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getShifts,
  createShift,
  updateShift,
  deleteShift,
};
