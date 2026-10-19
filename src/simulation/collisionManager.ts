import { SignalState, Vehicle } from '../types/simulation';
import { MIN_STOPPED_GAP, STOP_LINE_DISTANCE } from './queueManager';

export class CollisionManager {
  /**
   * Updates speed and position for a vehicle while guaranteeing:
   * 1. No collision with leader vehicle in the same lane
   * 2. Proper stopping at RED/AMBER signals for through-traffic
   * 3. Fluid, unhindered Free Left Turn flow with realistic cornering deceleration
   * 4. Safe merge yielding if another vehicle is occupying the slip exit point
   */
  public static updateVehiclePhysics(
    vehicle: Vehicle,
    leader: Vehicle | null,
    signal: SignalState,
    freeLeftTurnEnabled: boolean,
    hasMergeConflict: boolean = false
  ): void {
    // 1. Determine effective obstacle distance ahead along the vehicle's path
    let obstacleDistance = Infinity;
    let obstacleSpeed = 0;

    // A) Check leader vehicle in the same lane
    if (leader) {
      const bumperGap = leader.distanceAlongPath - (leader.length / 2) - (vehicle.length / 2) - MIN_STOPPED_GAP;
      if (bumperGap < obstacleDistance) {
        obstacleDistance = bumperGap;
        obstacleSpeed = Math.max(0, leader.speed);
      }
    }

    // B) Check Traffic Signal / Stop Line
    const isFreeLeft = freeLeftTurnEnabled && vehicle.movement === 'left';
    const isEmergency = vehicle.isEmergency;

    // Left turn vehicles enter the slip curve at distance 240
    if (vehicle.movement === 'left' && vehicle.distanceAlongPath >= 240) {
      vehicle.hasCrossedStopLine = true;
      vehicle.state = 'crossing';
    }

    // If vehicle has not yet committed to crossing the stop line:
    if (!vehicle.hasCrossedStopLine && vehicle.distanceAlongPath < STOP_LINE_DISTANCE) {
      let mustStopAtSignal = false;

      if (isEmergency) {
        // Emergency vehicles get priority; only stop if absolute red and no corridor yet
        mustStopAtSignal = signal.color === 'red' && signal.remainingTime > 25;
      } else if (isFreeLeft) {
        // Free Left Turn bypasses signal entirely! Never stops at the signal stop line.
        mustStopAtSignal = false;
      } else {
        if (signal.color === 'red') {
          mustStopAtSignal = true;
        } else if (signal.color === 'amber') {
          const safeStoppingDistance = (vehicle.speed * vehicle.speed) / (2 * vehicle.deceleration);
          const distanceToStopLine = STOP_LINE_DISTANCE - vehicle.distanceAlongPath;

          if (distanceToStopLine > safeStoppingDistance * 0.9) {
            mustStopAtSignal = true;
          } else {
            vehicle.hasCrossedStopLine = true;
            vehicle.state = 'crossing';
          }
        }
      }

      if (mustStopAtSignal) {
        const stopLineObstacle = STOP_LINE_DISTANCE - (vehicle.length / 2) - 4;
        if (stopLineObstacle < obstacleDistance) {
          obstacleDistance = stopLineObstacle;
          obstacleSpeed = 0;
        }
      }
    } else {
      vehicle.hasCrossedStopLine = true;
      vehicle.state = 'crossing';
    }

    // 2. Intelligent Speed & Acceleration Adjustment
    const distanceToObstacle = obstacleDistance - vehicle.distanceAlongPath;

    // Maximum cruising speed adjusted for cornering
    let effectiveMaxSpeed = vehicle.maxSpeed;
    if (vehicle.movement === 'left') {
      if (vehicle.distanceAlongPath >= 235 && vehicle.distanceAlongPath <= 370) {
        // Smooth cornering speed while traversing the curved slip road
        effectiveMaxSpeed = Math.min(vehicle.maxSpeed, 2.0);
      }
      // If there's an active vehicle occupying the merge point at the curve exit, yield slightly
      if (hasMergeConflict && vehicle.distanceAlongPath >= 320 && vehicle.distanceAlongPath <= 375) {
        effectiveMaxSpeed = Math.min(effectiveMaxSpeed, 0.7);
      }
    }

    if (distanceToObstacle <= 0) {
      // Direct constraint: absolute hard stop at bumper gap to guarantee 0% overlap
      vehicle.speed = 0;
      vehicle.distanceAlongPath = Math.min(vehicle.distanceAlongPath, obstacleDistance);
      if (vehicle.distanceAlongPath <= STOP_LINE_DISTANCE + 5) {
        vehicle.state = 'waiting';
      }
    } else if (distanceToObstacle < 80) {
      // Approaching obstacle / stop line / leader: smooth deceleration
      const targetSpeed = Math.min(
        effectiveMaxSpeed,
        Math.sqrt(Math.max(0, 2 * vehicle.deceleration * distanceToObstacle)) + obstacleSpeed * 0.5
      );

      if (vehicle.speed > targetSpeed) {
        vehicle.speed = Math.max(0, vehicle.speed - vehicle.deceleration);
      } else {
        vehicle.speed = Math.min(targetSpeed, vehicle.speed + vehicle.acceleration * 0.6);
      }

      if (vehicle.speed < 0.2 && distanceToObstacle < 12) {
        vehicle.speed = 0;
        if (!vehicle.hasCrossedStopLine) {
          vehicle.state = 'waiting';
        }
      }
    } else {
      // Open road ahead: accelerate up to effective cruising speed
      if (vehicle.speed < effectiveMaxSpeed) {
        vehicle.speed = Math.min(effectiveMaxSpeed, vehicle.speed + vehicle.acceleration);
      } else if (vehicle.speed > effectiveMaxSpeed + 0.1) {
        vehicle.speed = Math.max(effectiveMaxSpeed, vehicle.speed - vehicle.deceleration * 0.5);
      }

      if (vehicle.hasCrossedStopLine) {
        vehicle.state = 'crossing';
      } else {
        vehicle.state = 'approaching';
      }
    }

    // 3. Advance vehicle along path
    vehicle.distanceAlongPath += vehicle.speed;
  }
}
