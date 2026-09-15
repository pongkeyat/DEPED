import React from "react";

export default function ApplicantHeader({ applicant }) {
  return (
    <div className="mb-6 rounded-xl bg-white p-6 shadow-sm">
      <h1 className="text-2xl font-bold text-gray-800">Assessment Scoring</h1>
      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-4">
        <div>
          <p className="text-sm text-gray-500">Applicant</p>
          <p className="font-semibold">{applicant?.applicant_id}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Position</p>
          <p className="font-semibold">{applicant?.position_title}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Salary Grade</p>
          <p className="font-semibold">{applicant?.salary_grade}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Initial Screening</p>
          <p className="font-semibold text-green-600">QUALIFIED</p>
        </div>
      </div>
    </div>
  );
}