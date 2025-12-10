/**
 * Application Constants
 */

// App Info
export const APP_NAME = 'ClinicFlow';
export const APP_DESCRIPTION = 'Simple clinic management system for small neighborhood clinics';

// Appointment Status
export const APPOINTMENT_STATUS = {
    SCHEDULED: 'scheduled',
    CONFIRMED: 'confirmed',
    CHECKED_IN: 'checked_in',
    IN_PROGRESS: 'in_progress',
    COMPLETED: 'completed',
    CANCELLED: 'cancelled',
    NO_SHOW: 'no_show',
} as const;

export const APPOINTMENT_STATUS_LABELS = {
    [APPOINTMENT_STATUS.SCHEDULED]: 'Scheduled',
    [APPOINTMENT_STATUS.CONFIRMED]: 'Confirmed',
    [APPOINTMENT_STATUS.CHECKED_IN]: 'Checked In',
    [APPOINTMENT_STATUS.IN_PROGRESS]: 'In Progress',
    [APPOINTMENT_STATUS.COMPLETED]: 'Completed',
    [APPOINTMENT_STATUS.CANCELLED]: 'Cancelled',
    [APPOINTMENT_STATUS.NO_SHOW]: 'No Show',
};

export const APPOINTMENT_STATUS_COLORS = {
    [APPOINTMENT_STATUS.SCHEDULED]: 'bg-blue-100 text-blue-800',
    [APPOINTMENT_STATUS.CONFIRMED]: 'bg-green-100 text-green-800',
    [APPOINTMENT_STATUS.CHECKED_IN]: 'bg-purple-100 text-purple-800',
    [APPOINTMENT_STATUS.IN_PROGRESS]: 'bg-yellow-100 text-yellow-800',
    [APPOINTMENT_STATUS.COMPLETED]: 'bg-gray-100 text-gray-800',
    [APPOINTMENT_STATUS.CANCELLED]: 'bg-red-100 text-red-800',
    [APPOINTMENT_STATUS.NO_SHOW]: 'bg-orange-100 text-orange-800',
};

// User Roles
export const USER_ROLES = {
    ADMIN: 'admin',
    DOCTOR: 'doctor',
    RECEPTIONIST: 'receptionist',
} as const;

export const USER_ROLE_LABELS = {
    [USER_ROLES.ADMIN]: 'Admin',
    [USER_ROLES.DOCTOR]: 'Doctor',
    [USER_ROLES.RECEPTIONIST]: 'Receptionist',
};

// Gender
export const GENDER = {
    MALE: 'male',
    FEMALE: 'female',
    OTHER: 'other',
} as const;

export const GENDER_LABELS = {
    [GENDER.MALE]: 'Male',
    [GENDER.FEMALE]: 'Female',
    [GENDER.OTHER]: 'Other',
};

// Blood Groups
export const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'] as const;

// Payment Status
export const PAYMENT_STATUS = {
    UNPAID: 'unpaid',
    PARTIAL: 'partial',
    PAID: 'paid',
    CANCELLED: 'cancelled',
} as const;

export const PAYMENT_STATUS_LABELS = {
    [PAYMENT_STATUS.UNPAID]: 'Unpaid',
    [PAYMENT_STATUS.PARTIAL]: 'Partially Paid',
    [PAYMENT_STATUS.PAID]: 'Paid',
    [PAYMENT_STATUS.CANCELLED]: 'Cancelled',
};

export const PAYMENT_STATUS_COLORS = {
    [PAYMENT_STATUS.UNPAID]: 'bg-red-100 text-red-800',
    [PAYMENT_STATUS.PARTIAL]: 'bg-yellow-100 text-yellow-800',
    [PAYMENT_STATUS.PAID]: 'bg-green-100 text-green-800',
    [PAYMENT_STATUS.CANCELLED]: 'bg-gray-100 text-gray-800',
};

// Payment Methods
export const PAYMENT_METHODS = {
    CASH: 'cash',
    UPI: 'upi',
    CARD: 'card',
    ONLINE: 'online',
} as const;

