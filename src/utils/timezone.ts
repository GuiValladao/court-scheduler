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
 * Countries that primarily use 12-hour format (AM/PM)
 */
const COUNTRIES_USING_12_HOUR = new Set([
	'US', 'CA', 'AU', 'NZ', 'PH', 'MY', 'SG', 'IN', 'PK', 'BD', 'LK', 'NP',
	'MM', 'KH', 'LA', 'BT', 'MV', 'FJ', 'PW', 'MH', 'FM', 'KI', 'TV', 'NR',
	'TO', 'WS', 'VU', 'SB', 'PG', 'NC', 'GU', 'AS', 'VI', 'PR', 'MP'
]);

/**
 * Timezone to country mapping for common timezones
 */
const TIMEZONE_TO_COUNTRY: { [key: string]: string } = {
	// North America
	'America/New_York': 'US',
	'America/Chicago': 'US',
	'America/Denver': 'US',
	'America/Los_Angeles': 'US',
	'America/Phoenix': 'US',
	'America/Anchorage': 'US',
	'Pacific/Honolulu': 'US',
	'America/Toronto': 'CA',
	'America/Vancouver': 'CA',
	'America/Montreal': 'CA',
	'America/Halifax': 'CA',
	'America/Winnipeg': 'CA',
	'America/Edmonton': 'CA',
	'America/Regina': 'CA',
	'America/St_Johns': 'CA',
	
	// Oceania
	'Australia/Sydney': 'AU',
	'Australia/Melbourne': 'AU',
	'Australia/Brisbane': 'AU',
	'Australia/Perth': 'AU',
	'Australia/Adelaide': 'AU',
	'Australia/Darwin': 'AU',
	'Australia/Hobart': 'AU',
	'Pacific/Auckland': 'NZ',
	'Pacific/Chatham': 'NZ',
	
	// Asia (12-hour countries)
	'Asia/Manila': 'PH',
	'Asia/Kuala_Lumpur': 'MY',
	'Asia/Singapore': 'SG',
	'Asia/Kolkata': 'IN',
	'Asia/Mumbai': 'IN',
	'Asia/Delhi': 'IN',
	'Asia/Karachi': 'PK',
	'Asia/Dhaka': 'BD',
	'Asia/Colombo': 'LK',
	'Asia/Kathmandu': 'NP',
	'Asia/Yangon': 'MM',
	'Asia/Phnom_Penh': 'KH',
	'Asia/Vientiane': 'LA',
	'Asia/Thimphu': 'BT',
	
	// Europe (24-hour)
	'Europe/London': 'GB',
	'Europe/Paris': 'FR',
	'Europe/Berlin': 'DE',
	'Europe/Rome': 'IT',
	'Europe/Madrid': 'ES',
	'Europe/Amsterdam': 'NL',
	'Europe/Stockholm': 'SE',
	'Europe/Moscow': 'RU',
	'Europe/Istanbul': 'TR',
	'Europe/Athens': 'GR',
	'Europe/Vienna': 'AT',
	'Europe/Brussels': 'BE',
	'Europe/Copenhagen': 'DK',
	'Europe/Helsinki': 'FI',
	'Europe/Oslo': 'NO',
	'Europe/Warsaw': 'PL',
	'Europe/Prague': 'CZ',
	'Europe/Budapest': 'HU',
	'Europe/Zurich': 'CH',
	'Europe/Dublin': 'IE',
	'Europe/Lisbon': 'PT',
	
	// South America (24-hour)
	'America/Sao_Paulo': 'BR',
	'America/Argentina/Buenos_Aires': 'AR',
	'America/Lima': 'PE',
	'America/Bogota': 'CO',
	'America/Caracas': 'VE',
	'America/Santiago': 'CL',
	'America/La_Paz': 'BO',
	'America/Montevideo': 'UY',
	'America/Asuncion': 'PY',
	'America/Guyana': 'GY',
	'America/Paramaribo': 'SR',
	'America/Cayenne': 'GF',
	
	// Africa (24-hour)
	'Africa/Cairo': 'EG',
	'Africa/Lagos': 'NG',
	'Africa/Johannesburg': 'ZA',
	'Africa/Nairobi': 'KE',
	'Africa/Casablanca': 'MA',
	'Africa/Algiers': 'DZ',
	'Africa/Tunis': 'TN',
	'Africa/Tripoli': 'LY',
	'Africa/Khartoum': 'SD',
	'Africa/Addis_Ababa': 'ET',
	'Africa/Dar_es_Salaam': 'TZ',
	'Africa/Kampala': 'UG',
	'Africa/Kigali': 'RW',
	'Africa/Lusaka': 'ZM',
	'Africa/Harare': 'ZW',
	'Africa/Maputo': 'MZ',
	'Africa/Windhoek': 'NA',
	'Africa/Gaborone': 'BW',
	'Africa/Maseru': 'LS',
	'Africa/Mbabane': 'SZ',
	
	// Asia (24-hour countries)
	'Asia/Tokyo': 'JP',
	'Asia/Shanghai': 'CN',
	'Asia/Hong_Kong': 'HK',
	'Asia/Seoul': 'KR',
	'Asia/Bangkok': 'TH',
	'Asia/Jakarta': 'ID',
	'Asia/Ho_Chi_Minh': 'VN',
	'Asia/Dubai': 'AE',
	'Asia/Riyadh': 'SA',
	'Asia/Tehran': 'IR',
	'Asia/Baghdad': 'IQ',
	'Asia/Kuwait': 'KW',
	'Asia/Doha': 'QA',
	'Asia/Bahrain': 'BH',
	'Asia/Muscat': 'OM',
	'Asia/Kabul': 'AF',
	'Asia/Tashkent': 'UZ',
	'Asia/Almaty': 'KZ',
	'Asia/Bishkek': 'KG',
	'Asia/Dushanbe': 'TJ',
	'Asia/Ashgabat': 'TM',
	'Asia/Baku': 'AZ',
	'Asia/Yerevan': 'AM',
	'Asia/Tbilisi': 'GE',
	'Asia/Jerusalem': 'IL',
	'Asia/Beirut': 'LB',
	'Asia/Damascus': 'SY',
	'Asia/Amman': 'JO',
	'Asia/Nicosia': 'CY'
};

