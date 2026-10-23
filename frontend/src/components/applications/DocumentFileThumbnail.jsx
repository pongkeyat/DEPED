import { useEffect, useState } from "react";
import { FileText } from "lucide-react";

const getFileName = (file) => {
  if (typeof file === "string") {
    return file.split(/[\\/]/).pop() || file;
  }

  return file?.name || file?.filename || file?.originalname || "Uploaded file";
};

const getFileType = (file) => {
  const mimeType =
    typeof File !== "undefined" && file instanceof File
      ? file.type
      : file?.type || file?.mimeType || "";
  const fileName = getFileName(file);

  if (mimeType) return mimeType.toLowerCase();
  if (/\.pdf$/i.test(fileName)) return "application/pdf";
  if (/\.(jpe?g|png|gif|webp)$/i.test(fileName)) return "image/";
  return "";
};

const getDefaultUrl = (file) => {
  if (typeof file === "string") return file;
  return file?.url || file?.path || file?.file_path || "";
};

export default function DocumentFileThumbnail({
  files,
  onPreview,
  getRemoteUrl = getDefaultUrl,
}) {
  const first = files[0];
  const isLocalFile =
    typeof File !== "undefined" && first instanceof File;
  const fileType = getFileType(first);
  const isImage = fileType.startsWith("image/");
  const isPdf = fileType === "application/pdf";
  const [localThumbnail, setLocalThumbnail] = useState(null);

  useEffect(() => {
    if (!isImage || !isLocalFile) return undefined;

    const objectUrl = URL.createObjectURL(first);
    // Keep the object URL associated with its file and revoke it on replacement.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLocalThumbnail({ file: first, url: objectUrl });
    return () => URL.revokeObjectURL(objectUrl);
  }, [first, isImage, isLocalFile]);

  const thumbnailUrl = !isImage
    ? null
    : isLocalFile
      ? localThumbnail?.file === first
        ? localThumbnail.url
        : null
      : getRemoteUrl(first) || null;

  const title =
    files.length > 1
      ? `Preview ${files.length} files`
      : `Preview ${getFileName(first)}`;

  return (
    <button
      type="button"
      onClick={() => onPreview(files.length > 1 ? files : first)}
      title={title}
      aria-label={title}
      className="relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-md border border-blue-200 bg-blue-50 transition hover:ring-2 hover:ring-blue-400"
    >
      {thumbnailUrl ? (
        <img
          src={thumbnailUrl}
          alt={getFileName(first)}
          className="h-full w-full object-cover"
        />
      ) : (
        <span className="flex flex-col items-center text-[9px] font-bold leading-none text-blue-700">
          <FileText size={16} />
          {isPdf ? "PDF" : "FILE"}
        </span>
      )}

      {files.length > 1 && (
        <span className="absolute bottom-0 right-0 rounded-tl bg-[#204a87] px-1 text-[9px] font-bold leading-4 text-white">
          +{files.length - 1}
        </span>
      )}
    </button>
  );
}
