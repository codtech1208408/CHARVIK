import React from 'react';
import type { LucideIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  iconBgColor?: string;
  iconColor?: string;
  subtitle?: string;
  linkTo?: string;
  dataAos?: string;
  dataAosDelay?: number;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon: Icon,
  iconBgColor = 'bg-blue-50',
  iconColor = 'text-blue-600',
  subtitle,
  linkTo,
  dataAos = 'fade-up',
  dataAosDelay = 0
}) => {
  const navigate = useNavigate();

  return (
    <div
      data-aos={dataAos}
      data-aos-delay={dataAosDelay}
      onClick={() => linkTo && navigate(linkTo)}
      className={`bg-white rounded-xl border border-slate-200/80 p-5 shadow-sm hover:shadow-md transition-all duration-200 flex items-center justify-between ${
        linkTo ? 'cursor-pointer hover:border-blue-400 group' : ''
      }`}
    >
      <div className="flex-1">
        <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">{title}</p>
        <h3 className="text-xl lg:text-2xl font-extrabold text-[#172B4D] mt-0.5 tracking-tight group-hover:text-blue-600 transition-colors">
          {value}
        </h3>
        {subtitle && (
          <p className="text-[11px] text-slate-500 mt-0.5 font-medium">{subtitle}</p>
        )}
      </div>

      <div className={`w-10 h-10 rounded-xl ${iconBgColor} flex items-center justify-center shrink-0 ml-3 shadow-sm group-hover:scale-105 transition-transform`}>
        <Icon className={`w-5 h-5 ${iconColor}`} />
      </div>
    </div>
  );
};
