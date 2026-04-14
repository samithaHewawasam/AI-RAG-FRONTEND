export interface Repository {
  repoId: string;
  repoPath: string;
  displayName: string;
  status?: IndexStatus;
}

export interface IndexStatus {
  repoId: string;
  status: 'idle' | 'indexing' | 'error';
  lastIndexedCommit?: string;
  totalChunks?: number;
  lastIndexedAt?: Date;
  error?: string;
  progressMessage?: string;
}

export interface SyncRepoDto {
  repoPath: string;
  repoId: string;
}

export interface IndexedRepo {
  repoId: string;
  collectionName: string;
  totalChunks: number;
  lastIndexedCommit?: string;
  lastIndexedAt?: Date;
}
