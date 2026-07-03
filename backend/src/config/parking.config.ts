/**
 * Parking Prototype Configuration
 *
 * This file is the single source of truth for all parking capacity constants.
 * Update TOTAL_LOTS here to change prototype capacity.
 *
 * NOTE: The current prototype uses a one-way route with 4 parking lots,
 * one ESP32-CAM at the entry gate, and one at the exit gate.
 */
export const PARKING_CONFIG = {
  /**
   * Total number of parking lots in the prototype area.
   * All capacity checks and stats calculations reference this value.
   */
  TOTAL_LOTS: 4,

  /**
   * Default zone identifier used when the CV engine does not specify a zone.
   * For the current single-gate prototype, all events belong to 'gate-main'.
   */
  DEFAULT_ZONE: 'gate-main',
} as const;
