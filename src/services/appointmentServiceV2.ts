import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import { startOfDay, endOfDay } from 'date-fns';
import { getNow } from '@/lib/dateUtils';

export interface Appointment {
    id: string; // record id
    patientId: string;
    patientName: string;
    patientKana: string;
    visitDate: Date;
    duration: number; // minutes
    visitCount: number;
    tags: string[];
    memo?: string; // patient memo
    adminMemo?: string; // admin/handover memo
    isMemoResolved?: boolean;
    adminMemoResolvedBy?: string; // staffId of resolver
    adminMemoResolvedAt?: Date; // when resolved
    adminMemoResolverName?: string; // name of resolver (for UI display)
    staffName?: string;
    staffId?: string;
    status: string; // Changed to required string as per schema default
    arrivedAt?: Date;
}

// Helper to calculate overlap
const hasOverlap = (start1: number, end1: number, start2: number, end2: number) => {
    return start1 < end2 && end1 > start2;
};

// Define the Prisma return type
// Note: adminMemo, isMemoResolved, arrivedAt are already in the Prisma schema
// so AppointmentGetPayload correctly includes them.
// Define the Prisma return type with select
type AppointmentWithRel = Prisma.AppointmentGetPayload<{
    select: {
        id: true,
        startAt: true,
        duration: true,
        status: true,
        memo: true,
        adminMemo: true,
        isMemoResolved: true,
        adminMemoResolvedBy: true,
        adminMemoResolvedAt: true,
        arrivedAt: true,
        patientId: true,
        staffId: true,
        staff: true,
        patient: {
            select: {
                id: true,
                name: true,
                kana: true,
                tags: true,
                memo: true,
                _count: { select: { records: true } }
            }
        }
    }
}>;

export const getTodaysAppointments = async (date: Date = getNow()): Promise<Appointment[]> => {
    const start = startOfDay(date);
    const end = endOfDay(date);

    const appointments = await prisma.appointment.findMany({
        where: {
            startAt: { gte: start, lte: end },
        },
        select: {
            id: true,
            startAt: true,
            duration: true,
            status: true,
            memo: true,
            adminMemo: true,
            isMemoResolved: true,
            adminMemoResolvedBy: true,
            adminMemoResolvedAt: true,
            arrivedAt: true,
            patientId: true,
            staffId: true,
            staff: true,
            patient: {
                select: {
                    id: true,
                    name: true,
                    kana: true,
                    tags: true,
                    memo: true,
                    _count: { select: { records: true } }
                }
            }
        },
        orderBy: { startAt: 'asc' },
    });

    // Collect resolver IDs and fetch their names
    const resolverIds = [...new Set(
        appointments
            .filter(a => a.adminMemoResolvedBy)
            .map(a => a.adminMemoResolvedBy as string)
    )];

    const resolvers = resolverIds.length > 0
        ? await prisma.staff.findMany({
            where: { id: { in: resolverIds } },
            select: { id: true, name: true }
        })
        : [];

    const resolverMap = new Map(resolvers.map(r => [r.id, r.name]));

    const patientVisitCounter = new Map<string, number>();

    return appointments.map((a: AppointmentWithRel) => {
        const currentCount = patientVisitCounter.get(a.patientId) || 0;
        patientVisitCounter.set(a.patientId, currentCount + 1);

        // Logic: DB Records + 1 (This Visit) + Previous Visits Today
        const visitCount = (a.patient._count.records || 0) + 1 + currentCount;

        return {
            id: a.id,
            patientId: a.patientId,
            patientName: a.patient.name,
            patientKana: a.patient.kana,
            visitDate: a.startAt,
            duration: a.duration || 60,
            visitCount: visitCount,
            tags: a.patient.tags ? JSON.parse(a.patient.tags) : [],
            memo: (() => {
                let mappedMemo = a.memo || '';
                const pMemo = a.patient.memo || '';
                if (pMemo.length > 0) {
                    // Check for full match or trimmed match
                    const isMatch = mappedMemo === pMemo || mappedMemo.trim() === pMemo.trim();
                    // Also check if mappedMemo *starts with* pMemo if pMemo is long enough?
                    // No, let's keep it safe.
                    if (mappedMemo.length > 0 && isMatch) {
                        mappedMemo = '';
                    }
                }
                return mappedMemo;
            })(),
            adminMemo: a.adminMemo || undefined,
            isMemoResolved: a.isMemoResolved ?? false,
            adminMemoResolvedBy: a.adminMemoResolvedBy || undefined,
            adminMemoResolvedAt: a.adminMemoResolvedAt || undefined,
            adminMemoResolverName: a.adminMemoResolvedBy
                ? resolverMap.get(a.adminMemoResolvedBy)
                : undefined,
            staffName: a.staff?.name,
            staffId: a.staffId || undefined,
            status: a.status,
            arrivedAt: a.arrivedAt || undefined,
        };
    });
};

