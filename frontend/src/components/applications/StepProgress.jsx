import {
  Briefcase,
  User,
  GraduationCap,
  BookOpen,
  BadgeCheck,
  Building2,
  ShieldCheck,
  Folder,
  ClipboardCheck,
  Check,
} from "lucide-react";

// Icon per step id (ids come from STEPS in ReceiveApplications.jsx)
const ICONS = {
  vacancy: Briefcase,
  applicant: User,
  education: GraduationCap,
  training: BookOpen,
  eligibility: BadgeCheck,
  work: Building2,
  equal: ShieldCheck,
  documents: Folder,
  remarks: ClipboardCheck,
};

/**
 * steps:       [{ id, short, title }]
 * currentStep: zero-based index
 * onStepClick: optional (index) => void  (only completed steps are clickable)
 */
function StepProgress({ steps = [], currentStep = 0, onStepClick }) {
  const count = steps.length;
  if (count === 0) return null;

  // Line runs from the first circle's centre to the last circle's centre
  const edge = 50 / count; // % inset on each side (columns are equal width)
  const fill = count > 1 ? (currentStep / (count - 1)) * 100 : 0;

  return (
    <div className="bg-white rounded-xl shadow-sm mt-4 px-4 sm:px-8 py-6">
      <div className="relative">
        {/* Base line */}
        <div
          className="absolute top-5 h-[2px] bg-gray-200"
          style={{ left: `${edge}%`, right: `${edge}%` }}
        />

        {/* Completed portion of the line */}
        <div
          className="absolute top-5 h-[2px] bg-emerald-500 transition-all duration-300"
          style={{
            left: `${edge}%`,
            width: `${(100 - edge * 2) * (fill / 100)}%`,
          }}
        />

        <div
          className="relative z-10 grid"
          style={{ gridTemplateColumns: `repeat(${count}, minmax(0, 1fr))` }}
        >
          {steps.map((step, index) => {
            const completed = index < currentStep;
            const active = index === currentStep;
            const Icon = ICONS[step.id] || Briefcase;
            const clickable = completed && typeof onStepClick === "function";

            return (
              <button
                key={step.id}
                type="button"
                disabled={!clickable}
                onClick={() => clickable && onStepClick(index)}
                title={step.title}
                className={`flex flex-col items-center ${
                  clickable ? "cursor-pointer" : "cursor-default"
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                    completed
                      ? "bg-emerald-500 text-white"
                      : active
                      ? "bg-[#173F78] text-white ring-4 ring-blue-100"
                      : "bg-gray-200 text-gray-500"
                  }`}
                >
                  {completed ? <Check size={16} /> : <Icon size={16} />}
                </div>

                <span
                  className={`mt-2 text-[11px] sm:text-xs font-medium text-center leading-tight ${
                    completed
                      ? "text-emerald-600"
                      : active
                      ? "text-[#173F78]"
                      : "text-gray-400"
                  } ${active ? "" : "hidden sm:block"}`}
                >
                  {step.short}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default StepProgress;