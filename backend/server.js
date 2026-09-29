import dotenv from 'dotenv';
import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import usersAuthRoutes from './users/users.routes.js'
import vacancyRoutes from './vacancies/vacancies.routes.js'
import applicationsRoutes from './applications/applications.routes.js'
import positionsRoutes from './postiions/positions.routes.js'
import initialEvaluationRoutes from './initialEvalualtion/initialEvaluation.routes.js'
import interviewSessionRoutes from './interviewSession/interviewSession.routes.js'
import assessmentRoutes from './assessment/assessment.route.js';
import rankingRoutes from "./ranking/ranking.routes.js";
import panelistRoutes from "./panelist/panelist.route.js";
import databaseRoutes from "./backup/database.route.js";
import auditLogsRoutes from "./auditLogs/auditLogs.routes.js";
import path from 'path';

const app = express();

app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true
}));


app.use(express.json());
app.use(cookieParser());


app.use('/api/usersAuth' , usersAuthRoutes)
app.use('/api/vacancies', vacancyRoutes)
app.use('/api/applications', applicationsRoutes)
app.use('/api/positions', positionsRoutes)
app.use('/api/initial-evaluation', initialEvaluationRoutes)
app.use('/api/', interviewSessionRoutes)
app.use("/api/assessment", assessmentRoutes );
app.use("/api/", rankingRoutes);
app.use("/api/panelists", panelistRoutes);
app.use("/api/database", databaseRoutes);
app.use("/api/audit-logs", auditLogsRoutes);
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));




const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
})