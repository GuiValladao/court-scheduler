import { Participant } from '../types';

const STORAGE_KEY = 'rp-court-participants';

export const saveParticipants = (participants: Participant[]): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(participants));
  } catch (error) {
    console.error('Failed to save participants:', error);
  }
};

export const loadParticipants = (): Participant[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Failed to load participants:', error);
    return [];
  }
};

export const clearParticipants = (): void => {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear participants:', error);
  }
};