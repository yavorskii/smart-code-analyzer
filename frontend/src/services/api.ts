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

export async function getAnalysisHistory(): Promise<import('../types/analysis').AnalysisHistoryItem[]> {
  const response = await fetch('/api/v1/analyze/history');
  if (!response.ok) {
    throw new Error('Failed to fetch analysis history');
  }
  return response.json();
}

export async function getAnalysisById(id: string): Promise<AnalysisResponse> {
  const response = await fetch(`/api/v1/analyze/history/${id}`);
  if (!response.ok) {
    throw new Error('Failed to fetch analysis details');
  }
  return response.json();
}

export async function deleteAnalysis(id: string): Promise<void> {
  const response = await fetch(`/api/v1/analyze/history/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    throw new Error('Failed to delete analysis record');
  }
}
