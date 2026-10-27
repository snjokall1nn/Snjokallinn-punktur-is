export const origin = 'https://snjokallinn.com';
export const services = {
  portrett: {
    title: 'Portrettljósmyndun í Reykjavík | Snjókallinn',
    description: 'Persónuleg portrett með litum, karakter og leiðsögn frá Alex Snæ. Skoðaðu myndir, verð og hvernig myndatakan fer fram hjá Snjókallinum.',
    heading: 'Portrett sem líða eins og þú.',
    intro: 'Hlýtt og mjúkt, djarfir litir eða smá kaos. Þú kemur með pælinguna og við finnum leiðina saman. Þú þarft ekki að kunna að pósa.',
    image: '/assets/stories/hannagiveawayedited-d947a300fa.webp',
    alt: 'Hanna í persónulegri portrettmyndatöku hjá Snjókallinum',
    project: 'Hanna vann gjafaleikinn minn og kom í sjút með hárstílista og förðunarartista. Úr varð einn skemmtilegasti myndatökudagur sem ég hef upplifað.',
    gallery: 'https://snjokallinn.pixieset.com/hannagiveawayedited/',
    galleryTitle: 'Sjá myndatökuna með Hönnu',
    process: 'Við byrjum á að spjalla um stemningu, föt, ljós og staðsetningu. Í tökunni færðu leiðsögn í pósum og hreyfingu. Við prófum okkur áfram þar til myndirnar hafa þinn karakter.',
  },
  headshots: {
    title: 'Headshots í Reykjavík | Snjókallinn',
    description: 'Headshots með karakter fyrir leikarasafnið, prófílinn eða vefinn. Skoðaðu myndatökur Róberts og Óðins og sendu Alex Snæ fyrirspurn.',
    heading: 'Headshots með karakter.',
    intro: 'Nýtt andlit á prófílinn, leikarasafnið eða vefinn? Við vinnum með svipbrigði, ljós og stellingar til að búa til myndir sem segja eitthvað um þig.',
    image: '/assets/stories/robertheadshot26edit-010e4949c3.webp',
    alt: 'Headshot af Róberti eftir Snjókallinn',
    project: 'Róbert kom í headshot-töku. Við bjuggum til eitthvað rosalegt saman! Óðinn kom líka í töku og útkoman var ICONIC.',
    gallery: 'https://snjokallinn.pixieset.com/robertheadshot26edit/',
    galleryTitle: 'Sjá headshots af Róberti',
    secondGallery: 'https://snjokallinn.pixieset.com/odinnedit/',
    secondTitle: 'Sjá headshots af Óðni',
    process: 'Segðu mér hvar myndirnar verða notaðar og hvaða stemningu þú vilt. Við veljum bakgrunn, föt og ljós út frá því. Þú færð leiðsögn allan tímann og við gefum svipbrigðunum pláss.',
  },
  'fyrirtaeki': {
    title: 'Ljósmyndun fyrir fyrirtæki og vörumerki | Snjókallinn',
    description: 'Persónulegar myndir fyrir vörumerkið þitt: fólk, vörur og stemning. Skoðaðu verkefnið með Önnu Marín og fáðu sérsniðið tilboð frá Snjókallinum.',
    heading: 'Gefum brandinu þínu andlit.',
    intro: 'Fólkið, vörurnar og litlu hlutirnir sem gera brandið þitt að þínu. Við byggjum myndaseríu utan um það sem þú vilt segja og hvar myndirnar eiga að birtast.',
    image: '/assets/stories/annamarinedit-9ed6f035e1.webp',
    alt: 'Anna Marín í myndatöku fyrir vörumerkið sitt hjá Snjókallinum',
    project: 'Anna Marín vildi nýjar myndir fyrir brandið sitt. Við tókum myndir af henni og bakkelsinu sem hún hafði bakað og enduðum á nokkrum skvísumyndum. Hún kom, sá, SIGRAÐI þetta sjút!',
    gallery: 'https://snjokallinn.pixieset.com/annamarinedit/',
    galleryTitle: 'Sjá myndaseríuna með Önnu Marín',
    process: 'Við ræðum tilgang, miðla, myndefni og umfang áður en við tökum myndir. Það hjálpar okkur að velja stað, ljós og útlit sem passa saman. Afhending og tímalína eru skilgreind í tilboði.',
  },
};
export const homeMeta = {
  title: 'Snjókallinn | Ljósmyndari í Reykjavík · Portrett og headshots',
  description: 'Portrett, headshots og myndir fyrir vörumerki í Reykjavík með Alex Snæ. Litir, karakter og leiðsögn í pósum. Skoðaðu myndir og verð og finndu þitt sjút.',
  image: '/assets/hero/01.webp',
  alt: 'Portrett í svörtu með rauðu bakljósi eftir Snjókallinn',
};
export function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
}
export function seoHead(slug = '') {
  if(slug&&!Object.hasOwn(services,slug)) throw new Error('Unknown SEO page');
  const meta = slug ? services[slug] : homeMeta;
  if (!meta) throw new Error('Unknown SEO page');
  const url = `${origin}/${slug}`;
  const graph = [
    {'@type':'Organization','@id':`${origin}/#brand`,name:'Snjókallinn',url:origin,email:'snjokallinn@snjokallinn.com',sameAs:['https://www.instagram.com/snjokallinn/','https://www.tiktok.com/@snjokallinn']},
    {'@type':'WebSite','@id':`${origin}/#website`,url:`${origin}/`,name:'Snjókallinn',inLanguage:'is',publisher:{'@id':`${origin}/#brand`}},
    {'@type':'WebPage','@id':url,url,name:meta.title,description:meta.description,inLanguage:'is',isPartOf:{'@id':`${origin}/#website`}},
  ];
  if(slug) graph.push({'@type':'Service',name:meta.heading,description:meta.description,url,provider:{'@id':`${origin}/#brand`},areaServed:{'@type':'City',name:'Reykjavík'}});
  const e=escapeHtml;
  return `<title>${e(meta.title)}</title>
<meta name="description" content="${e(meta.description)}">
<link rel="canonical" href="${url}">
<meta property="og:type" content="website"><meta property="og:locale" content="is_IS">
<meta property="og:site_name" content="Snjókallinn"><meta property="og:title" content="${e(meta.title)}">
<meta property="og:description" content="${e(meta.description)}"><meta property="og:url" content="${url}">
<meta property="og:image" content="${origin}${meta.image}"><meta property="og:image:alt" content="${e(meta.alt)}">
<meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${e(meta.title)}">
<meta name="twitter:description" content="${e(meta.description)}"><meta name="twitter:image" content="${origin}${meta.image}">
<script type="application/ld+json">${JSON.stringify({'@context':'https://schema.org','@graph':graph}).replace(/</g,'\\u003c')}</script>`;
}
export function sitemapXml() {
  return `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${['','umsagnir',...Object.keys(services),'amma','amma/spurningar','amma/um-okkur','amma/sagan','brudkaup'].map(slug=>`<url><loc>${origin}/${slug}</loc></url>`).join('')}</urlset>`;
}
export const robotsText = `User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /api/\nDisallow: /*?preview=\nSitemap: ${origin}/sitemap.xml\n`;
