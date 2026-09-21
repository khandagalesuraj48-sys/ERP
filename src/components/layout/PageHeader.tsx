import React from "react";

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 mb-5 border-b border-gray-200/70 gap-3">
      <div>
        <h1 className="text-[24px] font-bold text-gray-900 tracking-tight leading-tight">
          {title}
        </h1>
        {subtitle && (
          <p className="text-[13px] text-gray-500 mt-0.5 font-normal leading-normal">
            {subtitle}
          </p>
        )}
      </div>
      {action && <div className="flex items-center gap-2 shrink-0">{action}</div>}
    </div>
  );
}
