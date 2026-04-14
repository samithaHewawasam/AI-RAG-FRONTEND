import React, { useState } from 'react';
import { Repository } from '../types/repo';

interface RepoListProps {
  repositories: Repository[];
  selectedRepo: Repository | null;
  onSelectRepo: (repo: Repository) => void;
  onAddRepo: (repo: { repoId: string; repoPath: string; displayName: string }) => void;
  onDeleteRepo: (repoId: string) => void;
  onLoadFromBackend?: () => void;
  isLoadingFromBackend?: boolean;
}

const RepoList: React.FC<RepoListProps> = ({
  repositories,
  selectedRepo,
  onSelectRepo,
  onAddRepo,
  onDeleteRepo,
  onLoadFromBackend,
  isLoadingFromBackend = false,
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    repoId: '',
    repoPath: '',
    displayName: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.repoId && formData.repoPath && formData.displayName) {
      onAddRepo(formData);
      setFormData({ repoId: '', repoPath: '', displayName: '' });
      setShowAddForm(false);
    }
  };

  const getStatusColor = (status?: 'idle' | 'indexing' | 'error') => {
    switch (status) {
      case 'idle':
        return 'bg-green-500';
      case 'indexing':
        return 'bg-yellow-500 animate-pulse';
      case 'error':
        return 'bg-red-500';
      default:
        return 'bg-gray-400';
    }
  };

  return (
    <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-xl font-bold text-gray-800">Repositories</h2>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="mt-3 w-full py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          + Add Repository
        </button>
        {onLoadFromBackend && (
          <button
            onClick={onLoadFromBackend}
            disabled={isLoadingFromBackend}
            className="mt-2 w-full py-2 px-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isLoadingFromBackend ? 'Loading...' : '↻ Load from Backend'}
          </button>
        )}
      </div>

      {showAddForm && (
        <div className="p-4 bg-gray-50 border-b border-gray-200">
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Display Name
              </label>
              <input
                type="text"
                value={formData.displayName}
                onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="My Project"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Repo ID
              </label>
              <input
                type="text"
                value={formData.repoId}
                onChange={(e) => setFormData({ ...formData, repoId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="my-project"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Repo Path
              </label>
              <input
                type="text"
                value={formData.repoPath}
                onChange={(e) => setFormData({ ...formData, repoPath: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="/path/to/repo"
                required
              />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                className="flex-1 py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Add
              </button>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="flex-1 py-2 px-4 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="flex-1 overflow-y-auto">
        {repositories.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            No repositories added yet
          </div>
        ) : (
          repositories.map((repo) => (
            <div
              key={repo.repoId}
              onClick={() => onSelectRepo(repo)}
              className={`p-4 border-b border-gray-200 cursor-pointer transition-colors ${
                selectedRepo?.repoId === repo.repoId
                  ? 'bg-blue-50 border-l-4 border-l-blue-600'
                  : 'hover:bg-gray-50'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${getStatusColor(repo.status?.status)}`} />
                    <h3 className="font-medium text-gray-800 truncate">
                      {repo.displayName}
                    </h3>
                  </div>
                  <p className="text-xs text-gray-500 mt-1 truncate">
                    {repo.repoId}
                  </p>
                  {repo.status?.totalChunks !== undefined && (
                    <p className="text-xs text-gray-600 mt-1">
                      {repo.status.totalChunks} chunks indexed
                    </p>
                  )}
                  {repo.status?.status === 'indexing' && repo.status.progressMessage && (
                    <p className="text-xs text-blue-600 mt-1 truncate">
                      {repo.status.progressMessage}
                    </p>
                  )}
                  {repo.status?.error && (
                    <p className="text-xs text-red-600 mt-1 truncate">
                      Error: {repo.status.error}
                    </p>
                  )}
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (window.confirm(`Delete ${repo.displayName}?`)) {
                      onDeleteRepo(repo.repoId);
                    }
                  }}
                  className="ml-2 text-gray-400 hover:text-red-600 transition-colors"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default RepoList;
