import data from '../../content/testimonials.json';
import { testimonialsPage } from '../testimonials.mjs';
export function GET() {
 return new Response(testimonialsPage(data),{headers:{'Content-Type':'text/html; charset=utf-8'}});
}
