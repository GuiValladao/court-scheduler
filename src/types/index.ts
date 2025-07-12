export interface Participant {
  id: string;
  name: string;
  role: ParticipantRole;
  timezone: string;
  availability: Availability;
  availabilityType: 'weekly' | 'specific';
  createdAt: string;
}

export type ParticipantRole = 'Judge' | 'Prosecution' | 'Defendant' | 'Defense Attorney' | 'Witness';

export interface Availability {
  [day: string]: number[]; // hours (0-23)
}

export interface TimeSlot {
  day: string;
  hour: number;
  participants: Participant[];
}

export const DAYS_OF_WEEK = [
  'Monday',
  'Tuesday', 
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday'
];

export const PARTICIPANT_ROLES: ParticipantRole[] = [
  'Judge',
  'Prosecution', 
  'Defendant',
  'Defense Attorney',
  'Witness'
];

export const ROLE_COLORS = {
  'Judge': 'bg-purple-900 text-purple-200 border-purple-700',
  'Prosecution': 'bg-red-900 text-red-200 border-red-700',
  'Defendant': 'bg-orange-900 text-orange-200 border-orange-700',
  'Defense Attorney': 'bg-blue-900 text-blue-200 border-blue-700',
  'Witness': 'bg-green-900 text-green-200 border-green-700'
};

// GitHub-like dark theme compatible colors for participants on the map
export const PARTICIPANT_COLORS = [
  '#3B82F6', // Softer blue
  '#EF4444', // Deep red
  '#10B981', // Emerald green
  '#FACC15', // Muted yellow
  '#6B7280', // Medium gray
  '#F472B6', // Rose
  '#0EA5E9', // Cyan / teal
  '#5EEAD4', // Mint green
  '#FB923C', // Burnt orange
  '#8B5CF6', // Dark purple
  '#6366F1', // Indigo
  '#D97706', // Copper / bronze
];

export const COMMON_TIMEZONES = [
  // North America
  'America/New_York',      // EST/EDT
  'America/Chicago',       // CST/CDT
  'America/Denver',        // MST/MDT
  'America/Los_Angeles',   // PST/PDT
  'America/Phoenix',       // MST (no DST)
  'America/Anchorage',     // AKST/AKDT
  'Pacific/Honolulu',      // HST
  'America/Toronto',       // EST/EDT
  'America/Vancouver',     // PST/PDT
  'America/Mexico_City',   // CST/CDT
  
  // South America
  'America/Sao_Paulo',     // BRT/BRST
  'America/Argentina/Buenos_Aires', // ART
  'America/Lima',          // PET
  'America/Bogota',        // COT
  'America/Caracas',       // VET
  
  // Europe
  'Europe/London',         // GMT/BST
  'Europe/Paris',          // CET/CEST
  'Europe/Berlin',         // CET/CEST
  'Europe/Rome',           // CET/CEST
  'Europe/Madrid',         // CET/CEST
  'Europe/Amsterdam',      // CET/CEST
  'Europe/Stockholm',      // CET/CEST
  'Europe/Moscow',         // MSK
  'Europe/Istanbul',       // TRT
  'Europe/Athens',         // EET/EEST
  
  // Asia
  'Asia/Tokyo',            // JST
  'Asia/Shanghai',         // CST
  'Asia/Hong_Kong',        // HKT
  'Asia/Singapore',        // SGT
  'Asia/Seoul',            // KST
  'Asia/Bangkok',          // ICT
  'Asia/Jakarta',          // WIB
  'Asia/Manila',           // PHT
  'Asia/Kolkata',          // IST
  'Asia/Dubai',            // GST
  'Asia/Riyadh',           // AST
  
  // Africa
  'Africa/Cairo',          // EET
  'Africa/Lagos',          // WAT
  'Africa/Johannesburg',   // SAST
  'Africa/Nairobi',        // EAT
  'Africa/Casablanca',     // WET/WEST
  
  // Oceania
  'Australia/Sydney',      // AEST/AEDT
  'Australia/Melbourne',   // AEST/AEDT
  'Australia/Perth',       // AWST
  'Pacific/Auckland',      // NZST/NZDT
  'Pacific/Fiji',          // FJT/FJST
  
  // UTC
  'UTC'
];