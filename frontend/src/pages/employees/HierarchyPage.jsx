import React, { useState, useEffect } from 'react';
import apiClient from '../../api/client';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import { Skeleton } from '../../components/common/Skeleton';
import { Network, Building2, User, Users, ChevronRight } from 'lucide-react';

const HierarchyPage = () => {
  const [hierarchy, setHierarchy] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHierarchy = async () => {
      try {
        setLoading(true);
        const res = await apiClient.get('/employees/hierarchy');
        setHierarchy(res.data.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchHierarchy();
  }, []);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-56" />
        <Skeleton count={3} className="h-40" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">Organization Hierarchy</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Visual reporting tree mapping company leadership, departments, teams, and member assignments.
        </p>
      </div>

      <div className="space-y-6">
        {hierarchy.map((dept) => (
          <div key={dept._id} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
            {/* Department Level */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100">
                  <Building2 className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                    {dept.name} <Badge variant="primary">{dept.code}</Badge>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">{dept.description || 'Department Unit'}</p>
                </div>
              </div>

              {/* Department Manager */}
              <div className="flex items-center gap-3 px-3 py-2 bg-slate-50 rounded-xl border border-slate-100">
                <div className="h-8 w-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                  {dept.managerId?.firstName?.[0] || 'M'}
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">
                    Dept Manager
                  </span>
                  <span className="text-xs font-semibold text-slate-800">
                    {dept.managerId ? `${dept.managerId.firstName} ${dept.managerId.lastName}` : 'Unassigned'}
                  </span>
                </div>
              </div>
            </div>

            {/* Teams inside department */}
            <div className="mt-5 pl-2 sm:pl-6 space-y-4">
              {dept.teams?.length === 0 ? (
                <p className="text-xs text-slate-400 italic">No sub-teams created yet</p>
              ) : (
                dept.teams?.map((team) => (
                  <div
                    key={team._id}
                    className="p-4 rounded-xl bg-slate-50/70 border border-slate-200/60 relative"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                      <div className="flex items-center gap-2.5">
                        <Users className="h-4 w-4 text-teal-600" />
                        <h4 className="font-semibold text-xs text-slate-800">{team.name}</h4>
                      </div>

                      {/* Team Lead */}
                      {team.teamLeadId && (
                        <div className="flex items-center gap-2 text-xs">
                          <span className="text-slate-400 text-[11px]">Team Lead:</span>
                          <span className="font-semibold text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-100">
                            {team.teamLeadId.firstName} {team.teamLeadId.lastName}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Member chips */}
                    <div className="flex flex-wrap gap-2 mt-2 pt-2 border-t border-slate-200/50">
                      {team.memberIds?.length > 0 ? (
                        team.memberIds.map((m) => (
                          <div
                            key={m._id}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 text-[11px]"
                          >
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                            <span className="font-medium">{m.firstName} {m.lastName}</span>
                            <span className="text-slate-400 font-mono text-[10px]">({m.employeeCode})</span>
                          </div>
                        ))
                      ) : (
                        <span className="text-[11px] text-slate-400">No members assigned</span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HierarchyPage;
