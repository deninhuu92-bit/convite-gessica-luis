(() => {
  'use strict';
  const track = document.querySelector('#sea-ambience');
  const toggle = document.querySelector('#sound-toggle');
  const label = document.querySelector('#sound-label');
  let context, gain, source, hasStarted = false, starting = false, offByChoice = false;
  try { offByChoice = localStorage.getItem('gl-som') === 'off'; } catch {}
  function show(playing) {
    toggle.classList.toggle('is-playing', playing);
    toggle.setAttribute('aria-pressed', String(playing));
    toggle.setAttribute('aria-label', playing ? 'Pausar som de ondas e brisa do mar' : 'Ativar som de ondas e brisa do mar');
    label.textContent = playing ? 'Pausar som' : 'Ativar som';
  }
  function audioGraph() {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (AudioContext && !context) {
      try {
        context = new AudioContext();
        source = context.createMediaElementSource(track);
        gain = context.createGain();
        gain.gain.value = 0;
        source.connect(gain);
        gain.connect(context.destination);
        track.volume = 1;
      } catch {
        context = null;
        gain = null;
        track.volume = 0.2;
      }
    } else if (!AudioContext) track.volume = 0.2;
  }
  async function start(automatic = false) {
    if (starting || !track.paused) return;
    starting = true;
    offByChoice = false;
    if (!automatic) audioGraph();
    else track.volume = 0.2;
    try {
      const resumed = context && !automatic ? context.resume() : Promise.resolve();
      const played = track.play();
      await Promise.all([resumed, played]);
      if (track.paused || offByChoice) return;
      if (gain && context) {
        gain.gain.cancelScheduledValues(context.currentTime);
        gain.gain.setValueAtTime(0, context.currentTime);
        gain.gain.linearRampToValueAtTime(0.2, context.currentTime + 1.4);
      }
      hasStarted = true;
      offByChoice = false;
      try { localStorage.setItem('gl-som', 'on'); } catch {}
      show(true);
    } catch {
      show(false);
    } finally { starting = false; }
  }
  toggle.addEventListener('click', () => {
    if (!track.paused || starting) {
      track.pause();
      if (gain && context) {
        gain.gain.cancelScheduledValues(context.currentTime);
        gain.gain.setValueAtTime(0, context.currentTime);
      }
      offByChoice = true;
      hasStarted = true;
      try { localStorage.setItem('gl-som', 'off'); } catch {}
      show(false);
    } else void start();
  });
  function firstInteraction(event) {
    if (toggle.contains(event.target)) return;
    if (!hasStarted && !offByChoice) void start();
  }
  document.addEventListener('click', firstInteraction);
  document.addEventListener('keydown', firstInteraction);
  track.addEventListener('pause', () => show(false));
  track.addEventListener('playing', () => show(true));
  track.addEventListener('error', () => show(false));
  show(false);
  if (!offByChoice) void start(true);
})();
