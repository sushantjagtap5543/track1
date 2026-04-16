import alarm from '../../resources/alarm.mp3';

export const playSound = (type) => {
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const oscillator = audioCtx.createOscillator();
  const gainNode = audioCtx.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(audioCtx.destination);

  gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
  gainNode.gain.linearRampToValueAtTime(0.1, audioCtx.currentTime + 0.01);

  let duration = 1;

  switch (type) {
    case 'siren':
      oscillator.type = 'sawtooth';
      oscillator.frequency.setValueAtTime(440, audioCtx.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.5);
      oscillator.frequency.exponentialRampToValueAtTime(440, audioCtx.currentTime + 1.0);
      break;
    case 'digital':
      oscillator.type = 'square';
      oscillator.frequency.setValueAtTime(1200, audioCtx.currentTime);
      oscillator.frequency.setValueAtTime(1600, audioCtx.currentTime + 0.1);
      oscillator.frequency.setValueAtTime(1200, audioCtx.currentTime + 0.2);
      break;
    case 'minimal':
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(1000, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.2);
      duration = 0.2;
      break;
    case 'softBell':
      oscillator.type = 'triangle';
      oscillator.frequency.setValueAtTime(1500, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.8);
      duration = 0.8;
      break;
    case 'rapidBeeps':
      oscillator.type = 'square';
      [0, 0.2, 0.4].forEach((t) => {
        oscillator.frequency.setValueAtTime(1800, audioCtx.currentTime + t);
        gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime + t);
        gainNode.gain.setValueAtTime(0, audioCtx.currentTime + t + 0.1);
      });
      duration = 0.6;
      break;
    case 'doubleChime':
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(880, audioCtx.currentTime);
      oscillator.frequency.setValueAtTime(1108, audioCtx.currentTime + 0.3);
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.6);
      duration = 0.6;
      break;
    case 'radarSweep':
      oscillator.type = 'sawtooth';
      oscillator.frequency.setValueAtTime(200, audioCtx.currentTime);
      oscillator.frequency.linearRampToValueAtTime(1200, audioCtx.currentTime + 0.8);
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.9);
      duration = 0.9;
      break;
    case 'digitalPulse':
      oscillator.type = 'square';
      oscillator.frequency.setValueAtTime(300, audioCtx.currentTime);
      gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
      gainNode.gain.setValueAtTime(0, audioCtx.currentTime + 0.05);
      gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime + 0.15);
      gainNode.gain.setValueAtTime(0, audioCtx.currentTime + 0.2);
      duration = 0.3;
      break;
    case 'technoAlert':
      oscillator.type = 'sawtooth';
      oscillator.frequency.setValueAtTime(600, audioCtx.currentTime);
      oscillator.frequency.linearRampToValueAtTime(100, audioCtx.currentTime + 0.5);
      oscillator.frequency.linearRampToValueAtTime(600, audioCtx.currentTime + 1);
      break;
    case 'echoPing':
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(2000, audioCtx.currentTime);
      gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.8);
      duration = 0.8;
      break;
    case 'warningBlips':
      oscillator.type = 'sine';
      [0, 0.15, 0.3].forEach((t) => {
        oscillator.frequency.setValueAtTime(3000, audioCtx.currentTime + t);
        gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime + t);
        gainNode.gain.setValueAtTime(0, audioCtx.currentTime + t + 0.05);
      });
      duration = 0.4;
      break;
    case 'smoothSine':
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(440, audioCtx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 1.0);
      break;
    case 'techBeep':
      oscillator.type = 'square';
      oscillator.frequency.setValueAtTime(2500, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.1);
      duration = 0.15;
      break;
    default:
      new Audio(alarm).play().catch(() => {
        oscillator.type = 'triangle';
        oscillator.frequency.setValueAtTime(523.25, audioCtx.currentTime);
        oscillator.frequency.setValueAtTime(659.25, audioCtx.currentTime + 0.2);
      });
      break;
  }

  oscillator.start();
  oscillator.stop(audioCtx.currentTime + duration);
};
