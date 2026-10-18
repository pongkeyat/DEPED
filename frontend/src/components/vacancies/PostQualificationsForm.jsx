import {
    SlidersHorizontal,
    Info,
    FileText,
} from "lucide-react";

export default function PostQualificationsForm({
    formData,
    onChange,
}) {
    return (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            {/* HEADER */}
            <div className="flex items-center gap-2 bg-[#1b4584] p-3 text-white">
                <SlidersHorizontal size={16} />

                <span className="text-sm font-medium sm:text-base">
                    Qualifications Standard
                </span>
            </div>

            <div className="space-y-4 p-5">
                {/* INFORMATION */}
                <div className="flex items-start gap-2 rounded-lg border border-blue-100 bg-blue-50 p-3">
                    <Info
                        size={18}
                        className="mt-0.5 shrink-0 text-[#1b4584]"
                    />

                    <p className="text-xs leading-relaxed text-gray-600">
                        The qualification requirements are automatically
                        populated based on the selected position. You may
                        still edit the requirements before posting the vacancy.
                    </p>
                </div>

                {/* EDUCATION */}
                <div>
                    <label
                        htmlFor="education_requirement"
                        className="mb-1 block text-sm font-medium text-gray-700"
                    >
                        Education Requirement
                    </label>

                    <textarea
                        id="education_requirement"
                        name="education_requirement"
                        value={formData?.education_requirement || ""}
                        onChange={onChange}
                        placeholder="e.g. Bachelor's Degree in Accountancy"
                        rows={3}
                        className="w-full resize-none rounded-lg border border-gray-300 p-3 text-sm outline-none transition focus:border-[#1b4584] focus:ring-1 focus:ring-[#1b4584]"
                    />
                </div>

                {/* TRAINING */}
                <div>
                    <label
                        htmlFor="training_requirement"
                        className="mb-1 block text-sm font-medium text-gray-700"
                    >
                        Training Requirement
                    </label>

                    <textarea
                        id="training_requirement"
                        name="training_requirement"
                        value={formData?.training_requirement || ""}
                        onChange={onChange}
                        placeholder="e.g. 8 hours of relevant training"
                        rows={3}
                        className="w-full resize-none rounded-lg border border-gray-300 p-3 text-sm outline-none transition focus:border-[#1b4584] focus:ring-1 focus:ring-[#1b4584]"
                    />
                </div>

                {/* EXPERIENCE */}
                <div>
                    <label
                        htmlFor="experience_requirement"
                        className="mb-1 block text-sm font-medium text-gray-700"
                    >
                        Experience Requirement
                    </label>

                    <textarea
                        id="experience_requirement"
                        name="experience_requirement"
                        value={formData?.experience_requirement || ""}
                        onChange={onChange}
                        placeholder="e.g. 2 years relevant experience"
                        rows={3}
                        className="w-full resize-none rounded-lg border border-gray-300 p-3 text-sm outline-none transition focus:border-[#1b4584] focus:ring-1 focus:ring-[#1b4584]"
                    />
                </div>

                {/* ELIGIBILITY */}
                <div>
                    <label
                        htmlFor="eligibility_requirement"
                        className="mb-1 block text-sm font-medium text-gray-700"
                    >
                        Eligibility Requirement
                    </label>

                    <textarea
                        id="eligibility_requirement"
                        name="eligibility_requirement"
                        value={formData?.eligibility_requirement || ""}
                        onChange={onChange}
                        placeholder="e.g. RA 1080 (Teacher)"
                        rows={3}
                        className="w-full resize-none rounded-lg border border-gray-300 p-3 text-sm outline-none transition focus:border-[#1b4584] focus:ring-1 focus:ring-[#1b4584]"
                    />
                </div>

                {/* PRESCRIBED QUALIFICATIONS */}
                <div className="border-t border-gray-100 pt-4">
                    <div className="mb-3 flex items-center gap-2">
                        <FileText
                            size={18}
                            className="text-[#1b4584]"
                        />

                        <h3 className="text-sm font-semibold text-gray-800">
                            Prescribed Qualifications
                        </h3>
                    </div>

                    <p className="mb-3 text-xs leading-relaxed text-gray-500">
                        Enter any additional prescribed qualifications
                        applicable to this vacancy. This field is optional.
                    </p>

                    <label
                        htmlFor="prescribed_qualifications"
                        className="mb-1 block text-sm font-medium text-gray-700"
                    >
                        Qualification Details
                    </label>

                    <textarea
                        id="prescribed_qualifications"
                        name="prescribed_qualifications"
                        value={formData?.prescribed_qualifications ?? ""}
                        onChange={onChange}
                        placeholder="Enter prescribed qualifications here..."
                        rows={4}
                        className="w-full resize-y rounded-lg border border-gray-300 p-3 text-sm outline-none transition focus:border-[#1b4584] focus:ring-1 focus:ring-[#1b4584]"
                    />
                </div>


            </div>
        </div>
    );
}