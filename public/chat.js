(() => {
  const assistant = window.SnjokallinnChat.createAssistant();
  const launcher = document.querySelector('#chat-launcher');
  const panel = document.querySelector('#snaedis-chat');
  const log = document.querySelector('#chat-messages');
  const choices = document.querySelector('#chat-choices');
  const input = document.querySelector('#chat-input');
  const send = document.querySelector('.chat-send');
  const appliedDrafts = new Set();
  let started = false;
  let launcherEnlarged = false;
  function resizeLauncher(enlarged) {
    launcherEnlarged = enlarged;
    launcher.setAttribute('data-size', enlarged ? 'expanded' : 'compact');
    launcher.setAttribute('aria-label', enlarged ? 'Opna spjall við Snædísi' : 'Stækka Snædísi til að opna spjall');
  }
  let pending = null;
  let typing = null;
  let lastWasThoughtful = false;
  function cancelReply() {
    if (pending !== null) window.clearTimeout(pending);
    pending = null;
    if (typing) typing.remove();
    typing = null;
    send.setAttribute('aria-disabled', 'false');
  }
  function respond(response, greeting = false) {
    cancelReply();
    // Explicit navigation and form handoff should happen immediately.
    if (!response.text || response.section || response.draft) { render(response); return; }
    choices.replaceChildren();
    const thoughtful = !greeting && !lastWasThoughtful && Math.random() < .22;
    lastWasThoughtful = thoughtful;
    const delay = greeting ? 850 : thoughtful ? 3200 + Math.random() * 1600 : 1000 + Math.random() * 1200;
    typing = document.createElement('div');
    typing.className = 'chat-typing';
    const label = document.createElement('span');
    label.textContent = thoughtful ? 'Snædís er að hugsa…' : 'Snædís er að skrifa…';
    const dots = document.createElement('span');
    dots.className = 'chat-typing-dots';
    dots.setAttribute('aria-hidden', 'true');
    for (let i = 0; i < 3; i++) dots.append(document.createElement('i'));
    typing.append(label, dots);
    log.append(typing);
    log.scrollTop = log.scrollHeight;
    send.setAttribute('aria-disabled', 'true');
    pending = window.setTimeout(() => { cancelReply(); render(response); }, delay);
  }
  function close(returnFocus = true) {
    panel.hidden = true;
    launcher.setAttribute('aria-expanded', 'false');
    resizeLauncher(false);
    if (returnFocus) launcher.focus();
  }
  function message(text, role = 'assistant') {
    const item = document.createElement('div');
    item.className = 'chat-message ' + role;
    const speaker = document.createElement('span');
    speaker.className = 'chat-speaker';
    speaker.textContent = role === 'user' ? 'Þú' : 'Snædís';
    const p = document.createElement('p');
    p.textContent = text;
    item.append(speaker, p);
    log.append(item);
    while (log.children.length > 80) log.firstElementChild.remove();
    log.scrollTop = log.scrollHeight;
  }
  function navigate(id) {
    const section = document.getElementById(id);
    if (!section) return;
    close(false);
    section.scrollIntoView({ block: 'start', behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
    if (id === 'fyrirspurn') window.dispatchEvent(new Event('open-booking-draft'));
    else { section.tabIndex = -1; section.focus({ preventScroll: true }); }
  }
  function render(response) {
    if (response.text) message(response.text);
    choices.replaceChildren();
    (response.choices || []).forEach(({ label, action }) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'chat-choice';
      button.textContent = label;
      button.addEventListener('click', () => {
        if (pending !== null) return;
        message(label, 'user');
        respond(assistant.act(action));
        if (!panel.hidden) input.focus({ preventScroll: true });
      });
      choices.append(button);
    });
    if (response.draft) {
      const idea = document.querySelector('#idea');
      const when = document.querySelector('#when');
      const signature = JSON.stringify(response.draft);
      if (!appliedDrafts.has(signature)) {
        const combined = [idea.value.trim(), response.draft.idea].filter(Boolean).join('\n\n');
        const time = [when.value.trim(), response.draft.when].filter(Boolean).join(' / ');
        if (combined.length > idea.maxLength || time.length > when.maxLength) {
          message('Það er þegar mikill texti í forminu. Ég breytti honum ekki. Þú getur afritað pælinguna úr spjallinu og stytt textann í forminu.');
          return;
        }
        idea.value = combined;
        when.value = time;
        appliedDrafts.add(signature);
      }
      navigate('fyrirspurn');
      document.querySelector('#form-status').textContent = 'Pælingin úr spjallinu er komin í formið. Lestu yfir og kláraðu spurningalistann áður en þú sendir.';
    } else if (response.section) navigate(response.section);
    log.scrollTop = log.scrollHeight;
  }
  launcher.addEventListener('click', () => {
    if (!launcherEnlarged) { resizeLauncher(true); return; }
    panel.hidden = false;
    launcher.setAttribute('aria-expanded', 'true');
    if (!started) { respond(assistant.welcome(), true); started = true; }
    input.focus({ preventScroll: true });
  });
  launcher.addEventListener('keydown', event => {
    if (event.key === 'Escape') { event.preventDefault(); resizeLauncher(false); }
  });
  document.querySelector('#chat-close').addEventListener('click', () => close());
  panel.addEventListener('keydown', event => { if (event.key === 'Escape') { event.preventDefault(); close(); } });
  document.querySelector('#chat-form').addEventListener('submit', event => {
    event.preventDefault();
    if (pending !== null) return;
    const text = input.value.trim();
    if (!text) return;
    input.value = '';
    message(text, 'user');
    respond(assistant.reply(text));
    input.focus({ preventScroll: true });
  });
  document.querySelector('#chat-restart').addEventListener('click', () => {
    cancelReply();
    lastWasThoughtful = false;
    log.replaceChildren();
    respond(assistant.act('restart'), true);
    input.value = '';
    input.focus({ preventScroll: true });
  });
  document.querySelector('#chat-direct').addEventListener('click', event => { event.preventDefault(); navigate('fyrirspurn'); });
})();
