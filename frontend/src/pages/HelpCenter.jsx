import React, { useMemo, useState } from "react";
import {
  Search,
  BookOpen,
  User,
  Users,
  ClipboardCheck,
  Trophy,
  Settings,
  ChevronDown,
  ChevronUp,
  FileText,
  Upload,
  HelpCircle,
  Mail,
  ShieldCheck,
  Image as ImageIcon,
  CheckCircle,
  X,
  Maximize2,
} from "lucide-react";
import step1LoginImage from "../assets/Step1Login.png";
import Step2RoleProfileHeader from "../assets/Step2RoleProfileHeader.png";
import Step3SidebarNav from "../assets/Step3SideBarNav.png";
import Step3SidebarNav1 from "../assets/Step3SideBarNav1.png";
import Step1Vacancies from "../assets/Step1Vacancies.png";
import Step1AppVacancy from "../assets/Step1AppVacancy.png";
import Step1Applicant from "../assets/Step1Applicant.png";
import Step1VacaList from "../assets/Step1VacaList.png";
import Step2FillUpInfo from "../assets/Step2FillUpInfo.png";
import Step3AppConfirmation from "../assets/Step3AppConfirmation.png";
import ApplyNow from "../assets/ApplyNow.png";
import SubmitDoc from "../assets/SubmitDoc.png";
import UploadVerify from "../assets/UploadVerify.png";
import VacancyPosting from "../assets/VacancyPosting.png";
import PostVacancy from "../assets/PostVacancy.png";
import ManageVacancy from "../assets/ManageVacancy.png";
import VacancyList from "../assets/VacancyList.png";
import StaffLogIn from "../assets/StaffLogIn.png";
import CredentialsInput from "../assets/CredentialsInput.png";
import LoginConfirm from "../assets/LoginConfirm.png";
import LogoutProfile from "../assets/LogoutProfile.png";
import LogOut2 from "../assets/LogOut2.png";
import LogOut3 from "../assets/LogOut3.png";
import RankingSec from "../assets/RankingSec.png";
import Compar1 from "../assets/Compar1.png";
import Compar2 from "../assets/Compar2.png";
import GenerateRes1 from "../assets/GenerateRes1.png";
import GenerateRes2 from "../assets/GenerateRes2.png";
import AssessmentSession from "../assets/AssessmentSession.png";
import EvaluateDash from "../assets/EvaluateDash.png";
import EnterScore1 from "../assets/EnterScore1.png";
import EnterScore2 from "../assets/EnterScore2.png";
import ConfirmEv1 from "../assets/ConfirmEv1.png";
import ConfirmEv2 from "../assets/ConfirmEv2.png";
import Evaluate1 from "../assets/Evaluate1.png";
import Evaluate2 from "../assets/Evaluate2.png";
import Evaluate3 from "../assets/Evaluate3.png";
import QualiDash2 from "../assets/QualiDash2.png";
import QualiDash1 from "../assets/QualiDash1.png";
import AssessSess from "../assets/AssessSess.png";
import InitialE from "../assets/InitialE.png";
import Comparative1 from "../assets/Comparative1.png";
import Comparative2 from "../assets/Comparative2.png";
import ComparativeSelect from "../assets/ComparativeSelect.png";
import PrintRank2 from "../assets/PrintRank2.png";
import PrintRank1 from "../assets/PrintRank1.png";