/**
 * Determines if user's location typically uses 12-hour format based on timezone
 */
export const isUserLocation12Hour = (): boolean => {
	try {
		const userTimezone = getUserTimezone();
		const countryCode = TIMEZONE_TO_COUNTRY[userTimezone];
		
		if (countryCode) {
			return COUNTRIES_USING_12_HOUR.has(countryCode);
		}
		
		// Fallback: check if timezone name suggests 12-hour usage
		const timezone12HourPatterns = [
			/America\/(New_York|Chicago|Denver|Los_Angeles|Phoenix|Anchorage)/,
			/America\/(Toronto|Vancouver|Montreal|Halifax|Winnipeg|Edmonton|Regina)/,
			/Pacific\/Honolulu/,
			/Australia\//,
			/Pacific\/Auckland/,
			/Asia\/(Manila|Kuala_Lumpur|Singapore|Kolkata|Mumbai|Delhi|Karachi|Dhaka|Colombo)/
		];
		
		return timezone12HourPatterns.some(pattern => pattern.test(userTimezone));
	} catch (error) {
		console.error('Error determining time format from location:', error);
		// Final fallback: use locale-based detection
		return isLocale12Hour(getUserLocale());
	}
};

/**
 * Determines if a locale typically uses 12-hour format (AM/PM)
 * This is now a fallback method when location-based detection fails
 */
export const isLocale12Hour = (locale: string): boolean => {
	// Create a test date and format it with the locale's default settings
	const testDate = new Date(2023, 0, 1, 13, 0, 0); // 1 PM
	const formatted = testDate.toLocaleTimeString(locale);
	
	// If the formatted time contains AM/PM indicators, it's a 12-hour locale
	return /AM|PM|am|pm|a\.m\.|p\.m\./i.test(formatted);
};

/**
 * Formats an hour number (0-23) into a localized time string respecting user's location.
 * Uses 24-hour format for locations that prefer it, AM/PM for others.
 */
export const formatTime = (hour: number, locale: string): string => {
	const date = new Date();
	date.setHours(hour, 0, 0, 0);
	
	// Use location-based detection first, fallback to locale
	const uses12Hour = isUserLocation12Hour();
	
	return date.toLocaleTimeString(locale, { 
		hour: 'numeric', 
		hour12: uses12Hour,
		minute: '2-digit'
	});
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
 * 
 * @param participantTimezone - The participant's timezone
 * @param userTimezone - The user's timezone
 * @param day - Day name (for weekly) or date string (for specific dates)
 * @param hour - Hour (0-23)
 * @param specificDate - Optional: the specific date string (YYYY-MM-DD) for specific date mode
 */
export const convertTimeSlot = (
	participantTimezone: string,
	userTimezone: string,
	day: string,
	hour: number,
	specificDate?: string
): { day: string; hour: number } => {
	try {
		let targetDate: Date;

		if (specificDate) {
			// For specific dates, use the exact date provided
			targetDate = new Date(specificDate + 'T00:00:00');
			targetDate.setHours(hour, 0, 0, 0);
		} else {
			// For weekly patterns, use current date logic
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
			targetDate = new Date(today);
			targetDate.setDate(today.getDate() + daysToAdd);
			targetDate.setHours(hour, 0, 0, 0);
		}
		
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