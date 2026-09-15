import React from 'react';
import { FileCheck, Upload, FileText } from 'lucide-react';

export default function DocumentChecklist({
  documents,
  onChange,
  onFileUpload
}) {

  /*
   * ============================================================
   * BASIC DOCUMENTARY REQUIREMENTS
   * Based on the checklist provided.
   * ============================================================
   *
   * A. Letter of Intent
   * B. Personal Data Sheet
   * C. PRC License/ID
   * D. Certificate of Eligibility/Rating
   * E. Diploma
   * E. Transcript of Records / Academic Record
   * F. Certificate/s of Training
   * G. Certificate of Employment
   * G. Service Record
   * H. Latest Appointment
   * I. Performance Rating
   * J. Omnibus Sworn Statement
   */

  const requirements = [
    {
      field: 'has_application_letter',
      label:
        'Letter of intent addressed to the Head of Office, or to the highest human resource officer designated by the Head of Office.'
    },

    {
      field: 'has_personal_data_sheet',
      label:
        'Duly accomplished Personal Data Sheet (PDS) (CS Form No. 212, Revised 2017) with Work Experience Sheet, if applicable.'
    },

    {
      field: 'has_prc_license_id',
      label:
        'Photocopy of valid and updated PRC License/ID, if applicable.'
    },

    {
      field: 'has_civil_service_eligibility_cert',
      label:
        'Photocopy of Certificate of Eligibility/Rating, if applicable.'
    },

    {
      field: 'has_diploma',
      label:
        'Photocopy of scholastic/academic record such as Diploma, including completion of graduate and post-graduate units/degrees, if available.'
    },

    {
      field: 'has_transcript_of_records',
      label:
        'Photocopy of scholastic/academic record such as Transcript of Records (TOR), including completion of graduate and post-graduate units/degrees, if available.'
    },

    {
      field: 'has_training_certificates',
      label:
        'Photocopy of Certificate/s of Training, if applicable.',
      multiple: true
    },

    {
      field: 'has_certificate_of_employment',
      label:
        'Photocopy of Certificate of Employment, Contract of Service, or duly signed Service Record, whichever is applicable.'
    },

    {
      field: 'has_service_record',
      label:
        'Photocopy of Service Record, if applicable.'
    },

    {
      field: 'has_latest_appointment',
      label:
        'Photocopy of latest appointment, if applicable.'
    },

    {
      field: 'has_performance_rating',
      label:
        'Photocopy of the Performance Rating in the last rating period(s) covering one (1) year performance in the current/latest position prior to the deadline of submission, if applicable.'
    },

    {
      field: 'has_omnibus_sworn_statement',
      label:
        'Checklist of Requirements and Omnibus Sworn Statement on the Certification on the Authenticity and Veracity (CAV) of the documents submitted and Data Privacy Consent Form.'
    }
  ];


  /*
   * ============================================================
   * CHECK ALL
   * ============================================================
   */

  const allChecked =
    requirements.length > 0 &&
    requirements.every(
      (item) => documents?.[item.field] === true
    );


  const toggleAll = (checked) => {
    requirements.forEach((item) => {
      onChange(item.field, checked);
    });
  };


  /*
   * ============================================================
   * FILE UPLOAD
   * ============================================================
   */

  const handleFileChange = (field, e, multiple = false) => {

    if (multiple) {

      const files = Array.from(e.target.files || []);

      if (files.length === 0) {
        return;
      }

      // Automatically mark as submitted
      onChange(field, true);

      if (onFileUpload) {
        onFileUpload(field, files);
      }

      return;
    }


    const file = e.target.files?.[0];

    if (!file) {
      return;
    }


    // Automatically mark as submitted
    onChange(field, true);


    if (onFileUpload) {
      onFileUpload(field, file);
    }
  };


  /*
   * ============================================================
   * GET FILE FROM STATE
   * ============================================================
   */

  const getUploadedFile = (field) => {
    return documents?.[`${field}_file`] || null;
  };


  /*
   * ============================================================
   * DISPLAY FILE NAME
   * ============================================================
   */

  const getFileName = (file) => {

    if (!file) {
      return null;
    }


    // Multiple files
    if (Array.isArray(file)) {

      if (file.length === 0) {
        return null;
      }

      if (file.length === 1) {
        return file[0]?.name || 'File attached';
      }

      return `${file.length} files attached`;
    }


    // Single file
    return file.name || 'File attached';
  };


  return (
    <div className="rounded-[20px] bg-white shadow-sm border border-gray-200 overflow-hidden">

      {/* ======================================================
          HEADER
          ====================================================== */}

      <div className="bg-[#204a87] px-6 py-4 flex items-center justify-between">

        <div className="flex items-center gap-3">

          <div className="flex items-center justify-center w-7 h-7 rounded-full bg-white/20 text-white font-bold text-sm">
            8
          </div>

          <FileCheck
            size={20}
            className="text-white"
          />

          <h2 className="text-white font-semibold text-lg">
            Basic Documentary Requirement
          </h2>

        </div>


        {/* CHECK ALL */}

        <label className="flex items-center gap-2 text-sm text-white cursor-pointer font-medium hover:text-gray-200">

          <input
            type="checkbox"
            checked={allChecked}
            onChange={(e) =>
              toggleAll(e.target.checked)
            }
            className="w-4 h-4 rounded border-gray-300"
          />

          Check All

        </label>

      </div>


      {/* ======================================================
          TABLE
          ====================================================== */}

      <div className="overflow-x-auto">

        <table className="w-full border-collapse text-sm">

          <thead>

            <tr className="bg-gray-100">

              <th className="border border-gray-300 w-12 py-3 text-gray-700">
                #
              </th>

              <th className="border border-gray-300 text-left px-4 py-3 text-gray-700">
                Basic Documentary Requirement
              </th>

              <th className="border border-gray-300 w-32 text-gray-700">
                Upload File
              </th>

              <th className="border border-gray-300 w-24 text-gray-700">
                Submitted
              </th>

            </tr>

          </thead>


          <tbody>

            {requirements.map((item, index) => {

              const uploadedFile =
                getUploadedFile(item.field);

              const fileName =
                getFileName(uploadedFile);


              return (

                <tr
                  key={item.field}
                  className="hover:bg-gray-50 transition-colors"
                >

                  {/* ==================================================
                      NUMBER
                      ================================================== */}

                  <td className="border border-gray-300 text-center py-3 text-gray-600 font-medium align-top">

                    {String.fromCharCode(97 + index)}.

                  </td>


                  {/* ==================================================
                      REQUIREMENT
                      ================================================== */}

                  <td className="border border-gray-300 px-4 py-3 text-gray-800 leading-6">

                    <div className="flex flex-col">

                      <span>
                        {item.label}
                      </span>


                      {/* FILE NAME */}

                      {fileName && (

                        <span className="text-xs text-green-600 flex items-center gap-1 mt-2">

                          <FileText size={12} />

                          {fileName}

                        </span>

                      )}

                    </div>

                  </td>


                  {/* ==================================================
                      UPLOAD
                      ================================================== */}

                  <td className="border border-gray-300 text-center py-2 align-middle">

                    <label className="inline-flex items-center justify-center px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-medium rounded cursor-pointer transition-colors border border-gray-300 gap-1.5">

                      <Upload size={14} />

                      <span>
                        Upload
                      </span>


                      <input
                        type="file"
                        className="hidden"

                        /*
                         * Training certificates can have
                         * multiple files.
                         */

                        multiple={item.multiple || false}

                        accept=".pdf,.jpg,.jpeg,.png"

                        onChange={(e) =>
                          handleFileChange(
                            item.field,
                            e,
                            item.multiple || false
                          )
                        }

                      />

                    </label>

                  </td>


                  {/* ==================================================
                      SUBMITTED CHECKBOX
                      ================================================== */}

                  <td className="border border-gray-300 text-center align-middle">

                    <input
                      type="checkbox"

                      checked={
                        documents?.[item.field] || false
                      }

                      onChange={(e) =>
                        onChange(
                          item.field,
                          e.target.checked
                        )
                      }

                      className="w-5 h-5 accent-[#204a87] cursor-pointer"

                    />

                  </td>

                </tr>

              );

            })}

          </tbody>

        </table>

      </div>

    </div>
  );
}