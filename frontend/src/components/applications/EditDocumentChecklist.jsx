import { useEffect, useState } from "react";
import {
  FileCheck,
  Upload,
  FileText,
  Check,
  Eye,
  X,
} from "lucide-react";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  "http://localhost:5000";

export default function EditableDocumentChecklist({
  documents,
  uploadedFiles,
  onChange,
  onFileUpload,
}) {
  const [preview, setPreview] = useState(null);

  useEffect(() => {
    return () => {
      if (preview?.isObjectUrl) {
        URL.revokeObjectURL(preview.url);
      }
    };
  }, [preview]);

  // ============================================================
  // BASIC DOCUMENTARY REQUIREMENTS
  // ============================================================
  const requirements = [
    {
      field: "has_application_letter",
      label:
        "Letter of intent addressed to the Head of Office, or to the highest human resource officer designated by the Head of Office.",
    },
    {
      field: "has_personal_data_sheet",
      label:
        "Duly accomplished Personal Data Sheet (PDS) (CS Form No. 212, Revised 2017) with Work Experience Sheet, if applicable.",
    },
    {
      field: "has_prc_license_id",
      label:
        "Photocopy of valid and updated PRC License/ID, if applicable.",
    },
    {
      field: "has_civil_service_eligibility_cert",
      label:
        "Photocopy of Certificate of Eligibility/Rating, if applicable.",
    },
    {
      field: "has_diploma",
      label:
        "Photocopy of scholastic/academic record such as Diploma, including completion of graduate and post-graduate units/degrees, if available.",
    },
    {
      field: "has_transcript_of_records",
      label:
        "Photocopy of scholastic/academic record such as Transcript of Records (TOR), including completion of graduate and post-graduate units/degrees, if available.",
    },
    {
      field: "has_training_certificates",
      label:
        "Photocopy of Certificate/s of Training, if applicable.",
      multiple: true,
    },
    {
      field: "has_certificate_of_employment",
      label:
        "Photocopy of Certificate of Employment, Contract of Service, or duly signed Service Record, whichever is applicable.",
    },
    {
      field: "has_service_record",
      label:
        "Photocopy of Service Record, if applicable.",
    },
    {
      field: "has_latest_appointment",
      label:
        "Photocopy of latest appointment, if applicable.",
    },
    {
      field: "has_performance_rating",
      label:
        "Photocopy of the Performance Rating in the last rating period(s) covering one (1) year performance in the current/latest position prior to the deadline of submission, if applicable.",
    },
    {
      field: "has_omnibus_sworn_statement",
      label:
        "Checklist of Requirements and Omnibus Sworn Statement on the Certification on the Authenticity and Veracity (CAV) of the documents submitted and Data Privacy Consent Form.",
    },
  ];

  // ============================================================
  // FILE UPLOAD
  // ============================================================
  const handleFileChange = (field, e, multiple = false) => {
    if (multiple) {
      const files = Array.from(e.target.files || []);

      if (files.length === 0) {
        return;
      }

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

    onChange(field, true);

    if (onFileUpload) {
      onFileUpload(field, file);
    }
  };

  // ============================================================
  // GET UPLOADED FILE
  // ============================================================
  const getUploadedFile = (field) => {
    const fileKey = `${field.replace(/^has_/, "")}_file`;

    return (
      uploadedFiles?.[fileKey] ??
      uploadedFiles?.[`${field}_file`] ??
      documents?.[fileKey] ??
      documents?.[`${field}_file`] ??
      null
    );
  };

  const getFiles = (field) => {
    const uploadedFile = getUploadedFile(field);
    return Array.isArray(uploadedFile)
      ? uploadedFile
      : uploadedFile
        ? [uploadedFile]
        : [];
  };

  const getFileLabel = (value) => {
    if (!value) {
      return null;
    }

    if (typeof value === "string") {
      return value.split(/[\\/]/).pop() || value;
    }

    if (value instanceof File) {
      return value.name || "File attached";
    }

    if (Array.isArray(value)) {
      const names = value
        .map((item) => getFileLabel(item))
        .filter(Boolean);

      return names.length > 0 ? names : null;
    }

    if (typeof value === "object") {
      if (value.name) {
        return value.name;
      }

      const filePath = value.url || value.path || value.file_path;
      if (filePath) {
        return getFileLabel(filePath);
      }

      if (value.filename) {
        return value.filename;
      }
    }

    return null;
  };

  // ============================================================
  // CHECK IF FILE EXISTS
  // ============================================================
  const hasUploadedFile = (field) => {
    const file = getUploadedFile(field);

    if (!file) {
      return false;
    }

    if (Array.isArray(file)) {
      return file.length > 0;
    }

    if (typeof file === "string") {
      return file.trim().length > 0;
    }

    return true;
  };

  // ============================================================
  // DISPLAY FILE NAME
  // ============================================================
  const getFileName = (file) => {
    if (!file) {
      return null;
    }

    if (Array.isArray(file)) {
      const names = file
        .map((item) => getFileLabel(item))
        .filter(Boolean);

      if (names.length === 0) {
        return null;
      }

      if (names.length === 1) {
        return names[0];
      }

      return `${names.length} files attached`;
    }

    const label = getFileLabel(file);

    return label || "File attached";
  };

  const isImageFile = (file) => {
    const mimeType =
      file instanceof File
        ? file.type
        : typeof file === "object"
          ? file.type || file.mimeType
          : "";
    const fileName = getFileLabel(file) || "";

    return (
      mimeType.startsWith("image/") ||
      /\.(jpe?g|png)$/i.test(fileName)
    );
  };

  const isPdfFile = (file) => {
    const mimeType =
      file instanceof File
        ? file.type
        : typeof file === "object"
          ? file.type || file.mimeType
          : "";
    const fileName = getFileLabel(file) || "";

    return mimeType === "application/pdf" || /\.pdf$/i.test(fileName);
  };

  const handlePreview = (file) => {
    if (file instanceof File) {
      setPreview({
        file,
        url: URL.createObjectURL(file),
        isObjectUrl: true,
      });
      return;
    }

    const filePath =
      typeof file === "string"
        ? file
        : file.url || file.path || file.file_path;
    const normalizedPath =
      typeof filePath === "string"
        ? filePath.trim().replace(/\\/g, "/")
        : "";

    const url = normalizedPath
      ? normalizedPath.startsWith("http://") ||
        normalizedPath.startsWith("https://")
        ? normalizedPath
        : `${API_BASE_URL.replace(/\/+$/, "")}${
            normalizedPath.startsWith("/uploads/")
              ? normalizedPath
              : normalizedPath.startsWith("uploads/")
                ? `/${normalizedPath}`
                : `/uploads/${normalizedPath.replace(/^\/+/, "")}`
          }`
      : "";

    setPreview({ file, url, isObjectUrl: false });
  };

  return (
    <>
    <div className="rounded-[20px] bg-white shadow-sm border border-gray-200 overflow-hidden">
      {/* Header */}
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
      </div>

      {/* Table */}
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

              <th className="border border-gray-300 w-36 text-gray-700">
                Document
              </th>
            </tr>
          </thead>

          <tbody>
            {requirements.map((item, index) => {
              const uploadedFile = getUploadedFile(item.field);
              const fileName = getFileName(uploadedFile);
              const uploaded = hasUploadedFile(item.field);

              return (
                <tr
                  key={item.field}
                  className="hover:bg-gray-50 transition-colors"
                >
                  {/* Number */}
                  <td className="border border-gray-300 text-center py-3 text-gray-600 font-medium align-top">
                    {String.fromCharCode(97 + index)}.
                  </td>

                  {/* Requirement */}
                  <td className="border border-gray-300 px-4 py-3 text-gray-800 leading-6">
                    <div className="flex flex-col">
                      <span>{item.label}</span>

                      {fileName && (
                        <span className="text-xs text-green-600 flex items-center gap-1 mt-2">
                          <FileText size={12} />
                          {fileName}
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Document Actions */}
                  <td className="border border-gray-300 text-center py-2 align-middle">
                    <div className="flex items-center justify-center gap-2">
                      {/* CHECK ICON */}
                      {uploaded && (
                        <div
                          className="flex items-center justify-center w-8 h-8 rounded-md bg-green-100 text-green-600 border border-green-200"
                          title="File uploaded"
                        >
                          <Check size={16} strokeWidth={2.5} />
                        </div>
                      )}

                      {/* UPLOAD ICON */}
                      {getFiles(item.field).map((file, fileIndex) => (
                        <button
                          key={`${item.field}-preview-${fileIndex}`}
                          type="button"
                          onClick={() => handlePreview(file)}
                          className="flex items-center justify-center w-8 h-8 rounded-md bg-blue-50 hover:bg-blue-100 text-blue-700 transition-colors border border-blue-200"
                          title={`Preview ${getFileLabel(file) || "document"}`}
                          aria-label={`Preview ${getFileLabel(file) || "document"} for ${item.label}`}
                        >
                          <Eye size={16} />
                        </button>
                      ))}

                      <label
                        className="flex items-center justify-center w-8 h-8 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-700 cursor-pointer transition-colors border border-gray-300"
                        title={
                          uploaded
                            ? "Replace file"
                            : "Upload file"
                        }
                      >
                        <Upload size={16} />

                        <input
                          type="file"
                          className="hidden"
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
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
    {preview && (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
        role="presentation"
        onClick={(event) => {
          if (event.target === event.currentTarget) {
            setPreview(null);
          }
        }}
      >
        <section
          className="flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-xl bg-white shadow-xl"
          role="dialog"
          aria-modal="true"
          aria-label={`Preview ${getFileLabel(preview.file) || "document"}`}
        >
          <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
            <h2 className="truncate pr-4 font-semibold text-gray-800">
              {getFileLabel(preview.file) || "Document preview"}
            </h2>
            <button
              type="button"
              onClick={() => setPreview(null)}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-gray-600 hover:bg-gray-100"
              aria-label="Close document preview"
            >
              <X size={18} />
            </button>
          </div>
          <div className="min-h-[60vh] flex-1 bg-gray-100">
            {preview.url && isImageFile(preview.file) ? (
              <div className="flex h-full min-h-[60vh] items-center justify-center p-4">
                <img
                  src={preview.url}
                  alt={getFileLabel(preview.file) || "Uploaded document"}
                  className="max-h-[75vh] max-w-full object-contain"
                />
              </div>
            ) : preview.url && isPdfFile(preview.file) ? (
              <iframe
                src={preview.url}
                title={getFileLabel(preview.file) || "PDF document preview"}
                className="h-[70vh] w-full border-0"
              />
            ) : preview.url ? (
              <div className="flex min-h-[60vh] items-center justify-center p-6">
                <a
                  href={preview.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-md bg-blue-700 px-4 py-2 font-medium text-white hover:bg-blue-800"
                >
                  Open document in a new tab
                </a>
              </div>
            ) : (
              <p className="p-6 text-center text-gray-600">
                This document could not be previewed.
              </p>
            )}
          </div>
        </section>
      </div>
    )}
    </>
  );
}