const HELP_CATEGORIES = [
  {
    id: "getting-started",
    title: "Getting Started",
    description: "Learn the basics of using the Recruitment Management System.",
    icon: BookOpen,
    color: "text-blue-600",
    bg: "bg-blue-50",
  },
  {
    id: "applicant",
    title: "Applicant Guide",
    description: "Learn how to apply, upload documents, and track your application.",
    icon: User,
    color: "text-emerald-600",
    bg: "bg-emerald-50",
  },
  {
    id: "hr",
    title: "HR Personnel",
    description: "Guides for application screening, evaluation, and vacancy management.",
    icon: Users,
    color: "text-purple-600",
    bg: "bg-purple-50",
  },
  {
    id: "hrmpsb",
    title: "HRMPSB Guide",
    description: "Learn how to conduct and submit applicant assessments.",
    icon: ClipboardCheck,
    color: "text-orange-600",
    bg: "bg-orange-50",
  },
  {
    id: "ranking",
    title: "Ranking Guide",
    description: "Understand the applicant ranking process and results.",
    icon: Trophy,
    color: "text-amber-600",
    bg: "bg-amber-50",
  },
  {
    id: "account",
    title: "Account & System",
    description: "Help with login, logout, profile, and common system issues.",
    icon: Settings,
    color: "text-slate-600",
    bg: "bg-slate-100",
  },
];

