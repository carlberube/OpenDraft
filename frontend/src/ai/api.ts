/**
 * API client for AI screenplay generation
 */
import { API_BASE } from '../config';
import type {
  GenerateScreenplayContentRequest,
  GenerateScreenplayContentResponse,
} from './types';

export async function generateScreenplayContent(
  request: GenerateScreenplayContentRequest
): Promise<GenerateScreenplayContentResponse> {
  const endpoint = `${API_BASE}/ai/generate-screenplay-content`;
  let response: Response;

  try {
    response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });
  } catch (err) {
    const reason = err instanceof Error ? err.message : 'network error';
    throw new Error(`Failed to reach AI endpoint (${endpoint}): ${reason}`);
  }

  if (!response.ok) {
    const errorText = await response.text();
    let errorMessage = 'AI generation failed';

    try {
      const errorData = JSON.parse(errorText);
      if (errorData.detail) {
        errorMessage = errorData.detail;
      }
    } catch {
      errorMessage = errorText || `Error ${response.status}`;
    }

    throw new Error(errorMessage);
  }

  return response.json();
}
