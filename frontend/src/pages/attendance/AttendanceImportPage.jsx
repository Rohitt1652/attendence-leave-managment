import React, { useState } from 'react';
import apiClient from '../../api/client';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import { Upload, FileSpreadsheet, CheckCircle2, AlertTriangle, AlertOctagon, Download } from 'lucide-react';

const AttendanceImportPage = () => {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setPreviewData(null);
      setSuccessMsg('');
      setErrorMsg('');
    }
  };

  const handleDryRunPreview = async () => {
    if (!file) return;
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('commit', 'false'); // Dry-run verification

      const res = await apiClient.post('/attendance/import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setPreviewData(res.data.data);
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleCommitImport = async () => {
    if (!file) return;
    setLoading(true);
    setErrorMsg('');
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('commit', 'true'); // Commit valid records

      const res = await apiClient.post('/attendance/import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setSuccessMsg(`Successfully imported ${res.data.data.validRows} attendance records into the database!`);
      setPreviewData(res.data.data);
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Import execution failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">
          Biometric & Excel Attendance Import
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Bulk import punch logs with real-time employee code matching and pre-import validation.
        </p>
      </div>

      {/* Upload Box */}
      <Card title="Upload Punch Export File" subtitle="Supported formats: .xlsx, .xls, .csv (Max 10MB)">
        <div className="space-y-4">
          <div className="border-2 border-dashed border-slate-200 rounded-2xl p-8 text-center hover:bg-slate-50/50 transition-colors">
            <FileSpreadsheet className="h-10 w-10 text-indigo-500 mx-auto mb-3" />
            <p className="text-xs font-semibold text-slate-800">
              {file ? file.name : 'Select or drop Attendance spreadsheet file'}
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              Columns: [1: Emp Code, 2: Date (YYYY-MM-DD), 3: Punch In (HH:mm), 4: Punch Out (HH:mm)]
            </p>

            <input
              type="file"
              id="fileInput"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileChange}
              className="hidden"
            />
            <label htmlFor="fileInput" className="mt-4 inline-block">
              <Button size="sm" variant="outline" onClick={() => document.getElementById('fileInput').click()}>
                Browse File
              </Button>
            </label>
          </div>

          {file && !previewData && (
            <div className="flex justify-end">
              <Button
                variant="primary"
                size="sm"
                icon={Upload}
                loading={loading}
                onClick={handleDryRunPreview}
              >
                Verify & Preview File
              </Button>
            </div>
          )}
        </div>
      </Card>

      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
          <AlertOctagon className="h-4 w-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Verification Preview Section */}
      {previewData && (
        <Card title="Pre-Import Data Verification Summary" subtitle="Review validity before saving into database">
          <div className="space-y-5">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-xl font-bold text-slate-900 block">{previewData.totalRows}</span>
                <span className="text-slate-500 text-[11px]">Total Rows Scanned</span>
              </div>
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                <span className="text-xl font-bold text-emerald-700 block">{previewData.validRows}</span>
                <span className="text-emerald-600 text-[11px]">Valid Clean Rows</span>
              </div>
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200">
                <span className="text-xl font-bold text-amber-700 block">{previewData.duplicateRows}</span>
                <span className="text-amber-600 text-[11px]">Duplicates (Skipped)</span>
              </div>
              <div className="p-3 bg-rose-50 rounded-xl border border-rose-200">
                <span className="text-xl font-bold text-rose-700 block">{previewData.invalidRows}</span>
                <span className="text-rose-600 text-[11px]">Invalid / Errors</span>
              </div>
            </div>

            {/* Error table if failed rows */}
            {previewData.failedRecords?.length > 0 && (
              <div className="border border-rose-100 rounded-xl overflow-hidden">
                <div className="px-4 py-2 bg-rose-50 text-rose-800 font-semibold text-xs flex items-center justify-between">
                  <span>Rejected / Erroneous Records ({previewData.failedRecords.length})</span>
                </div>
                <div className="max-h-48 overflow-y-auto">
                  <table className="w-full text-left text-xs text-slate-600">
                    <thead className="bg-slate-50 text-[10px] uppercase text-slate-400">
                      <tr>
                        <th className="px-4 py-2">Row #</th>
                        <th className="px-3 py-2">Emp Code</th>
                        <th className="px-3 py-2">Date</th>
                        <th className="px-3 py-2">Issue Reason</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                      {previewData.failedRecords.map((f, i) => (
                        <tr key={i} className="bg-rose-50/20">
                          <td className="px-4 py-1.5">{f.rowNumber}</td>
                          <td className="px-3 py-1.5 font-bold text-slate-800">{f.empCode || 'MISSING'}</td>
                          <td className="px-3 py-1.5">{f.dateStr || '-'}</td>
                          <td className="px-3 py-1.5 text-rose-600">{f.error}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Commit Button */}
            {!previewData.isCommitted && previewData.validRows > 0 && (
              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                <p className="text-xs text-slate-500">
                  Ready to insert <strong>{previewData.validRows}</strong> validated records into MongoDB Atlas.
                </p>
                <Button
                  variant="success"
                  size="sm"
                  icon={CheckCircle2}
                  loading={loading}
                  onClick={handleCommitImport}
                >
                  Commit Valid Records
                </Button>
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
};

export default AttendanceImportPage;
