import React from 'react';
import { IndexStatus as IndexStatusType } from '../types/repo';

interface IndexingStatusProps {
  status: IndexStatusType | null;
  onStartIndexing: () => void;
  isIndexing: boolean;
}

const IndexingStatus: React.FC<IndexingStatusProps> = ({
  status,
  onStartIndexing,
  isIndexing,
}) => {
  if (!status) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Repository Status</h3>
        <p className="text-gray-500">No repository selected</p>
      </div>
    );
  }

  const getStatusInfo = () => {
    switch (status.status) {
      case 'idle':
        return {
          color: 'text-green-600',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          icon: '✓',
          title: 'Ready',
          description: 'Repository is indexed and ready for queries',
        };
      case 'indexing':
        return {
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200',
          icon: '⟳',
          title: 'Indexing',
          description: status.progressMessage || 'Processing repository...',
        };
      case 'error':
        return {
          color: 'text-red-600',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          icon: '⚠',
          title: 'Error',
          description: status.error || 'An error occurred during indexing',
        };
      default:
        return {
          color: 'text-gray-600',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200',
          icon: '○',
          title: 'Unknown',
          description: 'Status unknown',
        };
    }
  };

  const statusInfo = getStatusInfo();

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800">Repository Status</h3>
        {status.status !== 'indexing' && (
          <button
            onClick={onStartIndexing}
            disabled={isIndexing}
            className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {isIndexing ? 'Starting...' : 'Start Indexing'}
          </button>
        )}
      </div>

      <div className={`rounded-lg border ${statusInfo.borderColor} ${statusInfo.bgColor} p-4`}>
        <div className="flex items-start gap-3">
          <span className={`text-2xl ${status.status === 'indexing' ? 'animate-spin' : ''}`}>
            {statusInfo.icon}
          </span>
          <div className="flex-1">
            <h4 className={`font-medium ${statusInfo.color}`}>{statusInfo.title}</h4>
            <p className="text-sm text-gray-600 mt-1">{statusInfo.description}</p>
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4">
        <div className="bg-gray-50 rounded-lg p-3">
          <p className="text-xs text-gray-500 mb-1">Total Chunks</p>
          <p className="text-lg font-semibold text-gray-800">
            {status.totalChunks?.toLocaleString() || '0'}
          </p>
        </div>
        <div className="bg-gray-50 rounded-lg p-3">
          <p className="text-xs text-gray-500 mb-1">Status</p>
          <p className={`text-lg font-semibold capitalize ${statusInfo.color}`}>
            {status.status}
          </p>
        </div>
      </div>

      {status.lastIndexedCommit && (
        <div className="mt-4 bg-gray-50 rounded-lg p-3">
          <p className="text-xs text-gray-500 mb-1">Last Commit</p>
          <p className="text-sm font-mono text-gray-700 truncate">
            {status.lastIndexedCommit}
          </p>
        </div>
      )}

      {status.lastIndexedAt && (
        <div className="mt-2 bg-gray-50 rounded-lg p-3">
          <p className="text-xs text-gray-500 mb-1">Last Indexed</p>
          <p className="text-sm text-gray-700">
            {new Date(status.lastIndexedAt).toLocaleString()}
          </p>
        </div>
      )}
    </div>
  );
};

export default IndexingStatus;
