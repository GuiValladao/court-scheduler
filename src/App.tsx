import React, { useState, useEffect } from 'react';
import { Users, Plus, Trash } from 'lucide-react';
import { Participant } from './types';
import { ParticipantForm } from './components/ParticipantForm';
import { AvailabilityMap } from './components/AvailabilityMap';
import { ParticipantCard } from './components/ParticipantCard';
import { getUserTimezone } from './utils/timezone';
import { saveParticipants, loadParticipants, clearParticipants } from './utils/storage';

function App() {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [userTimezone, setUserTimezone] = useState<string>('UTC');

  useEffect(() => {
    // Detect user timezone
    const timezone = getUserTimezone();
    setUserTimezone(timezone);

    // Load saved participants
    const savedParticipants = loadParticipants();
    setParticipants(savedParticipants);
  }, []);

  useEffect(() => {
    // Save participants whenever the list changes
    saveParticipants(participants);
  }, [participants]);

  const handleAddParticipant = (participantData: Omit<Participant, 'id' | 'createdAt'>) => {
    const newParticipant: Participant = {
      ...participantData,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString()
    };
    
    setParticipants(prev => [...prev, newParticipant]);
  };

  const handleRemoveParticipant = (id: string) => {
    setParticipants(prev => prev.filter(p => p.id !== id));
  };

  const handleClearAll = () => {
    if (window.confirm('Are you sure you want to remove all participants?')) {
      setParticipants([]);
      clearParticipants();
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#0d1117' }}>
      {/* Header */}
      <header className="shadow-lg border-b" style={{ backgroundColor: '#010409', borderColor: '#21262d' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div>
                <h1 className="text-3xl font-bold text-white">
                  Court Scheduler
                </h1>
                <p className="text-gray-400 mt-1">
                  Coordinate hearings across timezones with ease
                </p>
              </div>
            </div>
            <div className="text-sm text-gray-500">
              Your timezone: <span className="font-medium text-gray-300">{userTimezone.replace('_', ' ')}</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Action Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div className="flex items-center text-gray-400">
            <Users className="mr-2" size={20} />
            <span className="font-medium">{participants.length} participants</span>
            {participants.length > 0 && (
              <span className="ml-2 text-sm">
                • {participants.reduce((total, p) => 
                  total + Object.values(p.availability).reduce((sum, hours) => sum + hours.length, 0), 0
                )} total available hours
              </span>
            )}
          </div>
          
          <div className="flex gap-3">
            {participants.length > 0 && (
              <button
                onClick={handleClearAll}
                className="px-4 py-2 border border-red-600 text-red-400 rounded-lg hover:bg-red-900/20 transition-colors font-medium flex items-center"
              >
                <Trash size={18} className="mr-2" />
                Clear All
              </button>
            )}
            <button
              onClick={() => setIsFormOpen(true)}
              className="px-6 py-2 bg-white text-black rounded-lg hover:bg-gray-200 transition-colors font-medium flex items-center shadow-sm"
            >
              <Plus size={18} className="mr-2" />
              Add Participant
            </button>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-6 gap-8">
          {/* Participants List - Narrower on larger screens */}
          <div className="xl:col-span-1">
            <h2 className="text-lg font-semibold text-white mb-4">Participants</h2>
            
            {participants.length === 0 ? (
              <div className="rounded-lg border p-6 text-center" style={{ backgroundColor: '#161b22', borderColor: '#30363d' }}>
                <Users className="mx-auto text-gray-500 mb-3" size={40} />
                <p className="text-gray-400 mb-4">No participants yet</p>
                <button
                  onClick={() => setIsFormOpen(true)}
                  className="text-white hover:text-gray-300 font-medium"
                >
                  Add the first participant
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {participants.map(participant => (
                  <ParticipantCard
                    key={participant.id}
                    participant={participant}
                    onRemove={handleRemoveParticipant}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Availability Map - Much wider space */}
          <div className="xl:col-span-5">
            <AvailabilityMap 
              participants={participants}
              userTimezone={userTimezone}
            />
          </div>
        </div>
      </main>

      {/* Participant Form Modal */}
      <ParticipantForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleAddParticipant}
        userTimezone={userTimezone}
      />
    </div>
  );
}

export default App;