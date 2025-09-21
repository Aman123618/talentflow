import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Clock, User, Mail, Briefcase, MessageSquare, AtSign } from 'lucide-react';
import db from '../../services/database';

const CandidateProfile = () => {
  const { id } = useParams();
  const [candidate, setCandidate] = useState(null);
  const [job, setJob] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [newNote, setNewNote] = useState('');
  const [addingNote, setAddingNote] = useState(false);

  // Mock mentions data
  const mentions = [
    { id: 1, name: 'John Smith', email: 'john@company.com' },
    { id: 2, name: 'Sarah Johnson', email: 'sarah@company.com' },
    { id: 3, name: 'Mike Wilson', email: 'mike@company.com' }
  ];

  useEffect(() => {
    const loadCandidateData = async () => {
      try {
        setLoading(true);

        // Load candidate details
        const candidateData = await db.candidates.get(parseInt(id));
        if (!candidateData) {
          throw new Error('Candidate not found');
        }
        setCandidate(candidateData);

        // Load job details
        const jobData = await db.jobs.get(candidateData.jobId);
        setJob(jobData);

        // Load timeline
        const timelineResponse = await fetch(`/api/candidates/${id}/timeline`);
        if (!timelineResponse.ok) throw new Error('Failed to load timeline');
        const timelineData = await timelineResponse.json();
        setTimeline(timelineData);

      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadCandidateData();
  }, [id]);

  const handleStageChange = async (newStage) => {
    try {
      const response = await fetch(`/api/candidates/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stage: newStage })
      });

      if (!response.ok) throw new Error('Failed to update stage');

      const updatedCandidate = await response.json();
      setCandidate(updatedCandidate);

      // Reload timeline
      const timelineResponse = await fetch(`/api/candidates/${id}/timeline`);
      const timelineData = await timelineResponse.json();
      setTimeline(timelineData);

    } catch (err) {
      setError(err.message);
    }
  };

  const handleAddNote = async () => {
    if (!newNote.trim()) return;

    setAddingNote(true);
    try {
      await db.candidateTimeline.add({
        candidateId: parseInt(id),
        stage: candidate.stage,
        timestamp: new Date(),
        notes: newNote.trim()
      });

      // Reload timeline
      const timelineResponse = await fetch(`/api/candidates/${id}/timeline`);
      const timelineData = await timelineResponse.json();
      setTimeline(timelineData);
      setNewNote('');

    } catch (err) {
      setError(err.message);
    } finally {
      setAddingNote(false);
    }
  };

  const renderNoteWithMentions = (note) => {
    if (!note) return note;

    // Simple @mention rendering (just highlight for demo)
    return note.split(/(@\w+)/).map((part, index) => {
      if (part.startsWith('@')) {
        return (
          <span key={index} className="bg-blue-100 text-blue-700 px-1 rounded">
            {part}
          </span>
        );
      }
      return part;
    });
  };

  const stages = [
    { key: 'applied', label: 'Applied' },
    { key: 'screen', label: 'Screening' },
    { key: 'tech', label: 'Technical' },
    { key: 'offer', label: 'Offer' },
    { key: 'hired', label: 'Hired' },
    { key: 'rejected', label: 'Rejected' }
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
          <Link to="/candidates" className="btn btn-primary">
            <ArrowLeft size={18} />
            Back to Candidates
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <Link to="/candidates" className="btn btn-secondary">
          <ArrowLeft size={18} />
          Back to Candidates
        </Link>
        <h1 className="text-2xl font-bold flex-1">{candidate.name}</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Candidate Info */}
        <div className="lg:col-span-1">
          <div className="card mb-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                <User size={32} className="text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">{candidate.name}</h2>
                <div className="flex items-center gap-2 text-gray-600">
                  <Mail size={16} />
                  {candidate.email}
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Current Stage:</span>
                <span className={`status-badge stage-${candidate.stage}`}>
                  {candidate.stage}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Applied:</span>
                <span>{new Date(candidate.createdAt).toLocaleDateString()}</span>
              </div>

              {job && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Job:</span>
                  <Link
                    to={`/jobs/${job.id}`}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    {job.title}
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Stage Actions */}
          <div className="card">
            <h3 className="font-semibold mb-4">Update Stage</h3>
            <div className="space-y-2">
              {stages.map((stage) => (
                <button
                  key={stage.key}
                  onClick={() => handleStageChange(stage.key)}
                  className={`w-full text-left px-3 py-2 rounded border ${
                    candidate.stage === stage.key
                      ? 'bg-blue-50 border-blue-200 text-blue-700'
                      : 'hover:bg-gray-50 border-gray-200'
                  }`}
                  disabled={candidate.stage === stage.key}
                >
                  {stage.label}
                  {candidate.stage === stage.key && (
                    <span className="float-right text-blue-600">✓</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Timeline */}
        <div className="lg:col-span-2">
          <div className="card">
            <h3 className="text-lg font-semibold mb-4">Timeline</h3>

            {/* Add Note */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium mb-2">Add Note</h4>
              <div className="space-y-3">
                <textarea
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="Add a note... Use @mentions to reference team members"
                  className="form-control"
                  rows="3"
                />
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <AtSign size={14} />
                  <span>Available mentions:</span>
                  {mentions.map((person) => (
                    <span
                      key={person.id}
                      className="bg-white px-2 py-1 rounded border text-xs cursor-pointer hover:bg-gray-50"
                      onClick={() => setNewNote(prev => prev + ` @${person.name.replace(' ', '')}`)}
                    >
                      @{person.name.replace(' ', '')}
                    </span>
                  ))}
                </div>
                <button
                  onClick={handleAddNote}
                  disabled={!newNote.trim() || addingNote}
                  className="btn btn-primary"
                >
                  {addingNote ? <div className="loading" /> : <MessageSquare size={16} />}
                  Add Note
                </button>
              </div>
            </div>

            {/* Timeline Items */}
            <div className="space-y-4">
              {timeline.map((item, index) => (
                <div key={item.id} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center stage-${item.stage}`}>
                      <Clock size={16} />
                    </div>
                    {index < timeline.length - 1 && (
                      <div className="w-0.5 h-12 bg-gray-200 mt-2"></div>
                    )}
                  </div>
                  <div className="flex-1 pb-4">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`status-badge stage-${item.stage}`}>
                        {item.stage}
                      </span>
                      <span className="text-sm text-gray-500">
                        {new Date(item.timestamp).toLocaleString()}
                      </span>
                    </div>
                    {item.notes && (
                      <p className="text-gray-700 text-sm">
                        {renderNoteWithMentions(item.notes)}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {timeline.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No timeline entries yet.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CandidateProfile;