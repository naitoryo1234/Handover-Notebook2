import { prisma } from '@/lib/db';

import { type Staff } from '@prisma/client';
export type { Staff };

export const getActiveStaff = async (): Promise<Staff[]> => {
    const staff = await prisma.staff.findMany({
        where: { active: true },
        orderBy: { createdAt: 'asc' }
    });
    return staff;
};

export const getAllStaff = async (): Promise<Staff[]> => {
    const staff = await prisma.staff.findMany({
        orderBy: { createdAt: 'asc' }
    });
    return staff;
};

export const getStaffById = async (id: string): Promise<Staff | null> => {
    const staff = await prisma.staff.findUnique({
        where: { id }
    });
    return staff;
};
