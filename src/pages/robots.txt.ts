import type { APIRoute } from 'astro';
import { montarRobots } from '../lib/sitemap';

export const GET: APIRoute = ({ site }) => new Response(montarRobots(site!.origin), { headers: { 'content-type': 'text/plain; charset=utf-8' } });