export const findAllAppointments = async (options?: { includePast?: boolean; includeCancelled?: boolean }) => {
    const now = getNow();
    const where: { startAt?: { gte: Date }; status?: { not: string } } = {};

    if (!options?.includePast) {
        where.startAt = { gte: startOfDay(now) };
    }

    if (!options?.includeCancelled) {
        where.status = { not: 'cancelled' };
    }

    const appointments = await prisma.appointment.findMany({
        where,
        select: {
            id: true,
            startAt: true,
            duration: true,
            status: true,
            memo: true,
            adminMemo: true,
            isMemoResolved: true,
            adminMemoResolvedBy: true,
            adminMemoResolvedAt: true,
            arrivedAt: true,
            patientId: true,
            staffId: true,
            staff: true,
            patient: {
                select: {
                    id: true,
                    name: true,
                    kana: true,
                    tags: true,
                    memo: true,
                    _count: { select: { records: true } }
                }
            }
        },
        orderBy: { startAt: 'asc' },
    });

    // Collect resolver IDs and fetch their names
    const resolverIds = [...new Set(
        appointments
            .filter(a => a.adminMemoResolvedBy)
            .map(a => a.adminMemoResolvedBy as string)
    )];

    const resolvers = resolverIds.length > 0
        ? await prisma.staff.findMany({
            where: { id: { in: resolverIds } },
            select: { id: true, name: true }
        })
        : [];

    const resolverMap = new Map(resolvers.map(r => [r.id, r.name]));

    const patientVisitCounter = new Map<string, number>();

    return appointments.map((a: AppointmentWithRel) => {
        // Only increment counter if we are looking at a coherent list (e.g. sorted by time)
        // For general list, this might be tricky if we mix dates, but assuming chronological order it works for "future visits".
        // Note: If we include past, the "db record count" includes those past visits, so double counting might happen.
        // For simplicity in V1.1: We apply the same logic as today's appointment for consistency in the list view.

        const currentCount = patientVisitCounter.get(a.patientId) || 0;
        patientVisitCounter.set(a.patientId, currentCount + 1);

        const visitCount = (a.patient._count.records || 0) + 1 + currentCount;

        return {
            id: a.id,
            patientId: a.patientId,
            patientName: a.patient.name,
            patientKana: a.patient.kana,
            visitDate: a.startAt,
            duration: a.duration || 60,
            visitCount: visitCount,
            tags: a.patient.tags ? JSON.parse(a.patient.tags) : [],
            memo: (() => {
                let mappedMemo = a.memo || '';
                const pMemo = a.patient.memo || '';
                if (pMemo.length > 0) {
                    // Check for full match or trimmed match
                    const isMatch = mappedMemo === pMemo || mappedMemo.trim() === pMemo.trim();
                    // Also check if mappedMemo *starts with* pMemo if pMemo is long enough?
                    // No, let's keep it safe.
                    if (mappedMemo.length > 0 && isMatch) {
                        mappedMemo = '';
                    }
                }
                return mappedMemo;
            })(),
            adminMemo: a.adminMemo || undefined,
            isMemoResolved: a.isMemoResolved ?? false,
            adminMemoResolvedBy: a.adminMemoResolvedBy || undefined,
            adminMemoResolvedAt: a.adminMemoResolvedAt || undefined,
            adminMemoResolverName: a.adminMemoResolvedBy
                ? resolverMap.get(a.adminMemoResolvedBy)
                : undefined,
            staffName: a.staff?.name,
            staffId: a.staffId || undefined,
            status: a.status,
            arrivedAt: a.arrivedAt || undefined,
        };
    });
};

