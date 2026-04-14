# RAG Chat - React Application

A modern, production-ready React chat interface for the Ollama RAG system with **optimized query service** integration.

## Features

### ✨ Core Features
- **Real-time Chat Interface** - Clean, responsive chat UI with message bubbles
- **Server-Sent Events (SSE)** - Live streaming of RAG pipeline progress
- **Process Visualization** - Expandable 7-step pipeline viewer
- **Metrics Display** - Inline performance metrics for each response
- **Full-Screen Mode** - Immersive chat experience

### 🚀 Optimized Query Integration

The chat app now uses the **optimized query service** (`/rag/ask/stream/optimized`) which provides:

1. **Similarity Filtering** - Rejects low-quality chunks (distance > 1.5)
2. **Context Management** - Safe token/character limits
3. **Re-ranking** - Multi-signal chunk scoring
4. **Query Caching** - 64x faster for repeated queries
5. **Enhanced Metrics** - Full pipeline observability

## Installation

```bash
cd rag-chat
npm install
npm start
```

The app will open at `http://localhost:3001`

## Architecture

### Pipeline Steps

The optimized pipeline shows 7 steps:

1. **📝 Query Received** - Question captured
2. **💾 Cache Check** - Check for cached response
3. **🧮 Embedding Query** - Convert query to 768D vector
4. **🔍 Retrieving Chunks** - Fetch top-k similar chunks
5. **⚡ Filtering & Re-ranking** - Filter + multi-signal scoring
6. **📊 Context Ready** - Final context assembled
7. **🤖 Generating Answer** - LLM generates response

### Event Types

The SSE endpoint (`/rag/ask/stream/optimized`) emits:

- `query_received` - Query captured
- `cache_hit` - Response from cache (skips steps 3-6)
- `embedding_query` - Started embedding
- `embedding_complete` - Embedding done
- `chunks_retrieved` - Retrieved from ChromaDB
- `filtering` - Filtering chunks by similarity
- `reranking` - Re-ranking with multi-signal scoring
- `context_ready` - Context assembled
- `generating_answer` - LLM generating response
- `answer_complete` - Response ready with metrics
- `complete` - Pipeline finished
- `error` - Error occurred

## Metrics Display

Each bot response shows inline metrics:

**Cached Response:**
```
💾 Cached
```

**Fresh Response:**
```
📊 5 chunks  🎯 0.45 avg distance  📝 2150 tokens
```

## Usage

1. **Start Backend:**
```bash
cd /path/to/ollama-rag
npm run start
```

2. **Start Frontend:**
```bash
cd rag-chat
npm start
```

3. **Ask Questions:**
   - Type your question in the input box
   - Click "Show Process" to see the RAG pipeline
   - Expand any step to see detailed metrics
   - View inline metrics below each bot response

## Configuration

The backend service can be configured via API:

```bash
# Update similarity threshold
curl -X POST "http://localhost:3000/rag/config?maxSimilarityDistance=1.0"

# Update max chunks
curl -X POST "http://localhost:3000/rag/config?maxChunksInContext=7"

# Clear cache
curl -X POST http://localhost:3000/rag/cache/clear

# Get cache stats
curl http://localhost:3000/rag/cache/stats
```

## Performance

### Without Cache:
- **Query Processing:** 2-4s
- **Steps:** All 7 steps executed
- **Metrics:** Full retrieval + filtering + re-ranking

### With Cache:
- **Query Processing:** 50-100ms (64x faster)
- **Steps:** Steps 3-6 skipped
- **Metrics:** `cacheHit: true`

## Related Documentation

- [Query Optimization Guide](../QUERY_OPTIMIZATION.md)
- [Backend Documentation](../README.md)
- [Testing Scripts](../scripts/README.md)

## Tech Stack

- **React 18** - UI framework
- **TypeScript** - Type safety
- **CSS3** - Styling with animations
- **Server-Sent Events** - Real-time updates
- **NestJS Backend** - REST + SSE API
