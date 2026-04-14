import { useState, useCallback, useRef } from 'react';
import { RagEvent, ProcessStep, RetrievalMetrics } from '../types';

const API_BASE = 'http://localhost:3000';

export const useRagStream = () => {
  const [processSteps, setProcessSteps] = useState<ProcessStep[]>([
    { id: 'step1', title: 'Query Received', icon: '📝', status: 'pending' },
    { id: 'step2', title: 'Cache Check', icon: '💾', status: 'pending' },
    { id: 'step3', title: 'Embedding Query', icon: '🧮', status: 'pending' },
    { id: 'step4', title: 'Retrieving Chunks', icon: '🔍', status: 'pending' },
    { id: 'step5', title: 'Filtering & Re-ranking', icon: '⚡', status: 'pending' },
    { id: 'step6', title: 'Context Ready', icon: '📊', status: 'pending' },
    { id: 'step7', title: 'Generating Answer', icon: '🤖', status: 'pending' },
  ]);

  const [isProcessing, setIsProcessing] = useState(false);
  const [metrics, setMetrics] = useState<RetrievalMetrics | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  const updateStep = useCallback((stepId: string, status: ProcessStep['status'], data?: any) => {
    setProcessSteps((prev) =>
      prev.map((step) =>
        step.id === stepId ? { ...step, status, data } : step
      )
    );
  }, []);

  const resetSteps = useCallback(() => {
    setProcessSteps((prev) =>
      prev.map((step) => ({ ...step, status: 'pending', data: undefined }))
    );
  }, []);

  const askQuestion = useCallback(
    (question: string, repoId: string | null, onMessage: (message: string, metrics?: RetrievalMetrics) => void, onComplete: () => void) => {
      // Reset state
      resetSteps();
      setIsProcessing(true);
      setMetrics(null);

      // Close existing connection
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }

      // Create SSE connection (using /ask endpoint with repo context)
      const params = new URLSearchParams({ q: question });
      if (repoId) {
        params.append('repoId', repoId);
      }
      const url = `${API_BASE}/rag/ask/stream/optimized?${params.toString()}`;
      const eventSource = new EventSource(url);
      eventSourceRef.current = eventSource;

      eventSource.onmessage = (event) => {
        try {
          const data: RagEvent = JSON.parse(event.data);

          switch (data.type) {
            case 'query_received':
              updateStep('step1', 'active');
              setTimeout(() => updateStep('step1', 'complete', data.data), 300);
              break;

            case 'cache_hit':
              updateStep('step2', 'active');
              updateStep('step2', 'complete', {
                cacheHit: true,
                message: 'Answer retrieved from cache',
              });
              // Skip embedding and retrieval steps
              updateStep('step3', 'complete', { skipped: true });
              updateStep('step4', 'complete', { skipped: true });
              updateStep('step5', 'complete', { skipped: true });
              updateStep('step6', 'complete', { skipped: true });
              break;

            case 'embedding_query':
              updateStep('step2', 'complete', { cacheHit: false });
              updateStep('step3', 'active');
              break;

            case 'embedding_complete':
              updateStep('step3', 'complete', {
                dimensions: data.data.dimensions,
                sample: data.data.vector,
              });
              break;

            case 'chunks_retrieved':
              updateStep('step4', 'active');
              setTimeout(() => {
                updateStep('step4', 'complete', {
                  count: data.data.count,
                  chunks: data.data.chunks,
                });
              }, 300);
              break;

            case 'filtering':
              updateStep('step5', 'active', {
                stage: 'filtering',
                totalRetrieved: data.data.totalRetrieved,
              });
              break;

            case 'reranking':
              updateStep('step5', 'active', {
                stage: 'reranking',
                afterFiltering: data.data.afterFiltering,
              });
              break;

            case 'context_ready':
              updateStep('step5', 'complete', {
                totalRetrieved: data.data.totalRetrieved,
                afterFiltering: data.data.afterFiltering,
                finalChunks: data.data.finalChunks,
                avgDistance: data.data.avgDistance,
              });
              updateStep('step6', 'complete', {
                contextTokens: data.data.contextTokens,
                contextChars: data.data.contextChars,
              });
              break;

            case 'generating_answer':
              updateStep('step7', 'active', {
                model: data.data.model,
                promptLength: data.data.promptLength,
              });
              break;

            case 'answer_complete':
              const resultMetrics: RetrievalMetrics = data.data.metrics;
              setMetrics(resultMetrics);

              updateStep('step7', 'complete', {
                answer: data.data.answer,
                elapsedTime: data.data.elapsedTime,
                metrics: resultMetrics,
              });
              onMessage(data.data.answer, resultMetrics);
              break;

            case 'complete':
              setIsProcessing(false);
              eventSource.close();
              onComplete();
              break;

            case 'error':
              onMessage(`Error: ${data.data}`);
              setIsProcessing(false);
              eventSource.close();
              break;
          }
        } catch (error) {
          console.error('Error parsing SSE event:', error);
        }
      };

      eventSource.onerror = (error) => {
        console.error('SSE Error:', error);
        onMessage('Connection error. Please check if the server is running.');
        setIsProcessing(false);
        eventSource.close();
      };
    },
    [updateStep, resetSteps]
  );

  const cleanup = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }
  }, []);

  return {
    processSteps,
    isProcessing,
    metrics,
    askQuestion,
    cleanup,
  };
};
