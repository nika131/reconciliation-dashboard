import { isBefore, isAfter, isEqual, startOfMonth, endOfMonth, parseISO } from 'date-fns';
import { Contract } from '@/schemas';

export function isContractActiveInMonth(contract: Contract, year: number, month: number): boolean {
  const targetStart = startOfMonth(new Date(year, month - 1));
  const targetEnd = endOfMonth(new Date(year, month - 1));
  
  const contractStart = parseISO(contract.start_date);

  if ((contract.status === 'paused' || contract.status === 'ended') && !contract.end_date) {
    return false; 
  }
  
  // Rule 1: Contract must start on or before the end of the target month
  const startedInTime = isBefore(contractStart, targetEnd) || isEqual(contractStart, targetEnd);
  if (!startedInTime) return false;

  // Rule 2: If no end date, it's active. Otherwise, it must end on or after the start of the target month
  if (!contract.end_date) return true;
  
  const contractEnd = parseISO(contract.end_date);
  return isAfter(contractEnd, targetStart) || isEqual(contractEnd, targetStart);
}