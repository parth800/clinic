/**
 * TypeScript type definitions for ClinicFlow
 * These will be auto-generated from Supabase schema later
 * For now, we'll define the core types manually
 */

export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

// Database types (will be auto-generated from Supabase)
export interface Database {
    public: {
        Tables: {
            clinics: {
                Row: Clinic
                Insert: Omit<Clinic, 'id' | 'created_at' | 'updated_at'>
                Update: Partial<Omit<Clinic, 'id'>>
            }
            users: {
                Row: User
                Insert: Omit<User, 'id' | 'created_at' | 'updated_at'>
                Update: Partial<Omit<User, 'id'>>
            }
            patients: {
                Row: Patient
                Insert: Omit<Patient, 'id' | 'patient_number' | 'created_at' | 'updated_at'>
                Update: Partial<Omit<Patient, 'id' | 'patient_number'>>
            }
            appointments: {
                Row: Appointment
                Insert: Omit<Appointment, 'id' | 'token_number' | 'created_at' | 'updated_at'>
                Update: Partial<Omit<Appointment, 'id' | 'token_number'>>
            }
            prescriptions: {
                Row: Prescription
                Insert: Omit<Prescription, 'id' | 'created_at' | 'updated_at'>
                Update: Partial<Omit<Prescription, 'id'>>
            }
            reminders: {
                Row: Reminder
                Insert: Omit<Reminder, 'id' | 'created_at' | 'updated_at'>
                Update: Partial<Omit<Reminder, 'id'>>
            }
            invoices: {
                Row: Invoice
                Insert: Omit<Invoice, 'id' | 'created_at' | 'updated_at'>
                Update: Partial<Omit<Invoice, 'id' | 'invoice_number'>>
            }
        }
    }
}

// Domain Models
export interface Clinic {
    id: string
    name: string
    slug: string
    phone: string
    email?: string
    address?: string
    city: string
    state: string
    pincode?: string
    registration_number?: string
    specialization?: string
    languages: string[]
    working_hours: WorkingHours
    slot_duration: number
    consultation_fee: number
    allow_online_booking: boolean
    whatsapp_number?: string
    subscription_plan: string
    subscription_status: string
    subscription_start_date?: string
    subscription_end_date?: string
    created_at: string
    updated_at: string
    deleted_at?: string
}

export interface WorkingHours {
    [key: string]: {
        open: string | null
        close: string | null
        slots: number
    }
}

export interface User {
    id: string
    clinic_id: string
    full_name: string
    email: string
    phone: string
    password_hash?: string
    role: 'admin' | 'doctor' | 'receptionist'
    avatar_url?: string
    qualification?: string
    specialization?: string
    license_number?: string
    permissions: UserPermissions
    is_active: boolean
    last_login_at?: string
    created_at: string
    updated_at: string
    deleted_at?: string
}

export interface UserPermissions {
    manage_appointments: boolean
    manage_patients: boolean
    manage_prescriptions: boolean
    manage_billing: boolean
    manage_settings: boolean
}

export interface Patient {
    id: string
    clinic_id: string
    full_name: string
    phone: string
    alternate_phone?: string
    email?: string
    date_of_birth?: string
    age?: number
    gender?: 'male' | 'female' | 'other'
    blood_group?: string
    address?: string
    city?: string
    pincode?: string
    allergies?: string[]
    chronic_conditions?: string[]
    current_medications?: string[]
    medical_notes?: string
    emergency_contact_name?: string
    emergency_contact_phone?: string
    emergency_contact_relation?: string
    patient_number: string
    registered_by?: string
    created_at: string
    updated_at: string
    deleted_at?: string
}

export interface Appointment {
    id: string
    clinic_id: string
    patient_id: string
    doctor_id?: string
    appointment_date: string
    appointment_time: string
    duration: number
    token_number: number
    status: 'scheduled' | 'confirmed' | 'checked_in' | 'in_progress' | 'completed' | 'cancelled' | 'no_show'
    booking_source: 'web' | 'whatsapp' | 'phone' | 'walk_in'
    booking_notes?: string
    checked_in_at?: string
    checked_in_by?: string
    consultation_started_at?: string
    consultation_ended_at?: string
    cancelled_at?: string
    cancelled_by?: string
    cancellation_reason?: string
    reminder_sent_at?: string
    reminder_status?: string
    created_by?: string
    created_at: string
    updated_at: string
    deleted_at?: string
}

