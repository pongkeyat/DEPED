import React from 'react';
import { FileCheck, Upload, FileText } from 'lucide-react';

export default function LandingPageDocument({ documents, onChange, onFileUpload }) {
  const requirements = [
    { field: "has_application_letter", label: "Letter of intent addressed to the Head of Office or highest human resource officer" },
    { field: "has_personal_data_sheet", label: "Duly accomplished Personal Data Sheet (PDS) (CS Form No. 212, Revised 2017) and Work Experience Sheet, if applicable" },
    { field: "has_prc_license_id", label: "Photocopy of valid and updated PRC License/ID, if applicable" },
    { field: "has_civil_service_eligibility_cert", label: "Photocopy of Certificate of Eligibility/Report of Rating, if applicable" },
    { field: "has_transcript_of_records", label: "Photocopy of scholastic/academic record such as Transcript of Records (TOR), including completion of graduate and post-graduate units/degrees, if available" },
    { field: "has_diploma", label: "Photocopy of Diploma, if available" },
    { field: "has_training_certificates", label: "Photocopy of Certificate/s of Training, if applicable" },
    { field: "has_certificate_of_employment", label: "Photocopy of Certificate of Employment or Contract of Service, if applicable" },
    { field: "has_service_record", label: "Photocopy of duly signed Service Record, if applicable" },
    { field: "has_latest_appointment", label: "Photocopy of latest appointment, if applicable" },
    { field: "has_performance_rating", label: "Photocopy of the Performance Ratings in the last rating period(s) covering one (1) year prior to the deadline of submission, if applicable" },
    { field: "has_omnibus_sworn_statement", label: "Checklist of Requirements and Omnibus Sworn Statement on the Certification on the Authenticity and Veracity (CAV) and Data Privacy Consent Form" },
    { field: "has_cert_of_outstanding_accomplishments", label: "Other documents as may be required for comparative assessment such as Outstanding Accomplishments and MOVs" },
  ];

  const handleFileChange = (field, e) => {
    const file = e.target.files[0];
    if (file) {
      // Automatically mark as submitted (true) when a file is uploaded
      onChange(field, true);
      
      if (onFileUpload) {
        onFileUpload(field, file);
      }
    }
  };

  return (
    <div className="rounded-[20px] bg-white shadow-sm border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="bg-[#204a87] px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-7 h-7 rounded-full bg-white/20 text-white font-bold text-sm">
            4
          </div>
          <FileCheck size={20} className="text-white" />
          <h2 className="text-white font-semibold text-lg">
            Basic Documentary Requirement
          </h2>
        </div>
      </div>

      {/* Main Table Structure (Checklist/Submitted Column Removed) */}
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="bg-gray-100">
            <th className="border border-gray-300 w-12 py-3 text-gray-700">#</th>
            <th className="border border-gray-300 text-left px-4 py-3 text-gray-700">Basic Documentary Requirement</th>
            <th className="border border-gray-300 w-36 text-gray-700">Upload File</th>
          </tr>
        </thead>
        <tbody>
          {requirements.map((item, index) => {
            const hasFile = documents[`${item.field}_file`];

            return (
              <tr key={item.field} className="hover:bg-gray-50">
                <td className="border border-gray-300 text-center py-3 text-gray-600">
                  {String.fromCharCode(97 + index)}.
                </td>
                <td className="border border-gray-300 px-4 py-3 text-gray-800 leading-6">
                  <div className="flex flex-col">
                    <span>{item.label}</span>
                    {hasFile && (
                      <span className="text-xs text-green-600 flex items-center gap-1 mt-1">
                        <FileText size={12} /> {hasFile.name || "File attached"}
                      </span>
                    )}
                  </div>
                </td>
                <td className="border border-gray-300 text-center py-2">
                  <label className="inline-flex items-center justify-center px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-medium rounded cursor-pointer transition-colors border border-gray-300 gap-1.5">
                    <Upload size={14} />
                    <span>Upload</span>
                    <input
                      type="file"
                      className="hidden"
                      onChange={(e) => handleFileChange(item.field, e)}
                    />
                  </label>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}