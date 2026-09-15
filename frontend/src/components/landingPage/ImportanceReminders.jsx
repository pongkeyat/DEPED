import React from 'react';

export default function ImportanceReminders() {
  const reminders = [
    "Applications must be submitted personally (walk-in) at the HR Office",
    "All submitted documents must be certified true copies",
    "Incomplete applications will not be accepted",
    "Late applications will not be entertained",
    "PWD, Solo Parent, and IP applicants are encouraged to apply",
    "Pursuant to DepEd Order No. 007, s. 2023"
  ];

  return (
    <ol className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3.5 text-[11px] text-slate-200 p-2">
      {reminders.map((reminder, index) => (
        <li key={index} className="flex gap-2.5 items-start leading-relaxed">
          <span className="bg-amber-500 text-slate-950 font-bold rounded-full w-4 h-4 flex items-center justify-center shrink-0 text-[10px] mt-0.5">
            {index + 1}
          </span>
          
          <span className="text-gray-200">
            {index === 5 ? (
              <>
                Pursuant to <span className="text-amber-400 font-semibold">DepEd Order No. 007, s. 2023</span>
              </>
            ) : (
              reminder
            )}
          </span>
        </li>
      ))}
    </ol>
  );
};
