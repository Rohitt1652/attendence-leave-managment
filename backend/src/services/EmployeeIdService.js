const Setting = require('../models/Setting');
const Employee = require('../models/Employee');

class EmployeeIdService {
  /**
   * Generates next sequential employee code based on company settings
   * e.g. EMP-001
   */
  static async generateNextEmployeeCode() {
    let setting = await Setting.findOne({ key: 'employee_id_config' });

    let prefix = 'EMP';
    let startingNumber = 1;
    let padding = 3;

    if (setting && setting.value) {
      prefix = setting.value.prefix || 'EMP';
      startingNumber = parseInt(setting.value.startingNumber, 10) || 1;
      padding = parseInt(setting.value.padding, 10) || 3;
    }

    // Find latest employee matching prefix
    const regex = new RegExp(`^${prefix}-(\\d+)$`);
    const employees = await Employee.find({ employeeCode: regex })
      .select('employeeCode')
      .lean();

    let maxNumber = startingNumber - 1;

    employees.forEach((emp) => {
      const match = emp.employeeCode.match(regex);
      if (match && match[1]) {
        const num = parseInt(match[1], 10);
        if (num > maxNumber) {
          maxNumber = num;
        }
      }
    });

    const nextNumber = maxNumber + 1;
    const formattedNumber = String(nextNumber).padStart(padding, '0');
    return `${prefix}-${formattedNumber}`;
  }
}

module.exports = EmployeeIdService;
