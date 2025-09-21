import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { FixedSizeList as List } from 'react-window';
import InfiniteLoader from 'react-window-infinite-loader';
import { Search, Filter, User } from 'lucide-react';
import { useDebounce } from '@react-hook/debounce';

const ITEM_HEIGHT = 80;
const ITEMS_PER_PAGE = 50;

const CandidateItem = ({ index, style, data }) => {
  const { candidates, isItemLoaded } = data;
  const candidate = candidates[index];

  if (!isItemLoaded(index)) {
    return (
      <div style={style} className="flex items-center justify-center">
        <div className="loading"></div>
      </div>
    );
  }

  if (!candidate) {
    return <div style={style}></div>;
  }

  return (
    <div style={style} className="px-4 py-2">
      <div className="bg-white rounded-lg p-4 shadow-sm border hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <User size={20} className="text-blue-600" />
            </div>
            <div>
              <Link
                to={`/candidates/${candidate.id}`}
                className="font-medium text-blue-600 hover:text-blue-800"
              >
                {candidate.name}
              </Link>
              <p className="text-sm text-gray-500">{candidate.email}</p>
            </div>
          </div>
          <div className="text-right">
            <span className={`status-badge stage-${candidate.stage}`}>
              {candidate.stage}
            </span>
            <p className="text-xs text-gray-500 mt-1">
              Applied: {new Date(candidate.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

const CandidatesList = () => {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [hasNextPage, setHasNextPage] = useState(true);
  const [isNextPageLoading, setIsNextPageLoading] = useState(false);
  const [filters, setFilters] = useState({
    search: '',
    stage: ''
  });
  const debouncedSearch = useDebounce(filters.search, 300);

  const loadMoreItems = useCallback(async (startIndex, stopIndex) => {
    if (isNextPageLoading) return;

    setIsNextPageLoading(true);
    try {
      const page = Math.floor(startIndex / ITEMS_PER_PAGE) + 1;
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: ITEMS_PER_PAGE.toString(),
        ...(debouncedSearch && { search: debouncedSearch }),
        ...(filters.stage && { stage: filters.stage })
      });

      const response = await fetch(`/api/candidates?${params}`);
      if (!response.ok) throw new Error('Failed to load candidates');

      const data = await response.json();
      
      if (page === 1) {
        setCandidates(data.candidates);
      } else {
        setCandidates(prev => [...prev, ...data.candidates]);
      }

      setHasNextPage(data.page < data.totalPages);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsNextPageLoading(false);
      setLoading(false);
    }
  }, [debouncedSearch, filters.stage, isNextPageLoading]);

  // Reset and load when filters change
  useEffect(() => {
    setCandidates([]);
    setHasNextPage(true);
    loadMoreItems(0, ITEMS_PER_PAGE - 1);
  }, [debouncedSearch, filters.stage]);

  const isItemLoaded = useCallback((index) => {
    return !!candidates[index];
  }, [candidates]);

  const itemCount = hasNextPage ? candidates.length + 1 : candidates.length;

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  if (loading && candidates.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="loading"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Candidates</h1>
        <div className="text-sm text-gray-500">
          {candidates.length} candidates loaded
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="card mb-6">
        <div className="flex gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Search by name or email..."
                className="form-control pl-10"
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
              />
            </div>
          </div>
          <select
            className="form-control w-48"
            value={filters.stage}
            onChange={(e) => handleFilterChange('stage', e.target.value)}
          >
            <option value="">All Stages</option>
            <option value="applied">Applied</option>
            <option value="screen">Screening</option>
            <option value="tech">Technical</option>
            <option value="offer">Offer</option>
            <option value="hired">Hired</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      <div className="card">
        {candidates.length === 0 && !loading ? (
          <div className="text-center py-8 text-gray-500">
            No candidates found. Try adjusting your search criteria.
          </div>
        ) : (
          <div style={{ height: '600px' }}>
            <InfiniteLoader
              isItemLoaded={isItemLoaded}
              itemCount={itemCount}
              loadMoreItems={loadMoreItems}
            >
              {({ onItemsRendered, ref }) => (
                <List
                  ref={ref}
                  height={600}
                  itemCount={itemCount}
                  itemSize={ITEM_HEIGHT}
                  onItemsRendered={onItemsRendered}
                  itemData={{
                    candidates,
                    isItemLoaded
                  }}
                >
                  {CandidateItem}
                </List>
              )}
            </InfiniteLoader>
          </div>
        )}
      </div>
    </div>
  );
};

export default CandidatesList;