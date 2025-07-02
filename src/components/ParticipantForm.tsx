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
} from 'lucide-react';
import {
	Participant,
	ParticipantRole,
	PARTICIPANT_ROLES,
	DAYS_OF_WEEK,
} from '../types';
import { formatTimezone } from '../utils/timezone';
import { COMMON_TIMEZONES } from '../utils/timezones';

interface ParticipantFormProps {
	isOpen: boolean;
	onClose: () => void;
	onSubmit: (participant: Omit<Participant, 'id' | 'createdAt'>) => void;
	userTimezone: string;
}

export const ParticipantForm: React.FC<ParticipantFormProps> = ({
	isOpen,
	onClose,
	onSubmit,
	userTimezone,
}) => {
	const [name, setName] = useState('');
	const [role, setRole] = useState<ParticipantRole>('Witness');
	const [timezone, setTimezone] = useState(userTimezone);
	const [availability, setAvailability] = useState<{ [day: string]: number[] }>(
		{}
	);
	const [expandedDays, setExpandedDays] = useState<{ [day: string]: boolean }>(
		{}
	);

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

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (!name.trim()) return;

		onSubmit({
			name: name.trim(),
			role,
			timezone,
			availability,
		});

		// Reset form
		setName('');
		setRole('Witness');
		setTimezone(userTimezone);
		setAvailability({});
		setExpandedDays({});
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

	const formatHour = (hour: number) => {
		return `${hour.toString().padStart(2, '0')}:00`;
	};

	const getSelectedHoursText = (day: string) => {
		const hours = availability[day] || [];
		if (hours.length === 0) return 'No selected hours';
		if (hours.length === 24) return 'Full day available';
		if (hours.length <= 3) {
			return hours.map((h) => formatHour(h)).join(', ');
		}
		return `${hours.length} hours selected`;
	};

	const isDaySelected = (day: string) => {
		return availability[day] && availability[day].length > 0;
	};

	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
			<div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
				<div className="p-6 border-b border-gray-200">
					<div className="flex items-center justify-between">
						<h2 className="text-2xl font-bold text-gray-900 flex items-center">
							<User className="mr-3 text-gray-700" size={28} />
							Add Participant
						</h2>
						<button
							onClick={onClose}
							className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
							title="Close (ESC)">
							<X size={24} className="text-gray-500" />
						</button>
					</div>
				</div>

				<form onSubmit={handleSubmit} className="p-6">
					<div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
						<div>
							<label className="block text-sm font-semibold text-gray-700 mb-2">
								Name
							</label>
							<input
								type="text"
								value={name}
								onChange={(e) => setName(e.target.value)}
								className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent transition-all"
								placeholder="Enter the participant's name"
								required
							/>
						</div>

						<div>
							<label className="block text-sm font-semibold text-gray-700 mb-2">
								Role
							</label>
							<select
								value={role}
								onChange={(e) => setRole(e.target.value as ParticipantRole)}
								className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent transition-all">
								{PARTICIPANT_ROLES.map((r) => (
									<option key={r} value={r}>
										{r}
									</option>
								))}
							</select>
						</div>

						<div className="md:col-span-2">
							<label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center">
								<MapPin size={16} className="mr-1" />
								Timezone
							</label>
							<select
								value={timezone}
								onChange={(e) => setTimezone(e.target.value)}
								className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent transition-all">
								{COMMON_TIMEZONES.map((tz) => (
									<option key={tz} value={tz}>
										{formatTimezone(tz)}
									</option>
								))}
							</select>
						</div>
					</div>

					<div>
						<label className="block text-sm font-semibold text-gray-700 mb-4 flex items-center">
							<Calendar size={16} className="mr-1" />
							Availability in the timezone: {formatTimezone(timezone)}
						</label>

						<div className="bg-gray-50 p-4 rounded-lg">
							<div className="bg-gray-100 p-3 rounded-lg mb-4">
								<div className="flex items-start">
									<Clock size={16} className="mr-2 text-gray-600 mt-0.5" />
									<div className="text-sm text-gray-800">
										<p className="font-medium mb-1">Important:</p>
										<p>
											The times you select will be saved in the timezone{' '}
											<strong>{formatTimezone(timezone)}</strong>. They will be
											automatically converted to other timezones in the map
											view.
										</p>
									</div>
								</div>
							</div>

							<p className="text-sm text-gray-600 mb-4">
								Select the days of the week and then choose the schedules 
                available for each day.               
							</p>

							<div className="space-y-3">
								{DAYS_OF_WEEK.map((day) => (
									<div
										key={day}
										className="bg-white rounded-lg border border-gray-200">
										<button
											type="button"
											onClick={() => toggleDay(day)}
											className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors rounded-lg">
											<div className="flex items-center">
												<Calendar size={16} className="mr-3 text-gray-400" />
												<span className="font-medium text-gray-900">{day}</span>
												{isDaySelected(day) && (
													<span className="ml-3 px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full">
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
											<div className="px-4 pb-4 border-t border-gray-100">
												<div className="flex justify-between items-center mb-3 pt-3">
													<span className="text-sm font-medium text-gray-700">
														Availability for {day} ({formatTimezone(timezone)}):
													</span>
													<div className="flex gap-2">
														<button
															type="button"
															onClick={() => selectAllHours(day)}
															className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors">
															Select All
														</button>
														<button
															type="button"
															onClick={() => clearAllHours(day)}
															className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors">
															Clean
														</button>
													</div>
												</div>

												<div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-12 gap-2">
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
																		? 'bg-gray-700 text-white border-gray-800 shadow-sm'
																		: 'bg-white hover:bg-gray-50 border-gray-200 text-gray-700 hover:border-gray-300'
																}`}>
																{formatHour(hour)}
															</button>
														);
													})}
												</div>
											</div>
										)}
									</div>
								))}
							</div>
						</div>
					</div>

					<div className="flex justify-end gap-3 mt-8">
						<button
							type="button"
							onClick={onClose}
							className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium">
							Cancel
						</button>
						<button
							type="submit"
							disabled={!name.trim()}
							className="px-6 py-3 bg-gray-800 text-white rounded-lg hover:bg-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center">
							<Plus size={18} className="mr-2" />
							Add Participant
						</button>
					</div>
				</form>
			</div>
		</div>
	);
};