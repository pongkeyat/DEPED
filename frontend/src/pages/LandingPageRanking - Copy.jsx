import Header from "../components/Headers";
import RankingContent from "../components/landingPage/LandingPageRanking";

export default function LandingPageRanking() {
  const isLoggedIn = !!localStorage.getItem("token");

  return (
    <div className="min-h-screen flex flex-col font-sans">
      <Header isLoggedIn={isLoggedIn} />

      <main className="w-full max-w-7xl mx-auto p-4 md:p-8 flex-grow">
        <RankingContent />
      </main>
    </div>
  );
}
