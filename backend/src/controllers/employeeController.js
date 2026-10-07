const Employee = require('../models/Employee');
const User = require('../models/User');
const Role = require('../models/Role');
const EmployeeIdService = require('../services/EmployeeIdService');
const AuditService = require('../services/AuditService');
const { ROLE_CODES } = require('../constants/roles');

// @route   GET /api/v1/employees
// @desc    Get all employees with search, filters, pagination and sorting
const getEmployees = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      departmentId,
      designationId,
      teamId,
      employmentType,
      status,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query;

    const query = {};

    if (search) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { firstName: searchRegex },
        { lastName: searchRegex },
        { email: searchRegex },
        { employeeCode: searchRegex },
      ];
    }

    if (departmentId) query.departmentId = departmentId;
    if (designationId) query.designationId = designationId;
    if (teamId) query.teamId = teamId;
    if (employmentType) query.employmentType = employmentType;
    if (status) query.status = status;

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const sortOption = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    const total = await Employee.countDocuments(query);
    const employees = await Employee.find(query)
      .populate('departmentId', 'name code')
      .populate('designationId', 'name code')
      .populate('teamId', 'name')
      .populate('reportingManagerId', 'firstName lastName employeeCode')
      .populate('teamLeadId', 'firstName lastName employeeCode')
      .populate('shiftId', 'name startTime endTime')
      .sort(sortOption)
      .skip(skip)
      .limit(limitNum);

    res.status(200).json({
      success: true,
      data: employees,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum) || 1,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @route   GET /api/v1/employees/:id
// @desc    Get single employee details
const getEmployeeById = async (req, res, next) => {
  try {
    const employee = await Employee.findById(req.params.id)
      .populate('userId', 'email status lastLoginAt roleId')
      .populate('departmentId', 'name code description')
      .populate('designationId', 'name code')
      .populate('teamId', 'name')
      .populate('reportingManagerId', 'firstName lastName employeeCode email')
      .populate('teamLeadId', 'firstName lastName employeeCode email')
      .populate('shiftId');

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found.',
      });
    }

    res.status(200).json({
      success: true,
      data: employee,
    });
  } catch (error) {
    next(error);
  }
};

// @route   POST /api/v1/employees
// @desc    Create new employee with automatic code generation and user account creation
const createEmployee = async (req, res, next) => {
  try {
    const employeeData = { ...req.body };

    // Auto-generate employee code if not explicitly given
    if (!employeeData.employeeCode) {
      employeeData.employeeCode = await EmployeeIdService.generateNextEmployeeCode();
    }

    // Check duplicate code or email
    const existingEmp = await Employee.findOne({
      $or: [{ employeeCode: employeeData.employeeCode }, { email: employeeData.email.toLowerCase() }],
    });

    if (existingEmp) {
      return res.status(400).json({
        success: false,
        message: 'An employee with this email or employee code already exists.',
      });
    }

    // Optional user creation
    let createdUser = null;
    if (req.body.createLoginAccount) {
      // Find role
      let roleId = req.body.roleId;
      if (!roleId) {
        const defaultRole = await Role.findOne({ code: ROLE_CODES.EMPLOYEE });
        roleId = defaultRole ? defaultRole._id : null;
      }

      if (roleId) {
        createdUser = await User.create({
          employeeId: employeeData.employeeCode,
          email: employeeData.email.toLowerCase(),
          password: req.body.password || 'Employee@123',
          roleId,
          status: 'Active',
        });
        employeeData.userId = createdUser._id;
      }
    }

    const employee = await Employee.create(employeeData);

    await AuditService.log({
      userId: req.user._id,
      userEmail: req.user.email,
      action: 'EMPLOYEE_CREATED',
      module: 'Employee',
      recordId: employee._id,
      newData: employee,
      req,
    });

    res.status(201).json({
      success: true,
      message: 'Employee created successfully.',
      data: employee,
    });
  } catch (error) {
    next(error);
  }
};

// @route   PUT /api/v1/employees/:id
// @desc    Update employee
const updateEmployee = async (req, res, next) => {
  try {
    const employee = await Employee.findById(req.params.id);
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found.',
      });
    }

    const oldData = employee.toObject();
    const updatedEmployee = await Employee.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    )
      .populate('departmentId', 'name code')
      .populate('designationId', 'name code')
      .populate('teamId', 'name')
      .populate('shiftId');

    // Also synchronize user email or status if updated
    if (employee.userId) {
      const userUpdates = {};
      if (req.body.email) userUpdates.email = req.body.email.toLowerCase();
      if (req.body.status) {
        userUpdates.status = req.body.status === 'Active' ? 'Active' : 'Inactive';
      }
      if (Object.keys(userUpdates).length > 0) {
        await User.findByIdAndUpdate(employee.userId, { $set: userUpdates });
      }
    }

    await AuditService.log({
      userId: req.user._id,
      userEmail: req.user.email,
      action: 'EMPLOYEE_UPDATED',
      module: 'Employee',
      recordId: employee._id,
      oldData,
      newData: updatedEmployee,
      req,
    });

    res.status(200).json({
      success: true,
      message: 'Employee updated successfully.',
      data: updatedEmployee,
    });
  } catch (error) {
    next(error);
  }
};

// @route   DELETE /api/v1/employees/:id
// @desc    Delete employee (soft delete or hard delete)
const deleteEmployee = async (req, res, next) => {
  try {
    const employee = await Employee.findById(req.params.id);
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found.',
      });
    }

    // Also deactivate or remove linked user
    if (employee.userId) {
      await User.findByIdAndDelete(employee.userId);
    }

    await Employee.findByIdAndDelete(req.params.id);

    await AuditService.log({
      userId: req.user._id,
      userEmail: req.user.email,
      action: 'EMPLOYEE_DELETED',
      module: 'Employee',
      recordId: req.params.id,
      oldData: employee,
      req,
    });

    res.status(200).json({
      success: true,
      message: 'Employee deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
};

// @route   GET /api/v1/employees/hierarchy
// @desc    Get company organizational hierarchy (Departments -> Managers -> Teams -> Leads -> Members)
const getOrganizationHierarchy = async (req, res, next) => {
  try {
    const departments = await require('../models/Department').find({ status: 'Active' })
      .populate('managerId', 'firstName lastName employeeCode email profileImage')
      .lean();

    const teams = await require('../models/Team').find({ status: 'Active' })
      .populate('teamLeadId', 'firstName lastName employeeCode email profileImage')
      .populate('memberIds', 'firstName lastName employeeCode email designationId profileImage')
      .lean();

    const hierarchy = departments.map((dept) => {
      const deptTeams = teams.filter(
        (t) => String(t.departmentId) === String(dept._id)
      );
      return {
        ...dept,
        teams: deptTeams,
      };
    });

    res.status(200).json({
      success: true,
      data: hierarchy,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  getOrganizationHierarchy,
};
