export const MAX_MEMO_FILE_SIZE = 10 * 1024 * 1024;

export const validateMemoFile = (file) => {
    if (!file) return "Select a PDF or DOCX memo file.";

    const extension = file.name.split(".").pop()?.toLowerCase();
    if (!["pdf", "docx"].includes(extension)) {
        return "Memo files must be PDF or DOCX.";
    }

    if (file.size > MAX_MEMO_FILE_SIZE) {
        return "Memo files must be 10 MB or smaller.";
    }

    return "";
};
