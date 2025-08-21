import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const body = await req.text(); // parse and save to DB here
  // return a receipt/record id
  return new NextResponse(`RCT-${Date.now()}`, { status: 200 });
}
