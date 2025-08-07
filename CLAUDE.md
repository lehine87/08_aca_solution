# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- **Development server**: `npm run dev` (uses Next.js with Turbopack)
- **Production build**: `npm run build`
- **Production server**: `npm start`
- **Linting**: `npm run lint` (uses ESLint with Next.js config)

## Architecture Overview

This is a Next.js 15 academy management system (학원 관리 시스템) built with React 19 and Supabase as the backend.

### Core Structure

- **Frontend**: Next.js App Router with client-side components
- **Database**: Supabase (PostgreSQL) with real-time capabilities
- **Styling**: Tailwind CSS 4
- **State Management**: React hooks (useState, useEffect)

### Database Schema

Key tables include:
- `students` - Student records with fields like name, grade, subject, monthly_fee, status
- `classes` - Class information with classroom, instructor assignments
- `class_schedules` - Class timing with day_of_week, start_time, end_time
- `instructors` - Instructor information

### Key Features

1. **Student Management** (`/students`) - Registration, editing, status management
2. **Class Management** (`/classes`) - Class creation, scheduling, student assignment
3. **Attendance System** (`/attendance`) - Daily attendance tracking
4. **Instructor Management** (`/instructors`) - Instructor information and class assignments
5. **Dashboard** (`/`) - Overview statistics and quick access
6. **Test Page** (`/test`) - Supabase connection testing and debugging

### Important Files

- `src/lib/supabase.js` - Supabase client configuration and connection testing
- `src/lib/scheduleUtils.js` - Schedule conflict detection, time utilities, classroom/instructor overlap checking
- `src/app/page.js` - Main dashboard with statistics and navigation

### Environment Variables

Required in `.env.local`:
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key

### Schedule Conflict System

The application includes sophisticated schedule conflict detection:
- Classroom booking conflicts
- Instructor schedule conflicts (with 10-minute buffer for movement)
- Time overlap validation utilities
- Conflict resolution messaging

### Development Notes

- All pages use client-side rendering (`'use client'`)
- Korean language interface
- Real-time dashboard statistics
- Excel export functionality for data management
- Responsive design with Tailwind CSS utilities