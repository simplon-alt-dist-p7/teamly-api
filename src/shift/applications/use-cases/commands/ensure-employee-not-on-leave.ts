import { ConflictException } from '@nestjs/common';
import type { Employee } from '@prisma/client';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { LeaveRequestRepository } from 'src/leave-request/data-access/leave-requests.repository';

function parisDay(date: Date): string {
  return new Intl.DateTimeFormat('fr-CA', { timeZone: 'Europe/Paris' }).format(
    date,
  );
}

export async function ensureEmployeeNotOnLeave(
  employee: Pick<Employee, 'id' | 'firstName'>,
  shiftStart: Date,
  leaveRequestsRepository: LeaveRequestRepository,
): Promise<void> {
  const day = parisDay(shiftStart);
  const shiftDay = new Date(day);
  const leaveRequests = await leaveRequestsRepository.findByEmployeeId(
    employee.id,
  );

  if (leaveRequests.some((leave) => leave.blocksShiftsOn(shiftDay))) {
    const dayLabel = format(parseISO(day), 'EEEE d MMMM', { locale: fr });
    throw new ConflictException(
      `${employee.firstName} est en congé le ${dayLabel}.`,
    );
  }
}
