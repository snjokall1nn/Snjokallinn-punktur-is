import legacyTexts from '../content/homepage-legacy.json' with {type:'json'};

// Adopt the new homepage once. Later editor saves retain the selected order,
// visibility, albums, custom sections and copy; reads do not write to storage.
export function normalizeLayout(content, seed) {
  if (content.sections.some(section => section.id === 'sessions')) return content;
  const previous = new Map(content.sections.map(section => [section.id, section]));
  const journeyHidden = previous.get('journey')?.hidden ?? false;
  const texts = {...content.texts};
  for (const [id, value] of Object.entries(seed.texts)) {
    if (!Object.hasOwn(texts,id) || texts[id] === legacyTexts[id]) texts[id] = value;
  }
  return {
    ...content, texts,
    sections: [
      ...seed.sections.map(section => previous.get(section.id) || {
        ...section,
        hidden: ['pricing', 'prints', 'faq', 'contact'].includes(section.id) ? journeyHidden : section.hidden
      }),
      ...content.sections.filter(section => !seed.sections.some(item => item.id === section.id))
    ]
  };
}
