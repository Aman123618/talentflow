import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { Link } from 'react-router-dom';
import { User, Mail } from 'lucide-react';

const KanbanBoard = () => {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const stages = [
    { key: 'applied', label: 'Applied', color: 'border-blue-500' },
    { key: 'screen', label: 'Screening', color: 'border-yellow-500' },
    { key: 'tech', label: 'Technical', color: 'border-purple-500' },
    { key: 'offer', label: 'Offer', color: 'border-orange-500' },
    { key: 'hired', label: 'Hired', color: 'border-green-500' },
    { key: 'rejected', label: 'Rejected', color: 'border-red-500' }
  ];

  useEffect(() => {
    loadCandidates();
  }, []);

  const loadCandidates = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/candidates?pageSize=1000');
      if (!response.ok) throw new Error('Failed to load candidates');
      
      const data = await response.json();
      setCandidates(data.candidates);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getCandidatesByStage = (stage) => {
    return candidates.filter(candidate => candidate.stage === stage);
  };

  const handleDragEnd = async (result) => {
    const { source, destination, draggableId } = result;

    if (!destination) return;
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    const candidateId = parseInt(draggableId);
    const newStage = destination.droppableId;

    // Optimistic update
    setCandidates(prevCandidates =>
      prevCandidates.map(candidate =>
        candidate.id === candidateId
          ? { ...candidate, stage: newStage }
          : candidate
      )
    );

    try {
      const response = await fetch(`/api/candidates/${candidateId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          stage: newStage,
          notes: `Moved to ${newStage} stage via Kanban board`
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update candidate stage');
      }
    } catch (err) {
      setError(err.message);
      // Revert optimistic update on error
      loadCandidates();
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="loading"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Kanban Board</h1>
        <div className="text-sm text-gray-500">
          {candidates.length} total candidates
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 h-[calc(100vh-200px)]">
          {stages.map((stage) => {
            const stageCandidates = getCandidatesByStage(stage.key);
            
            return (
              <div key={stage.key} className="flex flex-col">
                <div className={`bg-white rounded-lg border-t-4 ${stage.color} shadow-sm mb-4`}>
                  <div className="p-4 border-b">
                    <h3 className="font-semibold text-gray-900">{stage.label}</h3>
                    <p className="text-sm text-gray-500">
                      {stageCandidates.length} candidate{stageCandidates.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>

                <Droppable droppableId={stage.key}>
                  {(provided, snapshot) => (
                    <div
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                      className={`flex-1 space-y-2 p-2 rounded-lg transition-colors ${
                        snapshot.isDraggingOver
                          ? 'bg-blue-50 border-2 border-dashed border-blue-300'
                          : 'bg-gray-50 border-2 border-dashed border-transparent'
                      }`}
                      style={{ minHeight: '200px' }}
                    >
                      {stageCandidates.map((candidate, index) => (
                        <Draggable
                          key={candidate.id}
                          draggableId={candidate.id.toString()}
                          index={index}
                        >
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={`bg-white rounded-lg p-3 shadow-sm border cursor-grab active:cursor-grabbing transition-shadow ${
                                snapshot.isDragging
                                  ? 'shadow-lg rotate-2'
                                  : 'hover:shadow-md'
                              }`}
                            >
                              <Link
                                to={`/candidates/${candidate.id}`}
                                className="block"
                                onClick={(e) => {
                                  if (snapshot.isDragging) {
                                    e.preventDefault();
                                  }
                                }}
                              >
                                <div className="flex items-start gap-3">
                                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                                    <User size={16} className="text-blue-600" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <h4 className="font-medium text-sm text-gray-900 truncate">
                                      {candidate.name}
                                    </h4>
                                    <div className="flex items-center gap-1 mt-1 text-xs text-gray-500">
                                      <Mail size={12} />
                                      <span className="truncate">{candidate.email}</span>
                                    </div>
                                    <p className="text-xs text-gray-400 mt-2">
                                      Applied: {new Date(candidate.createdAt).toLocaleDateString()}
                                    </p>
                                  </div>
                                </div>
                              </Link>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                      
                      {stageCandidates.length === 0 && (
                        <div className="text-center py-8 text-gray-400 text-sm">
                          No candidates in this stage
                        </div>
                      )}
                    </div>
                  )}
                </Droppable>
              </div>
            );
          })}
        </div>
      </DragDropContext>
    </div>
  );
};

export default KanbanBoard;