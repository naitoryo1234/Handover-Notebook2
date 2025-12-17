'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db';
import { StaffSchema } from '@/config/schema';

export async function createStaff(formData: FormData) {
    const rawData = {
        name: formData.get('name') as string,
        role: formData.get('role') as string || 'Director',
        active: true
    };

    const validated = StaffSchema.safeParse(rawData);
    if (!validated.success) {
        return { success: false, errors: validated.error.flatten().fieldErrors };
    }

    try {
        await prisma.staff.create({
            data: validated.data
        });
        revalidatePath('/settings/staff'); // Assuming this will be the path
        return { success: true };
    } catch (error) {
        console.error('Failed to create staff:', error);
        return { success: false, message: 'Database Error' };
    }
}

export async function toggleStaffStatus(id: string, currentStatus: boolean) {
    try {
        await prisma.staff.update({
            where: { id },
            data: { active: !currentStatus }
        });
        revalidatePath('/settings/staff');
        return { success: true };
    } catch (error) {
        console.error('Failed to toggle staff status:', error);
        return { success: false, message: 'Database Error' };
    }
}

export async function updateStaff(id: string, formData: FormData) {
    const rawData = {
        name: formData.get('name') as string,
        role: formData.get('role') as string,
    };

    const validated = StaffSchema.pick({ name: true, role: true }).safeParse(rawData);

    if (!validated.success) {
        return { success: false, errors: validated.error.flatten().fieldErrors };
    }

    try {
        await prisma.staff.update({
            where: { id },
            data: validated.data
        });
        revalidatePath('/settings/staff');
        return { success: true };
    } catch (error) {
        console.error('Failed to update staff:', error);
        return { success: false, message: 'Database Error' };
    }
}
