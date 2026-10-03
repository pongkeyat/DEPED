import React from "react";
import DashboardCards from "../components/dashboard/DashboardCards";
import DashboardCharts from "../components/dashboard/DashboardCharts";
import RecruitmentProcessOverview from "../components/dashboard/RecruitmentProcessOverview";

export default function DashBoard () {
    return(
      <div className="min-h-screen flex flex-col gap-6 p-6 pb-16">
    
      <DashboardCards />
      <DashboardCharts />
            <div>
        <RecruitmentProcessOverview />
      </div>
      
     

    </div>

    )
}