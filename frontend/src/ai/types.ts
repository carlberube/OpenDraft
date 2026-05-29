/**
 * Types for AI screenplay generation
 */

export interface ScreenplayContext {
  selectedText?: string;
  currentSceneText?: string;
  nearbyText?: string;
  documentTitle?: string;
}

export interface GenerateScreenplayContentRequest {
  prompt: string;
  context?: ScreenplayContext;
}

export interface GenerateScreenplayContentResponse {
  fountain: string;
  explanation?: string;
  warnings?: string[];
}
