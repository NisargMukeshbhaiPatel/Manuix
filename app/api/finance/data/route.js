import { NextResponse } from 'next/server';
import Finance from '@/models/Finance';
import dbConnect from '@/lib/db';

export async function GET() {
  await dbConnect();
  try {
    const finance = await Finance.find({});
    return NextResponse.json({ success: true, data: finance });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
