// Turns a failed submit (axios error) into a SHORT, plain-language message
// for applicants. Technical details (SQL, status codes) are never shown;
// they are logged to the browser console by the pages instead.
//
//   const { message, stepId } = getSubmissionError(err);
//   stepId = the wizard step the user should fix (or null)

// Same order as the wizard steps (the portal simply has no step 9).
const SECTIONS = [
  { id: "vacancy", root: "job_applications", step: 1, title: "Vacancy / Position Applied For" },
  { id: "applicant", root: "applicant_info", step: 2, title: "Applicant Information" },
  { id: "education", root: "education_list", step: 3, title: "Educational Background" },
  { id: "training", root: "trainings_list", step: 4, title: "Relevant Trainings / Seminars" },
  { id: "eligibility", root: "eligibility_list", step: 5, title: "Civil Service Eligibility" },
  { id: "work", root: "work_experience_list", step: 6, title: "Work Experience" },
  { id: "equal", root: "equal_opportunity", step: 7, title: "Equal Opportunity Declaration" },
  { id: "documents", root: "document_checklist", step: 8, title: "Basic Documentary Requirement" },
  { id: "remarks", root: "hr_remarks", step: 9, title: "HR Remarks & Evaluation" },
];

const SAVED_NOTE = "Your answers are saved, so you can try again.";

const GENERIC_SERVER_MESSAGE =
  "We couldn't submit your application because of a problem on our side.\n\n" +
  `${SAVED_NOTE} If it keeps happening, please contact the HR Office.`;

const humanize = (text) =>
  String(text)
    .replace(/^has_/, "")
    .replace(/_file$/, " file")
    .replace(/_/g, " ")
    .replace(/^./, (c) => c.toUpperCase());

const stepLabel = (section) => `Step ${section.step} · ${section.title}`;

const findSectionByKey = (key) => {
  if (/_file(\.|$)/.test(key)) return SECTIONS.find((s) => s.id === "documents");
  const root = key.split(".")[0];
  return SECTIONS.find((s) => s.root === root) || null;
};

// Database table name -> wizard step
const findSectionByTable = (table = "") => {
  const t = table.toLowerCase();
  const id =
    (t.includes("work") && "work") ||
    (t.includes("educ") && "education") ||
    (t.includes("train") && "training") ||
    (t.includes("eligib") && "eligibility") ||
    (t.includes("applicant") && "applicant") ||
    ((t.includes("job_application") || t.includes("vacanc")) && "vacancy") ||
    (t.includes("equal") && "equal") ||
    (t.includes("document") && "documents") ||
    null;

  return SECTIONS.find((s) => s.id === id) || null;
};

// "education_list.0.school_name" -> "Entry #1 – School name"
const describeField = (key) => {
  const rest = key.split(".").slice(1);
  const entry = rest.find((p) => /^\d+$/.test(p));
  const field = rest
    .filter((p) => !/^\d+$/.test(p))
    .map(humanize)
    .join(" ");

  if (entry !== undefined) {
    return `Entry #${Number(entry) + 1}${field ? ` – ${field}` : ""}`;
  }
  return field || humanize(key.split(".")[0]);
};

const firstText = (value) =>
  Array.isArray(value) ? String(value[0] ?? "") : String(value ?? "");

export function getSubmissionError(err) {
  const res = err?.response;

  // ---- The request never got an answer ----
  if (!res) {
    const isNetwork =
      err?.request ||
      err?.code === "ERR_NETWORK" ||
      err?.message === "Network Error";

    return {
      stepId: null,
      message: isNetwork
        ? `We couldn't reach the server. Please check your internet connection and try again.\n\n${SAVED_NOTE}`
        : GENERIC_SERVER_MESSAGE,
    };
  }

  const status = res.status;
  const data = res.data && typeof res.data === "object" ? res.data : {};

  // ---- Field-by-field validation errors ----
  if (data.errors && typeof data.errors === "object" && !Array.isArray(data.errors)) {
    const grouped = new Map();
    let total = 0;

    Object.entries(data.errors).forEach(([key, value]) => {
      const section = findSectionByKey(key);
      const groupKey = section ? section.id : "other";

      if (!grouped.has(groupKey)) grouped.set(groupKey, { section, lines: [] });
      grouped.get(groupKey).lines.push(`• ${describeField(key)}: ${firstText(value)}`);
      total += 1;
    });

    const MAX_LINES = 8;
    let shown = 0;
    const blocks = [];

    grouped.forEach(({ section, lines }) => {
      if (shown >= MAX_LINES) return;
      const take = lines.slice(0, MAX_LINES - shown);
      shown += take.length;
      blocks.push(`${section ? stepLabel(section) : "Other"}\n${take.join("\n")}`);
    });

    if (total > shown) blocks.push(`...and ${total - shown} more.`);

    const first = [...grouped.values()].find((g) => g.section)?.section;

    return {
      stepId: first ? first.id : null,
      message: `Please correct the following, then submit again:\n\n${blocks.join("\n\n")}`,
    };
  }

  // ---- Known database problems, explained simply ----
  const raw = [data.message, data.error, data.detail, data.details]
    .filter((v) => typeof v === "string")
    .join(" ");

  // A required value was left empty
  const notNull =
    raw.match(/null value in column "([^"]+)"(?: of relation "([^"]+)")?/i) ||
    raw.match(/Column '([^']+)' cannot be null/i) ||
    raw.match(/Field '([^']+)' doesn't have a default value/i);

  if (notNull) {
    const field = humanize(notNull[1]);
    const section = findSectionByTable(notNull[2] || "");

    return {
      stepId: section ? section.id : null,
      message: section
        ? `${stepLabel(section)}\n"${field}" is required.\n\nPlease fill it in (or remove the empty entry), then submit again.`
        : `"${field}" is required.\n\nPlease go back, complete it, then submit again.`,
    };
  }

  if (/duplicate key|unique constraint|Duplicate entry/i.test(raw)) {
    return {
      stepId: null,
      message:
        "This application appears to have been submitted already.\n\nIf you think this is a mistake, please contact the HR Office.",
    };
  }

  if (/invalid input syntax|Incorrect (date|integer|decimal)|Invalid datetime/i.test(raw)) {
    return {
      stepId: null,
      message:
        "One of your entries is in the wrong format (for example a date or a number).\n\nPlease review your entries, then submit again.",
    };
  }

  if (/value too long|Data too long/i.test(raw)) {
    return {
      stepId: null,
      message: "One of your entries is too long.\n\nPlease shorten it, then submit again.",
    };
  }

  // ---- By status ----
  if (status === 401 || status === 419) {
    return {
      stepId: null,
      message: `Your session has expired. Please log in again, then submit once more.\n\n${SAVED_NOTE}`,
    };
  }

  if (status === 403) {
    return {
      stepId: null,
      message: "You don't have permission to submit this application.",
    };
  }

  if (status === 413) {
    return {
      stepId: "documents",
      message:
        "Your uploaded files are too large.\n\nPlease upload smaller files in Step 8, then submit again.",
    };
  }

  if (status === 429) {
    return {
      stepId: null,
      message: "Too many attempts. Please wait a moment, then try again.",
    };
  }

  // Readable message from the server for normal (non-server-crash) errors
  if (status < 500 && typeof data.message === "string" && data.message.length < 200) {
    return { stepId: null, message: data.message };
  }

  return { stepId: null, message: GENERIC_SERVER_MESSAGE };
}