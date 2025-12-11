-- ============================================================================
-- COMPREHENSIVE HRM SCHEMA MIGRATION
-- Purpose: Complete database schema aligned with source code
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- 1. ENUM TYPES
-- ============================================================================
CREATE TYPE attendance_type AS ENUM ('check_in', 'check_out');
CREATE TYPE leave_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE leave_type AS ENUM ('annual', 'sick', 'personal', 'unpaid');
CREATE TYPE booking_status AS ENUM ('pending', 'approved', 'rejected', 'cancelled');
CREATE TYPE app_role AS ENUM ('staff', 'leader', 'admin', 'hr', 'bod', 'employee');

-- ============================================================================
-- 2. BASE TABLES
-- ============================================================================

-- Teams
CREATE TABLE IF NOT EXISTS public.teams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    leader_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_teams_leader_id ON public.teams(leader_id);

-- Shifts
CREATE TABLE IF NOT EXISTS public.shifts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL UNIQUE,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_shifts_name ON public.shifts(name);

-- Positions
CREATE TABLE IF NOT EXISTS public.positions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- User Roles
CREATE TABLE IF NOT EXISTS public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role app_role NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_roles_unique ON public.user_roles(user_id, role);

-- Profiles (User Information)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL UNIQUE,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    full_name VARCHAR(255),
    phone VARCHAR(20),
    avatar_url TEXT,
    date_of_birth DATE,
    team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL,
    shift_id UUID REFERENCES public.shifts(id) ON DELETE SET NULL,
    position_id UUID REFERENCES public.positions(id) ON DELETE SET NULL,
    annual_leave_balance INTEGER DEFAULT 0,
    account_status VARCHAR(50) DEFAULT 'PENDING',
    notification_settings JSONB DEFAULT '{"email_new_tasks":true,"email_approvals":true,"email_daily_reports":true,"in_app_notifications":true}'::jsonb,
    theme_preference VARCHAR(20) DEFAULT 'system',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_profiles_team_id ON public.profiles(team_id);
CREATE INDEX IF NOT EXISTS idx_profiles_shift_id ON public.profiles(shift_id);

-- ============================================================================
-- 3. USER REGISTRATION & SESSIONS
-- ============================================================================

-- User Registrations
CREATE TABLE IF NOT EXISTS public.user_registrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    status VARCHAR(50) DEFAULT 'pending',
    rejection_reason TEXT,
    reapplication_count INTEGER DEFAULT 0,
    admin_approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    hr_approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    admin_notes TEXT,
    hr_notes TEXT,
    admin_approved_at TIMESTAMPTZ,
    hr_approved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_registrations_user_id ON public.user_registrations(user_id);

-- User Sessions
CREATE TABLE IF NOT EXISTS public.user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    session_id TEXT NOT NULL UNIQUE,
    device_type VARCHAR(50),
    device_name TEXT,
    device_os TEXT,
    user_agent TEXT,
    ip_address TEXT,
    location TEXT,
    last_activity TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON public.user_sessions(user_id);

-- Application Settings
CREATE TABLE IF NOT EXISTS public.application_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID,
    setting_key VARCHAR(255) NOT NULL UNIQUE,
    setting_value JSONB,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 4. ATTENDANCE
-- ============================================================================

-- Attendance Records
CREATE TABLE IF NOT EXISTS public.attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type attendance_type NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    location TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_attendance_user_id ON public.attendance(user_id);
CREATE INDEX IF NOT EXISTS idx_attendance_timestamp ON public.attendance(timestamp);

-- Attendance Settings
CREATE TABLE IF NOT EXISTS public.attendance_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE,
    start_time TIME NOT NULL DEFAULT '08:00:00'::time,
    end_time TIME NOT NULL DEFAULT '17:00:00'::time,
    allow_remote BOOLEAN DEFAULT FALSE,
    geofencing_enabled BOOLEAN DEFAULT FALSE,
    geofence_radius INTEGER,
    office_latitude DECIMAL(10, 8),
    office_longitude DECIMAL(11, 8),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_attendance_settings_team_id ON public.attendance_settings(team_id);

-- ============================================================================
-- 5. LEAVE MANAGEMENT
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.leave_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type leave_type NOT NULL,
    status leave_status DEFAULT 'pending',
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    reason TEXT,
    rejection_reason TEXT,
    approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    approved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_leave_requests_user_id ON public.leave_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_leave_requests_status ON public.leave_requests(status);

-- ============================================================================
-- 6. TASKS & PROJECT MANAGEMENT
-- ============================================================================

