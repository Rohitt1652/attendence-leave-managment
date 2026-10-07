import React, { useState, useEffect } from 'react';
import apiClient from '../../api/client';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import { Skeleton } from '../../components/common/Skeleton';
import { useAuthStore } from '../../store/authStore';
import {
  Calendar as CalendarIcon,
  Gift,
  Award,
  Sparkles,
  Plus,
  Filter,
  Palmtree,
  CalendarCheck,
} from 'lucide-react';

const CalendarPage = () => {
  const { hasPermission } = useAuthStore();
  const [events, setEvents] = useState([]);
  const [celebrations, setCelebrations] = useState(null);
  const [loading, setLoading] = useState(true);

  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [typeFilter, setTypeFilter] = useState('All');

  // Add Holiday Modal
  const [isHolidayModalOpen, setIsHolidayModalOpen] = useState(false);
  const [holidayForm, setHolidayForm] = useState({
    name: '',
    date: new Date().toISOString().split('T')[0],
    type: 'Public Holiday',
    description: '',
  });

  // Add Event Modal
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [eventForm, setEventForm] = useState({
    title: '',
    date: new Date().toISOString().split('T')[0],
    startTime: '10:00',
    endTime: '11:00',
    location: 'Main Auditorium',
    description: '',
    audience: 'Everyone',
  });

  const fetchCalendar = async () => {
    try {
      setLoading(true);
      const [resFeed, resCeleb] = await Promise.all([
        apiClient.get('/calendar/feed', { params: { month, year } }),
        apiClient.get('/calendar/celebrations'),
      ]);
      setEvents(resFeed.data.data);
      setCelebrations(resCeleb.data.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCalendar();
  }, [month, year]);

  const handleAddHoliday = async (e) => {
    e.preventDefault();
    try {
      await apiClient.post('/holidays', holidayForm);
      setIsHolidayModalOpen(false);
      fetchCalendar();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to add holiday');
    }
  };

  const handleAddEvent = async (e) => {
    e.preventDefault();
    try {
      await apiClient.post('/events', eventForm);
      setIsEventModalOpen(false);
      fetchCalendar();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to add event');
    }
  };

  const filteredEvents = events.filter((evt) => {
    if (typeFilter === 'All') return true;
    return evt.type === typeFilter;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Company Calendar & Celebrations
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Holidays, team milestones, birthdays, anniversaries, and company-wide events.
          </p>
        </div>

        {hasPermission('employee.create') && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              icon={Plus}
              onClick={() => setIsHolidayModalOpen(true)}
            >
              Add Holiday
            </Button>
            <Button
              variant="primary"
              size="sm"
              icon={Plus}
              onClick={() => setIsEventModalOpen(true)}
            >
              Create Event
            </Button>
          </div>
        )}
      </div>

      {/* Celebrations Highlights Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-gradient-to-tr from-rose-50 to-pink-50 border border-rose-100 flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-rose-500 text-white flex items-center justify-center shrink-0 shadow-xs">
            <Gift className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-rose-500 tracking-wider">Today's Birthdays</span>
            <p className="font-bold text-xs text-slate-800">
              {celebrations?.todayBirthdays?.length > 0
                ? celebrations.todayBirthdays.map((b) => `${b.firstName} ${b.lastName}`).join(', ')
                : 'None today'}
            </p>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-gradient-to-tr from-indigo-50 to-purple-50 border border-indigo-100 flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-indigo-500 tracking-wider">Upcoming Birthdays</span>
            <p className="font-bold text-xs text-slate-800">
              {celebrations?.upcomingBirthdays?.length || 0} Scheduled
            </p>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-gradient-to-tr from-emerald-50 to-teal-50 border border-emerald-100 flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
            <Award className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-emerald-600 tracking-wider">Today's Anniversaries</span>
            <p className="font-bold text-xs text-slate-800">
              {celebrations?.todayAnniversaries?.length > 0
                ? celebrations.todayAnniversaries.map((a) => `${a.firstName} (${a.years}y)`).join(', ')
                : 'None today'}
            </p>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-gradient-to-tr from-amber-50 to-yellow-50 border border-amber-100 flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
            <CalendarCheck className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-amber-600 tracking-wider">Total Feed Items</span>
            <p className="font-bold text-xs text-slate-800">{events.length} in this Month</p>
          </div>
        </div>
      </div>

      {/* Filter and Period Selection */}
      <Card className="p-3!">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <select
              value={month}
              onChange={(e) => setMonth(parseInt(e.target.value, 10))}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
            >
              {Array.from({ length: 12 }).map((_, i) => (
                <option key={i + 1} value={i + 1}>
                  {new Date(2026, i).toLocaleString('default', { month: 'long' })}
                </option>
              ))}
            </select>
            <input
              type="number"
              value={year}
              onChange={(e) => setYear(parseInt(e.target.value, 10))}
              className="w-20 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono"
            />
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {['All', 'Holiday', 'Birthday', 'Anniversary', 'Event', 'Leave'].map((t) => (
              <button
                key={t}
                onClick={() => setTypeFilter(t)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${
                  typeFilter === t
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Events Feed Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredEvents.map((evt) => (
          <div
            key={evt.id}
            className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex items-start gap-3.5 hover:shadow-sm transition-shadow"
          >
            <div className="h-12 w-12 rounded-xl bg-slate-100 text-slate-800 flex flex-col items-center justify-center shrink-0 border border-slate-200 font-bold leading-none">
              <span className="text-sm">{new Date(evt.date).getDate()}</span>
              <span className="text-[9px] uppercase font-semibold text-slate-400 mt-0.5">
                {new Date(evt.date).toLocaleString('default', { month: 'short' })}
              </span>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  {evt.type}
                </span>
                <Badge
                  variant={
                    evt.type === 'Holiday'
                      ? 'brand'
                      : evt.type === 'Birthday'
                      ? 'danger'
                      : evt.type === 'Anniversary'
                      ? 'success'
                      : evt.type === 'Leave'
                      ? 'purple'
                      : 'primary'
                  }
                  size="xs"
                >
                  {evt.type}
                </Badge>
              </div>

              <h4 className="font-semibold text-xs text-slate-900 truncate">{evt.title}</h4>
              <p className="text-[11px] text-slate-400 mt-0.5 truncate">
                {evt.details?.description || evt.details?.location || 'Company Milestone'}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Add Holiday Modal */}
      <Modal
        isOpen={isHolidayModalOpen}
        onClose={() => setIsHolidayModalOpen(false)}
        title="Add Company Holiday"
      >
        <form onSubmit={handleAddHoliday} className="space-y-4 text-xs">
          <div>
            <label className="block font-medium text-slate-700 mb-1">Holiday Name *</label>
            <input
              type="text"
              required
              value={holidayForm.name}
              onChange={(e) => setHolidayForm({ ...holidayForm, name: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-700 mb-1">Date *</label>
              <input
                type="date"
                required
                value={holidayForm.date}
                onChange={(e) => setHolidayForm({ ...holidayForm, date: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1">Type</label>
              <select
                value={holidayForm.type}
                onChange={(e) => setHolidayForm({ ...holidayForm, type: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
              >
                <option value="Public Holiday">Public Holiday</option>
                <option value="Optional Holiday">Optional Holiday</option>
                <option value="Restricted Holiday">Restricted Holiday</option>
                <option value="Company Holiday">Company Holiday</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">Description</label>
            <textarea
              rows={2}
              value={holidayForm.description}
              onChange={(e) => setHolidayForm({ ...holidayForm, description: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <Button variant="outline" size="sm" onClick={() => setIsHolidayModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit">
              Save Holiday
            </Button>
          </div>
        </form>
      </Modal>

      {/* Add Event Modal */}
      <Modal
        isOpen={isEventModalOpen}
        onClose={() => setIsEventModalOpen(false)}
        title="Create Company Event"
      >
        <form onSubmit={handleAddEvent} className="space-y-4 text-xs">
          <div>
            <label className="block font-medium text-slate-700 mb-1">Event Title *</label>
            <input
              type="text"
              required
              value={eventForm.title}
              onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-medium text-slate-700 mb-1">Date *</label>
              <input
                type="date"
                required
                value={eventForm.date}
                onChange={(e) => setEventForm({ ...eventForm, date: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1">Start Time</label>
              <input
                type="time"
                value={eventForm.startTime}
                onChange={(e) => setEventForm({ ...eventForm, startTime: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1">End Time</label>
              <input
                type="time"
                value={eventForm.endTime}
                onChange={(e) => setEventForm({ ...eventForm, endTime: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">Location</label>
            <input
              type="text"
              value={eventForm.location}
              onChange={(e) => setEventForm({ ...eventForm, location: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
            />
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">Description</label>
            <textarea
              rows={2}
              value={eventForm.description}
              onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <Button variant="outline" size="sm" onClick={() => setIsEventModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit">
              Save Event
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default CalendarPage;
