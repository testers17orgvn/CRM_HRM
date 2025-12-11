-- ============================================================================
-- MIGRATION: 025_complete_schema_with_all_features.sql
-- PURPOSE: Comprehensive migration to ensure all required tables and columns
--          exist for full application functionality
-- ============================================================================

-- ============================================================================
-- 1. ENSURE MEETING_ROOMS TABLE HAS ALL REQUIRED COLUMNS
-- ============================================================================
ALTER TABLE IF EXISTS public.meeting_rooms
ADD COLUMN IF NOT EXISTS google_meet_enabled BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS zoom_enabled BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS manager_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Add index for manager_id
CREATE INDEX IF NOT EXISTS idx_meeting_rooms_manager_id ON public.meeting_rooms(manager_id);

-- ============================================================================
-- 2. ENSURE ROOM_BOOKINGS TABLE HAS ALL REQUIRED COLUMNS
-- ============================================================================
ALTER TABLE IF EXISTS public.room_bookings
ADD COLUMN IF NOT EXISTS google_meet_link TEXT,
ADD COLUMN IF NOT EXISTS zoom_link TEXT,
ADD COLUMN IF NOT EXISTS organizer_notes TEXT;

-- ============================================================================
-- 3. CREATE ROOM_PARTICIPANTS TABLE FOR MEETING MANAGEMENT
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.room_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID NOT NULL REFERENCES public.room_bookings(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    is_organizer BOOLEAN DEFAULT FALSE,
    joined_at TIMESTAMPTZ,
    status VARCHAR(20) DEFAULT 'invited', -- invited, accepted, declined, joined
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_room_participants_unique ON public.room_participants(booking_id, user_id);
CREATE INDEX IF NOT EXISTS idx_room_participants_booking_id ON public.room_participants(booking_id);
CREATE INDEX IF NOT EXISTS idx_room_participants_user_id ON public.room_participants(user_id);

-- ============================================================================
-- 4. ENHANCE TASKS TABLE WITH ASSIGNMENT TRACKING
-- ============================================================================
ALTER TABLE IF EXISTS public.tasks
ADD COLUMN IF NOT EXISTS assigned_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS completed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS completion_notes TEXT;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_by ON public.tasks(assigned_by);
CREATE INDEX IF NOT EXISTS idx_tasks_completed_by ON public.tasks(completed_by);

-- ============================================================================
-- 5. CREATE TASK_ATTACHMENTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.task_attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_size INTEGER,
    uploaded_by UUID NOT NULL REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_task_attachments_task_id ON public.task_attachments(task_id);
CREATE INDEX IF NOT EXISTS idx_task_attachments_uploaded_by ON public.task_attachments(uploaded_by);

-- ============================================================================
-- 6. CREATE TASK_HISTORY TABLE FOR AUDIT TRAIL
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.task_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
    changed_by UUID NOT NULL REFERENCES auth.users(id),
    change_type VARCHAR(50), -- created, updated, completed, assigned, etc.
    old_value TEXT,
    new_value TEXT,
    field_name VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_task_history_task_id ON public.task_history(task_id);
CREATE INDEX IF NOT EXISTS idx_task_history_changed_by ON public.task_history(changed_by);

-- ============================================================================
-- 7. CREATE TASK_COLUMNS TABLE FOR KANBAN BOARD COLUMNS
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.task_columns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    position INTEGER DEFAULT 0,
    color VARCHAR(20),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_task_columns_team_id ON public.task_columns(team_id);

-- Add column_id to tasks if not exists
ALTER TABLE IF EXISTS public.tasks
ADD COLUMN IF NOT EXISTS column_id UUID REFERENCES public.task_columns(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_tasks_column_id ON public.tasks(column_id);

-- ============================================================================
-- 8. ENSURE TASKS TABLE HAS COMMENTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.task_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id),
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_task_comments_task_id ON public.task_comments(task_id);
CREATE INDEX IF NOT EXISTS idx_task_comments_user_id ON public.task_comments(user_id);

-- ============================================================================
-- 9. CREATE TASK_LABELS TABLE FOR CATEGORIZATION
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.task_labels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    color VARCHAR(20),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_task_labels_team_id ON public.task_labels(team_id);

-- Junction table for tasks and labels
CREATE TABLE IF NOT EXISTS public.task_label_mappings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
    label_id UUID NOT NULL REFERENCES public.task_labels(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_task_label_mappings_unique ON public.task_label_mappings(task_id, label_id);

-- ============================================================================
-- 10. ENHANCE USER_REGISTRATIONS TABLE FOR DUAL APPROVAL
-- ============================================================================
ALTER TABLE IF EXISTS public.user_registrations
ADD COLUMN IF NOT EXISTS admin_approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS hr_approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS admin_notes TEXT,
ADD COLUMN IF NOT EXISTS hr_notes TEXT,
ADD COLUMN IF NOT EXISTS admin_approved_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS hr_approved_at TIMESTAMPTZ;

-- ============================================================================
-- 11. CREATE NOTIFICATION_PREFERENCES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.notification_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    email_new_tasks BOOLEAN DEFAULT TRUE,
    email_approvals BOOLEAN DEFAULT TRUE,
    email_daily_reports BOOLEAN DEFAULT TRUE,
    email_room_bookings BOOLEAN DEFAULT TRUE,
    in_app_notifications BOOLEAN DEFAULT TRUE,
    push_new_tasks BOOLEAN DEFAULT TRUE,
    push_approvals BOOLEAN DEFAULT TRUE,
    push_reminders BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_notification_preferences_user_id ON public.notification_preferences(user_id);

-- ============================================================================
-- 12. ENSURE PROFILES TABLE HAS ALL REQUIRED COLUMNS
-- ============================================================================
ALTER TABLE IF EXISTS public.profiles
ADD COLUMN IF NOT EXISTS notification_settings JSONB DEFAULT '{"email_new_tasks":true,"email_approvals":true,"email_daily_reports":true,"in_app_notifications":true}'::jsonb,
ADD COLUMN IF NOT EXISTS theme_preference VARCHAR(20) DEFAULT 'system', -- light, dark, system
ADD COLUMN IF NOT EXISTS avatar_url TEXT,
ADD COLUMN IF NOT EXISTS full_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS account_status VARCHAR(50) DEFAULT 'PENDING'; -- PENDING, APPROVED, REJECTED

-- ============================================================================
-- 13. CREATE USER_SESSIONS TABLE FOR SESSION TRACKING
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    session_id TEXT NOT NULL UNIQUE,
    device_type VARCHAR(50), -- web, mobile, tablet, etc.
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
CREATE INDEX IF NOT EXISTS idx_user_sessions_session_id ON public.user_sessions(session_id);

-- ============================================================================
-- 14. CREATE APPLICATION_SETTINGS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.application_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID,
    setting_key VARCHAR(255) NOT NULL UNIQUE,
    setting_value JSONB,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Insert default settings
INSERT INTO public.application_settings (setting_key, setting_value, description)
VALUES
    ('support_email', '"support@hrm.local"'::jsonb, 'Support contact email'),
    ('support_phone', '"+84-123-456-789"'::jsonb, 'Support contact phone'),
    ('organization_name', '"LifeOS HRM AI"'::jsonb, 'Organization name'),
    ('app_name', '"LifeOS HRM AI"'::jsonb, 'Application name')
ON CONFLICT (setting_key) DO NOTHING;

-- ============================================================================
-- 15. ENABLE ROW LEVEL SECURITY ON NEW TABLES
-- ============================================================================
ALTER TABLE IF EXISTS public.room_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.task_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.task_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.task_columns ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.task_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.task_labels ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.task_label_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.application_settings ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 16. CREATE RLS POLICIES FOR ROOM_PARTICIPANTS
-- ============================================================================
CREATE POLICY "room_participants_select_policy"
    ON public.room_participants
    FOR SELECT
    USING (
        auth.uid() = user_id OR
        auth.uid() = (
            SELECT user_id FROM public.room_bookings 
            WHERE id = room_participants.booking_id
        ) OR
        EXISTS (
            SELECT 1 FROM public.teams t
            WHERE t.leader_id = auth.uid()
        )
    );

CREATE POLICY "room_participants_insert_policy"
    ON public.room_participants
    FOR INSERT
    WITH CHECK (
        auth.uid() = (
            SELECT user_id FROM public.room_bookings 
            WHERE id = booking_id
        )
    );

-- ============================================================================
-- 17. CREATE RLS POLICIES FOR TASK COMMENTS
-- ============================================================================
CREATE POLICY "task_comments_select_policy"
    ON public.task_comments
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.tasks t
            WHERE t.id = task_comments.task_id
            AND t.team_id = (
                SELECT tm.team_id FROM public.teams tm
                WHERE tm.id = t.team_id
            )
        )
    );

