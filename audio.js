// Audio Manager for Cookie Clicker - Música Removida
class AudioManager {
    constructor() {
        this.sounds = {};
        this.isSoundEnabled = true;
        this.volume = 0.5;
        
        this.initAudio();
        this.loadSettings();
    }

    initAudio() {
        // Create audio context for web audio API
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            console.log('Web Audio API not supported');
        }

        // Create sound effects only (no music)
        this.createSounds();
    }

    createSounds() {
        // Click sound
        this.sounds.click = this.createSound(this.getClickSound());
        
        // Purchase sound
        this.sounds.purchase = this.createSound(this.getPurchaseSound());
        
        // Achievement sound
        this.sounds.achievement = this.createSound(this.getAchievementSound());
    }

    createSound(src) {
        const audio = new Audio();
        audio.src = src;
        audio.preload = 'auto';
        return audio;
    }

    // Generate sounds using Web Audio API
    getClickSound() {
        return this.generateTone(800, 0.1, 50);
    }

    getPurchaseSound() {
        return this.generateTone(600, 0.3, 3);
    }

    getAchievementSound() {
        return this.generateTone(800, 0.5, 2);
    }

    generateTone(frequency, duration, decay) {
        if (!this.audioContext) return '';
        
        const sampleRate = this.audioContext.sampleRate;
        const length = sampleRate * duration;
        const buffer = this.audioContext.createBuffer(1, length, sampleRate);
        const data = buffer.getChannelData(0);
        
        for (let i = 0; i < length; i++) {
            const t = i / sampleRate;
            data[i] = Math.exp(-t * decay) * Math.sin(2 * Math.PI * frequency * t) * 0.3;
        }
        
        return this.bufferToWave(buffer, length);
    }

    bufferToWave(buffer, len) {
        const length = len;
        const sampleRate = buffer.sampleRate;
        const arrayBuffer = new ArrayBuffer(44 + length * 2);
        const view = new DataView(arrayBuffer);
        
        const writeString = (offset, string) => {
            for (let i = 0; i < string.length; i++) {
                view.setUint8(offset + i, string.charCodeAt(i));
            }
        };
        
        writeString(0, 'RIFF');
        view.setUint32(4, 36 + length * 2, true);
        writeString(8, 'WAVE');
        writeString(12, 'fmt ');
        view.setUint32(16, 16, true);
        view.setUint16(20, 1, true);
        view.setUint16(22, 1, true);
        view.setUint32(24, sampleRate, true);
        view.setUint32(28, sampleRate * 2, true);
        view.setUint16(32, 2, true);
        view.setUint16(34, 16, true);
        writeString(36, 'data');
        view.setUint32(40, length * 2, true);
        
        const float32Array = buffer.getChannelData(0);
        const int16Array = new Int16Array(length);
        for (let i = 0; i < length; i++) {
            const s = Math.max(-1, Math.min(1, float32Array[i]));
            int16Array[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
        }
        
        const int16View = new DataView(int16Array.buffer);
        for (let i = 0; i < length; i++) {
            view.setInt16(44 + i * 2, int16View.getInt16(i * 2), true);
        }
        
        return URL.createObjectURL(new Blob([arrayBuffer], { type: 'audio/wav' }));
    }

    playSound(soundName) {
        if (!this.isSoundEnabled || !this.sounds[soundName]) return;
        
        const sound = this.sounds[soundName].cloneNode();
        sound.volume = this.volume;
        sound.play().catch(e => console.log('Error playing sound:', e));
    }

    toggleSound() {
        this.isSoundEnabled = !this.isSoundEnabled;
        this.updateSoundButton();
        this.saveSettings();
    }

    setVolume(volume) {
        this.volume = Math.max(0, Math.min(1, volume));
        this.saveSettings();
    }

    updateSoundButton() {
        const soundBtn = document.getElementById('soundToggle');
        if (soundBtn) {
            soundBtn.textContent = this.isSoundEnabled ? '🔊' : '🔇';
        }
    }

    saveSettings() {
        const settings = {
            soundEnabled: this.isSoundEnabled,
            volume: this.volume
        };
        localStorage.setItem('audioSettings', JSON.stringify(settings));
    }

    loadSettings() {
        const saved = localStorage.getItem('audioSettings');
        if (saved) {
            const settings = JSON.parse(saved);
            this.isSoundEnabled = settings.soundEnabled !== undefined ? settings.soundEnabled : true;
            this.volume = settings.volume !== undefined ? settings.volume : 0.5;
        }
    }
}

// Create global audio manager
const audioManager = new AudioManager();
