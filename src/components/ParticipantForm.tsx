import React, { useState, useEffect } from 'react';
import {
	User,
	MapPin,
	Clock,
	Plus,
	X,
	Calendar,
	ChevronDown,
	ChevronUp,
	ChevronLeft,
	ChevronRight,
	Info,
} from 'lucide-react';
import {
	Participant,
	ParticipantRole,
	PARTICIPANT_ROLES,
	DAYS_OF_WEEK,
} from '../types';
import { formatTimezone, getUserLocale, isUserLocation12Hour } from '../utils/timezone';

// Timezone list with abbreviations and UTC offsets
const TIMEZONE_OPTIONS = [
	{ label: 'UTC -12 - Etc/GMT+12', value: 'Etc/GMT+12' },
	{ label: 'HST UTC -10 - Pacific/Honolulu', value: 'Pacific/Honolulu' },
	{ label: 'AKST UTC -9 - America/Anchorage', value: 'America/Anchorage' },
	{ label: 'PST UTC -8 - America/Los_Angeles', value: 'America/Los_Angeles' },
	{ label: 'MST UTC -7 - America/Denver', value: 'America/Denver' },
	{ label: 'CST UTC -6 - America/Chicago', value: 'America/Chicago' },
	{ label: 'EST UTC -5 - America/New_York', value: 'America/New_York' },
	{ label: 'VET UTC -4  - America/Caracas', value: 'America/Caracas' },
	{ label: 'BRT UTC -3 - America/Sao_Paulo', value: 'America/Sao_Paulo' },
	{ label: 'ART UTC -3 - America/Argentina/Buenos_Aires', value: 'America/Argentina/Buenos_Aires' },
	{ label: 'GST UTC -2 - Etc/GMT+2', value: 'Etc/GMT+2' },
	{ label: 'AZOT UTC -1 - Atlantic/Azores', value: 'Atlantic/Azores' },
	{ label: 'GMT UTC +0 - Europe/London', value: 'Europe/London' },
	{ label: 'CET UTC +1 - Europe/Berlin', value: 'Europe/Berlin' },
	{ label: 'CET UTC +1 - Europe/Paris', value: 'Europe/Paris' },
	{ label: 'EET UTC +2 - Africa/Cairo', value: 'Africa/Cairo' },
	{ label: 'MSK UTC +3 - Europe/Moscow', value: 'Europe/Moscow' },
	{ label: 'GST UTC +4 - Asia/Dubai', value: 'Asia/Dubai' },
	{ label: 'PKT UTC +5 - Asia/Karachi', value: 'Asia/Karachi' },
	{ label: 'BST UTC +6 - Asia/Dhaha', value: 'Asia/Dhaka' },
	{ label: 'ICT UTC +7 - Asia/Bangkok', value: 'Asia/Bangkok' },
	{ label: 'HKT UTC +8 - Asia/Hong_Kong', value: 'Asia/Hong_Kong' },
	{ label: 'JST UTC +9 - Asia/Tokyo', value: 'Asia/Tokyo' },
	{ label: 'AEST UTC +10 - Australia/Sydney', value: 'Australia/Sydney' },
	{ label: 'NZST UTC +12 - Pacific/Auckland', value: 'Pacific/Auckland' },
];

interface ParticipantFormProps {
	isOpen: boolean;
	onClose: () => void;
	onSubmit: (participant: Omit<Participant, 'id' | 'createdAt'>) => void;
	userTimezone: string;
	existingParticipants: Participant[];
}

const LAST_TIMEZONE_KEY = 'rp-court-last-timezone';

// Function to save last used timezone
const saveLastTimezone = (timezone: string): void => {
	try {
		localStorage.setItem(LAST_TIMEZONE_KEY, timezone);
	} catch (error) {
		console.error('Failed to save last timezone:', error);
	}
};

// Function to load last used timezone
const loadLastTimezone = (): string | null => {
	try {
		return localStorage.getItem(LAST_TIMEZONE_KEY);
	} catch (error) {
		console.error('Failed to load last timezone:', error);
		return null;
	}
};

