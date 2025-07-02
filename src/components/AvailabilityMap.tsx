import React from 'react';
import { Participant, PARTICIPANT_COLORS } from '../types';
import { formatTime, getUserLocale, convertTimeSlot } from '../utils/timezone';

interface AvailabilityMapProps {
  participants: Participant[];
  userTimezone: string;
}

export const AvailabilityMap: React.FC<AvailabilityMapProps> = ({ 
  participants, 
  userTimezone 
}) => {
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const userLocale = getUserLocale();

  // Calculate availability for each time slot in user's timezone
  const getAvailabilityData = (day: string, hour: number): { 
    participants: Participant[]; 
    count: number; 
    participantNames: string[] 
  } => {
    const availableParticipants: Participant[] = [];
    
    participants.forEach(participant => {
      // For each day/hour in participant's availability, convert to user's timezone
      Object.entries(participant.availability).forEach(([participantDay, participantHours]) => {
        participantHours.forEach(participantHour => {
          const converted = convertTimeSlot(
            participant.timezone,
            userTimezone,
            participantDay,
            participantHour
          );
          
          // Check if this converted time matches the current slot we're checking
          if (converted.day === day && converted.hour === hour) {
            availableParticipants.push(participant);
          }
        });
      });
    });
    
    return {
      participants: availableParticipants,
      count: availableParticipants.length,
      participantNames: availableParticipants.map(p => p.name)
    };
  };

  // Get participant color by index
  const getParticipantColor = (participantId: string): string => {
    const index = participants.findIndex(p => p.id === participantId);
    return PARTICIPANT_COLORS[index % PARTICIPANT_COLORS.length];
  };

  // Render the time slot with participant colors
  const renderTimeSlot = (day: string, hour: number) => {
    const { participants: availableParticipants, count, participantNames } = getAvailabilityData(day, hour);
    
    if (count === 0) {
      return (
        <div className="rounded border p-2 text-center min-h-[32px]" style={{ backgroundColor: '#21262d', borderColor: '#30363d' }}>
        </div>
      );
    }

    const totalParticipants = participants.length;
    const isAllParticipants = count === totalParticipants;

    return (
      <div className="rounded border p-2 text-center transition-all hover:scale-105 cursor-pointer group relative min-h-[32px] overflow-hidden" style={{ borderColor: '#30363d' }}>
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
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-20 border shadow-lg" style={{ backgroundColor: '#161b22', borderColor: '#30363d' }}>
          <div className="font-medium">{day} {formatTime(hour, userLocale)}</div>
          <div className="text-gray-300 mt-1">{count}/{totalParticipants} available</div>
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
      <div className="rounded-xl shadow-lg border p-8" style={{ backgroundColor: '#161b22', borderColor: '#30363d' }}>
        <h2 className="text-xl font-bold text-white mb-4">Availability Overview</h2>
        <div className="text-center py-12">
          <div className="text-gray-500 mb-4">
            <svg className="mx-auto w-16 h-16 mb-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
            </svg>
          </div>
          <p className="text-gray-400 text-lg">Add participants to see availability patterns</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl shadow-lg border p-6" style={{ backgroundColor: '#161b22', borderColor: '#30363d' }}>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-white">Availability Overview</h2>
        <div className="flex items-center space-x-4 text-sm">
          <div className="flex items-center">
            <div className="w-3 h-3 rounded mr-2" style={{ backgroundColor: '#21262d' }}></div>
            <span className="text-gray-400">No availability</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-gray-400">Participants:</span>
            {participants.slice(0, 6).map((participant, index) => (
              <div key={participant.id} className="flex items-center">
                <div 
                  className="w-3 h-3 rounded mr-1" 
                  style={{ backgroundColor: getParticipantColor(participant.id) }}
                ></div>
                <span className="text-gray-300 text-xs">{participant.name}</span>
              </div>
            ))}
            {participants.length > 6 && (
              <span className="text-gray-400 text-xs">+{participants.length - 6} more</span>
            )}
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-full">
          {/* Header with days */}
          <div className="grid gap-1 mb-2" style={{ gridTemplateColumns: '60px repeat(7, minmax(100px, 1fr))' }}>
            <div className="text-xs font-medium text-gray-400 p-2"></div>
            {days.map(day => (
              <div key={day} className="text-xs font-medium text-gray-300 p-2 text-center">
                {day}
              </div>
            ))}
          </div>

          {/* Time slots grid */}
          <div className="space-y-1">
            {hours.map(hour => (
              <div key={hour} className="grid gap-1" style={{ gridTemplateColumns: '60px repeat(7, minmax(100px, 1fr))' }}>
                <div className="text-xs text-gray-400 p-2 text-right font-mono pr-3">
                  {formatTime(hour, userLocale)}
                </div>
                {days.map(day => (
                  <div key={`${day}-${hour}`}>
                    {renderTimeSlot(day, hour)}
                  </div>
                ))}
              </div>
            ))}
          </div>
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