import { StateManager, getStateManager, resetStateManager } from '@/lib/utils/state-manager';
import { ProcessingStatus } from '@/lib/types';

describe('StateManager', () => {
  let stateManager: StateManager;

  beforeEach(() => {
    stateManager = new StateManager();
  });

  afterEach(() => {
    stateManager.clearAll();
  });

  describe('createSession', () => {
    it('should create a new session with initial state', () => {
      const input = 'https://vm.tiktok.com/ABC123';
      const sessionId = stateManager.createSession(input);

      expect(sessionId).toMatch(/^session_\d+_[a-z0-9]{9}$/);
      
      const state = stateManager.getStatus(sessionId);
      expect(state).toBeDefined();
      expect(state?.input).toBe(input);
      expect(state?.status).toBe('idle');
      expect(state?.createdAt).toBeInstanceOf(Date);
      expect(state?.updatedAt).toBeInstanceOf(Date);
    });

    it('should create multiple unique sessions', () => {
      const session1 = stateManager.createSession('input1');
      const session2 = stateManager.createSession('input2');
      
      expect(session1).not.toBe(session2);
      expect(stateManager.getSessionCount()).toBe(2);
    });
  });

  describe('updateStatus', () => {
    it('should update existing session', () => {
      const sessionId = stateManager.createSession('input');
      const originalState = stateManager.getStatus(sessionId);
      const originalUpdatedAt = originalState?.updatedAt;

      // Wait a bit to ensure different timestamp
      setTimeout(() => {
        const updated = stateManager.updateStatus(sessionId, {
          status: 'parsing',
          progress: 50
        });

        expect(updated).toBe(true);
        
        const newState = stateManager.getStatus(sessionId);
        expect(newState?.status).toBe('parsing');
        expect(newState?.progress).toBe(50);
        expect(newState?.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt?.getTime() || 0);
      }, 10);
    });

    it('should return false for non-existent session', () => {
      const updated = stateManager.updateStatus('non-existent', {
        status: 'parsing'
      });
      expect(updated).toBe(false);
    });

    it('should preserve unchanged fields', () => {
      const sessionId = stateManager.createSession('input');
      stateManager.updateStatus(sessionId, {
        parsedUrl: 'https://parsed.url'
      });

      const state = stateManager.getStatus(sessionId);
      expect(state?.input).toBe('input');
      expect(state?.status).toBe('idle');
      expect(state?.parsedUrl).toBe('https://parsed.url');
    });
  });

  describe('setProcessingStatus', () => {
    it('should update processing status and progress', () => {
      const sessionId = stateManager.createSession('input');
      
      const statuses: ProcessingStatus[] = [
        'parsing',
        'downloading',
        'uploading',
        'analyzing',
        'completed'
      ];

      statuses.forEach((status, index) => {
        const progress = (index + 1) * 20;
        const updated = stateManager.setProcessingStatus(sessionId, status, progress);
        
        expect(updated).toBe(true);
        const state = stateManager.getStatus(sessionId);
        expect(state?.status).toBe(status);
        expect(state?.progress).toBe(progress);
      });
    });
  });

  describe('setError', () => {
    it('should set error state with details', () => {
      const sessionId = stateManager.createSession('input');
      const updated = stateManager.setError(sessionId, 'Network error', 'NETWORK_ERROR');

      expect(updated).toBe(true);
      
      const state = stateManager.getStatus(sessionId);
      expect(state?.status).toBe('error');
      expect(state?.error).toBeDefined();
      expect(state?.error?.message).toBe('Network error');
      expect(state?.error?.code).toBe('NETWORK_ERROR');
      expect(state?.error?.timestamp).toBeInstanceOf(Date);
    });
  });

  describe('removeSession', () => {
    it('should remove existing session', () => {
      const sessionId = stateManager.createSession('input');
      expect(stateManager.getSessionCount()).toBe(1);
      
      const removed = stateManager.removeSession(sessionId);
      expect(removed).toBe(true);
      expect(stateManager.getSessionCount()).toBe(0);
      expect(stateManager.getStatus(sessionId)).toBeUndefined();
    });

    it('should return false for non-existent session', () => {
      const removed = stateManager.removeSession('non-existent');
      expect(removed).toBe(false);
    });
  });

  describe('cleanupOldSessions', () => {
    it('should remove sessions older than timeout', () => {
      const sessionId = stateManager.createSession('input');
      const state = stateManager.getStatus(sessionId);
      
      // Manually set old timestamp
      if (state) {
        state.updatedAt = new Date(Date.now() - 31 * 60 * 1000); // 31 minutes ago
      }

      const cleaned = stateManager.cleanupOldSessions();
      expect(cleaned).toBe(1);
      expect(stateManager.getSessionCount()).toBe(0);
    });

    it('should keep recent sessions', () => {
      const sessionId = stateManager.createSession('input');
      
      const cleaned = stateManager.cleanupOldSessions();
      expect(cleaned).toBe(0);
      expect(stateManager.getStatus(sessionId)).toBeDefined();
    });
  });

  describe('getActiveSessions', () => {
    it('should return all session IDs', () => {
      const session1 = stateManager.createSession('input1');
      const session2 = stateManager.createSession('input2');
      const session3 = stateManager.createSession('input3');

      const activeSessions = stateManager.getActiveSessions();
      expect(activeSessions).toHaveLength(3);
      expect(activeSessions).toContain(session1);
      expect(activeSessions).toContain(session2);
      expect(activeSessions).toContain(session3);
    });

    it('should return empty array when no sessions', () => {
      const activeSessions = stateManager.getActiveSessions();
      expect(activeSessions).toEqual([]);
    });
  });

  describe('clearAll', () => {
    it('should remove all sessions', () => {
      stateManager.createSession('input1');
      stateManager.createSession('input2');
      stateManager.createSession('input3');
      
      expect(stateManager.getSessionCount()).toBe(3);
      
      stateManager.clearAll();
      expect(stateManager.getSessionCount()).toBe(0);
      expect(stateManager.getActiveSessions()).toEqual([]);
    });
  });
});

describe('StateManager Singleton', () => {
  afterEach(() => {
    resetStateManager();
  });

  it('should return the same instance', () => {
    const instance1 = getStateManager();
    const instance2 = getStateManager();
    
    expect(instance1).toBe(instance2);
  });

  it('should reset the singleton', () => {
    const instance1 = getStateManager();
    const sessionId = instance1.createSession('input');
    expect(instance1.getSessionCount()).toBe(1);

    resetStateManager();
    
    const instance2 = getStateManager();
    expect(instance2).not.toBe(instance1);
    expect(instance2.getSessionCount()).toBe(0);
    expect(instance2.getStatus(sessionId)).toBeUndefined();
  });
});