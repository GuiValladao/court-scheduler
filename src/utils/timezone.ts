import { zonedTimeToUtc, utcToZonedTime, format } from 'date-fns-tz';
import { getDay, startOfWeek, addDays } from 'date-fns';

/**
 * Gets the user's current IANA timezone name from the browser.
 */
export const getUserTimezone = (): string => {
	// Ensure this code is environment-safe
	if (typeof Intl === 'undefined') {
		return 'UTC'; // Fallback for older environments
	}
	return Intl.DateTimeFormat().resolvedOptions().timeZone;
};

/**
 * Gets the user's current locale from the browser.
 */
export const getUserLocale = (): string => {
	// Ensure this code is environment-safe (won't break on server-side rendering)
	return typeof navigator !== 'undefined' ? navigator.language : 'en-US';
};

/**
 * Formats an hour number (0-23) into a localized time string respecting user's locale.
 * Uses 24-hour format for locales that prefer it, AM/PM for others.
 */
export const formatTime = (hour: number, locale: string): string => {
	const date = new Date();
	date.setHours(hour, 0, 0, 0);
	
	// Check if the locale typically uses 12-hour format
	const uses12Hour = isLocale12Hour(locale);
	
	return date.toLocaleTimeString(locale, { 
		hour: 'numeric', 
		hour12: uses12Hour,
		minute: '2-digit'
	});
};

/**
 * Determines if a locale typically uses 12-hour format (AM/PM)
 */
const isLocale12Hour = (locale: string): boolean => {
	// Create a test date and format it with the locale's default settings
	const testDate = new Date(2023, 0, 1, 13, 0, 0); // 1 PM
	const formatted = testDate.toLocaleTimeString(locale);
	
	// If the formatted time contains AM/PM indicators, it's a 12-hour locale
	return /AM|PM|am|pm|a\.m\.|p\.m\./i.test(formatted);
};

/**
 * Maps day names to day indices (Monday = 0, Sunday = 6)
 */
const getDayIndex = (dayName: string): number => {
	const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
	return days.indexOf(dayName);
};

/**
 * Maps day indices back to day names
 */
const getDayName = (dayIndex: number): string => {
	const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
	return days[dayIndex % 7];
};

/**
 * Converts a time slot from participant's timezone to user's timezone using date-fns-tz
 * This handles DST transitions and timezone differences accurately
 */
export const convertTimeSlot = (
	participantTimezone: string,
	userTimezone: string,
	day: string,
	hour: number
): { day: string; hour: number } => {
	try {
		// Use current date to ensure proper DST handling
		const now = new Date();
		const currentYear = now.getFullYear();
		const currentMonth = now.getMonth();
		
		// Find the next occurrence of the specified day in the current week
		const today = new Date(currentYear, currentMonth, now.getDate());
		const todayDayIndex = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
		const targetDayIndex = getDayIndex(day);
		
		if (targetDayIndex === -1) {
			console.warn(`Invalid day name: ${day}`);
			return { day, hour };
		}
		
		// Convert our Monday-based index to JavaScript's Sunday-based index
		const jsDayIndex = targetDayIndex === 6 ? 0 : targetDayIndex + 1;
		
		// Calculate days to add to get to the target day
		let daysToAdd = jsDayIndex - todayDayIndex;
		if (daysToAdd < 0) {
			daysToAdd += 7; // Next week
		}
		
		// Create the target date
		const targetDate = new Date(today);
		targetDate.setDate(today.getDate() + daysToAdd);
		targetDate.setHours(hour, 0, 0, 0);
		
		// Convert participant's local time to UTC
		const utcTime = zonedTimeToUtc(targetDate, participantTimezone);
		
		// Convert UTC to user's timezone
		const userLocalTime = utcToZonedTime(utcTime, userTimezone);
		
		// Get the day of week (0 = Sunday, 1 = Monday, etc.)
		const userDayOfWeek = userLocalTime.getDay();
		// Convert to our Monday-based index (Monday = 0)
		const userDayIndex = userDayOfWeek === 0 ? 6 : userDayOfWeek - 1;
		
		const userDay = getDayName(userDayIndex);
		const userHour = userLocalTime.getHours();
		
		return { day: userDay, hour: userHour };
	} catch (error) {
		console.error('Error converting timezone:', error);
		return { day, hour }; // Fallback to original values
	}
};

