import React from 'react';
import { ShieldCheck } from 'lucide-react'; // Assuming you want an icon here

export default function EqualOpportunityDeclaration({ data, onChange }) {
  const fields = [
    { id: 'is_pwd', label: 'Are you a Person with Disability (PWD)?' },
    { id: 'is_solo_parent', label: 'Are you a Solo Parent?' },
    { id: 'is_indigenous_person', label: 'Do you identify as an Indigenous Person?' }
  ];

  const handleRadioChange = (e) => {
    const { name, value } = e.target;
    const mappedValue = value === 'null' ? null : value === 'true';
    onChange(name, mappedValue);
  };

  return (
    <div className="rounded-[20px] bg-white shadow-sm border border-gray-200 overflow-hidden">
      {/* Blue Header with Number 3 Badge */}
      <div className="bg-[#204a87] px-6 py-4 flex items-center gap-3">
        <div className="flex items-center justify-center w-7 h-7 rounded-full bg-white/20 text-white font-bold text-sm">
          7
        </div>
        <ShieldCheck size={20} className="text-white" />
        <h2 className="text-white font-semibold text-lg">
          Equal Opportunity Declaration
        </h2>
      </div>

      {/* Body Content */}
      <div className="p-6 space-y-6">
        <p className="text-sm text-gray-500">
          This declaration is completely voluntary and assists us in tracking our diversity and inclusion performance.
        </p>

        <div className="divide-y divide-gray-100">
          {fields.map((field) => (
            <div key={field.id} className="py-4 first:pt-0 last:pb-0 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <span className="text-sm font-medium text-gray-700">{field.label}</span>
              
              <div className="flex flex-wrap gap-4 text-sm">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input 
                    type="radio" 
                    name={field.id} 
                    value="true" 
                    checked={data[field.id] === true} 
                    onChange={handleRadioChange}
                    className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                  />
                  <span className="text-gray-700">Yes</span>
                </label>

                <label className="flex items-center space-x-2 cursor-pointer">
                  <input 
                    type="radio" 
                    name={field.id} 
                    value="false" 
                    checked={data[field.id] === false} 
                    onChange={handleRadioChange}
                    className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                  />
                  <span className="text-gray-700">No</span>
                </label>

                <label className="flex items-center space-x-2 cursor-pointer">
                  <input 
                    type="radio" 
                    name={field.id} 
                    value="null" 
                    checked={data[field.id] === null} 
                    onChange={handleRadioChange}
                    className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                  />
                  <span className="text-gray-400 italic">Prefer not to say</span>
                </label>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}