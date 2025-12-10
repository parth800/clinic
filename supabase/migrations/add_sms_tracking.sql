-- Add SMS reminder tracking fields to appointments table

ALTER TABLE appointments
ADD COLUMN IF NOT EXISTS reminder_24h_sent BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS reminder_24h_sent_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS reminder_1h_sent BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS reminder_1h_sent_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS confirmation_sms_sent BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS confirmation_sms_sent_at TIMESTAMP WITH TIME ZONE;

-- Add index for reminder queries
CREATE INDEX IF NOT EXISTS idx_appointments_reminder_24h 
ON appointments(reminder_24h_sent, appointment_date) 
WHERE reminder_24h_sent = FALSE AND deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_appointments_reminder_1h 
ON appointments(reminder_1h_sent, appointment_date, appointment_time) 
WHERE reminder_1h_sent = FALSE AND deleted_at IS NULL;

-- Comment
COMMENT ON COLUMN appointments.reminder_24h_sent IS 'Whether 24-hour reminder SMS has been sent';
COMMENT ON COLUMN appointments.reminder_1h_sent IS 'Whether 1-hour reminder SMS has been sent';
COMMENT ON COLUMN appointments.confirmation_sms_sent IS 'Whether confirmation SMS has been sent';
