// Measurement templates per body type.
// Keys are stable identifiers used as JSON keys in customer_measurements.measurements.
// Labels are user-facing.

export type MeasurementTemplate = 'male' | 'female' | 'child';

export interface FieldDef {
  key: string;
  label: string;
}

export const TEMPLATE_LABEL: Record<MeasurementTemplate, string> = {
  male: 'Male',
  female: 'Female',
  child: 'Child',
};

export const MEASUREMENT_FIELDS: Record<MeasurementTemplate, FieldDef[]> = {
  male: [
    { key: 'neck', label: 'Neck' },
    { key: 'chest', label: 'Chest' },
    { key: 'waist', label: 'Waist' },
    { key: 'hips', label: 'Hips' },
    { key: 'shoulder', label: 'Shoulder' },
    { key: 'sleeve', label: 'Sleeve' },
    { key: 'bicep', label: 'Bicep' },
    { key: 'inseam', label: 'Inseam' },
    { key: 'outseam', label: 'Outseam' },
    { key: 'thigh', label: 'Thigh' },
    { key: 'shirt_length', label: 'Shirt length' },
    { key: 'trouser_length', label: 'Trouser length' },
  ],
  female: [
    { key: 'bust', label: 'Bust' },
    { key: 'underbust', label: 'Underbust' },
    { key: 'waist', label: 'Waist' },
    { key: 'hips', label: 'Hips' },
    { key: 'shoulder', label: 'Shoulder' },
    { key: 'sleeve', label: 'Sleeve' },
    { key: 'arm_hole', label: 'Arm hole' },
    { key: 'bust_point', label: 'Bust point' },
    { key: 'dress_length', label: 'Dress length' },
    { key: 'skirt_length', label: 'Skirt length' },
    { key: 'thigh', label: 'Thigh' },
    { key: 'inseam', label: 'Inseam' },
  ],
  child: [
    { key: 'age', label: 'Age (yrs)' },
    { key: 'height', label: 'Height' },
    { key: 'chest', label: 'Chest' },
    { key: 'waist', label: 'Waist' },
    { key: 'hips', label: 'Hips' },
    { key: 'shoulder', label: 'Shoulder' },
    { key: 'sleeve', label: 'Sleeve' },
    { key: 'inseam', label: 'Inseam' },
    { key: 'dress_length', label: 'Dress / shirt length' },
  ],
};

export const ALL_TEMPLATES: MeasurementTemplate[] = ['male', 'female', 'child'];