export const getUnassignedFutureAppointments = async (): Promise<Appointment[]> => {
    const now = getNow();

    // We want all unassigned valid appointments from now.
    const appointments = await prisma.appointment.findMany({
        where: {
            startAt: { gte: now },
            staffId: null,
            status: { not: 'cancelled' }
        },
        select: {
            id: true,
            startAt: true,
            duration: true,
            status: true,
            memo: true,
            adminMemo: true,
            isMemoResolved: true,
            adminMemoResolvedBy: true,
            adminMemoResolvedAt: true,
            arrivedAt: true,
            patientId: true,
            staffId: true,
            staff: true,
            patient: {
                select: {
                    id: true,
                    name: true,
                    kana: true,
                    tags: true,
                    memo: true,
                    _count: { select: { records: true } }
                }
            }
        },
        orderBy: { startAt: 'asc' },
    });

    const result = appointments.map((a) => {
        // [WORKAROUND] Prisma/DB seems to be populating a.memo with a.patient.memo even when DB has empty string/null.
        // Explicitly check for this condition and clear it if it matches.
        let mappedMemo = a.memo || '';

        // If mappedMemo is exactly the same as patient.memo, and we logically expect it might be a ghost fallback, clear it.
        // Also check with trim to be safe.
        const pMemo = a.patient.memo || '';
        if (pMemo.length > 0) {
            const isMatch = mappedMemo === pMemo || mappedMemo.trim() === pMemo.trim();
            // Conservative check: only if mappedMemo is NOT empty
            if (mappedMemo.length > 0 && isMatch) {
                console.log(`[SANITIZE] Clearing ghost memo for Appt ${a.id}. matches patient memo.`);
                mappedMemo = '';
            }
        }

        return {
            id: a.id,
            patientId: a.patientId,
            patientName: a.patient.name,
            patientKana: a.patient.kana,
            visitDate: a.startAt,
            duration: a.duration || 60,
            visitCount: (a.patient._count.records || 0) + 1,
            tags: a.patient.tags ? JSON.parse(a.patient.tags) : [],
            memo: mappedMemo,
            adminMemo: a.adminMemo || undefined,
            isMemoResolved: a.isMemoResolved ?? false,
            staffName: undefined,
            staffId: undefined,
            status: a.status,
            arrivedAt: a.arrivedAt || undefined,
        };
    });

    return result;
};

export const getTodaysAppointmentForPatient = async (patientId: string) => {
    // ... (unchanged logic)
    const today = getNow();
    const start = startOfDay(today);
    const end = endOfDay(today);

    const appointments = await prisma.appointment.findMany({
        where: {
            patientId,
            startAt: { gte: start, lte: end },
            status: { not: 'cancelled' }
        },
        orderBy: { startAt: 'asc' },
        include: { staff: true }
    });

    if (appointments.length === 0) return null;

    const now = getNow();
    const closest = appointments.reduce((prev, curr) => {
        const prevDiff = Math.abs(prev.startAt.getTime() - now.getTime());
        const currDiff = Math.abs(curr.startAt.getTime() - now.getTime());
        return currDiff < prevDiff ? curr : prev;
    });

    return closest;
};

