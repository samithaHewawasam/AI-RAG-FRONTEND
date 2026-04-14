import React, { useState } from 'react';
import { ProcessStep, Chunk } from '../types';
import './ProcessViewer.css';

interface ProcessViewerProps {
  steps: ProcessStep[];
}

const ProcessViewer: React.FC<ProcessViewerProps> = ({ steps }) => {
  const [expandedStep, setExpandedStep] = useState<string | null>(null);

  const toggleStep = (stepId: string) => {
    setExpandedStep(expandedStep === stepId ? null : stepId);
  };

  const renderStepData = (step: ProcessStep) => {
    if (!step.data) return null;

    switch (step.id) {
      case 'step2': // Cache Check
        if (step.status === 'complete') {
          return (
            <div className="step-details">
              <div className="detail-item">
                <span className="label">Cache Status:</span>
                <span className={`value badge ${step.data.cacheHit ? 'badge-success' : ''}`}>
                  {step.data.cacheHit ? '✓ HIT' : '✗ MISS'}
                </span>
              </div>
              {step.data.message && (
                <div className="detail-item">
                  <span className="value">{step.data.message}</span>
                </div>
              )}
            </div>
          );
        }
        break;

      case 'step3': // Embedding Query
        if (step.status === 'complete' && !step.data.skipped) {
          return (
            <div className="step-details">
              <div className="detail-item">
                <span className="label">Dimensions:</span>
                <span className="value">{step.data.dimensions}D</span>
              </div>
              <div className="detail-item">
                <span className="label">Sample Vector:</span>
                <div className="vector-sample">
                  [{step.data.sample?.slice(0, 5).map((v: number) => v.toFixed(3)).join(', ')}...]
                </div>
              </div>
            </div>
          );
        }
        break;

      case 'step4': // Retrieving Chunks
        if (step.status === 'complete' && !step.data.skipped && step.data.chunks) {
          return (
            <div className="step-details">
              <div className="detail-item">
                <span className="label">Chunks Found:</span>
                <span className="value badge">{step.data.count}</span>
              </div>
              <div className="chunks-preview">
                {step.data.chunks.slice(0, 3).map((chunk: Chunk, i: number) => (
                  <div key={i} className="chunk-preview">
                    <div className="chunk-header">
                      Chunk {i + 1}
                      {chunk.distance !== undefined && (
                        <span className="chunk-distance"> • distance: {chunk.distance.toFixed(3)}</span>
                      )}
                    </div>
                    <div className="chunk-text">{chunk.preview}...</div>
                  </div>
                ))}
              </div>
            </div>
          );
        }
        break;

      case 'step5': // Filtering & Re-ranking
        if (step.status === 'complete') {
          return (
            <div className="step-details">
              <div className="detail-item">
                <span className="label">Retrieved:</span>
                <span className="value badge">{step.data.totalRetrieved}</span>
              </div>
              <div className="detail-item">
                <span className="label">After Filtering:</span>
                <span className="value badge">{step.data.afterFiltering}</span>
              </div>
              <div className="detail-item">
                <span className="label">Final Chunks:</span>
                <span className="value badge-success">{step.data.finalChunks}</span>
              </div>
              {step.data.avgDistance !== undefined && (
                <div className="detail-item">
                  <span className="label">Avg Similarity:</span>
                  <span className="value">{step.data.avgDistance.toFixed(3)}</span>
                </div>
              )}
            </div>
          );
        } else if (step.status === 'active') {
          return (
            <div className="step-details">
              <div className="detail-item">
                <span className="value">
                  {step.data.stage === 'filtering' ? 'Filtering chunks...' : 'Re-ranking chunks...'}
                </span>
              </div>
            </div>
          );
        }
        break;

      case 'step6': // Context Ready
        if (step.status === 'complete' && !step.data.skipped) {
          return (
            <div className="step-details">
              <div className="detail-item">
                <span className="label">Context Size:</span>
                <span className="value">{step.data.contextChars} chars</span>
              </div>
              <div className="detail-item">
                <span className="label">Estimated Tokens:</span>
                <span className="value badge">{step.data.contextTokens}</span>
              </div>
            </div>
          );
        }
        break;

      case 'step7': // Generating Answer
        if (step.data.model || step.data.metrics) {
          return (
            <div className="step-details">
              {step.data.model && (
                <div className="detail-item">
                  <span className="label">Model:</span>
                  <span className="value badge">{step.data.model}</span>
                </div>
              )}
              {step.data.promptLength && (
                <div className="detail-item">
                  <span className="label">Prompt Size:</span>
                  <span className="value">{step.data.promptLength} chars</span>
                </div>
              )}
              {step.data.elapsedTime && (
                <div className="detail-item">
                  <span className="label">Time:</span>
                  <span className="value badge-success">{step.data.elapsedTime}s</span>
                </div>
              )}
            </div>
          );
        }
        break;

      default:
        return null;
    }
  };

  return (
    <div className="process-viewer">
      <div className="process-header">
        <span className="process-icon">⚙️</span>
        <span className="process-title">Processing Pipeline</span>
      </div>

      <div className="process-steps">
        {steps.map((step, index) => (
          <div
            key={step.id}
            className={`process-step ${step.status}`}
            onClick={() => step.data && toggleStep(step.id)}
          >
            <div className="step-main">
              <div className="step-indicator">
                <span className="step-icon">{step.icon}</span>
                {step.status === 'complete' && (
                  <span className="check-mark">✓</span>
                )}
                {step.status === 'active' && (
                  <span className="step-spinner"></span>
                )}
              </div>

              <div className="step-info">
                <div className="step-title">{step.title}</div>
                <div className="step-status-text">
                  {step.status === 'pending' && 'Waiting...'}
                  {step.status === 'active' && 'Processing...'}
                  {step.status === 'complete' && 'Complete'}
                </div>
              </div>

              {step.data && (
                <button className="expand-button">
                  {expandedStep === step.id ? '▼' : '▶'}
                </button>
              )}
            </div>

            {expandedStep === step.id && (
              <div className="step-expanded">
                {renderStepData(step)}
              </div>
            )}

            {index < steps.length - 1 && (
              <div className={`step-connector ${step.status === 'complete' ? 'complete' : ''}`}></div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProcessViewer;
