import { IndexStatus, SyncRepoDto, IndexedRepo } from '../types/repo';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

export const repoIndexingApi = {
  async syncRepo(dto: SyncRepoDto): Promise<{ message: string; repoId: string }> {
    const response = await fetch(`${API_BASE_URL}/repo-indexing/sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(dto),
    });

    if (!response.ok) {
      throw new Error(`Failed to sync repo: ${response.statusText}`);
    }

    return response.json();
  },

  async getStatus(repoId: string): Promise<IndexStatus> {
    const response = await fetch(`${API_BASE_URL}/repo-indexing/${repoId}/status`);

    if (!response.ok) {
      throw new Error(`Failed to get status: ${response.statusText}`);
    }

    return response.json();
  },

  async listIndexedRepos(): Promise<IndexedRepo[]> {
    const response = await fetch(`${API_BASE_URL}/repo-indexing/list`);

    if (!response.ok) {
      throw new Error(`Failed to list indexed repos: ${response.statusText}`);
    }

    return response.json();
  },

  async deleteIndex(repoId: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/repo-indexing/${repoId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error(`Failed to delete index: ${response.statusText}`);
    }
  },

  async search(repoId: string, query: string, topK: number = 5) {
    const response = await fetch(`${API_BASE_URL}/repo-indexing/${repoId}/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query, topK }),
    });

    if (!response.ok) {
      throw new Error(`Failed to search: ${response.statusText}`);
    }

    return response.json();
  },

  async generateInsights(repoId: string, query: string) {
    const response = await fetch(`${API_BASE_URL}/repo-indexing/${repoId}/insights`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query }),
    });

    if (!response.ok) {
      throw new Error(`Failed to generate insights: ${response.statusText}`);
    }

    return response.json();
  },
};

export const ragApi = {
  /**
   * Creates an EventSource connection to the /ask endpoint for streaming RAG responses
   * @param question The question to ask
   * @param repoId Optional repository ID for repo-specific context
   * @returns EventSource for receiving SSE events
   */
  createAskStream(question: string, repoId?: string | null): EventSource {
    const params = new URLSearchParams({ q: question });
    if (repoId) {
      params.append('repoId', repoId);
    }
    const url = `${API_BASE_URL}/rag/ask/stream/optimized?${params.toString()}`;
    return new EventSource(url);
  },
};