export interface Prescription {
    id: string
    clinic_id: string
    patient_id: string
    appointment_id?: string
    doctor_id: string
    vitals: Vitals
    chief_complaint?: string
    diagnosis?: string
    clinical_notes?: string
    medications: Medication[]
    lab_tests?: string[]
    lab_notes?: string
    follow_up_required: boolean
    follow_up_days?: number
    follow_up_notes?: string
    prescription_pdf_url?: string
    attachments?: string[]
    created_at: string
    updated_at: string
    deleted_at?: string
}

export interface Vitals {
    blood_pressure?: string
    pulse?: number
    temperature?: number
    weight?: number
    height?: number
    spo2?: number
    blood_sugar?: number
}

export interface Medication {
    name: string
    dosage: string
    duration: string
    instructions?: string
    quantity?: string
}

export interface Reminder {
    id: string
    clinic_id: string
    patient_id: string
    appointment_id?: string
    reminder_type: 'appointment_confirmation' | 'appointment_reminder' | 'follow_up' | 'medicine_reminder' | 'custom'
    scheduled_at: string
    message_template?: string
    message_content: string
    delivery_method: 'whatsapp' | 'sms' | 'both'
    recipient_phone: string
    status: 'pending' | 'sent' | 'delivered' | 'failed' | 'cancelled'
    sent_at?: string
    delivered_at?: string
    failed_at?: string
    failure_reason?: string
    retry_count: number
    max_retries: number
    next_retry_at?: string
    patient_response?: string
    response_received_at?: string
    created_at: string
    updated_at: string
}

export interface Invoice {
    id: string
    clinic_id: string
    patient_id: string
    appointment_id?: string
    invoice_number: string
    invoice_date: string
    due_date?: string
    items: InvoiceItem[]
    subtotal: number
    discount: number
    discount_amount?: number
    tax: number
    total_amount: number
    payment_status: 'unpaid' | 'partial' | 'paid' | 'cancelled'
    paid_amount: number
    payment_method?: 'cash' | 'upi' | 'card' | 'online'
    payment_date?: string
    payment_reference?: string
    upi_payment_link?: string
    upi_qr_code_url?: string
    notes?: string
    created_by?: string
    created_at: string
    updated_at: string
    deleted_at?: string
}

export interface InvoiceItem {
    description: string
    amount: number
    quantity: number
}

// API Response Types
export interface ApiResponse<T = any> {
    success: boolean
    data?: T
    error?: ApiError
    message?: string
}

export interface ApiError {
    code: string
    message: string
    details?: any
}

export interface PaginationParams {
    page?: number
    limit?: number
    sortBy?: string
    order?: 'asc' | 'desc'
}

export interface PaginatedResponse<T> {
    data: T[]
    pagination: {
        currentPage: number
        totalPages: number
        totalItems: number
        itemsPerPage: number
        hasNextPage: boolean
        hasPreviousPage: boolean
    }
}

// Form Types
export interface LoginFormData {
    email: string
    password: string
}

export interface RegisterFormData {
    clinicName: string
    doctorName: string
    email: string
    phone: string
    password: string
    city: string
    specialization: string
}

export interface PatientFormData {
    full_name: string
    phone: string
    alternate_phone?: string
    email?: string
    date_of_birth?: string
    age?: number
    gender?: 'male' | 'female' | 'other'
    blood_group?: string
    address?: string
    city?: string
    pincode?: string
    allergies?: string[]
    chronic_conditions?: string[]
    current_medications?: string[]
    medical_notes?: string
    emergency_contact_name?: string
    emergency_contact_phone?: string
    emergency_contact_relation?: string
}

export interface AppointmentFormData {
    patient_id: string
    appointment_date: string
    appointment_time: string
    booking_notes?: string
    booking_source?: 'web' | 'whatsapp' | 'phone' | 'walk_in'
}

export interface PrescriptionFormData {
    patient_id: string
    appointment_id?: string
    vitals: Vitals
    chief_complaint?: string
    diagnosis?: string
    clinical_notes?: string
    medications: Medication[]
    lab_tests?: string[]
    lab_notes?: string
    follow_up_required: boolean
    follow_up_days?: number
    follow_up_notes?: string
}

// Component Props Types
export interface DashboardStats {
    today: {
        appointments: number
        completed: number
        pending: number
        revenue: number
    }
    thisWeek: {
        appointments: number
        newPatients: number
        revenue: number
    }
    thisMonth: {
        appointments: number
        newPatients: number
        revenue: number
        averagePerDay: number
    }
}
