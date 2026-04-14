import React, { useState, useEffect, useCallback } from 'react';
import RepoList from './RepoList';
import IndexingStatus from './IndexingStatus';
import RepoChatWindow from './RepoChatWindow';
import FloatingChat from './FloatingChat';
import { Repository } from '../types/repo';
import { repoIndexingApi } from '../services/api';

const Dashboard: React.FC = () => {
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [selectedRepo, setSelectedRepo] = useState<Repository | null>(null);
  const [isStartingIndexing, setIsStartingIndexing] = useState(false);
  const [isLoadingFromBackend, setIsLoadingFromBackend] = useState(false);

  // Load indexed repos from backend
  const handleLoadFromBackend = useCallback(async () => {
    setIsLoadingFromBackend(true);
    try {
      const indexedRepos = await repoIndexingApi.listIndexedRepos();

      // Convert IndexedRepo to Repository format
      const repos: Repository[] = indexedRepos.map((indexed) => ({
        repoId: indexed.repoId,
        repoPath: '', // We don't have the path from metadata
        displayName: indexed.repoId, // Use repoId as display name by default
        status: {
          repoId: indexed.repoId,
          status: 'idle',
          totalChunks: indexed.totalChunks,
          lastIndexedCommit: indexed.lastIndexedCommit,
          lastIndexedAt: indexed.lastIndexedAt,
        },
      }));

      setRepositories(repos);
      if (repos.length > 0) {
        setSelectedRepo(repos[0]);
      }
    } catch (error) {
      console.error('Failed to load indexed repos from backend:', error);
      alert('Failed to load indexed repos from backend. Make sure the backend is running.');
    } finally {
      setIsLoadingFromBackend(false);
    }
  }, []);

  // Load repositories from localStorage or backend
  useEffect(() => {
    const saved = localStorage.getItem('repositories');
    if (saved) {
      const parsed = JSON.parse(saved);
      setRepositories(parsed);
      if (parsed.length > 0) {
        setSelectedRepo(parsed[0]);
      }
    } else {
      // If no repos in localStorage, try loading from backend
      handleLoadFromBackend();
    }
  }, [handleLoadFromBackend]);

  // Save repositories to localStorage
  useEffect(() => {
    if (repositories.length > 0) {
      localStorage.setItem('repositories', JSON.stringify(repositories));
    }
  }, [repositories]);

  // Poll for status updates
  const updateStatuses = useCallback(async () => {
    const updatedRepos = await Promise.all(
      repositories.map(async (repo) => {
        try {
          const status = await repoIndexingApi.getStatus(repo.repoId);
          return { ...repo, status };
        } catch (error) {
          console.error(`Failed to get status for ${repo.repoId}:`, error);
          return repo;
        }
      })
    );
    setRepositories(updatedRepos);

    // Update selected repo if it exists
    if (selectedRepo) {
      const updated = updatedRepos.find((r) => r.repoId === selectedRepo.repoId);
      if (updated) {
        setSelectedRepo(updated);
      }
    }
  }, [repositories, selectedRepo]);

  // Poll every 2 seconds for status updates
  useEffect(() => {
    if (repositories.length === 0) return;

    const interval = setInterval(updateStatuses, 2000);
    return () => clearInterval(interval);
  }, [updateStatuses, repositories.length]);

  const handleAddRepo = async (newRepo: {
    repoId: string;
    repoPath: string;
    displayName: string;
  }) => {
    const repository: Repository = {
      ...newRepo,
      status: undefined,
    };

    setRepositories((prev) => [...prev, repository]);
    setSelectedRepo(repository);

    // Fetch initial status
    try {
      const status = await repoIndexingApi.getStatus(newRepo.repoId);
      setRepositories((prev) =>
        prev.map((r) => (r.repoId === newRepo.repoId ? { ...r, status } : r))
      );
    } catch (error) {
      console.error('Failed to fetch initial status:', error);
    }
  };

  const handleDeleteRepo = async (repoId: string) => {
    try {
      await repoIndexingApi.deleteIndex(repoId);
    } catch (error) {
      console.error('Failed to delete index:', error);
    }

    setRepositories((prev) => prev.filter((r) => r.repoId !== repoId));
    if (selectedRepo?.repoId === repoId) {
      setSelectedRepo(repositories[0] || null);
    }
  };

  const handleSelectRepo = (repo: Repository) => {
    setSelectedRepo(repo);
  };

  const handleStartIndexing = async () => {
    if (!selectedRepo) return;

    setIsStartingIndexing(true);
    try {
      await repoIndexingApi.syncRepo({
        repoId: selectedRepo.repoId,
        repoPath: selectedRepo.repoPath,
      });

      // Immediately update status
      const status = await repoIndexingApi.getStatus(selectedRepo.repoId);
      setRepositories((prev) =>
        prev.map((r) =>
          r.repoId === selectedRepo.repoId ? { ...r, status } : r
        )
      );
      setSelectedRepo((prev) => (prev ? { ...prev, status } : null));
    } catch (error: any) {
      alert(`Failed to start indexing: ${error.message}`);
    } finally {
      setIsStartingIndexing(false);
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Repository List Sidebar */}
      <RepoList
        repositories={repositories}
        selectedRepo={selectedRepo}
        onSelectRepo={handleSelectRepo}
        onAddRepo={handleAddRepo}
        onDeleteRepo={handleDeleteRepo}
        onLoadFromBackend={handleLoadFromBackend}
        isLoadingFromBackend={isLoadingFromBackend}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Section: Status */}
        <div className="bg-gray-50 p-6 border-b border-gray-200">
          <IndexingStatus
            status={selectedRepo?.status || null}
            onStartIndexing={handleStartIndexing}
            isIndexing={isStartingIndexing}
          />
        </div>

        {/* Bottom Section: Chat */}
        <div className="flex-1 overflow-hidden">
          <RepoChatWindow repository={selectedRepo} />
        </div>
      </div>

      {/* Floating Chat */}
      <FloatingChat repository={selectedRepo} />
    </div>
  );
};

export default Dashboard;
