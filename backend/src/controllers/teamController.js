const Team = require('../models/Team');
const Employee = require('../models/Employee');
const AuditService = require('../services/AuditService');

// @route   GET /api/v1/teams
const getTeams = async (req, res, next) => {
  try {
    const { departmentId } = req.query;
    const query = {};
    if (departmentId) query.departmentId = departmentId;

    const teams = await Team.find(query)
      .populate('departmentId', 'name code')
      .populate({
        path: 'teamLeadId',
        select: 'firstName lastName employeeCode email profileImage designationId',
        populate: { path: 'designationId', select: 'name code' },
      })
      .populate({
        path: 'memberIds',
        select: 'firstName lastName employeeCode email profileImage designationId',
        populate: { path: 'designationId', select: 'name code' },
      })
      .sort({ name: 1 })
      .lean();

    // Also fetch employees who have teamId set to these teams to guarantee no member is omitted
    const teamIds = teams.map((t) => t._id);
    const linkedEmployees = await Employee.find({
      teamId: { $in: teamIds },
      status: 'Active',
    })
      .select('firstName lastName employeeCode email profileImage designationId teamId')
      .populate('designationId', 'name code')
      .lean();

    const teamsWithMembers = teams.map((team) => {
      const explicitMembers = team.memberIds || [];
      const employeesWithTeamId = linkedEmployees.filter(
        (emp) => String(emp.teamId) === String(team._id)
      );

      // Merge and deduplicate by _id
      const memberMap = new Map();
      explicitMembers.forEach((m) => {
        if (m && m._id) memberMap.set(String(m._id), m);
      });
      employeesWithTeamId.forEach((emp) => {
        if (emp && emp._id) {
          // If already in map, preserve, else add
          if (!memberMap.has(String(emp._id))) {
            memberMap.set(String(emp._id), emp);
          }
        }
      });

      const membersList = Array.from(memberMap.values());

      return {
        ...team,
        members: membersList,
        memberIds: membersList,
      };
    });

    res.status(200).json({ success: true, data: teamsWithMembers });
  } catch (error) {
    next(error);
  }
};

// @route   POST /api/v1/teams
const createTeam = async (req, res, next) => {
  try {
    const { memberIds, ...rest } = req.body;
    const team = await Team.create({
      ...rest,
      memberIds: Array.isArray(memberIds) ? memberIds : [],
    });

    // Sync teamId on assigned employees
    if (Array.isArray(memberIds) && memberIds.length > 0) {
      await Employee.updateMany(
        { _id: { $in: memberIds } },
        { $set: { teamId: team._id, teamLeadId: team.teamLeadId || null } }
      );
    }

    await AuditService.log({
      userId: req.user._id,
      userEmail: req.user.email,
      action: 'TEAM_CREATED',
      module: 'Team',
      recordId: team._id,
      newData: team,
      req,
    });

    // Populate created team
    const populated = await Team.findById(team._id)
      .populate('departmentId', 'name code')
      .populate({
        path: 'teamLeadId',
        select: 'firstName lastName employeeCode email designationId profileImage',
        populate: { path: 'designationId', select: 'name code' },
      })
      .populate({
        path: 'memberIds',
        select: 'firstName lastName employeeCode email designationId profileImage',
        populate: { path: 'designationId', select: 'name code' },
      });

    res.status(201).json({ success: true, message: 'Team created', data: populated });
  } catch (error) {
    next(error);
  }
};

// @route   PUT /api/v1/teams/:id
const updateTeam = async (req, res, next) => {
  try {
    const oldData = await Team.findById(req.params.id);
    if (!oldData) {
      return res.status(404).json({ success: false, message: 'Team not found' });
    }

    const { memberIds, ...rest } = req.body;
    const updatePayload = { ...rest };
    if (memberIds !== undefined) {
      updatePayload.memberIds = Array.isArray(memberIds) ? memberIds : [];
    }

    const updated = await Team.findByIdAndUpdate(
      req.params.id,
      { $set: updatePayload },
      { new: true, runValidators: true }
    );

    // Sync employee.teamId
    if (Array.isArray(memberIds)) {
      // Set teamId on new members
      await Employee.updateMany(
        { _id: { $in: memberIds } },
        { $set: { teamId: updated._id, teamLeadId: updated.teamLeadId || null } }
      );
      // Unset teamId for employees previously in this team who were unselected
      await Employee.updateMany(
        { teamId: updated._id, _id: { $nin: memberIds } },
        { $unset: { teamId: 1 } }
      );
    }

    await AuditService.log({
      userId: req.user._id,
      userEmail: req.user.email,
      action: 'TEAM_UPDATED',
      module: 'Team',
      recordId: req.params.id,
      oldData,
      newData: updated,
      req,
    });

    const populated = await Team.findById(updated._id)
      .populate('departmentId', 'name code')
      .populate({
        path: 'teamLeadId',
        select: 'firstName lastName employeeCode email designationId profileImage',
        populate: { path: 'designationId', select: 'name code' },
      })
      .populate({
        path: 'memberIds',
        select: 'firstName lastName employeeCode email designationId profileImage',
        populate: { path: 'designationId', select: 'name code' },
      });

    res.status(200).json({ success: true, message: 'Team updated', data: populated });
  } catch (error) {
    next(error);
  }
};

// @route   DELETE /api/v1/teams/:id
const deleteTeam = async (req, res, next) => {
  try {
    const team = await Team.findByIdAndDelete(req.params.id);
    if (!team) {
      return res.status(404).json({ success: false, message: 'Team not found' });
    }

    // Unset teamId on employees previously in this team
    await Employee.updateMany({ teamId: req.params.id }, { $unset: { teamId: 1 } });

    await AuditService.log({
      userId: req.user._id,
      userEmail: req.user.email,
      action: 'TEAM_DELETED',
      module: 'Team',
      recordId: req.params.id,
      oldData: team,
      req,
    });

    res.status(200).json({ success: true, message: 'Team deleted' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getTeams,
  createTeam,
  updateTeam,
  deleteTeam,
};