// Check if STAFF is available
export const checkStaffAvailability = async (startAt: Date, duration: number, staffId?: string | null, excludeId?: string) => {
    // Staff ID is optional (no staff assigned = always available? or check generic capacity? Assuming always OK if no staff)
    if (!staffId) return true;

    const rangeStart = new Date(startAt.getTime() - 180 * 60000);
    const rangeEnd = new Date(startAt.getTime() + 180 * 60000);

    const candidates = await prisma.appointment.findMany({
        where: {
            status: { not: 'cancelled' },
            staffId: staffId,
            startAt: { gte: rangeStart, lte: rangeEnd },
            ...(excludeId ? { id: { not: excludeId } } : {})
        }
    });

    const myStart = startAt.getTime();
    const myEnd = myStart + duration * 60000;

    for (const appt of candidates) {
        const otherStart = appt.startAt.getTime();
        const otherEnd = otherStart + (appt.duration || 60) * 60000;
        if (hasOverlap(myStart, myEnd, otherStart, otherEnd)) return false;
    }
    return true;
};

// Check if PATIENT is available (no double booking for same patient)
export const checkPatientAvailability = async (patientId: string, startAt: Date, duration: number, excludeId?: string) => {
    const rangeStart = new Date(startAt.getTime() - 180 * 60000);
    const rangeEnd = new Date(startAt.getTime() + 180 * 60000);

    const candidates = await prisma.appointment.findMany({
        where: {
            status: { not: 'cancelled' },
            patientId: patientId,
            startAt: { gte: rangeStart, lte: rangeEnd },
            ...(excludeId ? { id: { not: excludeId } } : {})
        }
    });

    const myStart = startAt.getTime();
    const myEnd = myStart + duration * 60000;

    for (const appt of candidates) {
        const otherStart = appt.startAt.getTime();
        const otherEnd = otherStart + (appt.duration || 60) * 60000;
        if (hasOverlap(myStart, myEnd, otherStart, otherEnd)) return false;
    }
    return true;
};

export const getNextAppointment = async (patientId: string) => {
    // ... (unchanged)
    const now = getNow();
    const appointment = await prisma.appointment.findFirst({
        where: {
            patientId,
            startAt: { gte: now },
            status: { not: 'cancelled' }
        },
        orderBy: { startAt: 'asc' },
        include: { staff: true }
    });

    if (!appointment) return null;
    return {
        id: appointment.id,
        startAt: appointment.startAt,
        duration: appointment.duration,
        memo: appointment.memo,
        staffId: appointment.staffId || undefined,
        staffName: appointment.staff?.name
    };
};

export const createAppointment = async (patientId: string, startAt: Date, memo?: string, staffId?: string, duration: number = 60, adminMemo?: string, createdBy?: string) => {
    // 1. Check Staff Availability
    const isStaffOk = await checkStaffAvailability(startAt, duration, staffId);
    if (!isStaffOk) {
        throw new Error('担当者の予定が重複しています');
    }

    // 2. Check Patient Availability
    const isPatientOk = await checkPatientAvailability(patientId, startAt, duration);
    if (!isPatientOk) {
        throw new Error('この患者は同じ時間帯に既に予約があります');
    }

    console.log(`[DEBUG_CREATE] Creating appt. Memo arg: "${memo}"`);

    return await prisma.appointment.create({
        data: {
            patientId,
            startAt,
            memo,
            staffId,
            duration,
            adminMemo,
            createdBy: createdBy || null,
        }
    });
};

export const cancelAppointment = async (id: string) => {
    return await prisma.appointment.update({
        where: { id },
        data: { status: 'cancelled' }
    });
};

