import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Clock, CheckCircle, AlertCircle, Upload } from 'lucide-react';

const AssessmentTaker = () => {
  const { jobId } = useParams();
  const [assessment, setAssessment] = useState(null);
  const [job, setJob] = useState(null);
  const [responses, setResponses] = useState({});
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [candidateInfo, setCandidateInfo] = useState({
    name: '',
    email: ''
  });

  useEffect(() => {
    loadAssessment();
  }, [jobId]);

  const loadAssessment = async () => {
    setLoading(true);
    try {
      // Load job and assessment data
      const jobResponse = await fetch(`/api/jobs?search=&status=&page=1&pageSize=100`);
      const jobsData = await jobResponse.json();
      const currentJob = jobsData.jobs.find(j => j.id === parseInt(jobId));
      
      if (!currentJob) {
        throw new Error('Job not found');
      }
      setJob(currentJob);

      const assessmentResponse = await fetch(`/api/assessments/${jobId}`);
      if (!assessmentResponse.ok) {
        throw new Error('Assessment not found');
      }
      
      const assessmentData = await assessmentResponse.json();
      if (!assessmentData) {
        throw new Error('No assessment configured for this job');
      }
      
      setAssessment(assessmentData);
    } catch (err) {
      console.error('Error loading assessment:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleResponseChange = (questionId, value) => {
    setResponses(prev => ({
      ...prev,
      [questionId]: value
    }));
    
    // Clear error if user provides response
    if (errors[questionId]) {
      setErrors(prev => ({
        ...prev,
        [questionId]: undefined
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    // Validate candidate info
    if (!candidateInfo.name.trim()) {
      newErrors.name = 'Name is required';
    }
    if (!candidateInfo.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(candidateInfo.email)) {
      newErrors.email = 'Please enter a valid email';
    }
    
    // Validate questions
    assessment.sections?.forEach(section => {
      section.questions?.forEach(question => {
        if (question.required) {
          const response = responses[question.id];
          if (!response || (Array.isArray(response) && response.length === 0)) {
            newErrors[question.id] = 'This question is required';
          }
        }
        
        // Validate numeric ranges
        if (question.type === 'numeric' && responses[question.id] !== undefined && responses[question.id] !== '') {
          const numValue = parseFloat(responses[question.id]);
          if (isNaN(numValue)) {
            newErrors[question.id] = 'Please enter a valid number';
          } else {
            if (question.min !== undefined && numValue < question.min) {
              newErrors[question.id] = `Value must be at least ${question.min}`;
            }
            if (question.max !== undefined && numValue > question.max) {
              newErrors[question.id] = `Value must be at most ${question.max}`;
            }
          }
        }
        
        // Validate text length
        if (['short-text', 'long-text'].includes(question.type) && question.maxLength && responses[question.id]) {
          if (responses[question.id].length > question.maxLength) {
            newErrors[question.id] = `Response must be ${question.maxLength} characters or less`;
          }
        }
      });
    });
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setSubmitting(true);
    try {
      // Simulate submission
      const submissionData = {
        candidateId: Date.now(), // In real app, this would be the logged-in user
        responses,
        candidateInfo,
        submittedAt: new Date()
      };

      const response = await fetch(`/api/assessments/${jobId}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submissionData)
      });

      if (!response.ok) {
        throw new Error('Failed to submit assessment');
      }

      setSubmitted(true);
    } catch (err) {
      setErrors({ general: 'Failed to submit assessment. Please try again.' });
    } finally {
      setSubmitting(false);
    }
  };

  const renderQuestion = (question) => {
    const response = responses[question.id];
    const error = errors[question.id];

    switch (question.type) {
      case 'single-choice':
        return (
          <div className="space-y-3">
            {question.options?.map((option, index) => (
              <label key={index} className="flex items-center gap-3 cursor-pointer p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                <input
                  type="radio"
                  name={`question-${question.id}`}
                  value={option}
                  checked={response === option}
                  onChange={(e) => handleResponseChange(question.id, e.target.value)}
                  className="text-blue-600"
                />
                <span className="flex-1">{option}</span>
              </label>
            ))}
          </div>
        );

      case 'multi-choice':
        return (
          <div className="space-y-3">
            {question.options?.map((option, index) => (
              <label key={index} className="flex items-center gap-3 cursor-pointer p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                <input
                  type="checkbox"
                  value={option}
                  checked={(response || []).includes(option)}
                  onChange={(e) => {
                    const currentResponses = response || [];
                    if (e.target.checked) {
                      handleResponseChange(question.id, [...currentResponses, option]);
                    } else {
                      handleResponseChange(question.id, currentResponses.filter(r => r !== option));
                    }
                  }}
                  className="text-blue-600"
                />
                <span className="flex-1">{option}</span>
              </label>
            ))}
          </div>
        );

      case 'short-text':
        return (
          <div>
            <input
              type="text"
              value={response || ''}
              onChange={(e) => handleResponseChange(question.id, e.target.value)}
              className="form-control"
              placeholder="Your answer..."
              maxLength={question.maxLength}
            />
            {question.maxLength && (
              <div className="text-xs text-gray-500 mt-2">
                {(response || '').length} / {question.maxLength} characters
              </div>
            )}
          </div>
        );

      case 'long-text':
        return (
          <div>
            <textarea
              value={response || ''}
              onChange={(e) => handleResponseChange(question.id, e.target.value)}
              className="form-control"
              rows="6"
              placeholder="Your detailed answer..."
              maxLength={question.maxLength}
            />
            {question.maxLength && (
              <div className="text-xs text-gray-500 mt-2">
                {(response || '').length} / {question.maxLength} characters
              </div>
            )}
          </div>
        );

      case 'numeric':
        return (
          <div>
            <input
              type="number"
              value={response || ''}
              onChange={(e) => handleResponseChange(question.id, e.target.value)}
              className="form-control"
              placeholder="Enter a number..."
              min={question.min}
              max={question.max}
            />
            {(question.min !== undefined || question.max !== undefined) && (
              <div className="text-xs text-gray-500 mt-2">
                {question.min !== undefined && question.max !== undefined
                  ? `Range: ${question.min} - ${question.max}`
                  : question.min !== undefined
                  ? `Minimum: ${question.min}`
                  : `Maximum: ${question.max}`
                }
              </div>
            )}
          </div>
        );

      case 'file-upload':
        return (
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors cursor-pointer">
            <Upload size={32} className="mx-auto text-gray-400 mb-3" />
            <p className="text-gray-600 mb-1">Click to upload or drag and drop</p>
            <p className="text-xs text-gray-500">PDF, DOC, DOCX files only (Max 10MB)</p>
          </div>
        );

      default:
        return <div className="text-gray-500">Unknown question type</div>;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="loading mb-4"></div>
          <p className="text-gray-600">Loading assessment...</p>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md mx-auto text-center">
          <div className="bg-white rounded-lg p-8 shadow-sm">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Assessment Submitted!</h2>
            <p className="text-gray-600 mb-4">
              Thank you for completing the assessment for <strong>{job?.title}</strong>.
            </p>
            <p className="text-sm text-gray-500">
              We'll review your responses and get back to you soon.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!assessment) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md mx-auto text-center">
          <div className="bg-white rounded-lg p-8 shadow-sm">
            <AlertCircle className="w-16 h-16 text-orange-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">Assessment Not Available</h2>
            <p className="text-gray-600">
              No assessment is currently configured for this position.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-sm">
          {/* Header */}
          <div className="border-b border-gray-200 px-8 py-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{assessment.title}</h1>
                <p className="text-gray-600">{job?.title}</p>
              </div>
            </div>
          </div>

          <div className="px-8 py-6">
            {errors.general && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
                {errors.general}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Candidate Information */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <h3 className="font-semibold text-blue-900 mb-4">Your Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-medium mb-2">
                      Full Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={candidateInfo.name}
                      onChange={(e) => setCandidateInfo(prev => ({ ...prev, name: e.target.value }))}
                      className="form-control"
                      placeholder="John Doe"
                    />
                    {errors.name && <div className="error">{errors.name}</div>}
                  </div>
                  <div>
                    <label className="block font-medium mb-2">
                      Email Address <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      value={candidateInfo.email}
                      onChange={(e) => setCandidateInfo(prev => ({ ...prev, email: e.target.value }))}
                      className="form-control"
                      placeholder="john@example.com"
                    />
                    {errors.email && <div className="error">{errors.email}</div>}
                  </div>
                </div>
              </div>

              {/* Assessment Sections */}
              {assessment.sections?.map((section, sectionIndex) => (
                <div key={section.id} className="space-y-6">
                  <div className="border-l-4 border-blue-500 pl-6">
                    <h3 className="text-xl font-semibold text-gray-900 mb-1">
                      {section.title}
                    </h3>
                    <p className="text-sm text-gray-600">
                      Section {sectionIndex + 1} of {assessment.sections.length}
                    </p>
                  </div>
                  
                  <div className="space-y-8 pl-6">
                    {section.questions?.map((question, questionIndex) => (
                      <div key={question.id} className="space-y-3">
                        <div className="flex items-start gap-4">
                          <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-sm font-medium text-gray-600 flex-shrink-0 mt-1">
                            {questionIndex + 1}
                          </div>
                          <div className="flex-1">
                            <label className="block font-medium text-gray-900 mb-3">
                              {question.question}
                              {question.required && <span className="text-red-500 ml-1">*</span>}
                            </label>
                            
                            {renderQuestion(question)}
                            
                            {errors[question.id] && (
                              <div className="error mt-2">{errors[question.id]}</div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              {/* Submit Button */}
              <div className="border-t border-gray-200 pt-8">
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="btn btn-primary px-8 py-3 text-lg"
                  >
                    {submitting ? (
                      <>
                        <div className="loading mr-2" />
                        Submitting...
                      </>
                    ) : (
                      'Submit Assessment'
                    )}
                  </button>
                </div>
                <p className="text-xs text-gray-500 text-right mt-2">
                  Please review your answers before submitting. You cannot modify them after submission.
                </p>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssessmentTaker;