import React from 'react';
import { Participant, PARTICIPANT_COLORS } from '../types';
import { formatTime, getUserLocale } from '../utils/timezone';
import { zonedTimeToUtc, utcToZonedTime } from 'date-fns-tz';

interface AvailabilityMapProps {
	participants: Participant[];
	userTimezone: string;
}

export const AvailabilityMap: React.FC<AvailabilityMapProps> = ({
	participants,
	userTimezone,
}) => {
	const hours = Array.from({ length: 24 }, (_, i) => i);
	const days = [
		'Monday',
		'Tuesday',
		'Wednesday',
		'Thursday',
		'Friday',
		'Saturday',
		'Sunday',
	];
	const userLocale = getUserLocale();

	const availabilityType =
		participants.length > 0 ? participants[0].availabilityType : 'weekly';

	const convertTimeSlotSpecific = (
		participantTimezone: string,
		userTimezone: string,
		participantDateKey: string,
		participantHour: number
	): { date: string; hour: number; dayName: string } => {
		try {
			// Cria uma string de data/hora que representa o horário local do participante,
			// sem que o JavaScript a interprete no fuso horário do navegador.
			const participantDateTimeString = `${participantDateKey}T${participantHour
				.toString()
				.padStart(2, '0')}:00:00`;

			// Converte a string (interpretada no fuso do participante) para UTC.
			const utcTime = zonedTimeToUtc(
				participantDateTimeString,
				participantTimezone
			);

			const userDateTime = utcToZonedTime(utcTime, userTimezone);

			const userYear = userDateTime.getFullYear();
			const userMonth = userDateTime.getMonth();
			const userDay = userDateTime.getDate();
			const userHour = userDateTime.getHours();

			const userDateString = `${userYear}-${(userMonth + 1)
				.toString()
				.padStart(2, '0')}-${userDay.toString().padStart(2, '0')}`;

			const userDayOfWeek = userDateTime.getDay();
			const userDayIndex = userDayOfWeek === 0 ? 6 : userDayOfWeek - 1;
			const dayName = days[userDayIndex];

			return {
				date: userDateString,
				hour: userHour,
				dayName: dayName,
			};
		} catch (error) {
			console.error('Error in specific timezone conversion:', error);
			return {
				date: participantDateKey,
				hour: participantHour,
				dayName: 'Monday',
			};
		}
	};

	// Get all possible dates that could show availability after timezone conversion
	const getAllPossibleDates = (): string[] => {
		const allDates = new Set<string>();

		participants.forEach((participant) => {
			if (participant.availabilityType === 'specific') {
				Object.entries(participant.availability).forEach(([dateKey, hours]) => {
					// For each hour, check what date it converts to in user timezone
					hours.forEach((hour) => {
						const converted = convertTimeSlotSpecific(
							participant.timezone,
							userTimezone,
							dateKey,
							hour
						);
						allDates.add(converted.date);
					});
				});
			}
		});

		return Array.from(allDates).sort();
	};

	const specificDates =
		availabilityType === 'specific' ? getAllPossibleDates() : [];

	// Calculate availability for each time slot in user's timezone
	const getAvailabilityData = (
		day: string,
		hour: number,
		specificDate?: string
	): {
		participants: Participant[];
		count: number;
		participantNames: string[];
	} => {
		const availableParticipants: Participant[] = [];

		participants.forEach((participant) => {
			if (participant.availabilityType === 'weekly' && !specificDate) {
				// Handle weekly availability (EXISTING WORKING LOGIC - unchanged)
				Object.entries(participant.availability).forEach(
					([participantDay, participantHours]) => {
						participantHours.forEach((participantHour) => {
							try {
								const now = new Date();
								const currentYear = now.getFullYear();
								const currentMonth = now.getMonth();

								const today = new Date(
									currentYear,
									currentMonth,
									now.getDate()
								);
								const todayDayIndex = today.getDay();

								const dayIndex = days.indexOf(participantDay);
								if (dayIndex === -1) return;

								const jsDayIndex = dayIndex === 6 ? 0 : dayIndex + 1;
								let daysToAdd = jsDayIndex - todayDayIndex;
								if (daysToAdd < 0) daysToAdd += 7;

								const targetDate = new Date(today);
								targetDate.setDate(today.getDate() + daysToAdd);
								targetDate.setHours(participantHour, 0, 0, 0);

								// Convert to user timezone using date-fns-tz
								const utcTime = zonedTimeToUtc(
									targetDate,
									participant.timezone
								);
								const userDateTime = utcToZonedTime(utcTime, userTimezone);

								const userDayOfWeek = userDateTime.getDay();
								const userDayIndex =
									userDayOfWeek === 0 ? 6 : userDayOfWeek - 1;
								const userDay = days[userDayIndex];
								const userHour = userDateTime.getHours();

								if (userDay === day && userHour === hour) {
									availableParticipants.push(participant);
								}
							} catch (error) {
								console.error('Error in weekly conversion:', error);
							}
						});
					}
				);
			} else if (participant.availabilityType === 'specific' && specificDate) {
				// Handle specific dates availability using the FINAL CORRECTED logic
				Object.entries(participant.availability).forEach(
					([participantDateKey, participantHours]) => {
						participantHours.forEach((participantHour) => {
							const converted = convertTimeSlotSpecific(
								participant.timezone,
								userTimezone,
								participantDateKey,
								participantHour
							);

							// Check if the converted time matches the current slot
							if (
								converted.date === specificDate &&
								converted.hour === hour &&
								converted.dayName === day
							) {
								availableParticipants.push(participant);
							}
						});
					}
				);
			}
		});

		return {
			participants: availableParticipants,
			count: availableParticipants.length,
			participantNames: availableParticipants.map((p) => p.name),
		};
	};

	// Get participant color by index
	const getParticipantColor = (participantId: string): string => {
		const index = participants.findIndex((p) => p.id === participantId);
		return PARTICIPANT_COLORS[index % PARTICIPANT_COLORS.length];
	};

	// Render the time slot with participant colors
	const renderTimeSlot = (day: string, hour: number, specificDate?: string) => {
		const {
			participants: availableParticipants,
			count,
			participantNames,
		} = getAvailabilityData(day, hour, specificDate);

		if (count === 0) {
			return (
				<div
					className="rounded border p-2 text-center min-h-[32px]"
					style={{ backgroundColor: '#21262d', borderColor: '#30363d' }}></div>
			);
		}

		const totalParticipants = participants.length;
		const isAllParticipants = count === totalParticipants;

		const displayDate = specificDate
			? new Date(specificDate + 'T12:00:00').toLocaleDateString('en-US', {
					month: 'short',
					day: 'numeric',
			  })
			: '';

		return (
			<div
				className="rounded border p-2 text-center transition-all hover:scale-105 cursor-pointer group relative min-h-[32px] overflow-hidden"
				style={{ borderColor: '#30363d' }}>
				{/* Color segments */}
				<div className="absolute inset-0 flex">
					{availableParticipants.map((participant, index) => {
						const color = getParticipantColor(participant.id);
						const widthPercentage = 100 / count;

						return (
							<div
								key={participant.id}
								className="flex-shrink-0"
								style={{
									backgroundColor: color,
									width: `${widthPercentage}%`,
								}}
							/>
						);
					})}
				</div>

				{/* Text overlay */}
				<div className="relative z-10 text-xs font-medium text-white drop-shadow-sm">
					{isAllParticipants ? 'all' : count}
				</div>

				{/* Tooltip */}
				<div
					className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-20 border shadow-lg"
					style={{ backgroundColor: '#161b22', borderColor: '#30363d' }}>
					<div className="font-medium">
						{specificDate ? `${displayDate} (${day})` : day}{' '}
						{formatTime(hour, userLocale)}
					</div>
					<div className="text-gray-300 mt-1">
						{count}/{totalParticipants} available
					</div>
					{participantNames.length > 0 && (
						<div className="text-gray-300 mt-1 text-left">
							{participantNames.join(', ')}
						</div>
					)}
				</div>
			</div>
		);
	};

	if (participants.length === 0) {
		return (
			<div
				className="rounded-xl shadow-lg border p-8"
				style={{ backgroundColor: '#161b22', borderColor: '#30363d' }}>
				<h2 className="text-xl font-bold text-white mb-4">
					Availability Overview
				</h2>
				<div className="text-center py-12">
					<div className="text-gray-500 mb-4">
						<svg
							className="mx-auto w-16 h-16 mb-4"
							fill="currentColor"
							viewBox="0 0 20 20">
							<path
								fillRule="evenodd"
								d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
								clipRule="evenodd"
							/>
						</svg>
					</div>
					<p className="text-gray-400 text-lg">
						Add participants to see availability patterns
					</p>
				</div>
			</div>
		);
	}

	return (
		<div
			className="rounded-xl shadow-lg border p-6"
			style={{ backgroundColor: '#161b22', borderColor: '#30363d' }}>
			<div className="flex items-center justify-between mb-6">
				<h2 className="text-xl font-bold text-white">
					Availability Overview -{' '}
					{availabilityType === 'weekly' ? 'Weekly Pattern' : 'Specific Dates'}
				</h2>
				<div className="flex items-center space-x-4 text-sm">
					<div className="flex items-center">
						<div
							className="w-3 h-3 rounded mr-2"
							style={{ backgroundColor: '#21262d' }}></div>
						<span className="text-gray-400">No availability</span>
					</div>
					<div className="flex items-center space-x-2">
						<span className="text-gray-400">Participants:</span>
						{participants.slice(0, 6).map((participant, index) => (
							<div key={participant.id} className="flex items-center">
								<div
									className="w-3 h-3 rounded mr-1"
									style={{
										backgroundColor: getParticipantColor(participant.id),
									}}></div>
								<span className="text-gray-300 text-xs">
									{participant.name}
								</span>
							</div>
						))}
						{participants.length > 6 && (
							<span className="text-gray-400 text-xs">
								+{participants.length - 6} more
							</span>
						)}
					</div>
				</div>
			</div>

			<div className="overflow-x-auto">
				<div className="min-w-full">
					{availabilityType === 'weekly' ? (
						<>
							{/* Weekly Pattern View */}
							<div
								className="grid gap-1 mb-2"
								style={{
									gridTemplateColumns: '60px repeat(7, minmax(100px, 1fr))',
								}}>
								<div className="text-xs font-medium text-gray-400 p-2"></div>
								{days.map((day) => (
									<div
										key={day}
										className="text-xs font-medium text-gray-300 p-2 text-center">
										{day}
									</div>
								))}
							</div>

							<div className="space-y-1">
								{hours.map((hour) => (
									<div
										key={hour}
										className="grid gap-1"
										style={{
											gridTemplateColumns: '60px repeat(7, minmax(100px, 1fr))',
										}}>
										<div className="text-xs text-gray-400 p-2 text-right font-mono pr-3">
											{formatTime(hour, userLocale)}
										</div>
										{days.map((day) => (
											<div key={`${day}-${hour}`}>
												{renderTimeSlot(day, hour)}
											</div>
										))}
									</div>
								))}
							</div>
						</>
					) : (
						<>
							{/* Compact Specific Dates View */}
							{specificDates.length === 0 ? (
								<div className="text-center py-8">
									<p className="text-gray-400">
										No specific dates selected by participants yet.
									</p>
								</div>
							) : (
								<>
									{/* Header with dates */}
									<div
										className="grid gap-1 mb-2"
										style={{
											gridTemplateColumns: `60px repeat(${specificDates.length}, minmax(120px, 1fr))`,
										}}>
										<div className="text-xs font-medium text-gray-400 p-2"></div>
										{specificDates.map((dateKey) => {
											const date = new Date(dateKey + 'T12:00:00');
											const dayOfWeek = date.getDay();

											// Convert to our Monday-first format for display
											const mondayFirstDays = [
												'Monday',
												'Tuesday',
												'Wednesday',
												'Thursday',
												'Friday',
												'Saturday',
												'Sunday',
											];
											const mondayFirstIndex =
												dayOfWeek === 0 ? 6 : dayOfWeek - 1;
											const displayDayName = mondayFirstDays[mondayFirstIndex];

											const formattedDate = date.toLocaleDateString('en-US', {
												month: 'short',
												day: 'numeric',
											});

											return (
												<div
													key={dateKey}
													className="text-xs font-medium text-gray-300 p-2 text-center">
													<div className="font-semibold">{formattedDate}</div>
													<div className="text-gray-400 text-xs mt-1">
														{displayDayName}
													</div>
												</div>
											);
										})}
									</div>

									{/* Time slots grid */}
									<div className="space-y-1">
										{hours.map((hour) => (
											<div
												key={hour}
												className="grid gap-1"
												style={{
													gridTemplateColumns: `60px repeat(${specificDates.length}, minmax(120px, 1fr))`,
												}}>
												<div className="text-xs text-gray-400 p-2 text-right font-mono pr-3">
													{formatTime(hour, userLocale)}
												</div>
												{specificDates.map((dateKey) => {
													const date = new Date(dateKey + 'T12:00:00');
													const dayOfWeek = date.getDay();

													// Convert to our Monday-first format
													const mondayFirstDays = [
														'Monday',
														'Tuesday',
														'Wednesday',
														'Thursday',
														'Friday',
														'Saturday',
														'Sunday',
													];
													const mondayFirstIndex =
														dayOfWeek === 0 ? 6 : dayOfWeek - 1;
													const displayDayName =
														mondayFirstDays[mondayFirstIndex];

													return (
														<div key={`${dateKey}-${hour}`}>
															{renderTimeSlot(displayDayName, hour, dateKey)}
														</div>
													);
												})}
											</div>
										))}
									</div>

									{/* Summary info */}
									<div
										className="mt-4 p-3 rounded-lg border"
										style={{
											backgroundColor: '#0d1117',
											borderColor: '#30363d',
										}}>
										<div className="text-sm text-gray-300">
											<span className="font-medium">Showing dates:</span>{' '}
											{specificDates.length} date
											{specificDates.length !== 1 ? 's' : ''}
											<span className="ml-4 text-gray-400">
												(includes timezone-converted dates)
											</span>
										</div>
									</div>
								</>
							)}
						</>
					)}
				</div>
			</div>

			{/* Legend */}
			<div className="mt-6 pt-4 border-t" style={{ borderColor: '#30363d' }}>
				<div className="flex items-center justify-between text-sm text-gray-400">
					<span>All times shown in: {userTimezone.replace('_', ' ')}</span>
					<span>Hover over time slots to see participant details</span>
				</div>
			</div>
		</div>
	);
};