const ARTICLES = [
  {
    id: 1,
    category: "getting-started",
    title: "How do I get started?",
    steps: [
      "Navigate to the main portal and log in using your registered credentials.",
      "Check your assigned role and profile information in the top-right header.",
      "Select a module from the navigation sidebar to access your available functions.",
    ],
    images: [
      { src: step1LoginImage, caption: "Step 1: System Login Interface" },
      { src: Step2RoleProfileHeader, caption: "Step 2: User Role Profile Header" },
      { src: Step3SidebarNav, caption: "Step 3: Sidebar Navigation Menu" },
      { src: Step3SidebarNav1, caption: "Step 3.1: Sidebar Navigation Menu" },
    ],
  },
  {
    id: 2,
    category: "getting-started",
    title: "What can I do in the Recruitment Management System?",
    steps: [
      "Applicants can explore open vacancies, build profiles, and upload required documents.",
      "HR Personnel screen incoming applications and conduct initial evaluation.",
      "HRMPSB Members grade candidates and finalized rank lists are generated.",
    ],
    images: [
      { src: Step1Vacancies, caption: "1 Applicant Portal Overview" },
      { src: Step1AppVacancy, caption: "1.1 Applicant Portal Overview" },
      { src: Step1Applicant, caption: "1.2 Applicant Portal Overview" },
      { src: InitialE, caption: "HR Screening Module" },
      { src: AssessmentSession, caption: "HRMPSB Assessment Board" },
    ],
  },
  {
    id: 3,
    category: "applicant",
    title: "How do I submit an application?",
    steps: [
      "Go to the 'Vacancies' page and select your target open position.",
      "Fill out the required personal information and work experience details.",
      "Attach all required supporting documents and click 'Submit Application'.",
    ],
    images: [
      { src: Step1VacaList, caption: "Step 1: Selecting Vacancy Listing" },
      { src: Step2FillUpInfo, caption: "Step 2: Filling Information Form" },
      { src: Step3AppConfirmation, caption: "Step 3: Final Submission Confirmation" },
    ],
  },
  {
    id: 4,
    category: "applicant",
    title: "How do I upload my documents?",
    steps: [
      "Open the 'My Documents' section from your dashboard menu.",
      "Click 'Upload File' for each specific required field (e.g., PDS, Transcript).",
      "Verify that all files are legible before locking your submission.",
    ],
    images: [
      { src: ApplyNow, caption: "Step 1: Document Section Portal" },
      { src: SubmitDoc, caption: "Step 2: File Attachment Field" },
      { src: UploadVerify, caption: "Step 3: Upload Preview & Lock" },
    ],
  },
  {
    id: 5,
    category: "applicant",
    title: "How can I check my application status?",
    steps: [
      "You will receive email updates regarding your application.",
    ],
  },
  {
    id: 7,
    category: "hr",
    title: "How do I manage vacancies?",
    steps: [
      "Navigate to the HR 'Vacancy Management' module.",
      "Click 'Create Vacancy' to input job criteria, requirements, and deadlines.",
      "Publish, update, or archive existing job postings as needed.",
    ],
    images: [
      { src: VacancyList, caption: "Step 1: Vacancies List Screen" },
      { src: VacancyPosting, caption: "Step 2: Job Creation Form" },
      { src: PostVacancy, caption: "Step 2.1: Job Creation Form" },
      { src: ManageVacancy, caption: "Step 3: Post Publishing & Status" },
    ],
  },

  {
    id: 9,
    category: "hr",
    title: "How do I evaluate an applicant?",
    steps: [
      "Select 'Applicant Evaluation' from the HR Dashboard.",
      "Points for Education, Training, and Experience.",
      "Save and submit the evaluation form to record the scores.",
    ],
    images: [
      { src: Evaluate1, caption: "Step 1: Evaluation Overview Table" },
      { src: Evaluate2, caption: "Step 2: Scoring Input" },
      { src: Evaluate3, caption: "Step 3: Score Submission Screen" },
    ],
  },
  {
    id: 10,
    category: "hr",
    title: "What happens after an applicant is qualified?",
    steps: [
      "Qualified applicants automatically move to the 'Eligible for Assessment' list.",
      "The applicant becomes visible in the HRMPSB assessment session.",
    ],
    images: [
      { src: QualiDash1, caption: "Step 1: Qualified Pool Dashboard" },
      { src: QualiDash2, caption: "Step 1.1: Qualified Pool Dashboard" },
      { src: AssessSess, caption: "Step 2: Assessment Queue View" },
    ],
  },
  {
    id: 11,
    category: "hrmpsb",
    title: "How do I assess an applicant?",
    steps: [
      "Access the HRMPSB Assessment Portal and select an applicant.",
      "Grade candidate responses according to standard rubric categories.",
      "Submit your assessment scores to compute the board average.",
    ],
    images: [
      { src: EvaluateDash, caption: "Step 1: Candidate Assessment Board" },
      { src: EnterScore1, caption: "Step 2: Grading Rubric Input" },
      { src: EnterScore2, caption: "Step 2.1: Grading Rubric Input" },
      { src: ConfirmEv1, caption: "Step 3: Score Finalization Modal" },
      { src: ConfirmEv2, caption: "Step 3: Score Finalization Modal" },
    ],
  },
 
  {
    id: 13,
    category: "hrmpsb",
    title: "What happens after I submit an assessment?",
    steps: [
      "The applicants’ names and scores will be displayed in the Comparative Assessment Result (CAR).",
      "You can print the applicants’ rankings in the Comparative Assessment Results module.",
    ],
    images: [
      { src: ComparativeSelect, caption: "Step 1: Select a Vacancy" },
      { src: Comparative1, caption: "Step 1.1: Results" },
      { src: Comparative2, caption: "Step 1.2: Results" },
      { src: PrintRank1, caption: "Step 2: Print" },
      { src: PrintRank2, caption: "Step 2.1: Print" },
    ],
  },
  {
    id: 14,
    category: "ranking",
    title: "What is the ranking section?",
    steps: [
      "Navigate to 'Ranking' on the main navigation panel.",
      "View comparative lists sorted by final candidate scores.",
      "Generate and print the Comparative Assessment Result (CAR) document.",
    ],
    images: [
      { src: RankingSec, caption: "Step 1: Ranking Module Main Dashboard" },
      { src: Compar1, caption: "Step 2: Candidate Score Leaderboard" },
      { src: Compar2, caption: "Step 2.1: Candidate Score Leaderboard" },
      { src: GenerateRes1, caption: "Step 3: CAR Document Generator" },
      { src: GenerateRes2, caption: "Step 3: CAR Document Generator" },
    ],
  },
  {
    id: 15,
    category: "ranking",
    title: "Why did an applicant disappear from the assessment list?",
    steps: [
      "Verify if the HRMPSB evaluation has been finalized.",
      "Check the 'Ranking' module to locate the candidate's moved entry.",
      "Use position filters to locate completed applicant records.",
    ],
  },
  {
    id: 16,
    category: "ranking",
    title: "Does 'Rank' mean that the applicant has already been hired?",
    steps: [
      "No, being ranked means the applicant has been evaluated and placed in the ranking list, but it does not guarantee hiring or appointment.",
    ],
  },
  {
    id: 17,
    category: "account",
    title: "How do I log in?",
    steps: [
      "Go to the login screen and enter your registered Email/Username.",
      "Type your account password into the password field.",
      "Click the 'Login' button to access your dashboard.",
    ],
    images: [
      { src: StaffLogIn, caption: "Step 1: Login Portal Page" },
      { src: CredentialsInput, caption: "Step 2: Credentials Input Form" },
      { src: LoginConfirm, caption: "Step 3: Dashboard Auth Confirmation" },
    ],
  },
  {
    id: 18,
    category: "account",
    title: "How do I log out?",
    steps: [
      "Click your avatar/profile name at the top-right corner.",
      "Select 'Logout' from the dropdown menu choices.",
      "Confirm logout when prompted to end your current session.",
    ],
    images: [
      { src: LogoutProfile, caption: "Step 1: Header Profile Icon" },
      { src: LogOut2, caption: "Step 2: User Dropdown Menu" },
      { src: LogOut3, caption: "Step 3: Logout Confirmation Window" },
    ],
  },
  {
    id: 19,
    category: "account",
    title: "What should I do if something is not working?",
    steps: [
      "Try hard refreshing your browser (Ctrl + F5 or Cmd + Shift + R).",
      "Capture a clear screenshot of the page or error code banner.",
    ],
  },
];

