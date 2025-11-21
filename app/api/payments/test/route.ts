import { NextResponse } from 'next/server';

/**
 * Simple test endpoint to verify payment routes work on Vercel
 */
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    message: 'Payment API routes are working',
    timestamp: new Date().toISOString()
  });
}

export async function POST() {
  return NextResponse.json({
    status: 'ok',
    message: 'Payment API POST endpoint is working',
    timestamp: new Date().toISOString()
  });
}
