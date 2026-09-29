import React from "react";
import { useNavigate } from "react-router-dom";
import depedLogo from "../assets/deped-logo.png";

export default function Header({ isLoggedIn }) {
  const navigate = useNavigate();

  const handleNavigate = () => {
    navigate("/login");
  };

  const handleApplyNow = () => {
    navigate("/apply");
  };

  const handleLogout = () => {
    navigate("/");
  };

  return (
    <div className="w-full bg-gradient-to-b from-[#1e3c72] via-[#112244] to-[#0d1b2a] text-white font-sans relative overflow-hidden flex flex-col">
      <header className="w-full flex justify-between items-center px-8 py-4 border-b border-white/10 shrink-0">

        {/* LOGO AND BRAND */}
        <div className="flex items-center gap-3">
          <img
            src={depedLogo}
            alt="DepEd Logo"
            className="w-10 h-10 rounded-full object-cover border border-gray-200"
          />

          <div>
            <h1 className="text-sm font-bold tracking-wide leading-tight">
              Region 1
            </h1>

            <p className="text-[10px] text-gray-400">
              Department of Education • Region I
            </p>
          </div>
        </div>

        {/* NAVIGATION AND ACTIONS */}
        <div className="flex items-center gap-8">
          {!isLoggedIn ? (
            <>
              <button
                onClick={handleApplyNow}
                className="flex items-center gap-2 hover:text-white transition text-sm text-gray-300"
              >
                <span>➜</span>
                Apply Now
              </button>

              <button
                onClick={handleNavigate}
                className="border border-white/40 hover:border-white px-4 py-2 rounded-md flex items-center gap-2 text-xs transition"
              >
                <span>➜</span>
                Staff Login
              </button>
            </>
          ) : (
            <button
              onClick={handleLogout}
              className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors text-xs font-semibold"
            >
              Logout
            </button>
          )}
        </div>
      </header>
    </div>
  );
}