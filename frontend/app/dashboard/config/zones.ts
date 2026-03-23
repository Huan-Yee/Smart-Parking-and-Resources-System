export interface ZoneConfig {
    id: string;
    name: string;
    description: string;
    isActive: boolean;
    physicalCapacity: number; // For rendering the precise Map grid size 
}

/**
 * PARKING_ZONES Configuration
 * 
 * Future-Proofing: When you add "Student Parking" mechanically,
 * just flip `isActive` to true, and the UI will automatically 
 * generate a 40-slot graphical map for it!
 */
export const PARKING_ZONES: ZoneConfig[] = [
    {
        id: 'staff-block-a',
        name: 'Staff Parking',
        description: 'FCI Building',
        isActive: true,
        physicalCapacity: 40,
    },
    {
        id: 'student-block-b',
        name: 'Student Parking',
        description: 'FCI Building',
        isActive: false, // Under Construction visually
        physicalCapacity: 40,
    }
];
