-- ClinicFlow Database Schema
-- Migration 001: Initial Schema
-- This creates all core tables for the ClinicFlow application

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- 1. CLINICS TABLE (Master tenant table)
-- ============================================================================

CREATE TABLE clinics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  
  -- Contact Information
  phone VARCHAR(15) NOT NULL,
  email VARCHAR(255),
  address TEXT,
  city VARCHAR(100) DEFAULT 'Ahmedabad',
  state VARCHAR(100) DEFAULT 'Gujarat',
  pincode VARCHAR(6),
  
  -- Business Details
  registration_number VARCHAR(100),
  specialization VARCHAR(255),
  languages JSONB DEFAULT '["English", "Hindi", "Gujarati"]',
  
  -- Operating Hours
  working_hours JSONB DEFAULT '{
    "monday": {"open": "09:00", "close": "18:00", "slots": 36},
    "tuesday": {"open": "09:00", "close": "18:00", "slots": 36},
    "wednesday": {"open": "09:00", "close": "18:00", "slots": 36},
    "thursday": {"open": "09:00", "close": "18:00", "slots": 36},
    "friday": {"open": "09:00", "close": "18:00", "slots": 36},
    "saturday": {"open": "09:00", "close": "14:00", "slots": 20},
    "sunday": {"open": null, "close": null, "slots": 0}
  }',
  
  -- Settings
  slot_duration INTEGER DEFAULT 15,
  consultation_fee DECIMAL(10,2) DEFAULT 500.00,
  allow_online_booking BOOLEAN DEFAULT true,
  whatsapp_number VARCHAR(15),
  
  -- Subscription
  subscription_plan VARCHAR(50) DEFAULT 'trial',
  subscription_status VARCHAR(20) DEFAULT 'active',
  subscription_start_date TIMESTAMP,
  subscription_end_date TIMESTAMP,
  
  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP,
  
  CONSTRAINT clinics_phone_check CHECK (phone ~ '^[0-9]{10,15}$')
);

CREATE INDEX idx_clinics_slug ON clinics(slug);
CREATE INDEX idx_clinics_city ON clinics(city);
CREATE INDEX idx_clinics_subscription_status ON clinics(subscription_status);

-- ============================================================================
-- 2. USERS TABLE (Doctors, Receptionists, Admins)
-- ============================================================================

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  
  -- Personal Information
  full_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(15) UNIQUE NOT NULL,
  
  -- Authentication (password handled by Supabase Auth)
  role VARCHAR(50) NOT NULL,
  
  -- Profile
  avatar_url TEXT,
  qualification VARCHAR(255),
  specialization VARCHAR(255),
  license_number VARCHAR(100),
  
  -- Permissions
  permissions JSONB DEFAULT '{
    "manage_appointments": true,
    "manage_patients": true,
    "manage_prescriptions": true,
    "manage_billing": false,
    "manage_settings": false
  }',
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  last_login_at TIMESTAMP,
  
  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP,
  
  CONSTRAINT users_role_check CHECK (role IN ('admin', 'doctor', 'receptionist'))
);

CREATE INDEX idx_users_clinic_id ON users(clinic_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

-- ============================================================================
-- 3. PATIENTS TABLE
-- ============================================================================

CREATE TABLE patients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  
  -- Personal Information
  full_name VARCHAR(255) NOT NULL,
  phone VARCHAR(15) NOT NULL,
  alternate_phone VARCHAR(15),
  email VARCHAR(255),
  
  -- Demographics
  date_of_birth DATE,
  age INTEGER,
  gender VARCHAR(10),
  blood_group VARCHAR(5),
  
  -- Address
  address TEXT,
  city VARCHAR(100),
  pincode VARCHAR(6),
  
  -- Medical Information
  allergies TEXT[],
  chronic_conditions TEXT[],
  current_medications TEXT[],
  medical_notes TEXT,
  
  -- Emergency Contact
  emergency_contact_name VARCHAR(255),
  emergency_contact_phone VARCHAR(15),
  emergency_contact_relation VARCHAR(50),
  
  -- Patient ID (auto-generated)
  patient_number VARCHAR(20) UNIQUE,
  
  -- Metadata
  registered_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP,
  
  CONSTRAINT patients_gender_check CHECK (gender IN ('male', 'female', 'other')),
  CONSTRAINT patients_unique_phone_clinic UNIQUE (clinic_id, phone)
);

