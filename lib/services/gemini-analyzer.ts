// Using Vertex AI with Service Account instead of API Key
import geminiVertexAnalyzer from './gemini-vertex-analyzer';

// Re-export types for compatibility
export { GeminiAnalysisResult, AnalysisOptions } from './gemini-vertex-analyzer-types';

/**
 * Gemini Video Analyzer Service
 * Now uses Vertex AI with Service Account authentication
 */
export class GeminiAnalyzer {
  constructor() {
    console.log('GeminiAnalyzer now uses Vertex AI with Service Account authentication');
    console.log('Service Account: config/public-service-220606-0ce909493107.json');
    console.log('Model: gemini-2.5-pro via Vertex AI');
  }

  /**
   * Analyze video from GCS URL - delegates to Vertex AI implementation
   */
  async analyzeVideo(
    videoUrl: string,
    options: any = {}
  ): Promise<any> {
    // Delegate to Vertex AI implementation
    return geminiVertexAnalyzer.analyzeVideo(videoUrl, options);
  }

  /**
   * Set API key - no longer used with Service Account
   */
  setApiKey(apiKey: string) {
    console.warn('setApiKey is deprecated. Using Service Account authentication via Vertex AI');
    console.warn('Service Account file: config/public-service-220606-0ce909493107.json');
  }
}

// Export singleton instance
export default new GeminiAnalyzer();