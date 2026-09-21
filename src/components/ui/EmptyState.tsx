import React from "react";
import { Icon } from "./Icon";
import Link from "next/link";

interface EmptyStateProps {
  icon?: string;
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
}

export function EmptyState({
  icon = "inbox",
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
}: EmptyStateProps) {
  return (
    <div className="card p-10 flex flex-col items-center justify-center text-center select-none">
      <div className="w-12 h-12 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-center text-gray-400 mb-3">
        <Icon name={icon} className="text-[24px]" />
      </div>
      <h4 className="text-[15px] font-semibold text-gray-900 mb-1">{title}</h4>
      <p className="text-[13px] text-gray-500 max-w-sm mb-5">{description}</p>
      {actionLabel && actionHref && (
        <Link
          href={actionHref}
          className="btn-primary"
        >
          <Icon name="add" className="text-[16px]" /> {actionLabel}
        </Link>
      )}
      {actionLabel && !actionHref && onAction && (
        <button
          onClick={onAction}
          className="btn-primary"
        >
          <Icon name="add" className="text-[16px]" /> {actionLabel}
        </button>
      )}
    </div>
  );
}
