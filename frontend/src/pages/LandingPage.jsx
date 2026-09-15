import React, { useState } from 'react';
import Header from '../components/Headers'; 
import Footer from '../components/landingPage/Footer';
import HeroContent from '../components/landingPage/HeroContext';
import OpenVacancies from '../components/landingPage/OpenVacancies'; // Imported your dynamic component


export default function LandingPage() {
  const [searchTerm, setSearchTerm] = useState("");

  const userToken = localStorage.getItem("token");
  const isLoggedIn = !userToken;

  return (
    <div className="min-h-screen flex flex-col justify-between font-sans">
     
      <Header 
        isLoggedIn={isLoggedIn} 
      />
      
      <HeroContent searchTerm={searchTerm} setSearchTerm={setSearchTerm} />

      <main className="w-full max-w-7xl mx-auto p-4 md:p-8 flex-grow">
        
        {/* Responsive Layout container */}
        <div className="w-full">
          
          {/* OpenVacancies component receiving search state links */}
          <OpenVacancies searchTerm={searchTerm} setSearchTerm={setSearchTerm} />


        </div>
      </main>
 
    </div>
  );
}