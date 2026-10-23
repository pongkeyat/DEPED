import { useEffect, useRef, useState } from "react";
import { renderAsync } from "docx-preview";
import { getVacancyMemo } from "../../api/VacancyApi";

export default function MemoFileViewer({ vacancyId, filename }) {
    const docxContainerRef = useRef(null);
    const [pdfUrl, setPdfUrl] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const isDocx = String(filename || "").toLowerCase().endsWith(".docx");

    useEffect(() => {
        let cancelled = false;
        let objectUrl = "";
        const docxContainer = docxContainerRef.current;

        const loadMemo = async () => {
            setLoading(true);
            setError("");
            setPdfUrl("");

            try {
                const blob = await getVacancyMemo(vacancyId);
                if (cancelled) return;

                if (isDocx) {
                    if (!docxContainer) return;
                    docxContainer.replaceChildren();
                    await renderAsync(
                        blob,
                        docxContainer,
                        undefined,
                        {
                            className: "memo-docx",
                            inWrapper: true,
                            useBase64URL: true
                        }
                    );
                } else {
                    objectUrl = URL.createObjectURL(blob);
                    setPdfUrl(objectUrl);
                }
            } catch (loadError) {
                if (!cancelled) {
                    setError(
                        loadError.response?.data?.error ||
                            "Unable to display this memo."
                    );
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        loadMemo();

        return () => {
            cancelled = true;
            if (objectUrl) URL.revokeObjectURL(objectUrl);
            docxContainer?.replaceChildren();
        };
    }, [vacancyId, isDocx]);

    return (
        <div className="relative min-h-[65vh]">
            {isDocx ? (
                <div
                    ref={docxContainerRef}
                    className="h-[65vh] overflow-auto rounded-lg border border-gray-200 bg-gray-100 p-4"
                />
            ) : (
                <iframe
                    title={filename || "Termination memo"}
                    src={pdfUrl || "about:blank"}
                    className="h-[65vh] w-full rounded-lg border border-gray-200 bg-gray-100"
                />
            )}
            {(loading || error) && (
                <div
                    className={`absolute inset-0 flex items-center justify-center rounded-lg p-4 text-sm ${
                        error
                            ? "bg-red-50 text-red-700"
                            : "bg-white/90 text-gray-500"
                    }`}
                >
                    {error || "Loading memo preview..."}
                </div>
            )}
        </div>
    );
}
