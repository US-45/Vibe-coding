import { SignalState, Vehicle } from '../types/simulation';
import { MIN_STOPPED_GAP, STOP_LINE_DISTANCE } from './queueManager';

export class CollisionManager {
  /**
   * Updates speed and position for a vehicle while guaranteeing:
   * 1. No collision with leader vehicle in the same lane
   * 2. Proper stopping at RED/AMBER signals
   * 3. Smooth crossing once committed to the intersection
   * 4. Free left turn yield logic
   */
  public static updateVehiclePhysics(
    vehicle: Vehicle,
    leader: Vehicle | null,
    signal: SignalState,
    freeLeftTurnEnabled: boolean,
    hasConflictingCrossingTraffic: boolean
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

    // If vehicle has not yet committed to crossing the stop line:
    if (!vehicle.hasCrossedStopLine && vehicle.distanceAlongPath < STOP_LINE_DISTANCE) {
      let mustStopAtSignal = false;

      if (isEmergency) {
        // Emergency vehicles get priority; only stop if absolute red and no corridor yet
        mustStopAtSignal = signal.color === 'red' && signal.remainingTime > 25; // brief hold if in clearance
      } else if (isFreeLeft) {
        // Free left turn bypasses normal stop line, but must yield if crossing traffic is right there
        if (hasConflictingCrossingTraffic && vehicle.distanceAlongPath > STOP_LINE_DISTANCE - 30) {
          mustStopAtSignal = true;
        }
      } else {
        if (signal.color === 'red') {
          mustStopAtSignal = true;
        } else if (signal.color === 'amber') {
          // Calculate safe stopping distance: d = v^2 / (2 * decel)
          const safeStoppingDistance = (vehicle.speed * vehicle.speed) / (2 * vehicle.deceleration);
          const distanceToStopLine = STOP_LINE_DISTANCE - vehicle.distanceAlongPath;

          // If we have enough room to stop safely before the stop line, we must stop!
          if (distanceToStopLine > safeStoppingDistance * 0.9) {
            mustStopAtSignal = true;
          } else {
            // Already committed to entering; proceed smoothly across
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
      // Vehicle has crossed or is crossing the stop line
      vehicle.hasCrossedStopLine = true;
      vehicle.state = 'crossing';
    }

    // 2. Intelligent Speed & Acceleration Adjustment
    const distanceToObstacle = obstacleDistance - vehicle.distanceAlongPath;

    if (distanceToObstacle <= 0) {
      // Direct constraint: absolute hard stop at bumper gap to guarantee 0% overlap
      vehicle.speed = 0;
      vehicle.distanceAlongPath = Math.min(vehicle.distanceAlongPath, obstacleDistance);
      if (vehicle.distanceAlongPath <= STOP_LINE_DISTANCE + 5) {
        vehicle.state = 'waiting';
      }
    } else if (distanceToObstacle < 80) {
      // Approaching obstacle / stop line / leader: smooth deceleration
      // Desired speed based on distance
      const targetSpeed = Math.min(
        vehicle.maxSpeed,
        Math.sqrt(Math.max(0, 2 * vehicle.deceleration * distanceToObstacle)) + obstacleSpeed * 0.5
      );

      if (vehicle.speed > targetSpeed) {
        vehicle.speed = Math.max(0, vehicle.speed - vehicle.deceleration);
      } else {
        vehicle.speed = Math.min(targetSpeed, vehicle.speed + vehicle.acceleration * 0.5);
      }

      if (vehicle.speed < 0.2 && distanceToObstacle < 12) {
        vehicle.speed = 0;
        if (!vehicle.hasCrossedStopLine) {
          vehicle.state = 'waiting';
        }
      }
    } else {
      // Open road ahead: accelerate up to cruising speed
      if (vehicle.speed < vehicle.maxSpeed) {
        vehicle.speed = Math.min(vehicle.maxSpeed, vehicle.speed + vehicle.acceleration);
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
