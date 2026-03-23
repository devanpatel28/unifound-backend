import { NextResponse } from 'next/server';

/**
 * CORS headers applied to every API response.
 * next.config.ts handles GET/POST automatically;
 * call corsHeaders() for manual control or preflight OPTIONS responses.
 */
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
  'Access-Control-Max-Age': '86400',
};

/**
 * Returns a 200 response for OPTIONS preflight requests.
 * Export an `OPTIONS` function that calls this in any route that needs it.
 */
export function handleOptions() {
  return new NextResponse(null, { status: 200, headers: corsHeaders });
}