CREATE INDEX idx_patients_clinic_id ON patients(clinic_id);
CREATE INDEX idx_patients_phone ON patients(phone);
CREATE INDEX idx_patients_patient_number ON patients(patient_number);
CREATE INDEX idx_patients_name ON patients(full_name);
CREATE INDEX idx_patients_search ON patients USING gin(to_tsvector('english', full_name || ' ' || COALESCE(phone, '')));

-- ============================================================================
-- 4. APPOINTMENTS TABLE
-- ============================================================================

CREATE TABLE appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  doctor_id UUID REFERENCES users(id),
  
  -- Appointment Details
  appointment_date DATE NOT NULL,
  appointment_time TIME NOT NULL,
  duration INTEGER DEFAULT 15,
  token_number INTEGER,
  
  -- Status
  status VARCHAR(50) DEFAULT 'scheduled',
  
  -- Booking Information
  booking_source VARCHAR(50) DEFAULT 'web',
  booking_notes TEXT,
  
  -- Check-in
  checked_in_at TIMESTAMP,
  checked_in_by UUID REFERENCES users(id),
  
  -- Consultation
  consultation_started_at TIMESTAMP,
  consultation_ended_at TIMESTAMP,
  
  -- Cancellation
  cancelled_at TIMESTAMP,
  cancelled_by UUID REFERENCES users(id),
  cancellation_reason TEXT,
  
  -- Reminders
  reminder_sent_at TIMESTAMP,
  reminder_status VARCHAR(50),
  
  -- Metadata
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP,
  
  CONSTRAINT appointments_status_check CHECK (
    status IN ('scheduled', 'confirmed', 'checked_in', 'in_progress', 'completed', 'cancelled', 'no_show')
  )
);

CREATE INDEX idx_appointments_clinic_id ON appointments(clinic_id);
CREATE INDEX idx_appointments_patient_id ON appointments(patient_id);
CREATE INDEX idx_appointments_doctor_id ON appointments(doctor_id);
CREATE INDEX idx_appointments_date ON appointments(appointment_date);
CREATE INDEX idx_appointments_status ON appointments(status);
CREATE INDEX idx_appointments_date_time ON appointments(appointment_date, appointment_time);

CREATE UNIQUE INDEX idx_appointments_unique_slot ON appointments(
  clinic_id, appointment_date, appointment_time
) WHERE deleted_at IS NULL AND status NOT IN ('cancelled', 'no_show');

-- ============================================================================
-- 5. PRESCRIPTIONS TABLE
-- ============================================================================

CREATE TABLE prescriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  appointment_id UUID REFERENCES appointments(id),
  doctor_id UUID NOT NULL REFERENCES users(id),
  
  -- Vitals
  vitals JSONB DEFAULT '{
    "blood_pressure": null,
    "pulse": null,
    "temperature": null,
    "weight": null,
    "height": null,
    "spo2": null,
    "blood_sugar": null
  }',
  
  -- Diagnosis
  chief_complaint TEXT,
  diagnosis TEXT,
  clinical_notes TEXT,
  
  -- Medications
  medications JSONB DEFAULT '[]',
  
  -- Lab Tests
  lab_tests TEXT[],
  lab_notes TEXT,
  
  -- Follow-up
  follow_up_required BOOLEAN DEFAULT false,
  follow_up_days INTEGER,
  follow_up_notes TEXT,
  
  -- Files
  prescription_pdf_url TEXT,
  attachments TEXT[],
  
  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP
);

CREATE INDEX idx_prescriptions_clinic_id ON prescriptions(clinic_id);
CREATE INDEX idx_prescriptions_patient_id ON prescriptions(patient_id);
CREATE INDEX idx_prescriptions_appointment_id ON prescriptions(appointment_id);
CREATE INDEX idx_prescriptions_created_at ON prescriptions(created_at DESC);

-- ============================================================================
-- 6. REMINDERS TABLE
-- ============================================================================

