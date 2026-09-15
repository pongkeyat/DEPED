import { SlidersHorizontal, Info } from "lucide-react";

export default function PostQualificationsForm({ formData, onChange }) {
    return (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="flex items-center gap-2 bg-[#1b4584] p-3 text-white">
                <SlidersHorizontal size={16} />
                <span className="font-medium text-sm sm:text-base">Vacancy-Specific Qualifications</span>
            </div>


            <div className="space-y-4 p-5">
                <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">Education Requirement</label>
                    <input
                        type="text"
                        name="education_requirement"
                        value={formData.education_requirement}
                        onChange={onChange}
                        placeholder="eg. Bachelor's Degree in Accountancy"
                        className="w-full rounded-lg border p-3 outline-none focus:border-[#1b4584] focus:ring-1 focus:ring-[#1b4584]"
                    />
                </div>

                <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">Training Requirement</label>
                    <input
                        type="text"
                        name="training_requirement"
                        value={formData.training_requirement}
                        onChange={onChange}
                        placeholder="eg. 16 hours of relevant training"
                        className="w-full rounded-lg border p-3 outline-none focus:border-[#1b4584] focus:ring-1 focus:ring-[#1b4584]"
                    />
                </div>

                <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">Experience Requirement</label>
                    <input
                        type="text"
                        name="experience_requirement"
                        value={formData.experience_requirement}
                        onChange={onChange}
                        placeholder="eg. 2 years of relevant experience"
                        className="w-full rounded-lg border p-3 outline-none focus:border-[#1b4584] focus:ring-1 focus:ring-[#1b4584]"
                    />
                </div>

                <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">Eligibility Requirement</label>
                    <input
                        type="text"
                        name="eligibility_requirement"
                        value={formData.eligibility_requirement}
                        onChange={onChange}
                        placeholder="eg. Career Service Professional"
                        className="w-full rounded-lg border p-3 outline-none focus:border-[#1b4584] focus:ring-1 focus:ring-[#1b4584]"
                    />
                </div>
            </div>
        </div>
    );
}