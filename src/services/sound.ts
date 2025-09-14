import { Audio } from 'expo-av';

export class SoundService {
  private stepCompleteSound: Audio.Sound | null = null;

  async loadSounds(): Promise<void> {
    try {
      // Load the step completion sound
      const { sound } = await Audio.Sound.createAsync(
        require('../../assets/sounds/step-complete.wav')
      );
      this.stepCompleteSound = sound;
    } catch (error) {
      console.error('Error loading sounds:', error);
    }
  }

  async playStepCompleteSound(): Promise<void> {
    try {
      if (this.stepCompleteSound) {
        await this.stepCompleteSound.replayAsync();
      }
    } catch (error) {
      console.error('Error playing step complete sound:', error);
    }
  }

  async unloadSounds(): Promise<void> {
    try {
      if (this.stepCompleteSound) {
        await this.stepCompleteSound.unloadAsync();
        this.stepCompleteSound = null;
      }
    } catch (error) {
      console.error('Error unloading sounds:', error);
    }
  }
}

export const soundService = new SoundService();