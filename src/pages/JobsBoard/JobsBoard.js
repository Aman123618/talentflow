import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { Plus, Search, Filter, Edit, Archive, MoreHorizontal, Settings } from 'lucide-react';
import JobModal from './JobModal';

const JobsBoard = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingJob, setEditingJob] = useState(null);
  const [filters, setFilters] = useState({
    search: '',
    status: ''
  });
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 10,
    total: 0,
    totalPages: 0
  });

  const loadJobs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        pageSize: pagination.pageSize.toString(),
        ...(filters.search && { search: filters.search }),
        ...(filters.status && { status: filters.status })
      });

      const response = await fetch(`/api/jobs?${params}`);
      if (!response.ok) throw new Error('Failed to load jobs');
      
      const data = await response.json();
      setJobs(data.jobs);
      setPagination(prev => ({
        ...prev,
        total: data.total,
        totalPages: data.totalPages
      }));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadJobs();
  }, [pagination.page, filters]);

  const handleDragEnd = async (result) => {
    if (!result.destination) return;

    const sourceIndex = result.source.index;
    const destIndex = result.destination.index;
    
    if (sourceIndex === destIndex) return;

    const jobId = parseInt(result.draggableId);
    const newJobs = Array.from(jobs);
    const [movedJob] = newJobs.splice(sourceIndex, 1);
    newJobs.splice(destIndex, 0, movedJob);
    
    // Optimistic update
    setJobs(newJobs);

    try {
      const response = await fetch(`/api/jobs/${jobId}/reorder`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fromOrder: movedJob.order,
          toOrder: destIndex + 1
        })
      });

      if (!response.ok) {
        throw new Error('Failed to reorder');
      }
    } catch (err) {
      // Rollback on failure
      loadJobs();
      setError('Failed to reorder jobs');
    }
  };

  const handleCreateJob = () => {
    setEditingJob(null);
    setShowModal(true);
  };

  const handleEditJob = (job) => {
    setEditingJob(job);
    setShowModal(true);
  };

  const handleArchiveJob = async (job) => {
    try {
      const response = await fetch(`/api/jobs/${job.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: job.status === 'active' ? 'archived' : 'active'
        })
      });

      if (!response.ok) throw new Error('Failed to update job');
      
      loadJobs();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleJobSaved = () => {
    setShowModal(false);
    setEditingJob(null);
    loadJobs();
  };

  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  if (loading && jobs.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="loading"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Jobs Board</h1>
        <button
          onClick={handleCreateJob}
          className="btn btn-primary"
        >
          <Plus size={18} />
          Create Job
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="card mb-6">
        <div className="flex gap-4 mb-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Search jobs..."
                className="form-control pl-10"
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
              />
            </div>
          </div>
          <select
            className="form-control w-48"
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="archived">Archived</option>
          </select>
        </div>

        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="jobs">
            {(provided) => (
              <div
                {...provided.droppableProps}
                ref={provided.innerRef}
                className="space-y-4"
              >
                {jobs.map((job, index) => (
                  <Draggable
                    key={job.id}
                    draggableId={job.id.toString()}
                    index={index}
                  >
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className={`bg-white border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow ${
                          snapshot.isDragging ? 'shadow-lg' : ''
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div
                              {...provided.dragHandleProps}
                              className="text-gray-400 hover:text-gray-600 cursor-grab"
                            >
                              <MoreHorizontal size={18} />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <Link
                                  to={`/jobs/${job.id}`}
                                  className="text-lg font-semibold text-blue-600 hover:text-blue-800"
                                >
                                  {job.title}
                                </Link>
                                <span className={`status-badge ${job.status === 'active' ? 'status-active' : 'status-archived'}`}>
                                  {job.status}
                                </span>
                              </div>
                              <div className="flex flex-wrap gap-1 mb-2">
                                {job.tags?.map((tag) => (
                                  <span
                                    key={tag}
                                    className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-sm"
                                  >
                                    {tag}
                                  </span>
                                ))}
                              </div>
                              <p className="text-sm text-gray-500">
                                Created: {new Date(job.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Link
                              to={`/assessments/${job.id}`}
                              className="btn btn-secondary"
                              title="Manage Assessment"
                            >
                              <Settings size={16} />
                            </Link>
                            <button
                              onClick={() => handleEditJob(job)}
                              className="btn btn-secondary"
                              title="Edit Job"
                            >
                              <Edit size={16} />
                            </button>
                            <button
                              onClick={() => handleArchiveJob(job)}
                              className={`btn ${job.status === 'active' ? 'btn-secondary' : 'btn-success'}`}
                              title={job.status === 'active' ? 'Archive Job' : 'Activate Job'}
                            >
                              <Archive size={16} />
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>

        {jobs.length === 0 && !loading && (
          <div className="text-center py-8 text-gray-500">
            No jobs found. Create your first job to get started.
          </div>
        )}

        {pagination.totalPages > 1 && (
          <div className="pagination mt-6">
            <button
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page === 1}
              className="btn btn-secondary"
            >
              Previous
            </button>
            <span className="px-4 py-2">
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <button
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={pagination.page === pagination.totalPages}
              className="btn btn-secondary"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {showModal && (
        <JobModal
          job={editingJob}
          onClose={() => setShowModal(false)}
          onSave={handleJobSaved}
        />
      )}
    </div>
  );
};

export default JobsBoard;