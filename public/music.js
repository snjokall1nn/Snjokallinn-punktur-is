(() => {
  const dock = document.createElement('aside');
  dock.className = 'music-dock';
  dock.setAttribute('aria-label', 'Tónlist með Snjókallinum');
  dock.innerHTML = `<button class="music-toggle" type="button" aria-expanded="false" aria-controls="spotify-panel"><svg class="ui-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M9 18V5l11-2v13M9 9l11-2"/><ellipse cx="6" cy="18" rx="3" ry="2"/><ellipse cx="17" cy="16" rx="3" ry="2"/></svg> Tónlist með Snjókallinum</button><div id="spotify-panel" hidden><div class="music-heading"><span>Settu þig í stemninguna.</span><button type="button" class="music-stop" aria-label="Stöðva tónlist og loka spilara">✕</button></div><div class="spotify-frame"></div><a href="https://open.spotify.com/playlist/6aXE1M2HMdmxOGq9YCr8vM?si=g3VqhdXKQAC_iVZVO9sv4g&utm_source=copy-link&pt=b71afd17282d6194282f8daece89ef07" target="_blank" rel="noopener">Opna playlistann í Spotify ↗</a></div>`;
  (document.querySelector('#music-home') || document.body).append(dock);
  const toggle = dock.querySelector('.music-toggle');
  const panel = dock.querySelector('#spotify-panel');
  const holder = dock.querySelector('.spotify-frame');
  function stop(focus = true) {
    holder.replaceChildren();
    panel.hidden = true;
    toggle.setAttribute('aria-expanded', 'false');
    document.body.classList.remove('music-open');
    if(focus) toggle.focus();
  }
  toggle.addEventListener('click', () => {
    if (!panel.hidden) { stop(); return; }
    window.dispatchEvent(new Event('snjo-spotify-start'));
    const frame = document.createElement('iframe');
    frame.title = 'Spotify-playlisti Snjókallsins';
    frame.src = 'https://open.spotify.com/embed/playlist/6aXE1M2HMdmxOGq9YCr8vM?utm_source=generator&theme=0';
    frame.width = '100%'; frame.height = '152';
    frame.allow = 'autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture';
    holder.append(frame);
    panel.hidden = false;
    toggle.setAttribute('aria-expanded', 'true');
    document.body.classList.add('music-open');
  });
  dock.querySelector('.music-stop').addEventListener('click', () => stop());
  window.addEventListener('snjo-song-start', () => stop(false));
  dock.addEventListener('keydown', e => { if (e.key === 'Escape' && !panel.hidden) stop(); });
})();
