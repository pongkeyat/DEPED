import { X } from "lucide-react";
import ConfirmSubmitPositionModal from "./ConfirmCreatePositionModal";

const PositionFormModal = ({
    open,
    editingPosition,
    formData,
    saving,
    formError,
    onChange,
    onSubmit,
    onClose,
}) => {
    if (!open) return null;

    const handleFormSubmit = (e) => {
        e.preventDefault();

        // Let the parent handle the actual submit.
        // This event can now be intercepted by the confirmation modal
        // if you connect it there.
        onSubmit(e);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-xl">
                {/* MODAL HEADER */}
                <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4">
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900">
                            {editingPosition
                                ? "Edit Position"
                                : "Add Position"}
                        </h2>

                        <p className="mt-1 text-sm text-gray-500">
                            {editingPosition
                                ? "Update the position details and qualification requirements."
                                : "Enter the position details and qualification requirements."}
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={() => !saving && onClose()}
                        disabled={saving}
                        className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 disabled:opacity-40"
                        aria-label="Close modal"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* FORM */}
                <form
                    onSubmit={handleFormSubmit}
                    className="space-y-5 p-6"
                >
                    {/* FORM ERROR */}
                    {formError && (
                        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                            {formError}
                        </div>
                    )}

                    {/* POSITION TITLE */}
                    <div>
                        <label className="mb-2 block text-sm font-medium text-gray-700">
                            Position Title{" "}
                            <span className="text-red-500">*</span>
                        </label>

                        <input
                            type="text"
                            name="position_title"
                            value={formData.position_title}
                            onChange={onChange}
                            placeholder="e.g. Teacher I"
                            maxLength={255}
                            required
                            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        />
                    </div>

                    {/* SALARY GRADE */}
                    <div>
                        <label className="mb-2 block text-sm font-medium text-gray-700">
                            Salary Grade{" "}
                            <span className="text-red-500">*</span>
                        </label>

                        <input
                            type="number"
                            name="salary_grade"
                            value={formData.salary_grade}
                            onChange={onChange}
                            min="1"
                            step="1"
                            placeholder="Enter salary grade"
                            required
                            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        />
                    </div>

                    {/* CATEGORY */}
                    <div>
                        <label className="mb-2 block text-sm font-medium text-gray-700">
                            Category{" "}
                            <span className="text-red-500">*</span>
                        </label>

                        <select
                            name="category"
                            value={formData.category}
                            onChange={onChange}
                            required
                            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        >
                            <option value="">
                                Select category
                            </option>

                            <option value="Teaching Positions">
                                Teaching Positions
                            </option>

                            <option value="School Administration Positions">
                                School Administration Positions
                            </option>

                            <option value="Related Teaching Positions">
                                Related Teaching Positions
                            </option>

                            <option value="Non-Teaching Positions">
                                Non-Teaching Positions
                            </option>
                        </select>
                    </div>

                    {/* QUALIFICATIONS */}
                    <div className="border-t border-gray-200 pt-5">
                        <div className="mb-4">
                            <h3 className="text-base font-semibold text-gray-900">
                                Qualification Requirements
                            </h3>

                            <p className="mt-1 text-xs text-gray-500">
                                Enter the qualification requirements for this position.
                            </p>
                        </div>

                        {/* EDUCATION */}
                        <div className="mb-4">
                            <label className="mb-2 block text-sm font-medium text-gray-700">
                                Education{" "}
                                <span className="text-red-500">*</span>
                            </label>

                            <textarea
                                name="education"
                                value={formData.education}
                                onChange={onChange}
                                placeholder="e.g. Bachelor's Degree in Education"
                                rows={3}
                                required
                                className="w-full resize-none rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                            />
                        </div>

                        {/* TRAINING */}
                        <div className="mb-4">
                            <label className="mb-2 block text-sm font-medium text-gray-700">
                                Training{" "}
                                <span className="text-red-500">*</span>
                            </label>

                            <textarea
                                name="training"
                                value={formData.training}
                                onChange={onChange}
                                placeholder="e.g. None required"
                                rows={2}
                                required
                                className="w-full resize-none rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                            />
                        </div>

                        {/* EXPERIENCE */}
                        <div className="mb-4">
                            <label className="mb-2 block text-sm font-medium text-gray-700">
                                Experience{" "}
                                <span className="text-red-500">*</span>
                            </label>

                            <textarea
                                name="experience"
                                value={formData.experience}
                                onChange={onChange}
                                placeholder="e.g. None required"
                                rows={2}
                                required
                                className="w-full resize-none rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                            />
                        </div>

                        {/* ELIGIBILITY */}
                        <div>
                            <label className="mb-2 block text-sm font-medium text-gray-700">
                                Eligibility{" "}
                                <span className="text-red-500">*</span>
                            </label>

                            <textarea
                                name="eligibility"
                                value={formData.eligibility}
                                onChange={onChange}
                                placeholder="e.g. RA 1080 (Teacher)"
                                rows={2}
                                required
                                className="w-full resize-none rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                            />
                        </div>
                    </div>

                    {/* BUTTONS */}
                    <div className="flex justify-end gap-3 border-t border-gray-100 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={saving}
                            className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                        >
                            Cancel
                        </button>

                        <button
                            type="submit"
                            disabled={saving}
                            className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {saving
                                ? "Saving..."
                                : editingPosition
                                ? "Save Changes"
                                : "Create Position"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default PositionFormModal;
