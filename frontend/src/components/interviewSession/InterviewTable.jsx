import React from 'react';
import { MapPin, Calendar, UserCheck, Tag } from 'lucide-react';

export default function AssessmentTable({ data }) {
  if (!data || data.length === 0) {
    return (
      <div className="text-center py-12 text-slate-400 font-medium text-xs bg-slate-50/50 border border-dashed border-slate-200 rounded-lg">
        No active scheduled assessment records found.
      </div>
    );
  }

  // Parse conducted_by string, Postgres array format, or JS Array into an Array of strings
  const parsePanelists = (value) => {
    if (!value) return [];
    if (Array.isArray(value)) return value.map(v => String(v).trim()).filter(Boolean);

    if (typeof value === 'string') {
      const cleaned = value.replace(/[{}[\]"']/g, '').trim();
      return cleaned
        .split(',')
        .map(name => name.trim())
        .filter(Boolean);
    }

    return [String(value)];
  };

  // Helper to format date string nicely
  const formatDate = (dateString) => {
    if (!dateString) return '--';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString; // Fallback to raw string if invalid
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200">
      <table className="w-full text-left text-xs border-collapse">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold tracking-wider uppercase text-[11px]">
            <th className="py-3 px-4 w-12 text-center">#</th>
            <th className="py-3 px-4">Session Date</th>
            <th className="py-3 px-4">Vacancy & Applicants</th>
            <th className="py-3 px-4">Venue Location</th>
            <th className="py-3 px-4">Panel Members</th>
            <th className="py-3 px-4">Remarks</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 bg-white text-slate-700">
          {data.map((session, index) => {
            const panelists = parsePanelists(session.conducted_by);
            const rowKey = session.assessment_id || session.session_id || session.id || `session-${index}`;

            return (
              <tr key={rowKey} className="hover:bg-slate-50/80 transition-colors">
                {/* Index */}
                <td className="py-3.5 px-4 font-medium text-slate-400 text-center">
                  {index + 1}
                </td>

                {/* Session Date */}
                <td className="py-3.5 px-4 whitespace-nowrap">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 font-semibold text-[11px] border border-blue-100">
                    <Calendar className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>{formatDate(session.session_date)}</span>
                  </div>
                </td>

                {/* Vacancy & Applicant IDs */}
                <td className="py-3.5 px-4">
                  <div className="font-bold text-slate-800 text-xs">
                    Vacancy ID: {session.vacancy_id || '--'}
                  </div>
                  {session.job_applications_id && (
                    <div className="mt-1 flex flex-wrap gap-1 items-center">
                      <Tag className="w-3 h-3 text-slate-400 shrink-0" />
                      <span className="text-[10px] bg-slate-100 border border-slate-200 text-slate-600 px-1.5 py-0.5 rounded font-mono">
                        App ID: {Array.isArray(session.job_applications_id) 
                          ? session.job_applications_id.join(', ') 
                          : session.job_applications_id}
                      </span>
                    </div>
                  )}
                </td>

                {/* Venue */}
                <td className="py-3.5 px-4 text-slate-600 font-medium">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{session.venue || '--'}</span>
                  </div>
                </td>

                {/* Conducted By / Panelists */}
                <td className="py-3.5 px-4 max-w-[220px]">
                  {panelists.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {panelists.map((name, idx) => (
                        <span 
                          key={idx} 
                          className="inline-flex items-center gap-1 text-[10px] font-medium bg-slate-100 text-slate-700 border border-slate-200 px-2 py-0.5 rounded-full"
                        >
                          <UserCheck className="w-3 h-3 text-slate-400 shrink-0" />
                          {name}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-slate-400 italic">--</span>
                  )}
                </td>

                {/* Remarks */}
                <td className="py-3.5 px-4 text-slate-500 italic text-[11px] max-w-[200px] truncate" title={session.remarks}>
                  {session.remarks || '--'}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}