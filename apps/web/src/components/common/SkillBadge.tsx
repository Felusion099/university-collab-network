import React from 'react';

interface SkillBadgeProps {
  skill: string;
  variant?: 'default' | 'accent' | 'subtle';
  size?: 'xs' | 'sm';
  onClick?: () => void;
}

export const SkillBadge: React.FC<SkillBadgeProps> = ({
  skill,
  variant = 'default',
  size = 'xs',
  onClick,
}) => {
  const sizeClasses = size === 'xs' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs';
  const interactiveClasses = onClick
    ? 'cursor-pointer hover:border-zinc-400 hover:text-zinc-900 transition-colors'
    : '';

  let colorClasses = 'bg-zinc-100/90 text-zinc-700 border-zinc-200/80';
  if (variant === 'accent') {
    colorClasses = 'bg-blue-50 text-blue-700 border-blue-200/70';
  } else if (variant === 'subtle') {
    colorClasses = 'bg-stone-50 text-stone-600 border-stone-200/60';
  }

  return (
    <span
      onClick={onClick}
      className={`inline-flex items-center font-medium rounded-md border ${sizeClasses} ${colorClasses} ${interactiveClasses}`}
    >
      {skill}
    </span>
  );
};
