import React, { useState } from 'react';
import { X, ArrowLeft, Upload } from 'lucide-react';

const AssessmentPreview = ({ assessment, job, onClose, embedded = false }) => {
  const [responses, setResponses] = useState({});
  const [errors, setErrors] = useState({});

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
    
    assessment.sections?.forEach(section => {
      section.questions?.forEach(question => {
        if (question.required) {
          const response = responses[question.id];
          if (!response || (Array.isArray(response) && response.length === 0)) {
            newErrors[question.id] = 'This question is required';
          }
        }
        
        // Validate numeric ranges
        if (question.type === 'numeric' && responses[question.id] !== undefined) {
          const numValue = parseFloat(responses[question.id]);
          if (!isNaN(numValue)) {
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

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      alert('Assessment submitted successfully! (This is just a preview)');
    }
  };

  const renderQuestion = (question) => {
    const response = responses[question.id];
    const error = errors[question.id];

    switch (question.type) {
      case 'single-choice':
        return (
          <div className="space-y-2">
            {question.options?.map((option, index) => (
              <label key={index} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name={`question-${question.id}`}
                  value={option}
                  checked={response === option}
                  onChange={(e) => handleResponseChange(question.id, e.target.value)}
                  className="text-blue-600"
                />
                <span>{option}</span>
              </label>
            ))}
          </div>
        );

      case 'multi-choice':
        return (
          <div className="space-y-2">
            {question.options?.map((option, index) => (
              <label key={index} className="flex items-center gap-2 cursor-pointer">
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
                <span>{option}</span>
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
              <div className="text-xs text-gray-500 mt-1">
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
              rows="4"
              placeholder="Your detailed answer..."
              maxLength={question.maxLength}
            />
            {question.maxLength && (
              <div className="text-xs text-gray-500 mt-1">
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
              <div className="text-xs text-gray-500 mt-1">
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
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <Upload size={24} className="mx-auto text-gray-400 mb-2" />
            <p className="text-sm text-gray-500">
              Click to upload or drag and drop<br />
              (File upload is not functional in preview mode)
            </p>
          </div>
        );

      default:
        return <div className="text-gray-500">Unknown question type</div>;
    }
  };

  const content = (
    <div className={embedded ? 'max-h-96 overflow-y-auto' : ''}>
      <div className="card">
        {!embedded && (
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <button onClick={onClose} className="btn btn-secondary">
                <ArrowLeft size={18} />
                Back to Builder
              </button>
              <div>
                <h1 className="text-xl font-bold">Assessment Preview</h1>
                <p className="text-gray-600">{job?.title}</p>
              </div>
            </div>
          </div>
        )}

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h2 className="font-semibold text-blue-900">{assessment.title || 'Untitled Assessment'}</h2>
          <p className="text-sm text-blue-700 mt-1">
            Complete all sections below. Required questions are marked with an asterisk (*).
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {assessment.sections?.map((section) => (
            <div key={section.id} className="border-b border-gray-200 pb-8 last:border-b-0">
              <h3 className="text-lg font-semibold mb-4">{section.title}</h3>
              
              <div className="space-y-6">
                {section.questions?.map((question) => (
                  <div key={question.id} className="space-y-2">
                    <label className="block font-medium">
                      {question.question}
                      {question.required && <span className="text-red-500 ml-1">*</span>}
                    </label>
                    
                    {renderQuestion(question)}
                    
                    {errors[question.id] && (
                      <div className="error">{errors[question.id]}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}

          {assessment.sections?.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No sections added yet. Add a section in the builder to see the preview.
            </div>
          )}

          {!embedded && assessment.sections?.length > 0 && (
            <div className="flex justify-end gap-4 pt-6 border-t">
              <button type="button" onClick={onClose} className="btn btn-secondary">
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                Submit Assessment
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );

  if (embedded) {
    return (
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          <span className="text-sm font-medium">Live Preview</span>
        </div>
        {content}
      </div>
    );
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal" 
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '800px' }}
      >
        {content}
      </div>
    </div>
  );
};

export default AssessmentPreview;