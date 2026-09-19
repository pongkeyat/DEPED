import React from "react";

// ==========================================
// 1. MAIN APPLICANT FORM (PARENT COMPONENT)
// ==========================================
export function MainApplicantForm() {
  const [formData, setFormData] = React.useState({
    trainings: [
      {
        training_title: "",
        date_from: "",
        date_to: "",
        hours_attended: 0,
        training_type: "",
        conducted_by: "",
      },
    ],
  });

  const handleFormChange = (name, value) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  return (
    <div className="w-full space-y-4">
      <ApplicantTrainingForm
        trainings={formData.trainings}
        onChange={handleFormChange}
      />
    </div>
  );
}

// ==========================================
// 2. TRAINING FORM (CHILD COMPONENT)
// ==========================================
export default function ApplicantTrainingForm({
  trainings = [],
  onChange,
}) {
  // ============================================================
  // CALCULATE DATE X DAYS FROM DATE
  // ============================================================
  const addDays = (dateString, days) => {
    if (!dateString) return "";

    const date = new Date(`${dateString}T00:00:00`);

    date.setDate(date.getDate() + days);

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  };

  // ============================================================
  // HANDLE FIELD CHANGES
  // ============================================================
  const handleItemChange = (index, field, value) => {
    const updatedTrainings = [...trainings];

    updatedTrainings[index] = {
      ...updatedTrainings[index],
      [field]: value,
    };

    onChange("trainings", updatedTrainings);
  };

  // ============================================================
  // HANDLE DATE FROM
  // ============================================================
  const handleDateFromChange = (index, value) => {
    const updatedTrainings = [...trainings];

    const currentTraining = updatedTrainings[index];

    let dateTo = currentTraining.date_to || "";

    // ----------------------------------------------------------
    // Date To must be between:
    // 2 days after Date From
    // and
    // 5 days after Date From
    // ----------------------------------------------------------
    if (value && dateTo) {
      const minimumDateTo = addDays(value, 2);
      const maximumDateTo = addDays(value, 5);

      // Clear Date To if it is outside the 2-5 day range
      if (
        dateTo < minimumDateTo ||
        dateTo > maximumDateTo
      ) {
        dateTo = "";
      }
    }

    updatedTrainings[index] = {
      ...currentTraining,
      date_from: value,
      date_to: dateTo,
    };

    onChange("trainings", updatedTrainings);
  };

  // ============================================================
  // HANDLE DATE TO
  // ============================================================
  const handleDateToChange = (index, value) => {
    const training = trainings[index];

    if (!training?.date_from || !value) {
      handleItemChange(index, "date_to", value);
      return;
    }

    const minimumDateTo = addDays(
      training.date_from,
      2
    );

    const maximumDateTo = addDays(
      training.date_from,
      5
    );

    // Do not allow a Date To outside the 2-5 day range
    if (
      value < minimumDateTo ||
      value > maximumDateTo
    ) {
      return;
    }

    handleItemChange(
      index,
      "date_to",
      value
    );
  };

  // ============================================================
  // ADD TRAINING
  // ============================================================
  const addTraining = () => {
    const newTraining = {
      training_title: "",
      date_from: "",
      date_to: "",
      hours_attended: 0,
      training_type: "",
      conducted_by: "",
    };

    onChange("trainings", [
      ...trainings,
      newTraining,
    ]);
  };

  // ============================================================
  // REMOVE TRAINING
  // ============================================================
  const removeTraining = (indexToRemove) => {
    if (trainings.length <= 1) return;

    const updatedTrainings = trainings.filter(
      (_, index) => index !== indexToRemove
    );

    onChange(
      "trainings",
      updatedTrainings
    );
  };

  return (
    <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden font-sans">

      {/* ======================================================
          HEADER PANEL
      ====================================================== */}
      <div className="bg-[#1e4a8a] p-4 text-white flex items-center justify-between">

        <div className="flex items-center gap-3">

          <span className="flex items-center justify-center bg-white/20 text-white font-semibold text-xs w-5 h-5 rounded-full">
            4
          </span>

          <h3 className="text-base font-semibold tracking-wide">
            Relevant Trainings / Seminars
          </h3>

        </div>

      </div>

      {/* ======================================================
          SUBHEADER ACTION BAR
      ====================================================== */}
      <div className="px-6 py-3 border-b border-gray-100 flex items-center justify-between bg-white">

        <div className="flex items-center gap-2 text-[#1e4a8a] font-medium text-sm">
          Training History & Seminars Attended
        </div>

        <button
          type="button"
          onClick={addTraining}
          className="flex items-center gap-1.5 px-3 py-1.5 border border-blue-600 rounded-lg text-blue-600 font-medium text-sm hover:bg-blue-50 transition-colors"
        >
          <span className="text-base font-bold leading-none">
            +
          </span>

          Add Training
        </button>

      </div>

      {/* ======================================================
          DYNAMIC CONTENT PANEL
      ====================================================== */}
      <div className="p-6 space-y-6 bg-[#fcfdfd]">

        {trainings.length === 0 ? (

          <div className="flex flex-col items-center justify-center py-12 text-gray-400 space-y-2 border border-dashed border-gray-200 rounded-xl bg-gray-50/40">

            <svg
              className="w-10 h-10 text-gray-300"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
              />
            </svg>

            <p className="text-xs md:text-sm text-gray-500">
              No trainings added yet
            </p>

          </div>

        ) : (

          trainings.map((item, index) => (

            <div
              key={index}
              className="p-4 border border-gray-200 rounded-xl bg-white shadow-sm space-y-4 relative"
            >

              {/* ==================================================
                  ROW 1
              ================================================== */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4">

                {/* TRAINING TITLE */}
                <div className="md:col-span-4 space-y-1">

                  <label className="block text-xs font-semibold text-gray-700">
                    Training / Seminar Title{" "}
                    <span className="text-red-500">
                      *
                    </span>
                  </label>

                  <input
                    type="text"
                    value={
                      item.training_title || ""
                    }
                    onChange={(e) =>
                      handleItemChange(
                        index,
                        "training_title",
                        e.target.value
                      )
                    }
                    className="w-full h-10 px-3 border border-gray-300 rounded-lg text-sm bg-white"
                    required
                  />

                </div>

                {/* ==================================================
                    DATE FROM
                ================================================== */}
                <div className="md:col-span-2 space-y-1">

                  <label className="block text-xs font-semibold text-gray-700">
                    Date From
                  </label>

                  <input
                    type="date"
                    value={
                      item.date_from || ""
                    }
                    onChange={(e) =>
                      handleDateFromChange(
                        index,
                        e.target.value
                      )
                    }
                    className="w-full h-10 px-3 border border-gray-300 rounded-lg text-sm bg-white"
                  />

                </div>

                {/* ==================================================
                    DATE TO
                ================================================== */}
                <div className="md:col-span-2 space-y-1">

                  <label className="block text-xs font-semibold text-gray-700">
                    Date To
                  </label>

                  <input
                    type="date"
                    value={
                      item.date_to || ""
                    }

                    /*
                     * Date To can only be:
                     *
                     * Date From + 2 days
                     *
                     * up to
                     *
                     * Date From + 5 days
                     */
                    min={
                      item.date_from
                        ? addDays(
                            item.date_from,
                            2
                          )
                        : undefined
                    }

                    max={
                      item.date_from
                        ? addDays(
                            item.date_from,
                            5
                          )
                        : undefined
                    }

                    onChange={(e) =>
                      handleDateToChange(
                        index,
                        e.target.value
                      )
                    }

                    className="w-full h-10 px-3 border border-gray-300 rounded-lg text-sm bg-white"
                  />

                </div>

                {/* ==================================================
                    HOURS
                ================================================== */}
                <div className="md:col-span-1 space-y-1">

                  <label className="block text-xs font-semibold text-gray-700">
                    Hours
                  </label>

                  <input
                    type="number"
                    value={
                      item.hours_attended || 0
                    }
                    onChange={(e) =>
                      handleItemChange(
                        index,
                        "hours_attended",
                        parseInt(
                          e.target.value
                        ) || 0
                      )
                    }
                    min="0"
                    className="w-full h-10 px-3 border border-gray-300 rounded-lg text-sm bg-white"
                  />

                </div>

                {/* ==================================================
                    TYPE DROPDOWN
                ================================================== */}
                <div className="md:col-span-3 space-y-1">

                  <label className="block text-xs font-semibold text-gray-700">
                    Type
                  </label>

                  <select
                    value={
                      item.training_type || ""
                    }
                    onChange={(e) =>
                      handleItemChange(
                        index,
                        "training_type",
                        e.target.value
                      )
                    }
                    className="w-full h-10 px-3 border border-gray-300 rounded-lg text-sm bg-white"
                  >

                    <option value="">
                      -- Type --
                    </option>

                    <option value="TECHNICAL">
                      Technical
                    </option>

                    <option value="MANAGERIAL">
                      Managerial
                    </option>

                  </select>

                </div>

              </div>

              {/* ==================================================
                  DATE RANGE INFORMATION
              ================================================== */}
              {item.date_from && (
                <div className="text-xs text-blue-600 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2">

                  Date To recommendation:
                  <strong className="ml-1">
                    {addDays(item.date_from, 2)}
                  </strong>
                  {" to "}
                  <strong>
                    {addDays(item.date_from, 5)}
                  </strong>

                  <span className="text-gray-500 ml-1">
                    (2–5 days after Date From)
                  </span>

                </div>
              )}

              {/* ==================================================
                  ROW 2
              ================================================== */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4">

                {/* CONDUCTED BY */}
                <div className="md:col-span-11 space-y-1">

                  <label className="block text-xs font-semibold text-gray-700">
                    Conducted By
                  </label>

                  <input
                    type="text"
                    value={
                      item.conducted_by || ""
                    }
                    onChange={(e) =>
                      handleItemChange(
                        index,
                        "conducted_by",
                        e.target.value
                      )
                    }
                    className="w-full h-10 px-3 border border-gray-300 rounded-lg text-sm bg-white"
                  />

                </div>

                {/* DELETE BUTTON */}
                <div className="md:col-span-1 flex items-end justify-end">

                  {trainings.length > 1 && (

                    <button
                      type="button"
                      onClick={() =>
                        removeTraining(index)
                      }
                      className="p-2.5 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors h-10 w-full flex items-center justify-center"
                    >

                      <svg
                        className="w-4 h-4 mx-auto"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>

                    </button>

                  )}

                </div>

              </div>

            </div>

          ))

        )}

      </div>

    </div>
  );
}