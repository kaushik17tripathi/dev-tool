import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
    const logs = (globalThis as any).mockApiWorkspaceLogs || [];
    return NextResponse.json(logs, {
        status: 200,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Cache-Control': 'no-store'
        }
    });
}

export async function DELETE() {
    (globalThis as any).mockApiWorkspaceLogs = [];
    return NextResponse.json({ success: true }, {
        status: 200,
        headers: {
            'Access-Control-Allow-Origin': '*'
        }
    });
}
