import { prisma } from '@/lib/db';
import { SettingsClient } from './SettingsClient';

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
    // スタッフ一覧を取得
    const staff = await prisma.staff.findMany({
        orderBy: [
            { active: 'desc' },
            { name: 'asc' }
        ]
    });

    // 現在のプリセット設定を取得
    const presetSetting = await prisma.systemSetting.findUnique({
        where: { key: 'voice_preset' }
    });

    const currentPreset = presetSetting?.value || 'acupuncture';

    return (
        <div className="max-w-4xl mx-auto py-8 px-4">
            <SettingsClient
                initialStaff={staff}
                initialPreset={currentPreset}
            />
        </div>
    );
}
