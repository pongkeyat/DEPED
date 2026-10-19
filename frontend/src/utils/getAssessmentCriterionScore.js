const CRITERION_ALIASES = {
    "pbet let lept rating": [
        "PBET/LET/LEPT Rating",
        "PBET/LET/LEPT",
        "LET Rating",
        "LEPT Rating",
        "PBET Rating",
        "LET",
        "LEPT",
        "PBET",
    ],
    "ppst cois": [
        "PPST COIs",
        "PPST COI",
        "PPST Classroom Observable Indicators",
        "PPST Classroom Observable Indicators (Demonstrated Teaching using COT-RSP)",
        "Classroom Observation",
    ],
    "ppst ncois": [
        "PPST NCOIs",
        "PPST NCOI",
        "PPST Non-Classroom Observable Indicators",
        "PPST Non-Classroom Observable Indicators (Teacher Reflection)",
        "Teacher Reflection",
    ],
};

const normalizeCriterionName = (value) =>
    String(value || "")
        .trim()
        .toLowerCase()
        .replace(/&/g, "and")
        .replace(/[^a-z0-9]+/g, " ")
        .trim();

export default function getAssessmentCriterionScore(applicant, criterionName) {
    const normalizedName = normalizeCriterionName(criterionName);
    const aliases = CRITERION_ALIASES[normalizedName] || [criterionName];
    const acceptedNames = new Set(aliases.map(normalizeCriterionName));
    const assessmentList =
        applicant?.assessment_criteria ||
        applicant?.assessmentCriteria ||
        applicant?.criteria ||
        [];

    if (!Array.isArray(assessmentList)) {
        return null;
    }

    const criterion = assessmentList.find((item) =>
        acceptedNames.has(
            normalizeCriterionName(
                item?.criterion_name ||
                item?.name ||
                item?.criterion ||
                item?.label
            )
        )
    );

    if (!criterion) {
        return null;
    }

    for (const key of ["points", "score", "value", "total", "rating", "result"]) {
        const value = criterion[key];

        if (value !== undefined && value !== null && value !== "") {
            const score = Number(value);

            if (Number.isFinite(score)) {
                return score;
            }
        }
    }

    return null;
}
