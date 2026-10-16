import { Direction, Vehicle } from '../types/simulation';

export const STOP_LINE_DISTANCE = 270; // pixels from entry edge to stop line
export const MIN_STOPPED_GAP = 9; // minimum gap between stopped vehicles in px
export const MIN_SPAWN_CLEARANCE = 45; // clearance needed at entry point to spawn

export class QueueManager {
  /**
   * Returns vehicles sorted by distanceAlongPath descending (lead vehicle first)
   * grouped by direction and lane index.
   */
  public static groupVehiclesByLane(vehicles: Vehicle[]): Map<string, Vehicle[]> {
    const laneMap = new Map<string, Vehicle[]>();

    for (const v of vehicles) {
      if (v.state === 'exited') continue;
      const key = `${v.origin}_${v.laneIndex}`;
      let list = laneMap.get(key);
      if (!list) {
        list = [];
        laneMap.set(key, list);
      }
      list.push(v);
    }

    // Sort each lane descending by distanceAlongPath
    laneMap.forEach((list) => {
      list.sort((a, b) => b.distanceAlongPath - a.distanceAlongPath);
    });

    return laneMap;
  }

  /**
   * Computes the current queue length for each direction.
   * A vehicle counts as queued if:
   * 1. It is on the incoming approach (distanceAlongPath <= STOP_LINE_DISTANCE)
   * 2. Its speed is stopped or crawling (< 0.25 px/frame)
   */
  public static calculateQueueLengths(vehicles: Vehicle[]): Record<Direction, number> {
    const queues: Record<Direction, number> = {
      north: 0,
      south: 0,
      east: 0,
      west: 0,
    };

    for (const v of vehicles) {
      if (
        !v.hasCrossedStopLine &&
        v.distanceAlongPath <= STOP_LINE_DISTANCE + 5 &&
        v.speed <= 0.3
      ) {
        queues[v.origin]++;
      }
    }

    return queues;
  }

  /**
   * Checks if an incoming lane has sufficient clearance to spawn a new vehicle without overlapping.
   */
  public static canSpawnInLane(vehicles: Vehicle[], origin: Direction, laneIndex: number): boolean {
    for (const v of vehicles) {
      if (v.origin === origin && v.laneIndex === laneIndex && !v.hasCrossedStopLine) {
        // If there's any vehicle too close to the entry point (distance < clearance)
        if (v.distanceAlongPath < MIN_SPAWN_CLEARANCE) {
          return false;
        }
      }
    }
    return true;
  }
}
