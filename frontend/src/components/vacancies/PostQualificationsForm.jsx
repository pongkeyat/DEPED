import { SlidersHorizontal, Info } from "lucide-react";

export default function PostQualificationsForm({
    formData,
    onChange,
}) {
    return (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            
            {/* HEADER */}
            <div className="flex items-center gap-2 bg-[#1b4584] p-3 text-white">
                <SlidersHorizontal size={16} />

                <span className="font-medium text-sm sm:text-base">
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
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                        Education Requirement
                    </label>

                    <textarea
                        name="education_requirement"
                        value={
                            formData?.education_requirement || ""
                        }
                        onChange={onChange}
                        placeholder="e.g. Bachelor's Degree in Accountancy"
                        rows={3}
                        className="w-full resize-none rounded-lg border border-gray-300 p-3 text-sm outline-none transition focus:border-[#1b4584] focus:ring-1 focus:ring-[#1b4584]"
                    />
                </div>

                {/* TRAINING */}
                <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                        Training Requirement
                    </label>

                    <textarea
                        name="training_requirement"
                        value={
                            formData?.training_requirement || ""
                        }
                        onChange={onChange}
                        placeholder="e.g. 8 hours of relevant training"
                        rows={3}
                        className="w-full resize-none rounded-lg border border-gray-300 p-3 text-sm outline-none transition focus:border-[#1b4584] focus:ring-1 focus:ring-[#1b4584]"
                    />
                </div>

                {/* EXPERIENCE */}
                <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                        Experience Requirement
                    </label>

                    <textarea
                        name="experience_requirement"
                        value={
                            formData?.experience_requirement || ""
                        }
                        onChange={onChange}
                        placeholder="e.g. 2 years relevant experience"
                        rows={3}
                        className="w-full resize-none rounded-lg border border-gray-300 p-3 text-sm outline-none transition focus:border-[#1b4584] focus:ring-1 focus:ring-[#1b4584]"
                    />
                </div>

                {/* ELIGIBILITY */}
                <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                        Eligibility Requirement
                    </label>

                    <textarea
                        name="eligibility_requirement"
                        value={
                            formData?.eligibility_requirement || ""
                        }
                        onChange={onChange}
                        placeholder="e.g. RA 1080 (Teacher)"
                        rows={3}
                        className="w-full resize-none rounded-lg border border-gray-300 p-3 text-sm outline-none transition focus:border-[#1b4584] focus:ring-1 focus:ring-[#1b4584]"
                    />
                </div>

            </div>
        </div>
    );
}