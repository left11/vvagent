import { ProcessingStatus, ErrorCode } from '@/lib/types';

describe('Type Definitions', () => {
  describe('ProcessingStatus', () => {
    it('should have all required status values', () => {
      const validStatuses: ProcessingStatus[] = [
        'idle',
        'parsing',
        'downloading',
        'uploading',
        'analyzing',
        'completed',
        'error'
      ];

      // Type checking happens at compile time
      expect(validStatuses).toHaveLength(7);
    });
  });

  describe('ErrorCode', () => {
    it('should have all required error codes', () => {
      expect(ErrorCode.INVALID_INPUT).toBe('INVALID_INPUT');
      expect(ErrorCode.PARSE_ERROR).toBe('PARSE_ERROR');
      expect(ErrorCode.DOWNLOAD_ERROR).toBe('DOWNLOAD_ERROR');
      expect(ErrorCode.UPLOAD_ERROR).toBe('UPLOAD_ERROR');
      expect(ErrorCode.RATE_LIMIT).toBe('RATE_LIMIT');
      expect(ErrorCode.ANALYSIS_ERROR).toBe('ANALYSIS_ERROR');
      expect(ErrorCode.NETWORK_ERROR).toBe('NETWORK_ERROR');
      expect(ErrorCode.STORAGE_ERROR).toBe('STORAGE_ERROR');
    });
  });
});