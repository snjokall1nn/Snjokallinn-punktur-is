import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { seoHead, services, sitemapXml, robotsText, origin } from '../app/seo.mjs';
import { renderService } from '../app/service-pages.mjs';
import { packages } from '../public/pricing.mjs';

test('all public pages have one canonical, unique metadata and valid structured data',()=>{
  const titles=new Set();
  for(const slug of ['',...Object.keys(services)]) {
    const head=seoHead(slug);
    assert.equal((head.match(/rel="canonical"/g)||[]).length,1);
    assert.ok(head.includes(`href="${origin}/${slug}"`));
    const title=head.match(/<title>(.*?)<\/title>/)[1];
    assert.ok(!titles.has(title));titles.add(title);
    const json=JSON.parse(head.match(/<script type="application\/ld\+json">(.*?)<\/script>/s)[1]);
    assert.equal(json['@context'],'https://schema.org');
    assert.ok(json['@graph'].some(item=>item['@type']==='WebPage'&&item.url===`${origin}/${slug}`));
    assert.ok(!head.includes('Starter Project'));
  }
});
test('sitemap includes exactly the public canonical pages',()=>{
  const locations=[...sitemapXml().matchAll(/<loc>(.*?)<\/loc>/g)].map(m=>m[1]);
  assert.deepEqual(locations,['','umsagnir',...Object.keys(services),'amma','amma/spurningar','amma/um-okkur','amma/sagan','brudkaup'].map(slug=>`${origin}/${slug}`));
  assert.ok(robotsText.includes(`Sitemap: ${origin}/sitemap.xml`));
  assert.ok(!locations.some(url=>/admin|api|preview|NewClient|Erna/.test(url)));
});
test('service pages expose content without javascript and use actual assets and current prices',()=>{
  for(const [slug,page] of Object.entries(services)) {
    const html=renderService(slug);
    assert.equal((html.match(/<h1>/g)||[]).length,1);
    assert.ok(html.includes('lang="is"'));
    assert.ok(existsSync(new URL(`../public${page.image}`,import.meta.url)));
    assert.ok(html.includes(page.gallery));
    assert.ok(html.includes('href="/#fyrirspurn"'));
    if(slug!=='fyrirtaeki') for(const id of ['quick','editorial','iconic']) assert.ok(html.includes(new Intl.NumberFormat('is-IS').format(packages[id].price)));
  }
  assert.equal(renderService('not-a-page'),null);
  assert.equal(renderService('constructor'),null);
  assert.equal(renderService('__proto__'),null);
});
test('home links make every service page discoverable and contains the metadata injection point',()=>{
  const home=readFileSync(new URL('../content/home.html',import.meta.url),'utf8');
  assert.ok(home.includes('<!--seo-head-->'));
  for(const slug of Object.keys(services))assert.ok(home.includes(`href="/${slug}"`));
});
