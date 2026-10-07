import React, { useState, useEffect } from 'react';
import apiClient from '../../api/client';
import Button from '../common/Button';
import Badge from '../common/Badge';
import { Clock, LogIn, LogOut, CheckCircle2 } from 'lucide-react';

const PunchWidget = ({ onPunchSuccess }) => {
  const [time, setTime] = useState(new Date());
  const [todayRecord, setTodayRecord] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchTodayStatus = async () => {
    try {
      const res = await apiClient.get('/attendance/today');
      setTodayRecord(res.data.data);
    } catch (err) {
      // ignore
    }
  };

  useEffect(() => {
    fetchTodayStatus();
  }, []);

  const handlePunch = async () => {
    setLoading(true);
    setError('');
    setSuccessMsg('');
    try {
      const res = await apiClient.post('/attendance/punch');
      setTodayRecord(res.data.data);
      setSuccessMsg(res.data.message);
      if (onPunchSuccess) onPunchSuccess(res.data.data);
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to punch');
      setTimeout(() => setError(''), 4000);
    } finally {
      setLoading(false);
    }
  };

  const isCheckedIn = !!todayRecord?.checkIn;
  const isCheckedOut = !!todayRecord?.checkOut;

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-indigo-600" />
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Live Punch Clock
          </span>
        </div>
        {isCheckedOut ? (
          <Badge variant="neutral">Shift Completed</Badge>
        ) : isCheckedIn ? (
          <Badge variant="success">Working</Badge>
        ) : (
          <Badge variant="warning">Not Punched</Badge>
        )}
      </div>

      <div className="text-center my-3">
        <div className="text-2xl font-bold tracking-tight text-slate-900 font-mono">
          {time.toLocaleTimeString()}
        </div>
        <div className="text-xs text-slate-500 mt-0.5">
          {time.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
        </div>
      </div>

      {todayRecord && (
        <div className="grid grid-cols-2 gap-2 my-3 p-2.5 bg-slate-50 rounded-lg text-xs">
          <div>
            <span className="text-slate-400 block text-[10px]">Punch In</span>
            <span className="font-medium text-slate-700">
              {todayRecord.checkIn ? new Date(todayRecord.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px]">Punch Out</span>
            <span className="font-medium text-slate-700">
              {todayRecord.checkOut ? new Date(todayRecord.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
            </span>
          </div>
        </div>
      )}

      {error && <p className="text-xs text-rose-600 mb-2 text-center">{error}</p>}
      {successMsg && <p className="text-xs text-emerald-600 mb-2 text-center">{successMsg}</p>}

      <div>
        {!isCheckedIn ? (
          <Button
            variant="success"
            className="w-full text-xs font-semibold py-2.5"
            icon={LogIn}
            loading={loading}
            onClick={handlePunch}
          >
            Punch In (Web)
          </Button>
        ) : !isCheckedOut ? (
          <Button
            variant="danger"
            className="w-full text-xs font-semibold py-2.5"
            icon={LogOut}
            loading={loading}
            onClick={handlePunch}
          >
            Punch Out (Web)
          </Button>
        ) : (
          <div className="flex items-center justify-center gap-1.5 py-2 text-xs font-medium text-slate-500 bg-slate-100 rounded-lg">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" /> Done for today
          </div>
        )}
      </div>
    </div>
  );
};

export default PunchWidget;
