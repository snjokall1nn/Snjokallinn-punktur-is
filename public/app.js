const projects = {
  jenny: { title: 'Jenný · Í nýju ljósi', description: 'Ljós, skuggar og litir úr myndatökunni með Jenný.' },
  beta: { title: 'Beta · Ljós & hreyfing', description: 'Innsýn í myndatökuna og myndirnar sem urðu til.' },
  dadi: { title: 'Daði · Bak við myndina', description: 'Frá stúdíóstemningunni yfir í lokaútkomuna.' },
  draw: { title: 'Embla · Þú teiknar, ég mynda', description: 'Við þróuðum hugmyndina saman. Fyrst teikningin, svo myndatakan.' }
};
Object.assign(projects, {
  "studio-lights": {
    "title": "Ljós í stúdíóinu",
    "description": "Frá undirbúningi að portraitmyndum í ólíku ljósi.",
    "src": "/assets/shoots/studio-lights.mp4",
    "poster": "/assets/shoots/studio-lights.webp"
  },
  "colour-ideas": {
    "title": "Litir og hugmyndir",
    "description": "Innsýn í myndatökur með litum, ljósi og ólíkum pælingum.",
    "src": "/assets/shoots/colour-ideas.mp4",
    "poster": "/assets/shoots/colour-ideas.webp"
  },
  "portrait-session": {
    "title": "Stemningin í tökunni",
    "description": "Augnablik úr stúdíóinu og myndirnar sem urðu til.",
    "src": "/assets/shoots/portrait-session.mp4",
    "poster": "/assets/shoots/portrait-session.webp"
  },
  "friends": {
    "title": "Vinasjút",
    "description": "Vinir, útivera og myndir saman.",
    "src": "/assets/shoots/friends.mp4",
    "poster": "/assets/shoots/friends.webp"
  },
  "wedding": {
    "title": "Bak við brúðkaupsmyndirnar",
    "description": "Innsýn í brúðkaupsmyndatöku utandyra.",
    "src": "/assets/shoots/wedding.mp4",
    "poster": "/assets/shoots/wedding.webp"
  },
  "outdoors": {
    "title": "Myndataka úti",
    "description": "Bak við myndavélina í útimyndatöku.",
    "src": "/assets/shoots/outdoors.mp4",
    "poster": "/assets/shoots/outdoors.webp"
  },
  "light-and-shadow": {
    "title": "Ljós og skuggar",
    "description": "Hlýtt ljós, skuggar og augnablik úr myndatökunni.",
    "src": "/assets/shoots/light-and-shadow.mp4",
    "poster": "/assets/shoots/light-and-shadow.webp"
  },
  "studio-moments": {
    "title": "Bak við tjöldin",
    "description": "Stemning úr stúdíóinu og lokaútkoman.",
    "src": "/assets/shoots/studio-moments.mp4",
    "poster": "/assets/shoots/studio-moments.webp"
  },
  "creative-portraits": {
    "title": "Prófum eitthvað nýtt",
    "description": "Ólíkar leiðir að skapandi portraitmyndum.",
    "src": "/assets/shoots/creative-portraits.mp4",
    "poster": "/assets/shoots/creative-portraits.webp"
  },
  "choosing-photos": {
    "title": "Alex um myndavalið",
    "description": "Alex segir frá því að velja myndirnar eftir tökuna.",
    "src": "/assets/shoots/choosing-photos.mp4",
    "poster": "/assets/shoots/choosing-photos.webp"
  }
});
Object.assign(projects, {
  'featured-hanna': {title:'Hanna · Við skoðum myndirnar saman',description:'Innsýn í myndatökuna með Hönnu. Myndbönd: @guiroquue. Ljósmyndir: Snjókallinn.',src:'/assets/featured/hanna.mp4',poster:'/assets/featured/hanna.webp'},
  'featured-victoria': {title:'Victoria · Myndataka með ekkert plan',description:'Leikur, hugmyndir og myndirnar sem urðu til.',src:'/assets/featured/victoria.mp4',poster:'/assets/featured/victoria.webp'},
  'featured-kjolar': {title:'Sverrir og Gunnar · Kjólar í náttúrunni',description:'Allt myndbandið úr kjólasjútinu með Sverri og Gunnari, með upprunalegu hljóði.',src:'/assets/featured/kjolar-full.mp4',poster:'/assets/featured/kjolar.webp'}
});
// Repeat the row on each side, then return to its identical middle copy
// after a scroll settles. Only the original cards enter the tab order.
const shootTrack = document.querySelector('#shoot-video-track');
if (shootTrack) {
  const originals = [...shootTrack.children];
  const copies = () => originals.map(card => {
    const copy = card.cloneNode(true);
    copy.dataset.loopCopy = 'true';
    copy.setAttribute('aria-hidden', 'true');
    copy.querySelectorAll('button').forEach(button => button.tabIndex = -1);
    return copy;
  });
  shootTrack.prepend(...copies());
  shootTrack.append(...copies());
  let span = 0;
  let settle;
  const measure = () => {
    const previousSpan = span;
    const position = previousSpan ? ((shootTrack.scrollLeft - previousSpan) % previousSpan + previousSpan) % previousSpan / previousSpan : 0;
    span = originals[0].offsetLeft - shootTrack.firstElementChild.offsetLeft;
    if (span) shootTrack.scrollLeft = span * (1 + position);
  };
  const wrap = () => {
    if (!span) return;
    const left = shootTrack.scrollLeft;
    if (left < span || left >= span * 2) {
      shootTrack.scrollLeft = span + ((left - span) % span + span) % span;
    }
  };
  shootTrack.addEventListener('scroll', () => {
    clearTimeout(settle);
    settle = setTimeout(wrap, 160);
  }, { passive: true });
  const move = direction => {
    clearTimeout(settle);
    wrap();
    const step = originals[1].offsetLeft - originals[0].offsetLeft;
    shootTrack.scrollBy({ left: step * direction, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
  };
  document.querySelector('.shoot-video-prev').addEventListener('click', () => move(-1));
  document.querySelector('.shoot-video-next').addEventListener('click', () => move(1));
  shootTrack.addEventListener('keydown', event => {
    if (event.target !== shootTrack || !['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
    event.preventDefault();
    move(event.key === 'ArrowLeft' ? -1 : 1);
  });
  requestAnimationFrame(measure);
  new ResizeObserver(measure).observe(shootTrack);
}
const dialog = document.querySelector('#video-dialog');
const video = document.querySelector('#project-video');
let trigger;
document.querySelectorAll('[data-video]').forEach(button => {
  button.addEventListener('click', () => {
    const key = button.dataset.video;
    const project = projects[key];
    if (!project) return;
    trigger = button.closest('[data-loop-copy]') ? shootTrack.querySelector(`.shoot-video-card:not([data-loop-copy]) [data-video="${key}"]`) : button;
    document.querySelector('#video-title').textContent = project.title;
    document.querySelector('#video-description').textContent = project.description;
    video.poster = project.poster || "";
    video.src = project.src || `assets/${key}.mp4`;
    dialog.showModal();
    document.body.classList.add('modal-open');
    video.play().catch(() => {});
  });
});
document.querySelector('.close-dialog').addEventListener('click', () => dialog.close());
dialog.addEventListener('click', event => {
  if (event.target === dialog) {
    const bounds = dialog.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) dialog.close();
  }
});
dialog.addEventListener('close', () => {
  video.pause();
  video.removeAttribute('src');
  video.removeAttribute('poster');
  video.load();
  document.body.classList.remove('modal-open');
  trigger?.focus();
});
