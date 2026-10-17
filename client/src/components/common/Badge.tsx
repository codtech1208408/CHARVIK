import React from 'react';

interface BadgeProps {
  status: string;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ status, className = '' }) => {
  const getColors = () => {
    switch (status) {
      case 'Active':
      case 'Completed':
      case 'Fit for Service':
      case 'Verified':
      case 'Working':
      case 'Good':
      case 'Resolved':
      case 'OK':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';

      case 'Due Soon':
      case 'Scheduled':
      case 'Pending':
      case 'Needs Inspection':
      case 'In Progress':
      case 'Needs Monitoring':
      case 'Fit with Restrictions':
      case 'Needs Attention':
      case 'Medium':
        return 'bg-amber-50 text-amber-700 border-amber-200';

      case 'Overdue':
      case 'Under Maintenance':
      case 'Critical':
      case 'High':
      case 'Defective':
      case 'Not Fit for Service':
      case 'Failed':
      case 'Rejected':
      case 'Expired':
      case 'Needs Replacement':
      case 'Replace Soon':
      case 'Open':
        return 'bg-rose-50 text-rose-700 border-rose-200';

      case 'Inactive':
      case 'Out of Service':
      case 'On Hold':
      case 'Cancelled':
      case 'Closed':
      case 'Low':
        return 'bg-slate-100 text-slate-700 border-slate-200';

      default:
        return 'bg-blue-50 text-blue-700 border-blue-200';
    }
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getColors()} ${className}`}
    >
      <span className="w-1.5 h-1.5 mr-1.5 rounded-full bg-current opacity-70"></span>
      {status}
    </span>
  );
};
