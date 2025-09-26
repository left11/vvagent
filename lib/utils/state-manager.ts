import { ProcessingState, ProcessingStatus } from '@/lib/types';
import { generateSessionId } from './validation';

/**
 * In-memory state manager for processing sessions
 */
export class StateManager {
  private states: Map<string, ProcessingState>;
  private readonly SESSION_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes

  constructor() {
    this.states = new Map();
    // Set up periodic cleanup
    this.startCleanupInterval();
  }

  /**
   * Creates a new session
   */
  createSession(input: string): string {
    const sessionId = generateSessionId();
    const now = new Date();
    
    const state: ProcessingState = {
      sessionId,
      input,
      status: 'idle',
      createdAt: now,
      updatedAt: now
    };

    this.states.set(sessionId, state);
    return sessionId;
  }

  /**
   * Updates session status
   */
  updateStatus(sessionId: string, updates: Partial<ProcessingState>): boolean {
    const state = this.states.get(sessionId);
    if (!state) {
      return false;
    }

    const updatedState: ProcessingState = {
      ...state,
      ...updates,
      updatedAt: new Date()
    };

    this.states.set(sessionId, updatedState);
    return true;
  }

  /**
   * Gets session status
   */
  getStatus(sessionId: string): ProcessingState | undefined {
    return this.states.get(sessionId);
  }

  /**
   * Updates processing status
   */
  setProcessingStatus(sessionId: string, status: ProcessingStatus, progress?: number): boolean {
    return this.updateStatus(sessionId, { status, progress });
  }

  /**
   * Sets an error for the session
   */
  setError(sessionId: string, message: string, code: string): boolean {
    return this.updateStatus(sessionId, {
      status: 'error',
      error: {
        message,
        code,
        timestamp: new Date()
      }
    });
  }

  /**
   * Removes a session
   */
  removeSession(sessionId: string): boolean {
    return this.states.delete(sessionId);
  }

  /**
   * Cleans up old sessions
   */
  cleanupOldSessions(): number {
    const now = Date.now();
    let cleaned = 0;

    for (const [sessionId, state] of this.states.entries()) {
      const age = now - state.updatedAt.getTime();
      if (age > this.SESSION_TIMEOUT_MS) {
        this.states.delete(sessionId);
        cleaned++;
      }
    }

    return cleaned;
  }

  /**
   * Gets all active sessions
   */
  getActiveSessions(): string[] {
    return Array.from(this.states.keys());
  }

  /**
   * Gets session count
   */
  getSessionCount(): number {
    return this.states.size;
  }

  /**
   * Starts periodic cleanup interval
   */
  private startCleanupInterval(): void {
    // Clean up every 5 minutes
    if (typeof setInterval !== 'undefined') {
      setInterval(() => {
        this.cleanupOldSessions();
      }, 5 * 60 * 1000);
    }
  }

  /**
   * Clears all sessions (for testing)
   */
  clearAll(): void {
    this.states.clear();
  }
}

// Singleton instance
let stateManagerInstance: StateManager | null = null;

/**
 * Gets the singleton StateManager instance
 */
export function getStateManager(): StateManager {
  if (!stateManagerInstance) {
    stateManagerInstance = new StateManager();
  }
  return stateManagerInstance;
}

/**
 * Resets the StateManager instance (for testing)
 */
export function resetStateManager(): void {
  if (stateManagerInstance) {
    stateManagerInstance.clearAll();
  }
  stateManagerInstance = null;
}