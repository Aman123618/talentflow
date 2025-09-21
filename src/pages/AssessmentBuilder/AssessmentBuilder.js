import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, Edit3, Eye, Save } from 'lucide-react';
import AssessmentPreview from './AssessmentPreview';

const QUESTION_TYPES = [
  { value: 'single-choice', label: 'Single Choice' },
  { value: 'multi-choice', label: 'Multiple Choice' },
  { value: 'short-text', label: 'Short Text' },
  { value: 'long-text', label: 'Long Text' },
  { value: 'numeric', label: 'Numeric' },
  { value: 'file-upload', label: 'File Upload' }
];

const AssessmentBuilder = () => {
  const { jobId } = useParams();
  const [job, setJob] = useState(null);
  const [assessment, setAssessment] = useState({
    title: '',
    sections: []
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    loadAssessmentData();
  }, [jobId]);

  const loadAssessmentData = async () => {
    setLoading(true);
    try {
      // Load job details from database
      const jobData = await fetch(`/api/jobs?search=&status=&page=1&pageSize=100`);
      const jobsResponse = await jobData.json();
      const currentJob = jobsResponse.jobs.find(j => j.id === parseInt(jobId));
      
      if (!currentJob) {
        throw new Error('Job not found');
      }
      setJob(currentJob);

      // Load existing assessment
      const assessmentResponse = await fetch(`/api/assessments/${jobId}`);
      if (assessmentResponse.ok) {
        const existingAssessment = await assessmentResponse.json();
        if (existingAssessment) {
          setAssessment(existingAssessment);
        } else {
          setAssessment({
            title: `${currentJob.title} Assessment`,
            sections: [{
              id: Date.now(),
              title: 'General Questions',
              questions: []
            }]
          });
        }
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch(`/api/assessments/${jobId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(assessment)
      });

      if (!response.ok) {
        throw new Error('Failed to save assessment');
      }

      setError('');
      // Show success message briefly
      const originalTitle = assessment.title;
      setAssessment(prev => ({ ...prev, title: prev.title + ' ✓' }));
      setTimeout(() => {
        setAssessment(prev => ({ ...prev, title: originalTitle }));
      }, 2000);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const addSection = () => {
    const newSection = {
      id: Date.now(),
      title: `Section ${assessment.sections.length + 1}`,
      questions: []
    };
    setAssessment(prev => ({
      ...prev,
      sections: [...prev.sections, newSection]
    }));
  };

  const updateSection = (sectionId, field, value) => {
    setAssessment(prev => ({
      ...prev,
      sections: prev.sections.map(section =>
        section.id === sectionId
          ? { ...section, [field]: value }
          : section
      )
    }));
  };

  const deleteSection = (sectionId) => {
    setAssessment(prev => ({
      ...prev,
      sections: prev.sections.filter(section => section.id !== sectionId)
    }));
  };

  const addQuestion = (sectionId) => {
    const newQuestion = {
      id: Date.now(),
      type: 'short-text',
      question: '',
      required: false,
      options: []
    };

    setAssessment(prev => ({
      ...prev,
      sections: prev.sections.map(section =>
        section.id === sectionId
          ? { ...section, questions: [...section.questions, newQuestion] }
          : section
      )
    }));
  };

  const updateQuestion = (sectionId, questionId, field, value) => {
    setAssessment(prev => ({
      ...prev,
      sections: prev.sections.map(section =>
        section.id === sectionId
          ? {
              ...section,
              questions: section.questions.map(q =>
                q.id === questionId ? { ...q, [field]: value } : q
              )
            }
          : section
      )
    }));
  };

  const deleteQuestion = (sectionId, questionId) => {
    setAssessment(prev => ({
      ...prev,
      sections: prev.sections.map(section =>
        section.id === sectionId
          ? {
              ...section,
              questions: section.questions.filter(q => q.id !== questionId)
            }
          : section
      )
    }));
  };

  const addOption = (sectionId, questionId) => {
    const newOption = `Option ${Date.now()}`;
    setAssessment(prev => ({
      ...prev,
      sections: prev.sections.map(section =>
        section.id === sectionId
          ? {
              ...section,
              questions: section.questions.map(q =>
                q.id === questionId
                  ? { ...q, options: [...(q.options || []), newOption] }
                  : q
              )
            }
          : section
      )
    }));
  };

  const updateOption = (sectionId, questionId, optionIndex, value) => {
    setAssessment(prev => ({
      ...prev,
      sections: prev.sections.map(section =>
        section.id === sectionId
          ? {
              ...section,
              questions: section.questions.map(q =>
                q.id === questionId
                  ? {
                      ...q,
                      options: q.options.map((opt, idx) =>
                        idx === optionIndex ? value : opt
                      )
                    }
                  : q
              )
            }
          : section
      )
    }));
  };

  const removeOption = (sectionId, questionId, optionIndex) => {
    setAssessment(prev => ({
      ...prev,
      sections: prev.sections.map(section =>
        section.id === sectionId
          ? {
              ...section,
              questions: section.questions.map(q =>
                q.id === questionId
                  ? {
                      ...q,
                      options: q.options.filter((_, idx) => idx !== optionIndex)
                    }
                  : q
              )
            }
          : section
      )
    }));
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="loading"></div>
      </div>
    );
  }

  if (showPreview) {
    return (
      <AssessmentPreview
        assessment={assessment}
        job={job}
        onClose={() => setShowPreview(false)}
      />
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link to={`/jobs/${jobId}`} className="btn btn-secondary">
            <ArrowLeft size={18} />
            Back to Job
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Assessment Builder</h1>
            <p className="text-gray-600">{job?.title}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowPreview(true)}
            className="btn btn-secondary"
          >
            <Eye size={18} />
            Preview
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="btn btn-primary"
          >
            {saving ? <div className="loading" /> : <Save size={18} />}
            {saving ? 'Saving...' : 'Save Assessment'}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Builder */}
        <div className="space-y-6">
          <div className="card">
            <div className="form-group">
              <label htmlFor="title">Assessment Title</label>
              <input
                type="text"
                id="title"
                className="form-control"
                value={assessment.title}
                onChange={(e) => setAssessment(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Assessment title..."
              />
            </div>
          </div>

          {assessment.sections.map((section) => (
            <div key={section.id} className="card">
              <div className="flex items-center justify-between mb-4">
                <input
                  type="text"
                  value={section.title}
                  onChange={(e) => updateSection(section.id, 'title', e.target.value)}
                  className="font-semibold text-lg bg-transparent border-none outline-none flex-1"
                  placeholder="Section title..."
                />
                <button
                  onClick={() => deleteSection(section.id)}
                  className="text-red-500 hover:text-red-700"
                  title="Delete Section"
                >
                  <Trash2 size={18} />
                </button>
              </div>

              <div className="space-y-4">
                {section.questions.map((question) => (
                  <div key={question.id} className="border rounded-lg p-4">
                    <div className="flex items-start gap-4 mb-3">
                      <div className="flex-1">
                        <textarea
                          value={question.question}
                          onChange={(e) => updateQuestion(section.id, question.id, 'question', e.target.value)}
                          className="form-control"
                          placeholder="Enter your question..."
                          rows="2"
                        />
                      </div>
                      <button
                        onClick={() => deleteQuestion(section.id, question.id)}
                        className="text-red-500 hover:text-red-700"
                        title="Delete Question"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-3">
                      <div>
                        <label className="block text-sm font-medium mb-1">Question Type</label>
                        <select
                          value={question.type}
                          onChange={(e) => {
                            const newType = e.target.value;
                            const updates = { type: newType };
                            
                            // Initialize options for choice types
                            if (['single-choice', 'multi-choice'].includes(newType) && !question.options?.length) {
                              updates.options = ['Option 1', 'Option 2'];
                            }
                            
                            // Clear options for non-choice types
                            if (!['single-choice', 'multi-choice'].includes(newType)) {
                              updates.options = undefined;
                            }
                            
                            Object.entries(updates).forEach(([field, value]) => {
                              updateQuestion(section.id, question.id, field, value);
                            });
                          }}
                          className="form-control"
                        >
                          {QUESTION_TYPES.map((type) => (
                            <option key={type.value} value={type.value}>
                              {type.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="flex items-center">
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={question.required}
                            onChange={(e) => updateQuestion(section.id, question.id, 'required', e.target.checked)}
                          />
                          <span className="text-sm">Required</span>
                        </label>
                      </div>
                    </div>

                    {/* Question-specific settings */}
                    {['single-choice', 'multi-choice'].includes(question.type) && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="text-sm font-medium">Options</label>
                          <button
                            onClick={() => addOption(section.id, question.id)}
                            className="text-blue-600 hover:text-blue-800 text-sm"
                          >
                            + Add Option
                          </button>
                        </div>
                        {question.options?.map((option, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <input
                              type="text"
                              value={option}
                              onChange={(e) => updateOption(section.id, question.id, index, e.target.value)}
                              className="form-control flex-1"
                              placeholder="Option text..."
                            />
                            <button
                              onClick={() => removeOption(section.id, question.id, index)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {question.type === 'short-text' && (
                      <div>
                        <label className="block text-sm font-medium mb-1">Max Length</label>
                        <input
                          type="number"
                          value={question.maxLength || ''}
                          onChange={(e) => updateQuestion(section.id, question.id, 'maxLength', parseInt(e.target.value) || undefined)}
                          className="form-control w-32"
                          placeholder="200"
                        />
                      </div>
                    )}

                    {question.type === 'long-text' && (
                      <div>
                        <label className="block text-sm font-medium mb-1">Max Length</label>
                        <input
                          type="number"
                          value={question.maxLength || ''}
                          onChange={(e) => updateQuestion(section.id, question.id, 'maxLength', parseInt(e.target.value) || undefined)}
                          className="form-control w-32"
                          placeholder="1000"
                        />
                      </div>
                    )}

                    {question.type === 'numeric' && (
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium mb-1">Min Value</label>
                          <input
                            type="number"
                            value={question.min || ''}
                            onChange={(e) => updateQuestion(section.id, question.id, 'min', parseInt(e.target.value) || undefined)}
                            className="form-control"
                            placeholder="0"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">Max Value</label>
                          <input
                            type="number"
                            value={question.max || ''}
                            onChange={(e) => updateQuestion(section.id, question.id, 'max', parseInt(e.target.value) || undefined)}
                            className="form-control"
                            placeholder="100"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                ))}

                <button
                  onClick={() => addQuestion(section.id)}
                  className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-gray-400 hover:text-gray-600 transition-colors"
                >
                  <Plus size={18} className="inline mr-2" />
                  Add Question
                </button>
              </div>
            </div>
          ))}

          <button
            onClick={addSection}
            className="w-full py-4 border-2 border-dashed border-blue-300 rounded-lg text-blue-600 hover:border-blue-400 hover:text-blue-700 transition-colors"
          >
            <Plus size={18} className="inline mr-2" />
            Add Section
          </button>
        </div>

        {/* Live Preview */}
        <div className="lg:sticky lg:top-4">
          <AssessmentPreview assessment={assessment} job={job} embedded={true} />
        </div>
      </div>
    </div>
  );
};

export default AssessmentBuilder;