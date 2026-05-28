import { Logger } from '@nestjs/common';

export enum CircuitState {
  CLOSED = 'CLOSED', // Normal operation
  OPEN = 'OPEN', // Failing, rejecting requests
  HALF_OPEN = 'HALF_OPEN', // Testing if recovered
}

export interface CircuitBreakerOptions {
  failureThreshold: number; // Number of failures before opening
  resetTimeout: number; // Time before attempting reset (ms)
  halfOpenMaxCalls: number; // Max calls in half-open state
  successThreshold: number; // Successes needed to close
}

export class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED;
  private failureCount = 0;
  private successCount = 0;
  private halfOpenCalls = 0;
  private nextAttempt = Date.now();
  private readonly logger: Logger;

  constructor(
    private readonly name: string,
    private readonly options: CircuitBreakerOptions = {
      failureThreshold: 5,
      resetTimeout: 60000, // 1 minute
      halfOpenMaxCalls: 3,
      successThreshold: 2,
    },
  ) {
    this.logger = new Logger(`CircuitBreaker:${name}`);
  }

  getState(): CircuitState {
    return this.state;
  }

  async execute<T>(fn: () => Promise<T>, fallback?: () => T): Promise<T> {
    if (this.state === CircuitState.OPEN) {
      if (Date.now() < this.nextAttempt) {
        this.logger.warn(`Circuit OPEN for ${this.name}, rejecting request`);
        if (fallback) {
          return fallback();
        }
        throw new Error(`Circuit breaker is OPEN for ${this.name}`);
      }
      // Transition to half-open
      this.state = CircuitState.HALF_OPEN;
      this.halfOpenCalls = 0;
      this.logger.log(
        `Circuit HALF_OPEN for ${this.name}, testing recovery...`,
      );
    }

    if (this.state === CircuitState.HALF_OPEN) {
      if (this.halfOpenCalls >= this.options.halfOpenMaxCalls) {
        this.logger.warn(`Circuit HALF_OPEN limit reached for ${this.name}`);
        if (fallback) {
          return fallback();
        }
        throw new Error(
          `Circuit breaker HALF_OPEN limit reached for ${this.name}`,
        );
      }
      this.halfOpenCalls++;
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      if (fallback) {
        return fallback();
      }
      throw error;
    }
  }

  private onSuccess(): void {
    if (this.state === CircuitState.HALF_OPEN) {
      this.successCount++;
      if (this.successCount >= this.options.successThreshold) {
        this.logger.log(`Circuit CLOSED for ${this.name} - service recovered`);
        this.reset();
      }
    } else {
      this.failureCount = 0;
    }
  }

  private onFailure(): void {
    this.failureCount++;

    if (this.state === CircuitState.HALF_OPEN) {
      this.logger.error(`Circuit OPEN for ${this.name} - recovery failed`);
      this.open();
    } else if (this.failureCount >= this.options.failureThreshold) {
      this.logger.error(
        `Circuit OPEN for ${this.name} - ${this.failureCount} failures`,
      );
      this.open();
    }
  }

  private open(): void {
    this.state = CircuitState.OPEN;
    this.nextAttempt = Date.now() + this.options.resetTimeout;
    this.successCount = 0;
  }

  private reset(): void {
    this.state = CircuitState.CLOSED;
    this.failureCount = 0;
    this.successCount = 0;
    this.halfOpenCalls = 0;
  }

  getMetrics() {
    return {
      name: this.name,
      state: this.state,
      failureCount: this.failureCount,
      successCount: this.successCount,
      nextAttempt: this.state === CircuitState.OPEN ? this.nextAttempt : null,
    };
  }
}

// Registry for all circuit breakers
export class CircuitBreakerRegistry {
  private static breakers = new Map<string, CircuitBreaker>();

  static getOrCreate(
    name: string,
    options?: CircuitBreakerOptions,
  ): CircuitBreaker {
    if (!this.breakers.has(name)) {
      this.breakers.set(name, new CircuitBreaker(name, options));
    }
    return this.breakers.get(name)!;
  }

  static getAllMetrics() {
    return Array.from(this.breakers.values()).map((b) => b.getMetrics());
  }

  static resetAll(): void {
    this.breakers.clear();
  }
}
