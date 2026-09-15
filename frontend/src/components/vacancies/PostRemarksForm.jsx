import { MessageSquare, Info } from "lucide-react"; 

export default function PostRemarksForm({ formData, onChange }) {
    return (
        <div className="overflow-hidden rounded-xl bg-white shadow lg:col-span-2 border border-gray-100">
            <div className="flex items-center gap-2 bg-[#1b4584] p-3 text-white">
                <MessageSquare size={16} />
                Vacancy Remarks
            </div>


            <div className="space-y-4 p-5">
                <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">Remarks</label>
                    <textarea 
                        rows={4}
                        name="remarks"
                        placeholder="eg. Preference will be given to applicants available for an immediate start date." 
                        value={formData.remarks} 
                        onChange={onChange} 
                        className="w-full rounded-lg border p-3 outline-none focus:border-[#1b4584] focus:ring-1 focus:ring-[#1b4584] resize-y"
                    />
                </div>
            </div>
        </div>
    );
}