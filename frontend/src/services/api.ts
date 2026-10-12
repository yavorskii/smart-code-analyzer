import type { AnalysisRequest, AnalysisResponse } from '../types/analysis';

export async function analyzeCode(request: AnalysisRequest): Promise<AnalysisResponse> {
  const response = await fetch('/api/v1/analyze', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => null);
    const message = errorBody?.message || errorBody?.error || `HTTP error ${response.status}`;
    throw new Error(message);
  }

  return response.json();
}
