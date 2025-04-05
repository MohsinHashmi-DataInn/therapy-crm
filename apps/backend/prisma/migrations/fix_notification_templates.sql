-- Fix the progress note template with correct apostrophe escaping
UPDATE notification_templates 
SET 
    email_body = '<p>Dear {{client_name}},</p><p>A new progress note has been added for {{learner_name}} following the session on {{session_date}}.</p><p>You can view this progress note by logging into your parent portal. If you have any questions about your child''s progress, please don''t hesitate to contact your therapist.</p>'
WHERE 
    notification_type = 'PROGRESS_NOTE_CREATED';

-- Fix any other templates with similar issues (if needed)
-- This is a safety check to ensure all apostrophes are properly escaped
DO $$
DECLARE
    template_record RECORD;
BEGIN
    FOR template_record IN 
        SELECT id, email_body, sms_body FROM notification_templates
    LOOP
        -- Replace any backslash-escaped apostrophes with properly escaped ones
        UPDATE notification_templates
        SET 
            email_body = REPLACE(email_body, E'\\''', ''''),
            sms_body = REPLACE(sms_body, E'\\''', '''')
        WHERE id = template_record.id;
    END LOOP;
END
$$;
