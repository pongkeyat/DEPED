import { useCallback, useEffect, useState } from "react";
import InterviewSessionHeader from "../components/interviewSession/InterviewSessionHeader";
import InterviewStats from "../components/interviewSession/InterviewStats";
import  InterviewTable  from "../components/interviewSession/InterviewTable";
import { getInterviewSessions, postAssessmentSession } from "../api/InterviewSessionApi";

export default function InterviewSession() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Load sessions from API
  const loadSessions = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await getInterviewSessions();
      setSessions(Array.isArray(response?.sessions) ? response.sessions : []);
    } catch (err) {
      console.error("Could not load assessment sessions", err);
      setSessions([]);
      setError("Unable to load assessment sessions. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  // Handle creating a new session
  const handleSaveSession = async (formData) => {
    setSaving(true);
    setError("");
    try {
      await postAssessmentSession(formData);
      await loadSessions(); // Refresh table data
    } catch (err) {
      console.error("Error creating assessment session:", err);
      throw err; // Re-throw to let the modal handle local error states
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full flex-col">
      {/* Main Container */}
      <main className="flex-1 overflow-y-auto p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          
          {/* 1. Header Section */}
          <section>
            <InterviewSessionHeader 
              onSaveSession={handleSaveSession} 
              isSaving={saving} 
            />
          </section>

          {/* Alert error message if fetch fails */}
          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-xl text-red-700 text-sm font-medium">
              {error}
            </div>
          )}

          {/* 2. Stats Section - Pass full sessions array for accurate metric calculations */}
          <section>
            <InterviewStats sessions={sessions} loading={loading} />
          </section>

          {/* 3. Main Dashboard Table Section */}
          <section>
            <InterviewTable
              data={sessions}
              loading={loading}
              error={error}
            />
          </section>

        </div>
      </main>
    </div>
  );
}