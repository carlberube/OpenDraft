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
  const response = await fetch(`${API_BASE}/api/ai/generate-screenplay-content`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

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
