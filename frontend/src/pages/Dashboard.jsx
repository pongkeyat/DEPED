import React from "react";
import DashboardCards from "../components/dashboard/DashboardCards";
import DashboardCharts from "../components/dashboard/DashboardCharts";
import RecruitmentProcessOverview from "../components/dashboard/RecruitmentProcessOverview";

export default function DashBoard () {
    return(
       <div className="min-h-screen bg-[#f4f7fc] flex flex-col pb-16 p-6">
    
      <DashboardCards />
      <DashboardCharts />
            <div className="-mt-25">
        <RecruitmentProcessOverview />
      </div>
      
     

    </div>

    )
}