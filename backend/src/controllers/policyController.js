const Policy = require('../models/Policy');
const PolicyAcknowledgement = require('../models/PolicyAcknowledgement');
const AuditService = require('../services/AuditService');

// @route   GET /api/v1/policies
const getPolicies = async (req, res, next) => {
  try {
    const policies = await Policy.find({ status: 'Published' }).sort({ createdAt: -1 }).lean();

    // Check which ones logged-in employee has acknowledged
    if (req.employee) {
      const acks = await PolicyAcknowledgement.find({ employeeId: req.employee._id });
      const ackSet = new Set(acks.map((a) => String(a.policyId)));

      const mapped = policies.map((p) => ({
        ...p,
        isAcknowledged: ackSet.has(String(p._id)),
      }));
      return res.status(200).json({ success: true, data: mapped });
    }

    res.status(200).json({ success: true, data: policies });
  } catch (error) {
    next(error);
  }
};

// @route   POST /api/v1/policies
const createPolicy = async (req, res, next) => {
  try {
    const policy = await Policy.create({
      ...req.body,
      publishedBy: req.user._id,
    });
    await AuditService.log({
      userId: req.user._id,
      userEmail: req.user.email,
      action: 'POLICY_CREATED',
      module: 'Policy',
      recordId: policy._id,
      newData: policy,
      req,
    });
    res.status(201).json({ success: true, message: 'Policy created', data: policy });
  } catch (error) {
    next(error);
  }
};

// @route   PUT /api/v1/policies/:id
const updatePolicy = async (req, res, next) => {
  try {
    const updated = await Policy.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true });
    res.status(200).json({ success: true, message: 'Policy updated', data: updated });
  } catch (error) {
    next(error);
  }
};

// @route   DELETE /api/v1/policies/:id
const deletePolicy = async (req, res, next) => {
  try {
    await Policy.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: 'Policy deleted' });
  } catch (error) {
    next(error);
  }
};

// @route   POST /api/v1/policies/:id/acknowledge
const acknowledgePolicy = async (req, res, next) => {
  try {
    const employee = req.employee;
    if (!employee) {
      return res.status(400).json({ success: false, message: 'No employee linked.' });
    }

    const ack = await PolicyAcknowledgement.findOneAndUpdate(
      { policyId: req.params.id, employeeId: employee._id },
      { $set: { acknowledgedAt: new Date() } },
      { upsert: true, new: true }
    );

    res.status(200).json({
      success: true,
      message: 'Policy acknowledged successfully.',
      data: ack,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getPolicies,
  createPolicy,
  updatePolicy,
  deletePolicy,
  acknowledgePolicy,
};
