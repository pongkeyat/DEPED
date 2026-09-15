import React from 'react';

// ==========================================
// 1. MAIN APPLICANT FORM (PARENT COMPONENT)
// ==========================================
export function MainApplicantForm() {
  const [formData, setFormData] = React.useState({
    trainings: [
      { training_title: '', date_from: '', date_to: '', hours_attended: 0, training_type: '', conducted_by: '' }
    ]
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
export default function ApplicantTrainingForm({ trainings = [], onChange }) {
  
  // Handles field changes within a specific row index
  const handleItemChange = (index, field, value) => {
    const updatedTrainings = [...trainings];
    updatedTrainings[index] = { ...updatedTrainings[index], [field]: value };
    onChange("trainings", updatedTrainings);
  };

  // Triggers when "+ Add Training" is clicked
  const addTraining = () => {
    const newTraining = {
      training_title: "",
      date_from: "",
      date_to: "",
      hours_attended: 0,
      training_type: "",
      conducted_by: "",
    };
    onChange("trainings", [...trainings, newTraining]);
  };

  // Triggers when "Remove" button is clicked
  const removeTraining = (indexToRemove) => {
    if (trainings.length <= 1) return;
    const updatedTrainings = trainings.filter((_, index) => index !== indexToRemove);
    onChange("trainings", updatedTrainings);
  };

  return (
    <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden font-sans">
      {/* Header Panel */}
      <div className="bg-[#1e4a8a] p-4 text-white flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="flex items-center justify-center bg-white/20 text-white font-semibold text-xs w-5 h-5 rounded-full">
            4
          </span>
          <h3 className="text-base font-semibold tracking-wide">Relevant Trainings / Seminars</h3>
        </div>
      </div>

      {/* Subheader action bar */}
      <div className="px-6 py-3 border-b border-gray-100 flex items-center justify-between bg-white">
        <div className="flex items-center gap-2 text-[#1e4a8a] font-medium text-sm">
          Training History & Seminars Attended
        </div>
        <button
          type="button"
          onClick={addTraining}
          className="flex items-center gap-1.5 px-3 py-1.5 border border-blue-600 rounded-lg text-blue-600 font-medium text-sm hover:bg-blue-50 transition-colors"
        >
          <span className="text-base font-bold leading-none">+</span> Add Training
        </button>
      </div>

      {/* Dynamic Content Panel */}
      <div className="p-6 space-y-6 bg-[#fcfdfd]">
        {trainings.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-400 space-y-2 border border-dashed border-gray-200 rounded-xl bg-gray-50/40">
            <svg className="w-10 h-10 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            <p className="text-xs md:text-sm text-gray-500">No trainings added yet</p>
          </div>
        ) : (
          trainings.map((item, index) => (
            <div 
              key={index} 
              className="p-4 border border-gray-200 rounded-xl bg-white shadow-sm space-y-4 relative"
            >
              {/* Row 1: Title, Date From, Date To, Hours, Type */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                
                {/* Training / Seminar Title */}
                <div className="md:col-span-4 space-y-1">
                  <label className="block text-xs font-semibold text-gray-700">
                    Training / Seminar Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={item.training_title || ""}
                    onChange={(e) => handleItemChange(index, "training_title", e.target.value)}
                    className="w-full h-10 px-3 border border-gray-300 rounded-lg text-sm bg-white"
                    required
                  />
                </div>

                {/* Date From */}
                <div className="md:col-span-2 space-y-1">
                  <label className="block text-xs font-semibold text-gray-700">Date From</label>
                  <input
                    type="date"
                    value={item.date_from || ""}
                    onChange={(e) => handleItemChange(index, "date_from", e.target.value)}
                    className="w-full h-10 px-3 border border-gray-300 rounded-lg text-sm bg-white"
                  />
                </div>

                {/* Date To */}
                <div className="md:col-span-2 space-y-1">
                  <label className="block text-xs font-semibold text-gray-700">Date To</label>
                  <input
                    type="date"
                    value={item.date_to || ""}
                    onChange={(e) => handleItemChange(index, "date_to", e.target.value)}
                    className="w-full h-10 px-3 border border-gray-300 rounded-lg text-sm bg-white"
                  />
                </div>

                {/* Hours */}
                <div className="md:col-span-1 space-y-1">
                  <label className="block text-xs font-semibold text-gray-700">Hours</label>
                  <input
                    type="number"
                    value={item.hours_attended || 0}
                    onChange={(e) => handleItemChange(index, "hours_attended", parseInt(e.target.value) || 0)}
                    min="0"
                    className="w-full h-10 px-3 border border-gray-300 rounded-lg text-sm bg-white"
                  />
                </div>

                {/* Type Dropdown */}
                <div className="md:col-span-3 space-y-1">
                  <label className="block text-xs font-semibold text-gray-700">Type</label>
                  <select
                    value={item.training_type || ""}
                    onChange={(e) => handleItemChange(index, "training_type", e.target.value)}
                    className="w-full h-10 px-3 border border-gray-300 rounded-lg text-sm bg-white"
                  >
                    <option value="">-- Type --</option>
                    <option value="TECHNICAL">Technical</option>
                    <option value="MANAGERIAL">Managerial</option>
                  </select>
                </div>
              </div>

              {/* Row 2: Conducted By & Delete Action Button aligned inside grid */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                <div className="md:col-span-11 space-y-1">
                  <label className="block text-xs font-semibold text-gray-700">Conducted By</label>
                  <input
                    type="text"
                    value={item.conducted_by || ""}
                    onChange={(e) => handleItemChange(index, "conducted_by", e.target.value)}
                    className="w-full h-10 px-3 border border-gray-300 rounded-lg text-sm bg-white"
                  />
                </div>

                <div className="md:col-span-1 flex items-end justify-end">
                  {trainings.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeTraining(index)}
                      className="p-2.5 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors h-10 w-full flex items-center justify-center"
                    >
                      <svg className="w-4 h-4 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
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