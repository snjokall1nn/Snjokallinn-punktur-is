import html from '../../content/amma/index.html?raw';

export function GET() {
  return new Response(html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
}
