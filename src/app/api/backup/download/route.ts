import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
    try {
        const dbPath = path.join(process.cwd(), 'prisma/local.db');

        if (!fs.existsSync(dbPath)) {
            return NextResponse.json(
                { error: 'Database file not found' },
                { status: 404 }
            );
        }

        const fileBuffer = fs.readFileSync(dbPath);

        // YYYYMMDD-HHmm format
        const now = new Date();
        const timestamp = now.toISOString()
            .replace(/[-:]/g, '')
            .replace('T', '-')
            .slice(0, 13);

        const filename = `handover-notebook-backup-${timestamp}.db`;

        const headers = new Headers();
        headers.append('Content-Disposition', `attachment; filename="${filename}"`);
        headers.append('Content-Type', 'application/x-sqlite3');

        return new NextResponse(fileBuffer, {
            status: 200,
            headers,
        });
    } catch (error) {
        console.error('Backup error:', error);
        return NextResponse.json(
            { error: 'Failed to create backup' },
            { status: 500 }
        );
    }
}