// Function to format hour based on user's location preference
const formatHourForLocation = (hour: number, locale: string): string => {
	const date = new Date();
	date.setHours(hour, 0, 0, 0);
	
	// Use location-based detection for time format
	const uses12Hour = isUserLocation12Hour();
	
	return date.toLocaleTimeString(locale, { 
		hour: 'numeric', 
		hour12: uses12Hour,
		minute: '2-digit'
	});
};

export const ParticipantForm: React.FC<ParticipantFormProps> = ({
	isOpen,
	onClose,
	onSubmit,
	userTimezone,
	existingParticipants,
}) => {
	const [name, setName] = useState('');
	const [role, setRole] = useState<ParticipantRole>('Witness');
	const [timezone, setTimezone] = useState(userTimezone);
	const [availabilityType, setAvailabilityType] = useState<'weekly' | 'specific'>('weekly');
	const [availability, setAvailability] = useState<{ [day: string]: number[] }>({});
	const [expandedDays, setExpandedDays] = useState<{ [day: string]: boolean }>({});
	
	// Calendar state
	const [selectedDates, setSelectedDates] = useState<Set<string>>(new Set());
	const [expandedCalendarDates, setExpandedCalendarDates] = useState<{ [date: string]: boolean }>({});

	// Get user locale and location-based time format preference
	const userLocale = getUserLocale();
	const uses12HourFormat = isUserLocation12Hour();

	// Determine if availability type is locked based on existing participants
	const isFirstParticipant = existingParticipants.length === 0;
	const lockedAvailabilityType = !isFirstParticipant ? existingParticipants[0]?.availabilityType : null;

	// Set availability type based on existing participants
	useEffect(() => {
		if (lockedAvailabilityType) {
			setAvailabilityType(lockedAvailabilityType);
		}
	}, [lockedAvailabilityType]);

	// Initialize timezone on component mount
	useEffect(() => {
		if (isOpen) {
			// Try to load last used timezone, fallback to user timezone
			const lastTimezone = loadLastTimezone();
			if (lastTimezone && TIMEZONE_OPTIONS.some(tz => tz.value === lastTimezone)) {
				setTimezone(lastTimezone);
			} else {
				setTimezone(userTimezone);
			}
		}
	}, [isOpen, userTimezone]);

	// Handle ESC key press to close modal
	useEffect(() => {
		const handleEscapeKey = (event: KeyboardEvent) => {
			if (event.key === 'Escape' && isOpen) {
				onClose();
			}
		};

		if (isOpen) {
			document.addEventListener('keydown', handleEscapeKey);
		}

		return () => {
			document.removeEventListener('keydown', handleEscapeKey);
		};
	}, [isOpen, onClose]);

	const handleAvailabilityTypeChange = (newType: 'weekly' | 'specific') => {
		setAvailabilityType(newType);
		// Clear all availability-related state when switching types
		setAvailability({});
		setExpandedDays({});
		setSelectedDates(new Set());
		setExpandedCalendarDates({});
	};

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (!name.trim()) return;

		// Save the selected timezone for future use
		saveLastTimezone(timezone);

		onSubmit({
			name: name.trim(),
			role,
			timezone,
			availability,
			availabilityType,
		});

		// Reset form
		setName('');
		setRole('Witness');
		// Don't reset timezone - it will be loaded from localStorage next time
		if (isFirstParticipant) {
			setAvailabilityType('weekly');
		}
		setAvailability({});
		setExpandedDays({});
		setSelectedDates(new Set());
		setExpandedCalendarDates({});
		onClose();
	};

	const toggleDay = (day: string) => {
		setExpandedDays((prev) => ({
			...prev,
			[day]: !prev[day],
		}));

		// If day is being collapsed and has no hours selected, remove it from availability
		if (
			expandedDays[day] &&
			(!availability[day] || availability[day].length === 0)
		) {
			const newAvailability = { ...availability };
			delete newAvailability[day];
			setAvailability(newAvailability);
		}
	};

	const toggleTimeSlot = (day: string, hour: number) => {
		setAvailability((prev) => ({
			...prev,
			[day]: prev[day]?.includes(hour)
				? prev[day].filter((h) => h !== hour)
				: [...(prev[day] || []), hour].sort((a, b) => a - b),
		}));
	};

	const selectAllHours = (day: string) => {
		setAvailability((prev) => ({
			...prev,
			[day]: Array.from({ length: 24 }, (_, i) => i),
		}));
	};

	const clearAllHours = (day: string) => {
		setAvailability((prev) => {
			const newAvailability = { ...prev };
			delete newAvailability[day];
			return newAvailability;
		});
	};

	const copyHoursToAllDays = (sourceDay: string) => {
		const sourceHours = availability[sourceDay] || [];
		if (sourceHours.length === 0) return;
		
		const newAvailability = { ...availability };
		DAYS_OF_WEEK.forEach(day => {
			if (day !== sourceDay) {
				newAvailability[day] = [...sourceHours];
			}
		});
		setAvailability(newAvailability);
		
		// Expand all days to show the copied hours
		const newExpandedDays = { ...expandedDays };
		DAYS_OF_WEEK.forEach(day => {
			newExpandedDays[day] = true;
		});
		setExpandedDays(newExpandedDays);
	};

	const copyHoursToSelectedDays = (sourceDay: string, targetDays: string[]) => {
		const sourceHours = availability[sourceDay] || [];
		if (sourceHours.length === 0) return;
		
		const newAvailability = { ...availability };
		targetDays.forEach(day => {
			if (day !== sourceDay) {
				newAvailability[day] = [...sourceHours];
			}
		});
		setAvailability(newAvailability);
	};

	const copyHoursToAllSelectedDates = (sourceDateKey: string) => {
		const sourceHours = availability[sourceDateKey] || [];
		if (sourceHours.length === 0) return;
		
		const newAvailability = { ...availability };
		selectedDates.forEach(dateKey => {
			if (dateKey !== sourceDateKey) {
				newAvailability[dateKey] = [...sourceHours];
			}
		});
		setAvailability(newAvailability);
		
		// Expand all selected dates to show the copied hours
		const newExpandedDates = { ...expandedCalendarDates };
		selectedDates.forEach(dateKey => {
			newExpandedDates[dateKey] = true;
		});
		setExpandedCalendarDates(newExpandedDates);
	};

	const setCommonWorkingHours = () => {
		const workingHours = [9, 10, 11, 12, 13, 14, 15, 16, 17]; // 9 AM to 5 PM
		const newAvailability = { ...availability };
		DAYS_OF_WEEK.slice(0, 5).forEach(day => { // Monday to Friday
			newAvailability[day] = workingHours;
		});
		setAvailability(newAvailability);
		
		// Expand weekdays to show the hours
		const newExpandedDays = { ...expandedDays };
		DAYS_OF_WEEK.slice(0, 5).forEach(day => {
			newExpandedDays[day] = true;
		});
		setExpandedDays(newExpandedDays);
	};

	const clearAllDays = () => {
		setAvailability({});
		setExpandedDays({});
	};

	const clearAllSelectedDates = () => {
		setAvailability({});
		setExpandedCalendarDates({});
	};

	const getSelectedHoursText = (day: string) => {
		const hours = availability[day] || [];
		if (hours.length === 0) return 'No selected hours';
		if (hours.length === 24) return 'Full day available';
		if (hours.length <= 3) {
			return hours.map((h) => formatHourForLocation(h, userLocale)).join(', ');
		}
		return `${hours.length} hours selected`;
	};

	const isDaySelected = (day: string) => {
		return availability[day] && availability[day].length > 0;
	};

	// Calendar functions
	const generateCalendarDates = () => {
		const today = new Date();
		const startOfCurrentWeek = new Date(today);
		
		// Ajustar para começar na segunda-feira (Monday = 1, Sunday = 0)
		const dayOfWeek = today.getDay();
		const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Se for domingo (0), subtrair 6, senão subtrair (dayOfWeek - 1)
		startOfCurrentWeek.setDate(today.getDate() - daysToSubtract);
		
		const weeks = [];
		
		// Gerar 5 semanas a partir da semana atual
		for (let week = 0; week < 5; week++) {
			const weekDates = [];
			for (let day = 0; day < 7; day++) {
				const date = new Date(startOfCurrentWeek);
				date.setDate(startOfCurrentWeek.getDate() + (week * 7) + day);
				weekDates.push(date);
			}
			weeks.push(weekDates);
		}
		
		return weeks;
	};

	const formatDateKey = (date: Date) => {
		return date.toISOString().split('T')[0];
	};

	const formatDateDisplay = (date: Date) => {
		return date.toLocaleDateString('en-US', { 
			weekday: 'short', 
			month: 'short', 
			day: 'numeric' 
		});
	};

	const toggleCalendarDate = (date: Date) => {
		const dateKey = formatDateKey(date);
		const newSelectedDates = new Set(selectedDates);
		
		if (newSelectedDates.has(dateKey)) {
			newSelectedDates.delete(dateKey);
			// Remove from availability
			const newAvailability = { ...availability };
			delete newAvailability[dateKey];
			setAvailability(newAvailability);
		} else {
			newSelectedDates.add(dateKey);
		}
		
		setSelectedDates(newSelectedDates);
	};

	const toggleCalendarDateExpansion = (date: Date) => {
		const dateKey = formatDateKey(date);
		setExpandedCalendarDates(prev => ({
			...prev,
			[dateKey]: !prev[dateKey]
		}));
	};

	const isDateSelected = (date: Date) => {
		return selectedDates.has(formatDateKey(date));
	};

	const isDateExpanded = (date: Date) => {
		return expandedCalendarDates[formatDateKey(date)];
	};

	const isDateInPast = (date: Date) => {
		const today = new Date();
		today.setHours(0, 0, 0, 0);
		return date < today;
	};

	const calendarDates = generateCalendarDates();

	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
			<div className="rounded-xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto" style={{ backgroundColor: '#161b22' }}>
				<div className="p-6 border-b" style={{ borderColor: '#30363d' }}>
					<div className="flex items-center justify-between">
						<h2 className="text-2xl font-bold text-white flex items-center">
							<User className="mr-3 text-gray-400" size={28} />
							Add Participant
						</h2>
						<button
							onClick={onClose}
							className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
							title="Close (ESC)">
							<X size={24} className="text-gray-400" />
						</button>
					</div>
				</div>

				<form onSubmit={handleSubmit} className="p-6">
					<div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
						<div>
							<label className="block text-sm font-semibold text-gray-300 mb-2">
								Name
							</label>
							<input
								type="text"
								value={name}
								onChange={(e) => setName(e.target.value)}
								className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-white"
								style={{ backgroundColor: '#21262d', borderColor: '#30363d' }}
								placeholder="Enter the participant's name"
								required
							/>
						</div>

						<div>
							<label className="block text-sm font-semibold text-gray-300 mb-2">
								Role
							</label>
							<select
								value={role}
								onChange={(e) => setRole(e.target.value as ParticipantRole)}
								className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-white"
								style={{ backgroundColor: '#21262d', borderColor: '#30363d' }}>
								{PARTICIPANT_ROLES.map((r) => (
									<option key={r} value={r}>
										{r}
									</option>
								))}
							</select>
						</div>

						<div className="md:col-span-2">
							<label className="block text-sm font-semibold text-gray-300 mb-2 flex items-center">
								<MapPin size={16} className="mr-1" />
								Timezone
							</label>
							<select
								value={timezone}
								onChange={(e) => setTimezone(e.target.value)}
								className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-white"
								style={{ backgroundColor: '#21262d', borderColor: '#30363d' }}>
								{TIMEZONE_OPTIONS.map((tz) => (
									<option key={tz.value} value={tz.value}>
										{tz.label}
									</option>
								))}
							</select>
						</div>
					</div>

					{/* Availability Type Selection */}
					<div className="mb-6">
						<label className="block text-sm font-semibold text-gray-300 mb-4">
							Availability Type
						</label>
						
						{/* Show locked message if not first participant */}
						{!isFirstParticipant && (
							<div className="rounded-lg p-4 mb-4 border" style={{ backgroundColor: '#0d1117', borderColor: '#30363d' }}>
								<div className="flex items-start">
									<Info size={16} className="mr-2 text-blue-400 mt-0.5 flex-shrink-0" />
									<div className="text-sm text-gray-300">
										<p className="font-medium mb-1">Availability type is locked</p>
										<p>
											All participants must use the same availability type. The first participant chose{' '}
											<strong>{lockedAvailabilityType === 'weekly' ? 'Weekly Schedule' : 'Specific Dates'}</strong>.
										</p>
									</div>
								</div>
							</div>
						)}
						
						<div className="flex gap-4">
							<label className="flex items-center cursor-pointer">
								<input
									type="radio"
									value="weekly"
									checked={availabilityType === 'weekly'}
									onChange={(e) => handleAvailabilityTypeChange(e.target.value as 'weekly' | 'specific')}
									disabled={!isFirstParticipant}
									className="mr-2"
								/>
								<span className={`${!isFirstParticipant && availabilityType !== 'weekly' ? 'text-gray-500' : 'text-gray-300'}`}>
									Weekly Schedule
								</span>
							</label>
							<label className="flex items-center cursor-pointer">
								<input
									type="radio"
									value="specific"
									checked={availabilityType === 'specific'}
									onChange={(e) => handleAvailabilityTypeChange(e.target.value as 'weekly' | 'specific')}
									disabled={!isFirstParticipant}
									className="mr-2"
								/>
								<span className={`${!isFirstParticipant && availabilityType !== 'specific' ? 'text-gray-500' : 'text-gray-300'}`}>
									Specific Dates
								</span>
							</label>
						</div>
					</div>

					<div>
						<label className="block text-sm font-semibold text-gray-300 mb-4 flex items-center">
							<Calendar size={16} className="mr-1" />
							{availabilityType === 'weekly' ? 'Weekly availability' : 'Specific dates availability'} in the timezone: {formatTimezone(timezone)}
						</label>

						<div className="rounded-lg p-4" style={{ backgroundColor: '#0d1117' }}>
							<div className="rounded-lg p-3 mb-4" style={{ backgroundColor: '#21262d' }}>
								<div className="flex items-start">
									<Clock size={16} className="mr-2 text-gray-400 mt-0.5" />
									<div className="text-sm text-gray-300">
										<p className="font-medium mb-1">Important:</p>
										<p>
											The times you select will be saved in the timezone{' '}
											<strong>{formatTimezone(timezone)}</strong>. They will be
											automatically converted to other timezones in the map
											view.
										</p>
										{uses12HourFormat && (
											<p className="mt-2 text-blue-300">
												<strong>Note:</strong> Times are displayed in {uses12HourFormat ? '12-hour (AM/PM)' : '24-hour'} format based on your location.
											</p>
										)}
									</div>
								</div>
							</div>

							{availabilityType === 'weekly' ? (
								<>
									<p className="text-sm text-gray-400 mb-4">
										Select the days of the week and then choose the schedules 
										available for each day.               
									</p>

									{/* Quick Actions */}
									<div className="space-y-3">
										{DAYS_OF_WEEK.map((day) => (
											<div
												key={day}
												className="rounded-lg border"
												style={{ backgroundColor: '#161b22', borderColor: '#30363d' }}>
												<button
													type="button"
													onClick={() => toggleDay(day)}
													className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-800 transition-colors rounded-lg">
													<div className="flex items-center">
														<Calendar size={16} className="mr-3 text-gray-400" />
														<span className="font-medium text-white">{day}</span>
														{isDaySelected(day) && (
															<span className="ml-3 px-2 py-1 text-gray-300 text-xs rounded-full" style={{ backgroundColor: '#21262d' }}>
																{getSelectedHoursText(day)}
															</span>
														)}
													</div>
													{expandedDays[day] ? (
														<ChevronUp size={20} className="text-gray-400" />
													) : (
														<ChevronDown size={20} className="text-gray-400" />
													)}
												</button>

												{expandedDays[day] && (
													<div className="px-4 pb-4 border-t" style={{ borderColor: '#30363d' }}>
														<div className="flex justify-between items-center mb-3 pt-3">
															<span className="text-sm font-medium text-gray-300">
																Availability for {day} ({formatTimezone(timezone)}):
															</span>
															<div className="flex gap-2">
																{isDaySelected(day) && (
																	<button
																		type="button"
																		onClick={() => copyHoursToAllDays(day)}
																		className="text-xs px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700 transition-colors">
																		Copy to All Days
																	</button>
																)}
																<button
																	type="button"
																	onClick={() => selectAllHours(day)}
																	className="text-xs px-2 py-1 text-gray-300 rounded hover:bg-gray-700 transition-colors"
																	style={{ backgroundColor: '#21262d' }}>
																	Select All
																</button>
																<button
																	type="button"
																	onClick={() => clearAllHours(day)}
																	className="text-xs px-2 py-1 text-gray-300 rounded hover:bg-gray-700 transition-colors"
																	style={{ backgroundColor: '#21262d' }}>
																	Clean
																</button>
															</div>
														</div>

														<div className={`grid gap-2 ${uses12HourFormat ? 'grid-cols-4 sm:grid-cols-6 md:grid-cols-8' : 'grid-cols-6 sm:grid-cols-8 md:grid-cols-12'}`}>
															{Array.from({ length: 24 }, (_, hour) => {
																const isSelected =
																	availability[day]?.includes(hour);
																return (
																	<button
																		key={hour}
																		type="button"
																		onClick={() => toggleTimeSlot(day, hour)}
																		className={`px-2 py-2 text-xs rounded-md border transition-all ${
																			isSelected
																				? 'bg-blue-600 text-white border-blue-500 shadow-sm'
																				: 'text-gray-300 hover:bg-gray-700 border-gray-600 hover:border-gray-500'
																		}`}
																		style={!isSelected ? { backgroundColor: '#21262d' } : {}}>
																		{formatHourForLocation(hour, userLocale)}
																	</button>
																);
															})}
														</div>
													</div>
												)}
											</div>
										))}
									</div>
								</>
							) : (
								<>
									<p className="text-sm text-gray-400 mb-4">
										Select specific dates (next 5 weeks) and then choose the available hours for each selected date.
									</p>

									{/* Calendar Grid */}
									<div className="mb-6">
										<div className="grid grid-cols-7 gap-1 mb-2">
											{['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, index) => (
												<div key={index} className="text-center text-xs font-medium text-gray-400 p-2">
													{day}
												</div>
											))}
										</div>
										
										{calendarDates.map((week, weekIndex) => (
											<div key={weekIndex} className="grid grid-cols-7 gap-1 mb-1">
												{week.map((date, dayIndex) => {
													const isSelected = isDateSelected(date);
													const isToday = date.toDateString() === new Date().toDateString();
													const isPast = isDateInPast(date);
													
													return (
														<button
															key={dayIndex}
															type="button"
															onClick={() => !isPast && toggleCalendarDate(date)}
															disabled={isPast}
															className={`p-2 text-xs rounded border transition-all ${
																isPast
																	? 'text-gray-600 border-gray-700 cursor-not-allowed opacity-50'
																	: isSelected
																	? 'bg-blue-600 text-white border-blue-500'
																	: 'text-gray-300 hover:bg-gray-700 border-gray-600 hover:border-gray-500'
															} ${isToday ? 'ring-1 ring-blue-400' : ''}`}
															style={!isSelected && !isPast ? { backgroundColor: '#21262d' } : {}}>
															{date.getDate()}
														</button>
													);
												})}
											</div>
										))}
									</div>

									{/* Selected Dates Time Selection */}
									{selectedDates.size > 0 && (
										<div className="space-y-3">
											<div className="flex justify-between items-center mb-3">
												<h4 className="text-sm font-medium text-gray-300">
													Configure hours for selected dates:
												</h4>
												<button
													type="button"
													onClick={clearAllSelectedDates}
													className="text-xs px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors">
													Clear All
												</button>
											</div>
											
											{Array.from(selectedDates).sort().map((dateKey) => {
												const date = new Date(`${dateKey}T00:00:00`);
												const isExpanded = isDateExpanded(date);
												
												return (
													<div
														key={dateKey}
														className="rounded-lg border"
														style={{ backgroundColor: '#161b22', borderColor: '#30363d' }}>
														<button
															type="button"
															onClick={() => toggleCalendarDateExpansion(date)}
															className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-800 transition-colors rounded-lg">
															<div className="flex items-center">
																<Calendar size={16} className="mr-3 text-gray-400" />
																<span className="font-medium text-white">{formatDateDisplay(date)}</span>
																{isDaySelected(dateKey) && (
																	<span className="ml-3 px-2 py-1 text-gray-300 text-xs rounded-full" style={{ backgroundColor: '#21262d' }}>
																		{getSelectedHoursText(dateKey)}
																	</span>
																)}
															</div>
															{isExpanded ? (
																<ChevronUp size={20} className="text-gray-400" />
															) : (
																<ChevronDown size={20} className="text-gray-400" />
															)}
														</button>

														{isExpanded && (
															<div className="px-4 pb-4 border-t" style={{ borderColor: '#30363d' }}>
																<div className="flex justify-between items-center mb-3 pt-3">
																	<span className="text-sm font-medium text-gray-300">
																		Availability for {formatDateDisplay(date)} ({formatTimezone(timezone)}):
																	</span>
																	<div className="flex gap-2">
																		{isDaySelected(dateKey) && (
																			<button
																				type="button"
																				onClick={() => copyHoursToAllSelectedDates(dateKey)}
																				className="text-xs px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700 transition-colors">
																				Copy to All Days
																			</button>
																		)}
																		<button
																			type="button"
																			onClick={() => selectAllHours(dateKey)}
																			className="text-xs px-2 py-1 text-gray-300 rounded hover:bg-gray-700 transition-colors"
																			style={{ backgroundColor: '#21262d' }}>
																			Select All
																		</button>
																		<button
																			type="button"
																			onClick={() => clearAllHours(dateKey)}
																			className="text-xs px-2 py-1 text-gray-300 rounded hover:bg-gray-700 transition-colors"
																			style={{ backgroundColor: '#21262d' }}>
																			Clean
																		</button>
																	</div>
																</div>

																<div className={`grid gap-2 ${uses12HourFormat ? 'grid-cols-4 sm:grid-cols-6 md:grid-cols-8' : 'grid-cols-6 sm:grid-cols-8 md:grid-cols-12'}`}>
																	{Array.from({ length: 24 }, (_, hour) => {
																		const isSelected = availability[dateKey]?.includes(hour);
																		return (
																			<button
																				key={hour}
																				type="button"
																				onClick={() => toggleTimeSlot(dateKey, hour)}
																				className={`px-2 py-2 text-xs rounded-md border transition-all ${
																					isSelected
																						? 'bg-blue-600 text-white border-blue-500 shadow-sm'
																						: 'text-gray-300 hover:bg-gray-700 border-gray-600 hover:border-gray-500'
																				}`}
																				style={!isSelected ? { backgroundColor: '#21262d' } : {}}>
																				{formatHourForLocation(hour, userLocale)}
																			</button>
																		);
																	})}
																</div>
															</div>
														)}
													</div>
												);
											})}
										</div>
									)}
								</>
							)}
						</div>
					</div>

					<div className="flex justify-end gap-3 mt-8">
						<button
							type="button"
							onClick={onClose}
							className="px-6 py-3 border rounded-lg text-gray-300 hover:bg-gray-700 transition-colors font-medium"
							style={{ borderColor: '#30363d' }}>
							Cancel
						</button>
						<button
							type="submit"
							disabled={!name.trim()}
							className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center">
							<Plus size={18} className="mr-2" />
							Add Participant
						</button>
					</div>
				</form>
			</div>
		</div>
	);
};