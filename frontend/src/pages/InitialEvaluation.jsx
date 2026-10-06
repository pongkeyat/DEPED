import React from "react";
import InitialScreeningHeader from "../components/initialEvaluation/InitialScreeningHeader";
import ScreeningStats from "../components/initialEvaluation/ScreeningStats";
import ApplicationsForScreening from "../components/initialEvaluation/ApplicationsForScreening";

export default function InitialEvaluation() {
    return (
        <div className="min-h-screen p-6 flex flex-col gap-6">
            <InitialScreeningHeader />
            <ApplicationsForScreening />
        </div>
    );
}