-- Fields/Categories for Tasks
CREATE TABLE IF NOT EXISTS public.fields (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    color VARCHAR(20),
    position INTEGER DEFAULT 0,
    is_archived BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Task Statuses
CREATE TABLE IF NOT EXISTS public.task_statuses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    color VARCHAR(20),
    position INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tasks
CREATE TABLE IF NOT EXISTS public.tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    priority VARCHAR(20) DEFAULT 'medium',
    status VARCHAR(50) DEFAULT 'todo',
    creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
    assignee_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL,
    field_id UUID REFERENCES public.fields(id) ON DELETE SET NULL,
    group_id UUID,
    space_id UUID,
    deadline DATE,
    completed_at TIMESTAMPTZ,
    assigned_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    completed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    completion_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tasks_creator_id ON public.tasks(creator_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assignee_id ON public.tasks(assignee_id);
CREATE INDEX IF NOT EXISTS idx_tasks_team_id ON public.tasks(team_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON public.tasks(status);

-- Task Files/Attachments
CREATE TABLE IF NOT EXISTS public.task_files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_size INTEGER,
    uploaded_by UUID NOT NULL REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_task_files_task_id ON public.task_files(task_id);

-- Groups
CREATE TABLE IF NOT EXISTS public.groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    color VARCHAR(20),
    position INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_groups_team_id ON public.groups(team_id);

-- Spaces
CREATE TABLE IF NOT EXISTS public.spaces (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    color VARCHAR(20),
    position INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_spaces_group_id ON public.spaces(group_id);

-- ============================================================================
-- 7. MEETING ROOMS
-- ============================================================================

-- Meeting Rooms
CREATE TABLE IF NOT EXISTS public.meeting_rooms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    location TEXT,
    capacity INTEGER DEFAULT 10,
    equipment TEXT[] DEFAULT ARRAY[]::text[],
    google_meet_enabled BOOLEAN DEFAULT FALSE,
    zoom_enabled BOOLEAN DEFAULT FALSE,
    manager_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    is_active BOOLEAN DEFAULT TRUE,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_meeting_rooms_manager_id ON public.meeting_rooms(manager_id);

-- Room Bookings
CREATE TABLE IF NOT EXISTS public.room_bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID NOT NULL REFERENCES public.meeting_rooms(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    status booking_status DEFAULT 'pending',
    approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    approved_at TIMESTAMPTZ,
    google_meet_link TEXT,
    zoom_link TEXT,
    organizer_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_room_bookings_room_id ON public.room_bookings(room_id);
CREATE INDEX IF NOT EXISTS idx_room_bookings_user_id ON public.room_bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_room_bookings_start_time ON public.room_bookings(start_time);

-- Room Participants
CREATE TABLE IF NOT EXISTS public.room_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID NOT NULL REFERENCES public.room_bookings(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    is_organizer BOOLEAN DEFAULT FALSE,
    status VARCHAR(20) DEFAULT 'invited',
    joined_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_room_participants_unique ON public.room_participants(booking_id, user_id);
CREATE INDEX IF NOT EXISTS idx_room_participants_booking_id ON public.room_participants(booking_id);
CREATE INDEX IF NOT EXISTS idx_room_participants_user_id ON public.room_participants(user_id);

-- ============================================================================
-- 8. NOTIFICATIONS & COMMUNICATIONS
-- ============================================================================

-- Notifications
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    link TEXT,
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON public.notifications(read);

-- Audit Logs
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    action VARCHAR(255) NOT NULL,
    entity_type VARCHAR(100) NOT NULL,
    entity_id UUID,
    details JSONB,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON public.audit_logs(entity_type, entity_id);

-- ============================================================================
-- 9. PAYROLL & SALARIES
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.salaries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    month VARCHAR(7) NOT NULL,
    base_salary DECIMAL(15, 2) NOT NULL,
    bonus DECIMAL(15, 2),
    deductions DECIMAL(15, 2),
    total_salary DECIMAL(15, 2),
    hours_worked DECIMAL(10, 2),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_salaries_user_id ON public.salaries(user_id);
CREATE INDEX IF NOT EXISTS idx_salaries_month ON public.salaries(month);

-- ============================================================================
-- 10. REPORTS & MEETINGS
-- ============================================================================

-- Daily Reports
CREATE TABLE IF NOT EXISTS public.daily_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    report_date DATE NOT NULL,
    content TEXT NOT NULL,
    created_by UUID,
    approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_daily_reports_user_id ON public.daily_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_reports_date ON public.daily_reports(report_date);

-- Meeting Minutes
CREATE TABLE IF NOT EXISTS public.meeting_minutes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    meeting_date DATE NOT NULL,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_meeting_minutes_date ON public.meeting_minutes(meeting_date);

-- ============================================================================
-- 11. ENABLE ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE IF EXISTS public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.user_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.attendance_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.leave_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.task_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.meeting_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.room_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.room_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.salaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.daily_reports ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 12. RLS POLICIES
-- ============================================================================

-- Profiles - Users can view/edit own profile
CREATE POLICY "profiles_select_policy" ON public.profiles
    FOR SELECT USING (auth.uid() = id OR 
        EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'hr')));

CREATE POLICY "profiles_update_policy" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- User Roles - Admin can manage
CREATE POLICY "user_roles_select_policy" ON public.user_roles
    FOR SELECT USING (auth.uid() = user_id OR 
        EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

-- Attendance - Users can view own, admins can view all
CREATE POLICY "attendance_select_policy" ON public.attendance
    FOR SELECT USING (auth.uid() = user_id OR 
        EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'hr')));

CREATE POLICY "attendance_insert_policy" ON public.attendance
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Tasks - Users can view assigned, creators, team members
CREATE POLICY "tasks_select_policy" ON public.tasks
    FOR SELECT USING (
        auth.uid() = creator_id OR
        auth.uid() = assignee_id OR
        team_id IN (SELECT team_id FROM public.profiles WHERE id = auth.uid()) OR
        EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'leader'))
    );

CREATE POLICY "tasks_insert_policy" ON public.tasks
    FOR INSERT WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "tasks_update_policy" ON public.tasks
    FOR UPDATE USING (auth.uid() = creator_id OR 
        EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'leader')));

