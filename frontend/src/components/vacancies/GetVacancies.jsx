import React, { useState, useEffect } from "react";
import { Eye, Pencil, Search, Filter, Briefcase, CheckCircle, XCircle, Users } from "lucide-react";
import VacancyHeader from "./PostVacancyHeader";
import { getVacancies } from "../../api/VacancyApi";

export default function GetVacancies({ onPostVacancy }) {
    const [vacancies, setVacancies] = useState([]);
    const [loading, setLoading] = useState(true);

    // Fetch vacancies on load
    useEffect(() => {
        const loadVacancies = async () => {
            try {
                const response = await getVacancies();
                setVacancies(response?.data || []);
            } catch (err) {
                console.error("Failed to load vacancies:", err);
            } finally {
                setLoading(false);
            }
        };
        loadVacancies();
    }, []);

    // Dynamic Card Metrics derived directly from your live array data
    const totalVacancies = vacancies.length;
    const openVacancies = vacancies.filter(v => v.status === "Open" || !v.status).length; 
    const closedVacancies = vacancies.filter(v => v.status === "Closed").length;
    const totalSlots = vacancies.reduce((acc, curr) => acc + (Number(curr.no_of_slots) || 0), 0);

    const cards = [
        {
            title: "Total Vacancies",
            value: totalVacancies,
            icon: Briefcase,
            color: "border-t-[#1b4584]",
            bg: "bg-blue-50",
            iconColor: "text-[#1b4584]"
        },
        {
            title: "Open Postings",
            value: openVacancies,
            icon: CheckCircle,
            color: "border-t-green-500",
            bg: "bg-green-50",
            iconColor: "text-green-500"
        },
        {
            title: "Closed Postings",
            value: closedVacancies,
            icon: XCircle,
            color: "border-t-red-500",
            bg: "bg-red-50",
            iconColor: "text-red-500"
        },
        {
            title: "Total Available Slots",
            value: totalSlots,
            icon: Users,
            color: "border-t-purple-500",
            bg: "bg-purple-50",
            iconColor: "text-purple-500"
        }
    ];

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <p className="text-gray-500 animate-pulse font-medium">Loading data profiles...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen p-6 max-w-7xl mx-auto space-y-6">
            {/* 1. CONDITIONAL HEADER ELEMENT */}

            {/* 2. LIVE METRIC CARDS */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                {cards.map((card) => {
                    const Icon = card.icon;
                    return (
                        <div
                            key={card.title}
                            className={`rounded-xl border-t-4 ${card.color} bg-white p-5 shadow-sm transition-all duration-300 ease-in-out hover:-translate-y-1 hover:shadow-lg hover:scale-[1.02] cursor-pointer`}
                        >
                            <div className="flex items-center gap-4">
                                <div className={`${card.bg} rounded-xl p-3`}>
                                    <Icon size={24} className={card.iconColor} />
                                </div>
                                <div>
                                    <h2 className="text-4xl font-bold text-gray-800">{card.value}</h2>
                                    <p className="text-sm text-gray-500">{card.title}</p>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* 3. FILTERS BAR CONTAINER */}
            <div className="rounded-xl bg-white p-6 shadow-sm">
                <div className="grid grid-cols-1 gap-5 lg:grid-cols-4">
                    <div>
                        <label className="mb-2 block text-sm font-medium text-gray-700">Status</label>
                        <select className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-blue-500 bg-gray-50">
                            <option value="">All Status</option>
                            <option value="Open">Open</option>
                            <option value="Closed">Closed</option>
                        </select>
                    </div>

                    <div>
                        <label className="mb-2 block text-sm font-medium text-gray-700">Office / Unit</label>
                        <select className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-blue-500 bg-gray-50">
                            <option value="">All Offices</option>
                            <option value="Accounting Section">Accounting Section</option>
                            <option value="Budget Section">Budget Section</option>
                            <option value="Cashier Section">Cashier Section</option>
                            <option value="Human Resource Section">Human Resource Section</option>
                            <option value="ICT Section">ICT Section</option>
                        </select>
                    </div>

                    <div className="flex items-end justify-end lg:col-span-2">
                        <button className="flex items-center gap-2 rounded-lg bg-[#1b4584] px-8 py-3 text-white hover:bg-[#17386d] transition">
                            <Filter size={18} />
                            Filter
                        </button>
                    </div>
                </div>
            </div>

            {/* 4. DATA TABLES WRAPPER */}
            <div className="overflow-hidden rounded-xl bg-white shadow-sm">
                <div className="bg-[#1b4584] px-6 py-4">
                    <h2 className="font-semibold text-white">Vacancy Postings</h2>
                </div>

                <div className="flex flex-col gap-4 border-b p-5 md:flex-row md:items-center md:justify-between">
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-500">Show</span>
                        <select className="rounded border px-3 py-2 bg-white">
                            <option>25</option>
                        </select>
                        <span className="text-sm text-gray-500">entries</span>
                    </div>

                    <div className="relative w-full md:w-72">
                        <Search size={18} className="absolute left-3 top-3 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search position titles..."
                            className="w-full rounded-full border py-2 pl-10 pr-4 outline-none focus:border-blue-500"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="min-w-full">
                        <thead className="bg-gray-50 text-sm uppercase text-gray-600">
                            <tr>
                                <th className="px-6 py-4 text-left">#</th>
                                <th className="px-6 py-4 text-left">Vacancy ID</th>
                                <th className="px-6 py-4 text-left">Position Title</th>
                                <th className="px-6 py-4 text-left">Office / Unit</th>
                                <th className="px-6 py-4 text-left">Posting Date</th>
                                <th className="px-6 py-4 text-left">Deadline</th>
                                <th className="px-6 py-4 text-center">Slots</th>
                                <th className="px-6 py-4 text-center">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 text-sm">
                            {vacancies.map((item, index) => {
                                const vacancyId = item.vacancy_id || item.id;
                                return (
                                    <tr key={vacancyId || index} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 font-medium text-gray-400">{index + 1}</td>
                                        <td className="px-6 py-4 font-mono text-xs text-gray-500">{vacancyId || "N/A"}</td>
                                        <td className="px-6 py-4">
                                            <div className="font-semibold text-gray-900">{item.position_title}</div>
                                            <div className="text-xs text-gray-500">SG-{item.salary_grade}</div>
                                        </td>
                                        <td className="px-6 py-4 text-gray-600">{item.office_unit}</td>
                                        <td className="px-6 py-4 text-gray-600">
                                            {item.application_posted ? new Date(item.application_posted).toLocaleDateString() : 'N/A'}
                                        </td>
                                        <td className="px-6 py-4 text-gray-600">
                                            {item.application_deadline ? new Date(item.application_deadline).toLocaleDateString() : 'N/A'}
                                        </td>
                                        <td className="px-6 py-4 text-center font-bold text-gray-700">{item.no_of_slots}</td>
                                        <td className="px-6 py-4 text-center">
                                            {item.status === "Closed" ? (
                                                <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-medium text-red-700">
                                                    Closed
                                                </span>
                                            ) : (
                                                <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700">
                                                    Open
                                                </span>
                                            )}
                                        </td>
                                       
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}