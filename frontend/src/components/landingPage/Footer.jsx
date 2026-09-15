import React from "react";
import { FaMapMarkerAlt, FaEnvelope, FaClock } from "react-icons/fa";

const Footer = () => {
  return (
    <footer className="bg-[#0f2447] text-white mt-16 w-full">

      <div className="max-w-7xl mx-auto px-4 py-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        
        <div>

          <p className="text-sm text-gray-300">
            Department of Education • Region I
          </p>

          <p className="text-xs text-gray-400 mt-4 leading-relaxed">
            Personnel Ranking and Selection System
            <br />
            Pursuant to DepEd Order No. 007, s. 2023
          </p>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-amber-400 mb-4">
            QUICK LINKS
          </h3>

          <ul className="space-y-2 text-sm text-gray-300">
            <li className="hover:text-white cursor-pointer">Open Vacancies</li>
            <li className="hover:text-white cursor-pointer">Staff Login</li>
            <li className="hover:text-white cursor-pointer">DepEd Official Website</li>
            <li className="hover:text-white cursor-pointer">DO 007, s. 2023</li>
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-amber-400 mb-4">
            CONTACT INFORMATION
          </h3>

          <div className="space-y-3 text-sm text-gray-300">

            <div className="flex items-center gap-2">
              <FaMapMarkerAlt className="text-amber-400" />
              <span>San Fernando City, La Union</span>
            </div>

            <div className="flex items-center gap-2">
              <FaEnvelope className="text-amber-400" />
              <span>hrmo@depedlaunion.ph</span>
            </div>

            <div className="flex items-center gap-2">
              <FaClock className="text-amber-400" />
              <span>Mon–Fri, 8:00 AM – 5:00 PM</span>
            </div>

          </div>
        </div>
      </div>

      <div className="border-t border-white/10 py-4 text-center text-xs text-gray-400">
        © 2026 La Union Schools Division Office — Personnel Ranking and Selection System • v1.0.0
      </div>
    </footer>
  );
};

export default Footer;