CREATE TABLE reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  appointment_id UUID REFERENCES appointments(id),
  
  -- Reminder Details
  reminder_type VARCHAR(50) NOT NULL,
  scheduled_at TIMESTAMP NOT NULL,
  message_template VARCHAR(50),
  message_content TEXT,
  
  -- Delivery
  delivery_method VARCHAR(20) DEFAULT 'whatsapp',
  recipient_phone VARCHAR(15) NOT NULL,
  
  -- Status
  status VARCHAR(50) DEFAULT 'pending',
  sent_at TIMESTAMP,
  delivered_at TIMESTAMP,
  failed_at TIMESTAMP,
  failure_reason TEXT,
  
  -- Retry Logic
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  next_retry_at TIMESTAMP,
  
  -- Response
  patient_response TEXT,
  response_received_at TIMESTAMP,
  
  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  CONSTRAINT reminders_type_check CHECK (
    reminder_type IN ('appointment_confirmation', 'appointment_reminder', 'follow_up', 'medicine_reminder', 'custom')
  ),
  CONSTRAINT reminders_status_check CHECK (
    status IN ('pending', 'sent', 'delivered', 'failed', 'cancelled')
  )
);

CREATE INDEX idx_reminders_clinic_id ON reminders(clinic_id);
CREATE INDEX idx_reminders_patient_id ON reminders(patient_id);
CREATE INDEX idx_reminders_scheduled_at ON reminders(scheduled_at);
CREATE INDEX idx_reminders_status ON reminders(status);
-- Index for pending reminders (removed NOW() from WHERE clause as it's not IMMUTABLE)
CREATE INDEX idx_reminders_pending ON reminders(scheduled_at, status) 
  WHERE status = 'pending';

-- ============================================================================
-- 7. INVOICES TABLE
-- ============================================================================

CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  appointment_id UUID REFERENCES appointments(id),
  
  -- Invoice Details
  invoice_number VARCHAR(50) UNIQUE NOT NULL,
  invoice_date DATE DEFAULT CURRENT_DATE,
  due_date DATE,
  
  -- Line Items
  items JSONB DEFAULT '[]',
  
  -- Amounts
  subtotal DECIMAL(10,2) NOT NULL,
  discount DECIMAL(10,2) DEFAULT 0,
  discount_amount DECIMAL(10,2) DEFAULT 0,
  tax DECIMAL(10,2) DEFAULT 0,
  total_amount DECIMAL(10,2) NOT NULL,
  
  -- Payment
  payment_status VARCHAR(50) DEFAULT 'unpaid',
  paid_amount DECIMAL(10,2) DEFAULT 0,
  payment_method VARCHAR(50),
  payment_date TIMESTAMP,
  payment_reference VARCHAR(255),
  
  -- UPI Payment Link
  upi_payment_link TEXT,
  upi_qr_code_url TEXT,
  
  -- Notes
  notes TEXT,
  
  -- Metadata
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP,
  
  CONSTRAINT invoices_payment_status_check CHECK (
    payment_status IN ('unpaid', 'partial', 'paid', 'cancelled')
  )
);

CREATE INDEX idx_invoices_clinic_id ON invoices(clinic_id);
CREATE INDEX idx_invoices_patient_id ON invoices(patient_id);
CREATE INDEX idx_invoices_invoice_number ON invoices(invoice_number);
CREATE INDEX idx_invoices_payment_status ON invoices(payment_status);
CREATE INDEX idx_invoices_date ON invoices(invoice_date DESC);

-- ============================================================================
-- 8. CLINIC_HOLIDAYS TABLE
-- ============================================================================

CREATE TABLE clinic_holidays (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  
  holiday_date DATE NOT NULL,
  reason VARCHAR(255),
  is_recurring BOOLEAN DEFAULT false,
  
  created_at TIMESTAMP DEFAULT NOW(),
  
  CONSTRAINT clinic_holidays_unique UNIQUE (clinic_id, holiday_date)
);

CREATE INDEX idx_clinic_holidays_clinic_date ON clinic_holidays(clinic_id, holiday_date);

-- ============================================================================
-- 9. AUDIT_LOGS TABLE
-- ============================================================================

CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID REFERENCES clinics(id),
  user_id UUID REFERENCES users(id),
  
  -- Action Details
  table_name VARCHAR(100) NOT NULL,
  record_id UUID,
  action VARCHAR(50) NOT NULL,
  
  -- Changes
  old_values JSONB,
  new_values JSONB,
  
  -- Metadata
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_clinic_id ON audit_logs(clinic_id);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_table_record ON audit_logs(table_name, record_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);
