import { Direction, SignalColor, SignalPhase, SignalState } from '../types/simulation';

export interface TrafficSignalControllerConfig {
  fixedTimings: {
    green: number; // seconds
    amber: number;
    allRed: number;
  };
}

export class TrafficSignalController {
  private currentPhase: SignalPhase = 'NS_GREEN';
  private phaseTimer: number = 0; // accumulated seconds in current phase
  private targetPhaseDuration: number = 15; // current phase duration in seconds
  
  // Emergency vehicle override state
  private emergencyDirection: Direction | null = null;
  private preEmergencyPhase: SignalPhase = 'NS_GREEN';
  private isEmergencyActive: boolean = false;

  private fixedTimings = {
    green: 15,
    amber: 3,
    allRed: 1.5,
  };

  constructor(config?: Partial<TrafficSignalControllerConfig>) {
    if (config?.fixedTimings) {
      this.fixedTimings = { ...this.fixedTimings, ...config.fixedTimings };
    }
    this.targetPhaseDuration = this.fixedTimings.green;
  }

  public reset(): void {
    this.currentPhase = 'NS_GREEN';
    this.phaseTimer = 0;
    this.targetPhaseDuration = this.fixedTimings.green;
    this.emergencyDirection = null;
    this.isEmergencyActive = false;
  }

  public getPhase(): SignalPhase {
    return this.currentPhase;
  }

  public getPhaseElapsed(): number {
    return this.phaseTimer;
  }

  public getPhaseDuration(): number {
    return this.targetPhaseDuration;
  }

  public getRemainingTime(): number {
    return Math.max(0, Math.ceil(this.targetPhaseDuration - this.phaseTimer));
  }

  public isEmergency(): boolean {
    return this.isEmergencyActive;
  }

  public getEmergencyDirection(): Direction | null {
    return this.emergencyDirection;
  }

  /**
   * Request an emergency green corridor for a specific direction.
   */
  public triggerEmergencyCorridor(direction: Direction): void {
    if (this.isEmergencyActive && this.emergencyDirection === direction) return;

    this.emergencyDirection = direction;
    this.isEmergencyActive = true;
    this.preEmergencyPhase = this.currentPhase;

    // Check if the current phase already permits this direction
    const isNsDirection = direction === 'north' || direction === 'south';
    const isCurrentNs = this.currentPhase === 'NS_GREEN';
    const isCurrentEw = this.currentPhase === 'EW_GREEN';

    if ((isNsDirection && isCurrentNs) || (!isNsDirection && isCurrentEw)) {
      // Already green in this direction! Simply extend as emergency active
      this.currentPhase = 'EMERGENCY_ACTIVE';
      this.targetPhaseDuration = 30; // give plenty of corridor time
      this.phaseTimer = 0;
    } else {
      // Must safely transition conflicting traffic to amber, then all-red
      if (this.currentPhase === 'NS_GREEN') {
        this.currentPhase = 'NS_AMBER';
        this.targetPhaseDuration = this.fixedTimings.amber;
        this.phaseTimer = 0;
      } else if (this.currentPhase === 'EW_GREEN') {
        this.currentPhase = 'EW_AMBER';
        this.targetPhaseDuration = this.fixedTimings.amber;
        this.phaseTimer = 0;
      } else {
        // Already in amber or all-red clearance, fast forward to all-red then emergency
        this.currentPhase = 'EMERGENCY_CLEARANCE';
        this.targetPhaseDuration = this.fixedTimings.allRed;
        this.phaseTimer = 0;
      }
    }
  }

  /**
   * Release emergency priority and resume regular signal operation.
   */
  public clearEmergencyCorridor(): void {
    if (!this.isEmergencyActive) return;

    this.isEmergencyActive = false;
    const direction = this.emergencyDirection;
    this.emergencyDirection = null;

    // Smooth transition: amber for the emergency direction, then all-red, then resume normal
    if (direction === 'north' || direction === 'south') {
      this.currentPhase = 'NS_AMBER';
      this.targetPhaseDuration = this.fixedTimings.amber;
    } else {
      this.currentPhase = 'EW_AMBER';
      this.targetPhaseDuration = this.fixedTimings.amber;
    }
    this.phaseTimer = 0;
  }

  /**
   * Set dynamic green phase duration for adaptive signal controller
   */
  public setAdaptiveGreenDuration(durationSeconds: number): void {
    if (this.currentPhase === 'NS_GREEN' || this.currentPhase === 'EW_GREEN') {
      this.targetPhaseDuration = durationSeconds;
    }
  }

