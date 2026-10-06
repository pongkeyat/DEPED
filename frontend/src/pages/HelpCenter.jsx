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
  CheckCircle2,
  HelpCircle,
  LogIn,
  Mail,
  ShieldCheck,
} from "lucide-react";

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
    content:
      "Log in using your registered account. After logging in, the system will display the modules and functions available to your assigned role.",
  },
  {
    id: 2,
    category: "getting-started",
    title: "What can I do in the Recruitment Management System?",
    content:
      "The system supports recruitment-related activities such as application submission, document management, screening, evaluation, assessment, and ranking.",
  },
  {
    id: 3,
    category: "applicant",
    title: "How do I submit an application?",
    content:
      "Open the available vacancy, complete the required application information, provide the required documents, review your information, and submit the application.",
  },
  {
    id: 4,
    category: "applicant",
    title: "How do I upload my documents?",
    content:
      "Open the document or application section and upload the required files in the appropriate document fields. Make sure the files are readable and correspond to the requested documents.",
  },
  {
    id: 5,
    category: "applicant",
    title: "How can I check my application status?",
    content:
      "After logging in, open the application section to view the current status of your submitted application.",
  },
  {
    id: 6,
    category: "applicant",
    title: "What should I do if my application is incomplete?",
    content:
      "Review the application requirements and provide any missing information or documents indicated by the system or HR personnel.",
  },
  {
    id: 7,
    category: "hr",
    title: "How do I manage vacancies?",
    content:
      "Use the vacancy management section to create, view, update, close, or archive vacancies according to your assigned permissions.",
  },
  {
    id: 8,
    category: "hr",
    title: "How does initial screening work?",
    content:
      "HR personnel review the applicant's qualifications and supporting information. The system records the screening results and determines whether the applicant proceeds to the next stage.",
  },
  {
    id: 9,
    category: "hr",
    title: "How do I evaluate an applicant?",
    content:
      "Open the applicant evaluation section, review the applicant's information and qualifications, enter the required evaluation information, and submit the evaluation.",
  },
  {
    id: 10,
    category: "hr",
    title: "What happens after an applicant is qualified?",
    content:
      "A qualified applicant can proceed to the assessment stage. The applicant becomes available for the appropriate assessment process.",
  },
  {
    id: 11,
    category: "hrmpsb",
    title: "How do I assess an applicant?",
    content:
      "Open the assessment section, select the appropriate applicant or assessment session, review the applicable criteria, enter the required scores, and submit the assessment.",
  },
  {
    id: 12,
    category: "hrmpsb",
    title: "What assessment criteria should I use?",
    content:
      "The system displays assessment criteria according to the applicant's position and category. Use the criteria displayed by the system when entering the assessment.",
  },
  {
    id: 13,
    category: "hrmpsb",
    title: "What happens after I submit an assessment?",
    content:
      "The submitted assessment is saved by the system. Once the assessment is completed, the applicant proceeds to the ranking pool.",
  },
  {
    id: 14,
    category: "ranking",
    title: "What is the ranking section?",
    content:
      "The ranking section contains applicants who have completed the required assessment process and are ready for ranking.",
  },
  {
    id: 15,
    category: "ranking",
    title: "Why did an applicant disappear from the assessment list?",
    content:
      "An applicant may no longer appear in the assessment list after the assessment has been successfully submitted and the applicant's application status has been moved to the ranking stage.",
  },
  {
    id: 16,
    category: "ranking",
    title: "Does 'Rank' mean that the applicant has already been hired?",
    content:
      "No. The Rank status indicates that the applicant has completed the applicable assessment stage and has moved to the ranking process. It does not by itself indicate appointment or hiring.",
  },
  {
    id: 17,
    category: "account",
    title: "How do I log in?",
    content:
      "Enter your registered account credentials on the login page and select the Login button.",
  },
  {
    id: 18,
    category: "account",
    title: "How do I log out?",
    content:
      "Open the account menu and select Logout. Confirm the logout action when prompted.",
  },
  {
    id: 19,
    category: "account",
    title: "What should I do if something is not working?",
    content:
      "Refresh the page and try the action again. If the problem continues, record the error message and contact the designated HR or system administrator.",
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

function Article({ article }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-b border-slate-200 last:border-b-0">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition hover:bg-slate-50"
      >
        <div className="flex items-center gap-3">
          <HelpCircle
            size={18}
            className="shrink-0 text-slate-400"
          />

          <span className="text-sm font-medium text-slate-700">
            {article.title}
          </span>
        </div>

        {open ? (
          <ChevronUp
            size={18}
            className="shrink-0 text-slate-400"
          />
        ) : (
          <ChevronDown
            size={18}
            className="shrink-0 text-slate-400"
          />
        )}
      </button>

      {open && (
        <div className="px-5 pb-5 pl-12">
          <p className="text-sm leading-6 text-slate-600">
            {article.content}
          </p>
        </div>
      )}
    </div>
  );
}

