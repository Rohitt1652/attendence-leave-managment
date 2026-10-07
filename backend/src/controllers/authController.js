const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Employee = require('../models/Employee');
const Role = require('../models/Role');
const AuditService = require('../services/AuditService');

const generateAccessToken = (user) => {
  return jwt.sign(
    { id: user._id, email: user.email, role: user.roleId },
    process.env.JWT_ACCESS_SECRET || 'hrms_super_secure_access_token_secret_key_2026_xyz987',
    { expiresIn: process.env.JWT_ACCESS_EXPIRES || '15m' }
  );
};

const generateRefreshToken = (user) => {
  return jwt.sign(
    { id: user._id },
    process.env.JWT_REFRESH_SECRET || 'hrms_super_secure_refresh_token_secret_key_2026_abc123',
    { expiresIn: process.env.JWT_REFRESH_EXPIRES || '7d' }
  );
};

// @route   POST /api/v1/auth/login
// @desc    Login with Email or Employee ID (e.g. EMP-001)
const login = async (req, res, next) => {
  try {
    const { identifier, password } = req.body;

    if (!identifier || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide Email or Employee ID and password.',
      });
    }

    const trimmedIdentifier = identifier.trim().toLowerCase();

    // Find user by email or by employeeId (case insensitive)
    const user = await User.findOne({
      $or: [
        { email: trimmedIdentifier },
        { employeeId: new RegExp(`^${identifier.trim()}$`, 'i') },
      ],
    })
      .select('+password +refreshToken')
      .populate('roleId');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials. User not found.',
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials. Incorrect password.',
      });
    }

    if (user.status !== 'Active') {
      return res.status(403).json({
        success: false,
        message: 'Account is not active. Please contact system administrator.',
      });
    }

    // Generate tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // Save refresh token & last login
    user.refreshToken = refreshToken;
    user.lastLoginAt = new Date();
    await user.save();

    // Fetch linked employee profile
    const employee = await Employee.findOne({
      $or: [{ userId: user._id }, { email: user.email }, { employeeCode: user.employeeId }],
    })
      .populate('departmentId', 'name code')
      .populate('designationId', 'name code')
      .populate('teamId', 'name')
      .populate('shiftId');

    // Audit log
    await AuditService.log({
      userId: user._id,
      userEmail: user.email,
      action: 'USER_LOGIN',
      module: 'Auth',
      recordId: user._id,
      req,
    });

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        accessToken,
        refreshToken,
        user: {
          id: user._id,
          email: user.email,
          employeeId: user.employeeId,
          role: user.roleId,
          lastLoginAt: user.lastLoginAt,
        },
        employee,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @route   POST /api/v1/auth/refresh-token
// @desc    Generate new access token from refresh token
const refreshToken = async (req, res, next) => {
  try {
    const token = req.body.token || req.body.refreshToken;
    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Refresh token is required.',
      });
    }

    let decoded;
    try {
      decoded = jwt.verify(
        token,
        process.env.JWT_REFRESH_SECRET || 'hrms_super_secure_refresh_token_secret_key_2026_abc123'
      );
    } catch (err) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired refresh token. Please login again.',
      });
    }

    const user = await User.findById(decoded.id).select('+refreshToken').populate('roleId');
    if (!user || user.refreshToken !== token) {
      return res.status(401).json({
        success: false,
        message: 'Invalid refresh token.',
      });
    }

    const newAccessToken = generateAccessToken(user);

    res.status(200).json({
      success: true,
      message: 'Access token refreshed successfully',
      data: {
        accessToken: newAccessToken,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @route   POST /api/v1/auth/logout
// @desc    Logout user and clear refresh token
const logout = async (req, res, next) => {
  try {
    if (req.user) {
      await User.findByIdAndUpdate(req.user._id, { refreshToken: null });
      await AuditService.log({
        userId: req.user._id,
        userEmail: req.user.email,
        action: 'USER_LOGOUT',
        module: 'Auth',
        recordId: req.user._id,
        req,
      });
    }

    res.status(200).json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    next(error);
  }
};

// @route   GET /api/v1/auth/me
// @desc    Get currently logged-in user and employee profile
const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).populate('roleId');
    const employee = await Employee.findOne({
      $or: [{ userId: user._id }, { email: user.email }, { employeeCode: user.employeeId }],
    })
      .populate('departmentId', 'name code')
      .populate('designationId', 'name code')
      .populate('teamId', 'name')
      .populate('reportingManagerId', 'firstName lastName employeeCode')
      .populate('teamLeadId', 'firstName lastName employeeCode')
      .populate('shiftId');

    res.status(200).json({
      success: true,
      data: {
        user,
        employee,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @route   POST /api/v1/auth/change-password
// @desc    Change user password
const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Both current and new passwords are required.',
      });
    }

    const user = await User.findById(req.user._id).select('+password');
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect.',
      });
    }

    user.password = newPassword;
    await user.save();

    await AuditService.log({
      userId: user._id,
      userEmail: user.email,
      action: 'PASSWORD_CHANGED',
      module: 'Auth',
      recordId: user._id,
      req,
    });

    res.status(200).json({
      success: true,
      message: 'Password changed successfully.',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  login,
  refreshToken,
  logout,
  getMe,
  changePassword,
};
