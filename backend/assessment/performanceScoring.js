const normalize = (value) =>
    String(value || "")
        .trim()
        .toUpperCase()
        .replace(/[-_]+/g, " ")
        .replace(/\s+/g, " ");

const CATEGORY_ASSESSMENT_TYPES = new Map([
    ["NON TEACHING", "NON_TEACHING"],
    ["NON TEACHING POSITION", "NON_TEACHING"],
    ["NON TEACHING POSITIONS", "NON_TEACHING"],
    ["SCHOOL ADMINISTRATION", "SCHOOL_ADMINISTRATION"],
    ["SCHOOL ADMINISTRATION POSITION", "SCHOOL_ADMINISTRATION"],
    ["SCHOOL ADMINISTRATION POSITIONS", "SCHOOL_ADMINISTRATION"],
    ["RELATED TEACHING", "RELATED_TEACHING"],
    ["RELATED TEACHING POSITION", "RELATED_TEACHING"],
    ["RELATED TEACHING POSITIONS", "RELATED_TEACHING"],
]);

export const getPerformanceAssessmentType = (category) =>
    CATEGORY_ASSESSMENT_TYPES.get(normalize(category)) || "";

export const getPerformanceScore = (
    optionPoints,
    assessmentType,
    maxPoints
) => {
    const points = Number(optionPoints);
    const normalizedType = String(assessmentType || "")
        .trim()
        .toUpperCase()
        .replace(/[\s-]+/g, "_");

    if (!Number.isFinite(points)) {
        return Number.NaN;
    }

    // Some existing options contain category-weighted points rather than a 0-5 rating.
    if (points > 5) {
        return points;
    }

    if (normalizedType === "RELATED_TEACHING") {
        return (points / 5) * 20;
    }

    if (
        normalizedType === "SCHOOL_ADMINISTRATION" ||
        normalizedType === "NON_TEACHING"
    ) {
        return (points / 5) * Number(maxPoints);
    }

    return points;
};
