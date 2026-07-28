import confetti from 'canvas-confetti';

export const triggerConfetti = () => {
  if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
  const end = Date.now() + 3000;
  const frame = () => {
    confetti({ particleCount: 5, angle: 60, spread: 55, origin: { x: 0 }, colors: ['#4f46e5', '#818cf8', '#c7d2fe'] });
    confetti({ particleCount: 5, angle: 120, spread: 55, origin: { x: 1 }, colors: ['#4f46e5', '#818cf8', '#c7d2fe'] });
    if (Date.now() < end) requestAnimationFrame(frame);
  };
  frame();
};
