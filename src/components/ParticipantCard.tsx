import React from 'react';
import { Trash2, MapPin, Clock } from 'lucide-react';
import { Participant, ROLE_COLORS } from '../types';
import { formatTimezone, formatDate, getUserLocale } from '../utils/timezone';

interface ParticipantCardProps {
  participant: Participant;
  onRemove: (id: string) => void;
}

export const ParticipantCard: React.FC<ParticipantCardProps> = ({
  participant,
  onRemove
}) => {
  const userLocale = getUserLocale();

  const getTotalAvailableHours = () => {
    return Object.values(participant.availability).reduce(
      (total, hours) => total + hours.length, 
      0
    );
  };

  return (
    <div className="rounded-lg border p-4 hover:shadow-lg transition-shadow" style={{ backgroundColor: '#161b22', borderColor: '#30363d' }}>
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-semibold text-white text-lg">
            {participant.name}
          </h3>
          <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium border ${ROLE_COLORS[participant.role]}`}>
            {participant.role}
          </span>
        </div>
        <button
          onClick={() => onRemove(participant.id)}
          className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-900/20 rounded-lg transition-colors"
          title="Remove participant"
        >
          <Trash2 size={18} />
        </button>
      </div>

      <div className="space-y-2 text-sm text-gray-400">
        <div className="flex items-center">
          <MapPin size={14} className="mr-2 text-gray-500" />
          <span>{formatTimezone(participant.timezone)}</span>
        </div>
        <div className="flex items-center">
          <Clock size={14} className="mr-2 text-gray-500" />
          <span>{getTotalAvailableHours()} hours available per week</span>
        </div>
      </div>

      <div className="mt-3 text-xs text-gray-500">
        Added {formatDate(participant.createdAt, userLocale)}
      </div>
    </div>
  );
};