export const updateAppointment = async (id: string, data: { startAt?: Date, memo?: string, staffId?: string | null, duration?: number, adminMemo?: string | null, isMemoResolved?: boolean, status?: string }) => {
    const current = await prisma.appointment.findUnique({ where: { id } });
    if (!current) throw new Error('Appointment not found');

    // staffId logic:
    // undefined -> no change (use current)
    // null -> unassign (use null)
    // string -> assign (use string)

    // Check constraints if time or staff changes
    // Condition: Time changed OR Duration changed OR Staff changed (undefined means no change)
    const isTimeChanged = (data.startAt && data.startAt.getTime() !== current.startAt.getTime()) || (data.duration && data.duration !== current.duration);
    const isStaffChanged = data.staffId !== undefined && data.staffId !== current.staffId;

    if (isTimeChanged || isStaffChanged) {
        const targetStart = data.startAt || current.startAt;
        const targetDuration = data.duration || current.duration;
        // If data.staffId is undefined, use current. If null or string, use it.
        const targetStaffId = data.staffId !== undefined ? data.staffId : current.staffId;

        // 1. Check Staff (Only if a staff is assigned)
        if (targetStaffId) {
            const isStaffOk = await checkStaffAvailability(targetStart, targetDuration, targetStaffId, id);
            if (!isStaffOk) {
                throw new Error('担当者の予定が重複しています');
            }
        }

        // 2. Check Patient
        const isPatientOk = await checkPatientAvailability(current.patientId, targetStart, targetDuration, id);
        if (!isPatientOk) {
            throw new Error('この患者は同じ時間帯に既に予約があります');
        }
    }

    return await prisma.appointment.update({
        where: { id },
        data: {
            ...data, // Prisma handles undefined as "skip" and null as "set null"
        }
    });
};

export const checkInAppointment = async (id: string) => {
    return await prisma.appointment.update({
        where: { id },
        data: {
            status: 'arrived',
            arrivedAt: new Date()
        }
    });
};

export const cancelCheckIn = async (id: string) => {
    return await prisma.appointment.update({
        where: { id },
        data: {
            status: 'pending', // Revert to meaningful default
            arrivedAt: null
        }
    });
};

// Get all unresolved admin memos (not limited to today)
export const getUnresolvedAdminMemos = async (): Promise<Appointment[]> => {
    const appointments = await prisma.appointment.findMany({
        where: {
            adminMemo: { not: null, notIn: [''] }, // Exclude null AND empty strings
            status: { not: 'cancelled' },
            OR: [
                { isMemoResolved: false },
                {
                    isMemoResolved: true,
                    updatedAt: { gte: startOfDay(getNow()) } // Keep today's resolved items visible
                }
            ]
        },
        select: {
            id: true,
            startAt: true,
            duration: true,
            status: true,
            memo: true,
            adminMemo: true,
            isMemoResolved: true,
            adminMemoResolvedBy: true,
            adminMemoResolvedAt: true,
            arrivedAt: true,
            patientId: true,
            staffId: true,
            staff: true,
            patient: {
                select: {
                    id: true,
                    name: true,
                    kana: true,
                    tags: true,
                    memo: true,
                    _count: { select: { records: true } }
                }
            }
        },
        orderBy: { startAt: 'desc' }
    });

    // Collect resolver IDs and fetch their names
    const resolverIds = [...new Set(
        appointments
            .filter(a => a.adminMemoResolvedBy)
            .map(a => a.adminMemoResolvedBy as string)
    )];

    const resolvers = resolverIds.length > 0
        ? await prisma.staff.findMany({
            where: { id: { in: resolverIds } },
            select: { id: true, name: true }
        })
        : [];

    const resolverMap = new Map(resolvers.map(r => [r.id, r.name]));

    return appointments.map((a: AppointmentWithRel) => {
        const visitCount = a.patient._count.records + 1;
        return {
            id: a.id,
            patientId: a.patientId,
            patientName: a.patient.name,
            patientKana: a.patient.kana,
            visitDate: a.startAt,
            duration: a.duration,
            visitCount,
            tags: a.patient.tags ? JSON.parse(a.patient.tags as string) : [],
            memo: a.memo || undefined,
            adminMemo: a.adminMemo || undefined,
            isMemoResolved: a.isMemoResolved ?? false,
            adminMemoResolvedBy: a.adminMemoResolvedBy || undefined,
            adminMemoResolvedAt: a.adminMemoResolvedAt || undefined,
            adminMemoResolverName: a.adminMemoResolvedBy
                ? resolverMap.get(a.adminMemoResolvedBy)
                : undefined,
            staffName: a.staff?.name,
            staffId: a.staffId || undefined,
            status: a.status,
            arrivedAt: a.arrivedAt || undefined,
        };
    });
};
