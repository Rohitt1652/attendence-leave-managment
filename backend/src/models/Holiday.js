const mongoose = require('mongoose');
const { HOLIDAY_TYPE } = require('../constants/statuses');

const holidaySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Holiday name is required'],
      trim: true,
    },
    date: {
      type: Date,
      required: [true, 'Holiday date is required'],
      index: true,
    },
    type: {
      type: String,
      enum: Object.values(HOLIDAY_TYPE),
      default: HOLIDAY_TYPE.PUBLIC,
    },
    location: {
      type: String,
      default: 'All Locations',
      trim: true,
    },
    departmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
    },
    description: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['Active', 'Inactive'],
      default: 'Active',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Holiday', holidaySchema);
