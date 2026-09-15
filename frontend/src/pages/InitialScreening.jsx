import react from "react";
import InitialScreeningHeader from "../components/initialscreening/InitialScreeningHeader";
import ScreeningStats from "../components/initialscreening/ScreeningStats";
import ApplicationsForScreening from "../components/initialscreening/ApplicationsForScreening";


export default function InitialScreening() {
    return (
        <div className="w-full h-full flex flex-col gap-6">
            <InitialScreeningHeader />
            <ScreeningStats />
            <ApplicationsForScreening />
            
        </div>
    )
}