export default function HelpCenter() {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(null);

  const filteredArticles = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return ARTICLES.filter((article) => {
      const matchesCategory =
        !selectedCategory ||
        article.category === selectedCategory;

      const matchesSearch =
        !keyword ||
        article.title.toLowerCase().includes(keyword) ||
        article.content.toLowerCase().includes(keyword);

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
      document
        .getElementById("help-articles")
        ?.scrollIntoView({
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

      {/* =====================================================
          HERO
      ===================================================== */}

      <section className="bg-gradient-to-br from-blue-800 via-blue-700 to-blue-600 px-6 py-12">
        <div className="mx-auto max-w-6xl">

          <div className="mb-8 text-center">
            <div className="mb-3 flex justify-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15">
                <BookOpen
                  size={28}
                  className="text-white"
                />
              </div>
            </div>

            <h1 className="text-3xl font-bold tracking-tight text-white md:text-4xl">
              Help Center
            </h1>

            <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-blue-100 md:text-base">
              Find guides and answers for the DepEd Recruitment
              Management System.
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
                onChange={(e) =>
                  setSearch(e.target.value)
                }
                placeholder="Search for help..."
                className="h-14 w-full rounded-xl border-0 bg-white pl-12 pr-5 text-sm text-slate-700 shadow-lg outline-none ring-0 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-300"
              />
            </div>
          </div>

        </div>
      </section>


      {/* =====================================================
          MAIN CONTENT
      ===================================================== */}

      <main className="mx-auto max-w-6xl px-6 py-8">

        {/* QUICK GUIDES */}

        {!search && !selectedCategory && (
          <section className="mb-10">

            <div className="mb-4">
              <h2 className="text-lg font-bold text-slate-800">
                Quick Guides
              </h2>

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
                    onClick={() =>
                      handleCategoryClick(
                        guide.category
                      )
                    }
                    className="group rounded-xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md"
                  >
                    <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50">
                      <Icon
                        size={20}
                        className="text-blue-700"
                      />
                    </div>

                    <h3 className="font-semibold text-slate-800">
                      {guide.title}
                    </h3>

                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      {guide.description}
                    </p>
                  </button>
                );
              })}

            </div>
          </section>
        )}


        {/* =====================================================
            CATEGORIES
        ===================================================== */}

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
                    onClick={() =>
                      handleCategoryClick(
                        category.id
                      )
                    }
                    className="group flex items-start gap-4 rounded-xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md"
                  >

                    <div
                      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${category.bg}`}
                    >
                      <Icon
                        size={21}
                        className={category.color}
                      />
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


        {/* =====================================================
            ARTICLES
        ===================================================== */}

        <section
          id="help-articles"
          className="scroll-mt-6"
        >

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
                {filteredArticles.length === 1
                  ? "article"
                  : "articles"}
                {" "}available
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
                />
              ))}

            </div>
          ) : (
            <div className="rounded-xl border border-slate-200 bg-white px-6 py-12 text-center">

              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
                <Search
                  size={22}
                  className="text-slate-400"
                />
              </div>

              <h3 className="font-semibold text-slate-800">
                No help articles found
              </h3>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                Try using a different search term or
                browse one of the help categories.
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


        {/* =====================================================
            NEED MORE HELP
        ===================================================== */}

        <section className="mt-10 rounded-xl border border-blue-100 bg-blue-50 p-6">

          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">

            <div className="flex items-start gap-4">

              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white">
                <Mail
                  size={20}
                  className="text-blue-700"
                />
              </div>

              <div>
                <h3 className="font-semibold text-slate-800">
                  Need more help?
                </h3>

                <p className="mt-1 max-w-xl text-sm leading-6 text-slate-600">
                  If you cannot find the information you need,
                  contact the designated HR personnel or system
                  administrator for assistance.
                </p>
              </div>

            </div>

            <div className="flex items-center gap-2 text-xs font-medium text-blue-700">
              <ShieldCheck size={16} />
              <span>
                Recruitment Management System
              </span>
            </div>

          </div>

        </section>

      </main>

    </div>
  );
}