CREATE POLICY "task_comments_insert_policy"
    ON public.task_comments
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- 18. CREATE RLS POLICIES FOR TASK_ATTACHMENTS
-- ============================================================================
CREATE POLICY "task_attachments_select_policy"
    ON public.task_attachments
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.tasks t
            WHERE t.id = task_attachments.task_id
        )
    );

CREATE POLICY "task_attachments_insert_policy"
    ON public.task_attachments
    FOR INSERT
    WITH CHECK (auth.uid() = uploaded_by);

-- ============================================================================
-- 19. CREATE RLS POLICIES FOR NOTIFICATION_PREFERENCES
-- ============================================================================
CREATE POLICY "notification_preferences_select_policy"
    ON public.notification_preferences
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "notification_preferences_update_policy"
    ON public.notification_preferences
    FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "notification_preferences_insert_policy"
    ON public.notification_preferences
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- 20. CREATE RLS POLICIES FOR USER_SESSIONS
-- ============================================================================
CREATE POLICY "user_sessions_select_policy"
    ON public.user_sessions
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "user_sessions_delete_policy"
    ON public.user_sessions
    FOR DELETE
    USING (auth.uid() = user_id);

-- ============================================================================
-- 21. CREATE RLS POLICIES FOR APPLICATION_SETTINGS
-- ============================================================================
CREATE POLICY "application_settings_select_policy"
    ON public.application_settings
    FOR SELECT
    USING (TRUE); -- Everyone can read settings

CREATE POLICY "application_settings_manage_policy"
    ON public.application_settings
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_id = auth.uid()
            AND role = 'admin'
        )
    );

-- ============================================================================
-- 22. GRANT PERMISSIONS
-- ============================================================================
GRANT SELECT ON public.room_participants TO authenticated;
GRANT SELECT ON public.task_attachments TO authenticated;
GRANT SELECT ON public.task_comments TO authenticated;
GRANT SELECT ON public.task_labels TO authenticated;
GRANT SELECT ON public.application_settings TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_sessions TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.notification_preferences TO authenticated;

-- ============================================================================
-- 23. ENABLE REALTIME FOR IMPORTANT TABLES
-- ============================================================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.room_participants;
ALTER PUBLICATION supabase_realtime ADD TABLE public.task_comments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
-- This migration creates all necessary tables and columns for:
-- 1. Meeting room participant management
-- 2. Task attachments, comments, and history
-- 3. Kanban board columns management
-- 4. Dual approval workflow for user registration
-- 5. Notification preferences
-- 6. User session tracking
-- 7. Application settings management
--
-- All tables have RLS policies enabled and appropriate indexes created.
-- ============================================================================
