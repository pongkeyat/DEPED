import {
  Briefcase,
  User,
  Folder,
  FileText,
  CheckCheck,
} from "lucide-react";

function StepProgress() {
  const steps = [
    {
      icon: <Briefcase size={16} />,
      title: "Vacancy",
      active: true,
    },
    {
      icon: <User size={16} />,
      title: "Applicant",
    },
    {
      icon: <Folder size={16} />,
      title: "Documents",
    },
    {
      icon: <FileText size={16} />,
      title: "Background",
      completed: true,
    },
    {
      icon: <CheckCheck size={16} />,
      title: "Review",
      active: true,
    },
  ];

  return (
    <div className="bg-white rounded-xl shadow-sm mt-4 px-8 py-6">
      <div className="relative flex justify-between items-center">

        {/* Progress Line */}
        <div className="absolute left-12 right-12 top-5 h-[2px] bg-[#173F78]" />

        {steps.map((step, index) => (
          <div
            key={index}
            className="relative z-10 flex flex-col items-center"
          >
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors
                ${
                  step.completed
                    ? "bg-emerald-500 text-white"
                    : step.active
                    ? "bg-[#173F78] text-white"
                    : "bg-gray-200 text-gray-500"
                }`}
            >
              {step.icon}
            </div>

            <span
              className={`mt-2 text-xs font-medium
                ${
                  step.completed
                    ? "text-emerald-500"
                    : step.active
                    ? "text-[#173F78]"
                    : "text-gray-400"
                }`}
            >
              {step.title}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default StepProgress;