  /**
   * Force transition to next phase (e.g., adaptive controller detected empty queue)
   */
  public forceNextPhase(): void {
    this.phaseTimer = this.targetPhaseDuration;
  }

  /**
   * Advance signal controller by delta seconds
   * @param dt Delta time in seconds
   * @param nextGreenDuration Optional duration calculated by adaptive controller for the next green phase
   */
  public update(dt: number, nextGreenDuration?: number): void {
    this.phaseTimer += dt;

    if (this.phaseTimer >= this.targetPhaseDuration) {
      this.phaseTimer = 0;
      this.advancePhase(nextGreenDuration);
    }
  }

  private advancePhase(nextGreenDuration?: number): void {
    switch (this.currentPhase) {
      case 'NS_GREEN':
        this.currentPhase = 'NS_AMBER';
        this.targetPhaseDuration = this.fixedTimings.amber;
        break;

      case 'NS_AMBER':
        this.currentPhase = 'ALL_RED_1';
        this.targetPhaseDuration = this.fixedTimings.allRed;
        break;

      case 'ALL_RED_1':
        if (this.isEmergencyActive && this.emergencyDirection) {
          this.currentPhase = 'EMERGENCY_ACTIVE';
          this.targetPhaseDuration = 30;
        } else {
          this.currentPhase = 'EW_GREEN';
          this.targetPhaseDuration = nextGreenDuration ?? this.fixedTimings.green;
        }
        break;

      case 'EW_GREEN':
        this.currentPhase = 'EW_AMBER';
        this.targetPhaseDuration = this.fixedTimings.amber;
        break;

      case 'EW_AMBER':
        this.currentPhase = 'ALL_RED_2';
        this.targetPhaseDuration = this.fixedTimings.allRed;
        break;

      case 'ALL_RED_2':
        if (this.isEmergencyActive && this.emergencyDirection) {
          this.currentPhase = 'EMERGENCY_ACTIVE';
          this.targetPhaseDuration = 30;
        } else {
          this.currentPhase = 'NS_GREEN';
          this.targetPhaseDuration = nextGreenDuration ?? this.fixedTimings.green;
        }
        break;

      case 'EMERGENCY_CLEARANCE':
        this.currentPhase = 'EMERGENCY_ACTIVE';
        this.targetPhaseDuration = 30;
        break;

      case 'EMERGENCY_ACTIVE':
        // If emergency timer expires without explicit clearance, clear it safely
        this.clearEmergencyCorridor();
        break;
    }
  }

  /**
   * Get the signal color and accessibility representation for a given direction.
   */
  public getSignalState(direction: Direction): SignalState {
    const isNs = direction === 'north' || direction === 'south';
    const isEw = direction === 'east' || direction === 'west';
    const remainingTime = this.getRemainingTime();
    const totalPhaseTime = this.targetPhaseDuration;

    if (this.currentPhase === 'EMERGENCY_ACTIVE' && this.emergencyDirection) {
      if (direction === this.emergencyDirection) {
        return { color: 'green', label: 'GO', symbol: '▲', remainingTime, totalPhaseTime };
      }
      return { color: 'red', label: 'STOP', symbol: '■', remainingTime, totalPhaseTime };
    }

    if (isNs) {
      if (this.currentPhase === 'NS_GREEN') {
        return { color: 'green', label: 'GO', symbol: '▲', remainingTime, totalPhaseTime };
      }
      if (this.currentPhase === 'NS_AMBER') {
        return { color: 'amber', label: 'WAIT', symbol: '◆', remainingTime, totalPhaseTime };
      }
      return { color: 'red', label: 'STOP', symbol: '■', remainingTime, totalPhaseTime };
    }

    if (isEw) {
      if (this.currentPhase === 'EW_GREEN') {
        return { color: 'green', label: 'GO', symbol: '▲', remainingTime, totalPhaseTime };
      }
      if (this.currentPhase === 'EW_AMBER') {
        return { color: 'amber', label: 'WAIT', symbol: '◆', remainingTime, totalPhaseTime };
      }
      return { color: 'red', label: 'STOP', symbol: '■', remainingTime, totalPhaseTime };
    }

    return { color: 'red', label: 'STOP', symbol: '■', remainingTime, totalPhaseTime };
  }
}
