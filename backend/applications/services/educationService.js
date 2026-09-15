export const insertApplicantsEducation = async (
    client,
    applicantId,
    educationInput
) => {

    // ============================================================
    // NORMALIZE EDUCATION INPUT
    // ============================================================

    const educationList = Array.isArray(educationInput)
        ? educationInput
        : Array.isArray(educationInput?.educationList)
            ? educationInput.educationList
            : [];


    // ============================================================
    // NO EDUCATION DATA
    // ============================================================

    if (educationList.length === 0) {
        console.log(
            "No education records to insert for applicant:",
            applicantId
        );

        return [];
    }


    const insertedEducation = [];


    // ============================================================
    // INSERT EACH EDUCATION RECORD
    // ============================================================

    for (const edu of educationList) {

        const educationLevel =
            edu.level ||
            edu.education_level ||
            null;

        const schoolName =
            edu.school_name?.trim() ||
            null;

        const degreeCourse =
            edu.degree_course?.trim() ||
            null;

        const honorsAwards =
            edu.honors_awards?.trim() ||
            null;


        // ========================================================
        // SKIP COMPLETELY EMPTY RECORD
        // ========================================================

        if (
            !educationLevel &&
            !schoolName &&
            !degreeCourse &&
            !honorsAwards
        ) {
            continue;
        }


        // ========================================================
        // INSERT
        // ========================================================

        const result = await client.query(
            `
            INSERT INTO education (
                applicant_id,
                education_level,
                school_name,
                degree_course,
                honors_awards
            )
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *
            `,
            [
                applicantId,
                educationLevel,
                schoolName,
                degreeCourse,
                honorsAwards
            ]
        );


        insertedEducation.push(
            result.rows[0]
        );

    }


    console.log(
        "Inserted education records:",
        insertedEducation
    );


    return insertedEducation;
};