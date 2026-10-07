const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Employee = require('../models/Employee');

const protect = async (req, res, next) => {
  try {
    let token;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer ')
    ) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies && req.cookies.accessToken) {
      token = req.cookies.accessToken;
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. No token provided.',
      });
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_ACCESS_SECRET || 'hrms_super_secure_access_token_secret_key_2026_xyz987'
    );

    const user = await User.findById(decoded.id).populate('roleId');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'The user belonging to this token no longer exists.',
      });
    }

    if (user.status !== 'Active') {
      return res.status(403).json({
        success: false,
        message: 'Account is deactivated or suspended. Please contact administrator.',
      });
    }

    // Attach user
    req.user = user;

    // Attach employee profile if linked
    const employee = await Employee.findOne({
      $or: [{ userId: user._id }, { email: user.email }, { employeeCode: user.employeeId }],
    })
      .populate('departmentId', 'name code')
      .populate('designationId', 'name code')
      .populate('teamId', 'name')
      .populate('shiftId');

    req.employee = employee || null;

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Access token expired.',
        code: 'TOKEN_EXPIRED',
      });
    }
    return res.status(401).json({
      success: false,
      message: 'Invalid token. Authorization denied.',
    });
  }
};

module.exports = { protect };
