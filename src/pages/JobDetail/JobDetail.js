import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Users, Settings, Calendar } from 'lucide-react';
import db from '../../services/database';

const JobDetail = () => {
  const { jobId } = useParams();
  const [job, setJob] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadJobData = async () => {
      try {
        setLoading(true);
        
        // Load job details from database
        const jobData = await db.jobs.get(parseInt(jobId));
        if (!jobData) {
          throw new Error('Job not found');
        }
        setJob(jobData);

        // Load candidates for this job
        const jobCandidates = await db.candidates
          .where('jobId')
          .equals(parseInt(jobId))
          .toArray();
        setCandidates(jobCandidates);

      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadJobData();
  }, [jobId]);

  const getCandidatesByStage = (stage) => {
    return candidates.filter(candidate => candidate.stage === stage);
  };

  const stages = [
    { key: 'applied', label: 'Applied', color: 'stage-applied' },
    { key: 'screen', label: 'Screening', color: 'stage-screen' },
    { key: 'tech', label: 'Technical', color: 'stage-tech' },
    { key: 'offer', label: 'Offer', color: 'stage-offer' },
    { key: 'hired', label: 'Hired', color: 'stage-hired' },
    { key: 'rejected', label: 'Rejected', color: 'stage-rejected' }
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="loading"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded inline-block">
          {error}
        </div>
        <div className="mt-4">
          <Link to="/jobs" className="btn btn-primary">
            <ArrowLeft size={18} />
            Back to Jobs
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <Link to="/jobs" className="btn btn-secondary">
          <ArrowLeft size={18} />
          Back to Jobs
        </Link>
        <h1 className="text-2xl font-bold flex-1">{job.title}</h1>
        <Link
          to={`/assessments/${job.id}`}
          className="btn btn-primary"
        >
          <Settings size={18} />
          Manage Assessment
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="card">
          <h3 className="font-semibold mb-2">Job Details</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Status:</span>
              <span className={`status-badge ${job.status === 'active' ? 'status-active' : 'status-archived'}`}>
                {job.status}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Slug:</span>
              <span>{job.slug}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Created:</span>
              <span>{new Date(job.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
        </div>

        <div className="card">
          <h3 className="font-semibold mb-2">Tags</h3>
          <div className="flex flex-wrap gap-1">
            {job.tags?.length > 0 ? (
              job.tags.map((tag) => (
                <span
                  key={tag}
                  className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-sm"
                >
                  {tag}
                </span>
              ))
            ) : (
              <span className="text-gray-500 text-sm">No tags</span>
            )}
          </div>
        </div>

        <div className="card">
          <h3 className="font-semibold mb-2">Candidates Overview</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Total:</span>
              <span className="font-medium">{candidates.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Active:</span>
              <span className="font-medium">
                {candidates.filter(c => !['hired', 'rejected'].includes(c.stage)).length}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Hired:</span>
              <span className="font-medium text-green-600">
                {getCandidatesByStage('hired').length}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <h2 className="text-xl font-semibold mb-4">Candidate Pipeline</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {stages.map((stage) => {
            const stageCandidates = getCandidatesByStage(stage.key);
            return (
              <div key={stage.key} className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-medium text-sm">{stage.label}</h3>
                  <span className={`status-badge ${stage.color}`}>
                    {stageCandidates.length}
                  </span>
                </div>
                
                <div className="space-y-2">
                  {stageCandidates.slice(0, 5).map((candidate) => (
                    <Link
                      key={candidate.id}
                      to={`/candidates/${candidate.id}`}
                      className="block p-2 bg-white rounded text-xs hover:bg-gray-50 border"
                    >
                      <div className="font-medium truncate">{candidate.name}</div>
                      <div className="text-gray-500 truncate">{candidate.email}</div>
                    </Link>
                  ))}
                  
                  {stageCandidates.length > 5 && (
                    <div className="text-xs text-gray-500 text-center py-2">
                      +{stageCandidates.length - 5} more
                    </div>
                  )}
                  
                  {stageCandidates.length === 0 && (
                    <div className="text-xs text-gray-400 text-center py-4">
                      No candidates
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default JobDetail;