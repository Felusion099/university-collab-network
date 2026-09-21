import React from 'react';
import { UserVerification } from '../../types';
import { GraduationCap, Award, ShieldCheck, Sparkles } from 'lucide-react';

interface VerificationBadgeProps {
  verification: UserVerification;
  size?: 'sm' | 'md';
}

export const VerificationBadge: React.FC<VerificationBadgeProps> = ({
  verification,
  size = 'sm',
}) => {
  if (!verification.isVerified) return null;

  const isSmall = size === 'sm';

  switch (verification.badge) {
    case 'faculty':
      return (
        <span
          className={`inline-flex items-center gap-1 font-medium bg-amber-50 text-amber-800 border border-amber-200/80 rounded-full ${
            isSmall ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs'
          }`}
          title="Verified University Faculty Member"
        >
          <Award className={isSmall ? 'w-3 h-3 text-amber-600' : 'w-3.5 h-3.5 text-amber-600'} />
          {verification.label || 'Faculty'}
        </span>
      );
    case 'council':
      return (
        <span
          className={`inline-flex items-center gap-1 font-medium bg-purple-50 text-purple-800 border border-purple-200/80 rounded-full ${
            isSmall ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs'
          }`}
          title="Official Campus Council Representative"
        >
          <ShieldCheck className={isSmall ? 'w-3 h-3 text-purple-600' : 'w-3.5 h-3.5 text-purple-600'} />
          {verification.label || 'Council'}
        </span>
      );
    case 'lead':
      return (
        <span
          className={`inline-flex items-center gap-1 font-medium bg-indigo-50 text-indigo-800 border border-indigo-200/80 rounded-full ${
            isSmall ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs'
          }`}
        >
          <Sparkles className={isSmall ? 'w-3 h-3 text-indigo-600' : 'w-3.5 h-3.5 text-indigo-600'} />
          {verification.label || 'Team Lead'}
        </span>
      );
    case 'student':
    default:
      return (
        <span
          className={`inline-flex items-center gap-1 font-medium bg-emerald-50 text-emerald-800 border border-emerald-200/80 rounded-full ${
            isSmall ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs'
          }`}
          title="Verified University Student"
        >
          <GraduationCap className={isSmall ? 'w-3 h-3 text-emerald-600' : 'w-3.5 h-3.5 text-emerald-600'} />
          {verification.label || 'Verified Student'}
        </span>
      );
  }
};
