'use client';

import { motion } from 'framer-motion';
import {
  GraduationCap,
  Briefcase,
  Play,
} from 'lucide-react';
import type { Profile, BehavioralStyle } from '@/lib/types/database';
import { BEHAVIORAL_STYLE_LABELS, BEHAVIORAL_STYLE_COLORS, BEHAVIORAL_STYLE_ICONS } from '@/lib/types/database';

interface StudentCardProps {
  student: Profile;
}

function calculateAge(dateOfBirth: string | null): number | null {
  if (!dateOfBirth) return null;
  const dob = new Date(dateOfBirth);
  const now = new Date();
  let age = now.getFullYear() - dob.getFullYear();
  const monthDiff = now.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < dob.getDate())) {
    age--;
  }
  return age;
}

function StyleBadge({ style }: { style: BehavioralStyle }) {
  return (
    <span
      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border"
      style={{
        backgroundColor: `${BEHAVIORAL_STYLE_COLORS[style]}15`,
        borderColor: `${BEHAVIORAL_STYLE_COLORS[style]}30`,
        color: BEHAVIORAL_STYLE_COLORS[style],
      }}
    >
      {BEHAVIORAL_STYLE_ICONS[style]} {BEHAVIORAL_STYLE_LABELS[style]}
    </span>
  );
}

export default function StudentCard({ student }: StudentCardProps) {
  const age = calculateAge(student.date_of_birth);

  return (
    <div className="w-full h-full rounded-3xl overflow-hidden bg-gradient-to-b from-[#1A1A2E] to-[#12121A] border border-white/10 shadow-2xl flex flex-col">
      {/* Video / Avatar area */}
      <div className="relative aspect-[3/4] bg-gradient-to-br from-purple-900/30 to-blue-900/30 overflow-hidden">
        {student.video_thumbnail_url ? (
          <img
            src={student.video_thumbnail_url}
            alt={student.full_name}
            className="w-full h-full object-cover"
          />
        ) : student.avatar_url ? (
          <img
            src={student.avatar_url}
            alt={student.full_name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
              <span className="text-4xl font-bold text-white">
                {student.full_name?.charAt(0)?.toUpperCase() || '?'}
              </span>
            </div>
          </div>
        )}

        {/* Video play button overlay */}
        {student.video_pitch_url && (
          <div className="absolute bottom-4 right-4">
            <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-lg flex items-center justify-center border border-white/20">
              <Play className="w-5 h-5 text-white ml-0.5" />
            </div>
          </div>
        )}

        {/* Name overlay at bottom */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-5 pt-16">
          <h2 className="text-2xl font-bold text-white">
            {student.full_name}
            {age && (
              <span className="text-lg font-normal text-white/70 ml-2">{age}</span>
            )}
          </h2>
        </div>
      </div>

      {/* Info section */}
      <div className="p-5 flex-1 flex flex-col gap-3">
        {/* Education line */}
        {student.education_line && (
          <div className="flex items-center gap-2 text-text-secondary text-sm">
            <GraduationCap className="w-4 h-4 text-purple-400 shrink-0" />
            <span className="capitalize">
              {student.education_line.replace(/_/g, ' ')}
            </span>
          </div>
        )}

        {/* Work experience */}
        {student.work_experience && (
          <div className="flex items-start gap-2 text-text-secondary text-sm">
            <Briefcase className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
            <span className="line-clamp-2">{student.work_experience}</span>
          </div>
        )}

        {/* Behavioral styles */}
        <div className="flex flex-wrap gap-2 mt-auto pt-2">
          {student.primary_style && <StyleBadge style={student.primary_style} />}
          {student.secondary_style && <StyleBadge style={student.secondary_style} />}
        </div>
      </div>
    </div>
  );
}
