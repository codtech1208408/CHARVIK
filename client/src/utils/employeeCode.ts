/**
 * Auto-generates sequential employee code starting from 1001.
 * Formats:
 * - Driver:  DRV-1001, DRV-1002, DRV-1003...
 * - Helper:  HLP-1001, HLP-1002, HLP-1003...
 * - Captain: CPT-1001, CPT-1002, CPT-1003...
 * 
 * Rules:
 * 1. Only codes strictly following the DRV-XXXX, HLP-XXXX, or CPT-XXXX format are considered.
 * 2. Legacy codes with EMP- prefix or arbitrary random numbers are ignored completely.
 * 3. Starts strictly at 1001.
 */
export const getNextEmployeeCode = (
  role: 'Driver' | 'Helper' | 'Captain' | string,
  employees: Array<{ role?: string; employee_code?: string }> = []
): string => {
  const roleLower = (role || '').toLowerCase().trim();
  let prefix = 'DRV-';
  let pattern = /^DRV-(\d+)$/i;

  if (roleLower === 'helper') {
    prefix = 'HLP-';
    pattern = /^HLP-(\d+)$/i;
  } else if (roleLower === 'captain') {
    prefix = 'CPT-';
    pattern = /^CPT-(\d+)$/i;
  }

  let maxSeq = 1000;

  if (Array.isArray(employees)) {
    for (const emp of employees) {
      const code = String(emp.employee_code || '').trim();
      if (!code) continue;

      // Strict match for standard prefix followed by digits (e.g. DRV-1001, HLP-1001, CPT-1001)
      const match = code.match(pattern);
      if (match) {
        const num = parseInt(match[1], 10);
        if (!isNaN(num) && num >= 1001 && num > maxSeq) {
          maxSeq = num;
        }
      }
    }
  }

  return `${prefix}${maxSeq + 1}`;
};
