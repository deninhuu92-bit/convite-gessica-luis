(() => {
  'use strict';
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const video = document.createElement('video');
  video.src = 'assets/fumaca-presente.mp4';
  video.muted = true;
  video.playsInline = true;
  video.preload = 'auto';
  video.setAttribute('playsinline', '');
  video.setAttribute('aria-hidden', 'true');
  let active = false;
  window.playGiftSmoke = () => {
    if (reducedMotion || active) return Promise.resolve();
    active = true;
    return new Promise(resolve => {
      const gift = document.querySelector('#gift');
      const origin = gift.getBoundingClientRect();
      const layer = document.createElement('div');
      layer.className = 'gift-smoke-transition';
      const canvas = document.createElement('canvas');
      canvas.setAttribute('aria-hidden', 'true');
      const skip = document.createElement('button');
      skip.className = 'gift-smoke-skip';
      skip.type = 'button';
      skip.textContent = 'Ver convite agora';
      skip.setAttribute('aria-label', 'Pular animação de fumaça e ver o convite');
      layer.append(canvas, skip);
      document.body.append(layer);
      const width = innerWidth, height = innerHeight;
      const ratio = Math.min(devicePixelRatio || 1, 1.5);
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
      const context = canvas.getContext('2d');
      const buffer = document.createElement('canvas');
      buffer.width = 512;
      buffer.height = 288;
      const pixels = buffer.getContext('2d', { willReadFrequently: true });
      let frame = 0, finished = false, readinessTimer, endTimer;
      const previousOverflow = document.documentElement.style.overflow;
      document.documentElement.style.overflow = 'hidden';
      function finish() {
        if (finished) return;
        finished = true;
        active = false;
        cancelAnimationFrame(frame);
        clearTimeout(readinessTimer);
        clearTimeout(endTimer);
        video.pause();
        video.removeEventListener('ended', finish);
        video.removeEventListener('error', finish);
        document.removeEventListener('keydown', escape);
        document.documentElement.style.overflow = previousOverflow;
        layer.remove();
        resolve();
      }
      function escape(event) { if (event.key === 'Escape') finish(); }
      skip.addEventListener('click', finish);
      document.addEventListener('keydown', escape);
      video.addEventListener('ended', finish);
      video.addEventListener('error', finish);
      function draw() {
        if (finished) return;
        if (video.readyState >= 2) {
          try {
            pixels.drawImage(video, 0, 0, 512, 288);
            const image = pixels.getImageData(0, 0, 512, 288);
            const data = image.data;
            // Remove only green-dominant pixels, preserving pale blue and pink.
            for (let i = 0; i < data.length; i += 4) {
              const neutral = Math.max(data[i], data[i + 2]);
              const excess = data[i + 1] - neutral;
              const alpha = Math.max(0, Math.min(1, 1 - (excess - 8) / 55));
              data[i + 3] = Math.round(alpha * 255);
              if (alpha < 1) data[i + 1] = Math.min(data[i + 1], neutral + 8);
            }
            pixels.putImageData(image, 0, 0);
            const progress = Math.min(1, video.currentTime / 4.5);
            const expand = 1 - Math.pow(1 - progress, 3);
            const initialWidth = origin.width * 0.72;
            const finalWidth = Math.max(width * 1.12, Math.min(820, height * 1.15));
            const drawWidth = initialWidth + (finalWidth - initialWidth) * expand;
            const drawHeight = drawWidth * 9 / 16;
            const center = origin.left + origin.width / 2;
            const x = center + (width / 2 - center) * expand - drawWidth / 2;
            const opening = origin.top + origin.height * 0.51;
            const bottom = opening + Math.min(height * 0.18, 110) * expand;
            context.clearRect(0, 0, canvas.width, canvas.height);
            context.globalAlpha = Math.min(1, video.currentTime * 3) * Math.min(1, Math.max(0, (10 - video.currentTime) / 1.1));
            context.drawImage(buffer, x * ratio, (bottom - drawHeight) * ratio, drawWidth * ratio, drawHeight * ratio);
          } catch { finish(); return; }
        }
        frame = requestAnimationFrame(draw);
      }
      if (!context || !pixels) { finish(); return; }
      video.currentTime = 0;
      video.playbackRate = 1.65;
      // A slow connection must never prevent opening the invitation.
      readinessTimer = setTimeout(finish, 2200);
      endTimer = setTimeout(finish, 8500);
      try {
        const playback = video.play();
        Promise.resolve(playback).then(() => {
          if (finished) { video.pause(); return; }
          clearTimeout(readinessTimer);
          frame = requestAnimationFrame(draw);
        }).catch(finish);
      } catch { finish(); }
    });
  };
})();