const QUICK_GUIDES = [
  {
    title: "Application",
    description: "Submit an application and required documents.",
    icon: FileText,
    category: "applicant",
  },
  {
    title: "Document Upload",
    description: "Upload and manage your supporting documents.",
    icon: Upload,
    category: "applicant",
  },
  {
    title: "Assessment",
    description: "Enter and submit HRMPSB assessment scores.",
    icon: ClipboardCheck,
    category: "hrmpsb",
  },
  {
    title: "Ranking",
    description: "View applicants who have completed assessment.",
    icon: Trophy,
    category: "ranking",
  },
];

function Article({ article, onImageClick }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-b border-slate-200 last:border-b-0">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition hover:bg-slate-50"
      >
        <div className="flex items-center gap-3">
          <HelpCircle size={18} className="shrink-0 text-slate-400" />
          <span className="text-sm font-medium text-slate-700">
            {article.title}
          </span>
        </div>

        {open ? (
          <ChevronUp size={18} className="shrink-0 text-slate-400" />
        ) : (
          <ChevronDown size={18} className="shrink-0 text-slate-400" />
        )}
      </button>

      {open && (
        <div className="px-5 pb-6 pl-12 space-y-5">
          {/* Detailed Walkthrough List */}
          {article.steps && article.steps.length > 0 && (
            <div className="rounded-lg bg-slate-50 p-4 border border-slate-100">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">
                Detailed Walkthrough
              </h4>
              <ul className="space-y-2.5">
                {article.steps.map((step, idx) => (
                  <li
                    key={idx}
                    className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-600"
                  >
                    <CheckCircle
                      size={16}
                      className="mt-0.5 shrink-0 text-blue-600"
                    />
                    <span>{step}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* 3 Step Clickable Visual Screenshots */}
          {article.images && article.images.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">
                Visual Step-by-Step Guide (Click to Zoom)
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {article.images.map((imgObj, idx) => (
                  <div
                    key={idx}
                    className="group rounded-xl border border-slate-200 bg-slate-100/50 p-2 flex flex-col transition hover:border-blue-300 hover:shadow-sm"
                  >
                    <div
                      onClick={() => onImageClick(imgObj)}
                      className="relative cursor-pointer overflow-hidden rounded-lg bg-slate-200 text-slate-400 min-h-[140px] max-h-[180px] flex items-center justify-center"
                    >
                      <img
                        src={imgObj.src}
                        alt={imgObj.caption}
                        className="w-full h-36 object-cover rounded-lg transition duration-200 group-hover:scale-105"
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                          e.currentTarget.nextSibling.style.display = "flex";
                        }}
                      />
                      {/* Zoom Overlay Indicator */}
                      <div className="absolute inset-0 bg-blue-900/10 opacity-0 transition group-hover:opacity-100 flex items-center justify-center">
                        <div className="bg-white/90 p-1.5 rounded-full shadow text-blue-700">
                          <Maximize2 size={16} />
                        </div>
                      </div>

                      <div className="hidden h-36 w-full flex-col items-center justify-center gap-1.5 p-2 text-center text-slate-500">
                        <ImageIcon size={24} className="text-slate-400" />
                        <span className="text-[11px] font-medium leading-tight">
                          [ Click to Zoom Step {idx + 1} ]
                        </span>
                      </div>
                    </div>
                    <p className="mt-2 text-center text-[11px] font-medium text-slate-600">
                      {imgObj.caption}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function HelpCenter() {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);

  const filteredArticles = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return ARTICLES.filter((article) => {
      const matchesCategory =
        !selectedCategory || article.category === selectedCategory;

      const matchesSearch =
        !keyword ||
        article.title.toLowerCase().includes(keyword) ||
        article.steps.some((step) => step.toLowerCase().includes(keyword));

      return matchesCategory && matchesSearch;
    });
  }, [search, selectedCategory]);

  const selectedCategoryInfo = HELP_CATEGORIES.find(
    (category) => category.id === selectedCategory
  );

  const handleCategoryClick = (categoryId) => {
    setSelectedCategory(categoryId);
    setSearch("");

    setTimeout(() => {
      document.getElementById("help-articles")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 50);
  };

  const clearFilters = () => {
    setSearch("");
    setSelectedCategory(null);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* HERO */}
      <section className="bg-gradient-to-br from-blue-800 via-blue-700 to-blue-600 px-6 py-12">
        <div className="mx-auto max-w-6xl">
          <div className="mb-8 text-center">
            <div className="mb-3 flex justify-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15">
                <BookOpen size={28} className="text-white" />
              </div>
            </div>

            <h1 className="text-3xl font-bold tracking-tight text-white md:text-4xl">
              Help Center
            </h1>

            <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-blue-100 md:text-base">
              Find guides and answers for the DepEd Recruitment Management System.
            </p>
          </div>

          {/* SEARCH */}
          <div className="mx-auto max-w-2xl">
            <div className="relative">
              <Search
                size={20}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search for help..."
                className="h-14 w-full rounded-xl border-0 bg-white pl-12 pr-5 text-sm text-slate-700 shadow-lg outline-none ring-0 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-300"
              />
            </div>
          </div>
        </div>
      </section>

      {/* MAIN CONTENT */}
      <main className="mx-auto max-w-6xl px-6 py-8">
        {/* QUICK GUIDES */}
        {!search && !selectedCategory && (
          <section className="mb-10">
            <div className="mb-4">
              <h2 className="text-lg font-bold text-slate-800">Quick Guides</h2>
              <p className="mt-1 text-sm text-slate-500">
                Quickly access commonly used help topics.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {QUICK_GUIDES.map((guide) => {
                const Icon = guide.icon;

                return (
                  <button
                    key={guide.title}
                    type="button"
                    onClick={() => handleCategoryClick(guide.category)}
                    className="group rounded-xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md"
                  >
                    <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50">
                      <Icon size={20} className="text-blue-700" />
                    </div>

                    <h3 className="font-semibold text-slate-800">{guide.title}</h3>

                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      {guide.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {/* CATEGORIES */}
        {!search && !selectedCategory && (
          <section className="mb-10">
            <div className="mb-4">
              <h2 className="text-lg font-bold text-slate-800">
                Browse by Category
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Choose a category to find the information you need.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {HELP_CATEGORIES.map((category) => {
                const Icon = category.icon;

                return (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => handleCategoryClick(category.id)}
                    className="group flex items-start gap-4 rounded-xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md"
                  >
                    <div
                      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${category.bg}`}
                    >
                      <Icon size={21} className={category.color} />
                    </div>

                    <div>
                      <h3 className="font-semibold text-slate-800">
                        {category.title}
                      </h3>

                      <p className="mt-1 text-xs leading-5 text-slate-500">
                        {category.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {/* ARTICLES */}
        <section id="help-articles" className="scroll-mt-6">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-800">
                  {selectedCategoryInfo
                    ? selectedCategoryInfo.title
                    : search
                    ? "Search Results"
                    : "Frequently Asked Questions"}
                </h2>
              </div>

              <p className="mt-1 text-sm text-slate-500">
                {filteredArticles.length}{" "}
                {filteredArticles.length === 1 ? "article" : "articles"} available
              </p>
            </div>

            {(search || selectedCategory) && (
              <button
                type="button"
                onClick={clearFilters}
                className="text-sm font-medium text-blue-700 hover:text-blue-800"
              >
                Clear filters
              </button>
            )}
          </div>

          {filteredArticles.length > 0 ? (
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              {filteredArticles.map((article) => (
                <Article
                  key={article.id}
                  article={article}
                  onImageClick={(img) => setSelectedImage(img)}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-slate-200 bg-white px-6 py-12 text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
                <Search size={22} className="text-slate-400" />
              </div>

              <h3 className="font-semibold text-slate-800">
                No help articles found
              </h3>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                Try using a different search term or browse one of the help
                categories.
              </p>

              <button
                type="button"
                onClick={clearFilters}
                className="mt-5 rounded-lg bg-blue-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-800"
              >
                Browse Help Center
              </button>
            </div>
          )}
        </section>

        {/* NEED MORE HELP */}
        <section className="mt-10 rounded-xl border border-blue-100 bg-blue-50 p-6">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white">
                <Mail size={20} className="text-blue-700" />
              </div>

              <div>
                <h3 className="font-semibold text-slate-800">
                  Need more help?
                </h3>

                <p className="mt-1 max-w-xl text-sm leading-6 text-slate-600">
                  If you cannot find the information you need, contact the
                  designated HR personnel or system administrator for assistance.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs font-medium text-blue-700">
              <ShieldCheck size={16} />
              <span>Recruitment Management System</span>
            </div>
          </div>
        </section>
      </main>

      {/* IMAGE ZOOM MODAL */}
      {selectedImage && (
        <div
          onClick={() => setSelectedImage(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-4xl w-full bg-white rounded-2xl p-4 shadow-2xl flex flex-col items-center"
          >
            <button
              type="button"
              onClick={() => setSelectedImage(null)}
              className="absolute top-3 right-3 p-2 text-slate-500 hover:text-slate-800 rounded-full hover:bg-slate-100 transition"
            >
              <X size={20} />
            </button>

            <div className="w-full max-h-[80vh] flex items-center justify-center overflow-auto rounded-lg bg-slate-900 p-2">
              <img
                src={selectedImage.src}
                alt={selectedImage.caption}
                className="max-h-[75vh] w-auto max-w-full object-contain rounded"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                  e.currentTarget.nextSibling.style.display = "flex";
                }}
              />
              <div className="hidden h-64 w-full flex-col items-center justify-center gap-2 text-slate-400">
                <ImageIcon size={48} />
                <span className="text-sm">Image screenshot preview</span>
              </div>
            </div>

            <p className="mt-3 text-sm font-semibold text-slate-700 text-center">
              {selectedImage.caption}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}