/**
 * For a given Date object (representing a moment in UTC), this function
 * returns the local time parts (weekday, hour) in a specified timezone.
 * This is the core function for correct timezone conversion.
 */
export const getLocalTimeParts = (
	date: Date,
	timeZone: string
): { weekday: string; hour: number } => {
	const formatter = new Intl.DateTimeFormat('en-US', {
		timeZone,
		hour12: false,
		weekday: 'long',
		hour: 'numeric',
	});
	const parts = formatter.formatToParts(date);
	const weekday = parts.find((p) => p.type === 'weekday')?.value || '';
	const hour =
		parseInt(parts.find((p) => p.type === 'hour')?.value || '0', 10) % 24; // Handle "24" for midnight
	return { weekday, hour };
};

/**
 * Formats a date string into a localized, readable format (e.g., "June 15, 2024").
 */
export const formatDate = (dateString: string, locale: string): string => {
	const date = new Date(dateString);
	return date.toLocaleDateString(locale, {
		year: 'numeric',
		month: 'long',
		day: 'numeric',
	});
};

/**
 * Formats an IANA timezone string into a more readable format.
 * e.g., "America/New_York" becomes "America / New York"
 */
export const formatTimezone = (timezone: string): string => {
	return timezone.replace(/_/g, ' ');
};

/**
 * Advanced timezone conversion function similar to the provided script
 * Handles DST and provides detailed timezone information
 */
export const convertTimestampToTimezone = (
	timestamp: string | Date,
	targetTimezone: string
): {
	timeZone: string;
	date: string;
	time: string;
	isDaylightSavingTime: boolean;
	displayDateTime: string;
} => {
	try {
		const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
		
		if (isNaN(date.getTime())) {
			throw new Error('Invalid timestamp');
		}
		
		// Convert to target timezone
		const zonedDate = utcToZonedTime(date, targetTimezone);
		
		// Check if DST is active
		const isDST = isDaylightSavingTime(date, targetTimezone);
		
		// Format date and time
		const formattedDate = format(zonedDate, 'yyyy-MM-dd', { timeZone: targetTimezone });
		const formattedTime = format(zonedDate, 'HH:mm', { timeZone: targetTimezone });
		
		return {
			timeZone: targetTimezone,
			date: formattedDate,
			time: formattedTime,
			isDaylightSavingTime: isDST,
			displayDateTime: `${formattedDate} ${formattedTime}`
		};
	} catch (error) {
		console.error('Error converting timestamp:', error);
		return {
			timeZone: targetTimezone,
			date: 'Invalid',
			time: 'Invalid',
			isDaylightSavingTime: false,
			displayDateTime: 'Invalid timestamp'
		};
	}
};

/**
 * Checks if daylight saving time is active for a given date and timezone
 */
const isDaylightSavingTime = (date: Date, timezone: string): boolean => {
	try {
		// Get the timezone offset for the given date
		const currentOffset = getTimezoneOffset(date, timezone);
		
		// Get the timezone offset for January (winter) of the same year
		const winterDate = new Date(date.getFullYear(), 0, 1);
		const winterOffset = getTimezoneOffset(winterDate, timezone);
		
		// DST is active if the current offset is different from winter offset
		return currentOffset !== winterOffset;
	} catch (error) {
		console.error('Error checking DST:', error);
		return false;
	}
};

/**
 * Gets the timezone offset in minutes for a specific date and timezone
 */
const getTimezoneOffset = (date: Date, timezone: string): number => {
	const utcDate = new Date(date.toISOString());
	const zonedDate = utcToZonedTime(utcDate, timezone);
	const utcTime = zonedTimeToUtc(zonedDate, timezone);
	
	return (utcTime.getTime() - utcDate.getTime()) / (1000 * 60);
};