-- Room Bookings - Users can view own, organizers can manage
CREATE POLICY "room_bookings_select_policy" ON public.room_bookings
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "room_bookings_insert_policy" ON public.room_bookings
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "room_bookings_update_policy" ON public.room_bookings
    FOR UPDATE USING (auth.uid() = user_id);

-- Room Participants - Users can view bookings they're in
CREATE POLICY "room_participants_select_policy" ON public.room_participants
    FOR SELECT USING (
        auth.uid() = user_id OR
        EXISTS (SELECT 1 FROM public.room_bookings WHERE id = booking_id AND user_id = auth.uid())
    );

-- Notifications - Users can view own notifications
CREATE POLICY "notifications_select_policy" ON public.notifications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "notifications_update_policy" ON public.notifications
    FOR UPDATE USING (auth.uid() = user_id);

-- ============================================================================
-- 13. DEFAULT DATA
-- ============================================================================

-- Insert default positions
INSERT INTO public.positions (name, description) VALUES
    ('Staff', 'Regular Employee'),
    ('Leader', 'Team Leader'),
    ('Manager', 'Department Manager'),
    ('Director', 'Executive Director'),
    ('HR Manager', 'Human Resources Manager')
ON CONFLICT DO NOTHING;

-- Insert default shifts
INSERT INTO public.shifts (name, start_time, end_time, description) VALUES
    ('Morning', '08:00:00'::time, '17:00:00'::time, 'Standard morning shift'),
    ('Afternoon', '13:00:00'::time, '22:00:00'::time, 'Afternoon shift'),
    ('Night', '22:00:00'::time, '07:00:00'::time, 'Night shift'),
    ('Flexible', '09:00:00'::time, '18:00:00'::time, 'Flexible work hours')
ON CONFLICT DO NOTHING;

-- Insert default task statuses
INSERT INTO public.task_statuses (name, color, position) VALUES
    ('To Do', 'blue', 0),
    ('In Progress', 'yellow', 1),
    ('Review', 'purple', 2),
    ('Done', 'green', 3)
ON CONFLICT DO NOTHING;

-- Insert default application settings
INSERT INTO public.application_settings (setting_key, setting_value, description) VALUES
    ('support_email', '"support@hrm.local"'::jsonb, 'Support contact email'),
    ('support_phone', '"+84-123-456-789"'::jsonb, 'Support contact phone'),
    ('organization_name', '"LifeOS HRM AI"'::jsonb, 'Organization name'),
    ('app_name', '"LifeOS HRM AI"'::jsonb, 'Application name')
ON CONFLICT (setting_key) DO NOTHING;

-- ============================================================================
-- 14. REALTIME SETUP
-- ============================================================================

ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.tasks;
ALTER PUBLICATION supabase_realtime ADD TABLE public.room_participants;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
