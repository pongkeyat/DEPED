import React from "react";
import VacancyHeader from "../components/vacancies/PostVacancyHeader";
import GetVacancies from "../components/vacancies/GetVacancies";

export default function VacancyPosting({ onPostVacancy }) {
    return (
        <div className="min-h-screen p-6 max-w-7xl mx-auto">
            {/* Render the header in dashboard list mode */}
            <VacancyHeader 
                isPosting={false} 
                onPostVacancy={onPostVacancy} 
            />

            {/* Your main vacancies data table or list grid will go here */}
            <div>
                <GetVacancies />
            </div>
        </div>
    );
    
}