export const PAYMENT_METHOD_LABELS = {
    [PAYMENT_METHODS.CASH]: 'Cash',
    [PAYMENT_METHODS.UPI]: 'UPI',
    [PAYMENT_METHODS.CARD]: 'Card',
    [PAYMENT_METHODS.ONLINE]: 'Online',
};

// Reminder Types
export const REMINDER_TYPES = {
    APPOINTMENT_CONFIRMATION: 'appointment_confirmation',
    APPOINTMENT_REMINDER: 'appointment_reminder',
    FOLLOW_UP: 'follow_up',
    MEDICINE_REMINDER: 'medicine_reminder',
    CUSTOM: 'custom',
} as const;

export const REMINDER_TYPE_LABELS = {
    [REMINDER_TYPES.APPOINTMENT_CONFIRMATION]: 'Appointment Confirmation',
    [REMINDER_TYPES.APPOINTMENT_REMINDER]: 'Appointment Reminder',
    [REMINDER_TYPES.FOLLOW_UP]: 'Follow-up Reminder',
    [REMINDER_TYPES.MEDICINE_REMINDER]: 'Medicine Reminder',
    [REMINDER_TYPES.CUSTOM]: 'Custom Reminder',
};

// Reminder Status
export const REMINDER_STATUS = {
    PENDING: 'pending',
    SENT: 'sent',
    DELIVERED: 'delivered',
    FAILED: 'failed',
    CANCELLED: 'cancelled',
} as const;

// Booking Sources
export const BOOKING_SOURCES = {
    WEB: 'web',
    WHATSAPP: 'whatsapp',
    PHONE: 'phone',
    WALK_IN: 'walk_in',
} as const;

export const BOOKING_SOURCE_LABELS = {
    [BOOKING_SOURCES.WEB]: 'Web',
    [BOOKING_SOURCES.WHATSAPP]: 'WhatsApp',
    [BOOKING_SOURCES.PHONE]: 'Phone',
    [BOOKING_SOURCES.WALK_IN]: 'Walk-in',
};

// Subscription Plans
export const SUBSCRIPTION_PLANS = {
    TRIAL: 'trial',
    STARTER: 'starter',
    PROFESSIONAL: 'professional',
    PREMIUM: 'premium',
} as const;

export const SUBSCRIPTION_PLAN_LABELS = {
    [SUBSCRIPTION_PLANS.TRIAL]: 'Trial',
    [SUBSCRIPTION_PLANS.STARTER]: 'Starter',
    [SUBSCRIPTION_PLANS.PROFESSIONAL]: 'Professional',
    [SUBSCRIPTION_PLANS.PREMIUM]: 'Premium',
};

export const SUBSCRIPTION_PLAN_PRICES = {
    [SUBSCRIPTION_PLANS.TRIAL]: 0,
    [SUBSCRIPTION_PLANS.STARTER]: 799,
    [SUBSCRIPTION_PLANS.PROFESSIONAL]: 1299,
    [SUBSCRIPTION_PLANS.PREMIUM]: 1999,
};

// Days of Week
export const DAYS_OF_WEEK = [
    'monday',
    'tuesday',
    'wednesday',
    'thursday',
    'friday',
    'saturday',
    'sunday',
] as const;

export const DAY_LABELS = {
    monday: 'Monday',
    tuesday: 'Tuesday',
    wednesday: 'Wednesday',
    thursday: 'Thursday',
    friday: 'Friday',
    saturday: 'Saturday',
    sunday: 'Sunday',
};

// Default Settings
export const DEFAULT_SLOT_DURATION = 15; // minutes
export const DEFAULT_CONSULTATION_FEE = 500; // rupees
export const DEFAULT_WORKING_HOURS = {
    open: '09:00',
    close: '18:00',
    slots: 36,
};

// Pagination
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

// Do Not Disturb Hours
export const DND_START_HOUR = 21; // 9 PM
export const DND_END_HOUR = 8; // 8 AM

// WhatsApp
export const WHATSAPP_FREE_TIER_LIMIT = 1000; // conversations per month

// File Upload
export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
export const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png', 'application/pdf'];

// Date Formats
export const DATE_FORMAT = 'yyyy-MM-dd';
export const TIME_FORMAT = 'HH:mm';
export const DATETIME_FORMAT = 'yyyy-MM-dd HH:mm:ss';
