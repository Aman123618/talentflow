import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { initializeDatabase } from './services/database';
import { startMSW } from './mocks/browser';
import Layout from './components/Layout/Layout';
import JobsBoard from './pages/JobsBoard/JobsBoard';
import JobDetail from './pages/JobDetail/JobDetail';
import CandidatesList from './pages/CandidatesList/CandidatesList';
import CandidateProfile from './pages/CandidateProfile/CandidateProfile';
import KanbanBoard from './pages/KanbanBoard/KanbanBoard';
import AssessmentBuilder from './pages/AssessmentBuilder/AssessmentBuilder';
import AssessmentTaker from './pages/AssessmentTaker/AssessmentTaker';
import './App.css';

function App() {
  useEffect(() => {
    const initializeApp = async () => {
      try {
        await initializeDatabase();
        await startMSW();
        console.log('App initialized successfully');
      } catch (error) {
        console.error('Failed to initialize app:', error);
      }
    };

    initializeApp();
  }, []);

  return (
    <Router>
      <div className="App">
        <Layout>
          <Routes>
            <Route path="/" element={<Navigate to="/jobs" replace />} />
            <Route path="/jobs" element={<JobsBoard />} />
            <Route path="/jobs/:jobId" element={<JobDetail />} />
            <Route path="/candidates" element={<CandidatesList />} />
            <Route path="/candidates/:id" element={<CandidateProfile />} />
            <Route path="/kanban" element={<KanbanBoard />} />
            <Route path="/assessments/:jobId" element={<AssessmentBuilder />} />
            <Route path="/assessments/:jobId/take" element={<AssessmentTaker />} />
          </Routes>
        </Layout>
      </div>
    </Router>
  );
}

export default App;