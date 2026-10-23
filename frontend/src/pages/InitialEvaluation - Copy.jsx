import React from "react";
import InitialEvaluationHeader from "../components/initialEvaluation/InitialEvaluationHeader";
import ApplicationsForScreening from "../components/initialEvaluation/ApplicationsForScreening";

export default function InitialEvaluation() {
    return (
        <div className="min-h-screen p-6 flex flex-col gap-6">
            <InitialEvaluationHeader />
            <ApplicationsForScreening />
        </div>
    );
}