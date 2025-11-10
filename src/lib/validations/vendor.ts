import { z } from 'zod';

// Government ID types
export const governmentIdTypes = ['Aadhaar', 'Passport', 'VoterID', 'DriversLicense'] as const;
export const categories = ['Shop', 'Vehicle', 'Service', 'SimRacing', 'Event'] as const;

// Base validation schemas
export const phoneRegex = /^\+?[1-9]\d{1,14}$/;
export const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
export const aadhaarRegex = /^\d{12}$/;
export const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;

// Branch validation schema
export const branchSchema = z.object({
  branchName: z.string().min(2, 'Branch name must be at least 2 characters').max(100, 'Branch name must be less than 100 characters'),
  addressLine1: z.string().min(5, 'Address line 1 must be at least 5 characters').max(200, 'Address line 1 must be less than 200 characters'),
  addressLine2: z.string().max(200, 'Address line 2 must be less than 200 characters').optional(),
  city: z.string().min(2, 'City must be at least 2 characters').max(50, 'City must be less than 50 characters'),
  state: z.string().min(2, 'State must be at least 2 characters').max(50, 'State must be less than 50 characters'),
  postalCode: z.string().regex(/^\d{6}$/, 'Postal code must be 6 digits'),
  contactPerson: z.string().max(100, 'Contact person name must be less than 100 characters').optional(),
  contactPhone: z.string().regex(phoneRegex, 'Invalid phone number format').optional().or(z.literal('')),
  contactEmail: z.string().email('Invalid email format').max(100, 'Email must be less than 100 characters').optional().or(z.literal('')),
  branchProofs: z.object({
    utilityBillUrl: z.string().url('Invalid URL format').optional().or(z.literal('')),
    rentAgreementUrl: z.string().url('Invalid URL format').optional().or(z.literal('')),
    propertyTaxReceiptUrl: z.string().url('Invalid URL format').optional().or(z.literal(''))
  }).optional()
});

// Category specific details validation
export const categorySpecificDetailsSchema = z.object({
  shop: z
    .object({
      productCatalogUrl: z
        .string()
        .url('Invalid URL format')
        .or(z.literal(''))
        .optional(),
      brandCertificateUrl: z
        .string()
        .url('Invalid URL format')
        .or(z.literal(''))
        .optional(),
      returnPolicyUrl: z
        .string()
        .url('Invalid URL format')
        .or(z.literal(''))
        .optional(),
    })
    .optional(),

  vehicle: z
    .object({
      rcDocumentUrl: z
        .string()
        .url('Invalid URL format')
        .or(z.literal(''))
        .optional(),
      dealershipLicenseUrl: z
        .string()
        .url('Invalid URL format')
        .or(z.literal(''))
        .optional(),
      aviationOrMarineLicenseUrl: z
        .string()
        .url('Invalid URL format')
        .or(z.literal(''))
        .optional(),
    })
    .optional(),

  service: z
    .object({
      centerPhotosUrl: z
        .string()
        .url('Invalid URL format')
        .or(z.literal(''))
        .optional(),
      certificationUrls: z
        .array(z.string().url('Invalid URL format'))
        .optional(),
      insuranceProofUrl: z
        .string()
        .url('Invalid URL format')
        .or(z.literal(''))
        .optional(),
    })
    .optional(),

  simRacing: z
    .object({
      hardwareProofUrl: z
        .string()
        .url('Invalid URL format')
        .or(z.literal(''))
        .optional(),
      eventLicenseUrl: z
        .string()
        .url('Invalid URL format')
        .or(z.literal(''))
        .optional(),
      pastEventMediaUrls: z
        .array(z.string())
        .optional(),
    })
    .optional(),
    event: z
    .object({
      eventLicenseUrl: z
        .string()
        .url('Invalid URL format')
        .or(z.literal(''))
        .optional(),
      pastEventMediaUrls: z
        .array(z.string())
        .optional(),
    })
    .optional(),
});

// Vendor registration validation schema - updated for optional Step 2 fields
export const vendorRegistrationSchema = z.object({
  // Personal Information (Step 1)
  personal_name: z.string()
    .min(2, 'Full name must be at least 2 characters')
    .max(100, 'Full name must be less than 100 characters')
    .regex(/^[a-zA-Z\s]+$/, 'Name can only contain letters and spaces'),

  // Government ID (Step 2 - optional)
  government_id_type: z.enum(governmentIdTypes).optional(),

  government_id_number: z.string()
    .min(6, 'Government ID number must be at least 6 characters')
    .max(20, 'Government ID number must be less than 20 characters')
    .optional(),

  government_id_document_url: z.string()
    .url('Invalid document URL format')
    .optional(),

  // Business Information (Step 2 - optional)
  business_name: z.string()
    .min(2, 'Business name must be at least 2 characters')
    .max(200, 'Business name must be less than 200 characters')
    .optional(),

  gst_certificate_url: z.string()
    .url('Invalid GST certificate URL format')
    .optional(),

  msme_or_udyam_url: z.string()
    .url('Invalid MSME/Udyam certificate URL format')
    .optional(),

  trade_license_url: z.string()
    .url('Invalid trade license URL format')
    .optional(),

  shop_certificate_url: z.string()
    .url('Invalid shop certificate URL format')
    .optional(),

  // Contact Details (Step 1)
  mobile: z.string()
    .regex(phoneRegex, 'Invalid mobile number format')
    .min(10, 'Mobile number must be at least 10 digits'),

  email: z.string()
    .email('Invalid email format')
    .max(100, 'Email must be less than 100 characters'),

  whatsapp_number: z.string()
    .regex(phoneRegex, 'Invalid WhatsApp number format')
    .optional()
    .or(z.literal('')),

  // Business Categories (Step 1)
  categories: z.array(z.enum(categories))
    .min(1, 'Please select at least one business category')
    .max(5, 'You can select maximum 5 categories'),

  // Category Specific Details (Step 2 - optional)
  category_specific_details: categorySpecificDetailsSchema.optional(),

  // Branches (Step 2 - optional)
  branches: z.array(branchSchema).optional(),

  // Bank Details (Step 2 - optional)
  account_holder_name: z.string()
    .min(2, 'Account holder name must be at least 2 characters')
    .max(100, 'Account holder name must be less than 100 characters')
    .regex(/^[a-zA-Z\s]+$/, 'Account holder name can only contain letters and spaces')
    .optional(),

  bank_account_number: z.string()
    .min(9, 'Bank account number must be at least 9 digits')
    .max(18, 'Bank account number must be less than 18 digits')
    .regex(/^\d+$/, 'Bank account number can only contain digits')
    .optional(),

  ifsc_code: z.string()
    .regex(ifscRegex, 'Invalid IFSC code format (e.g., HDFC0000123)')
    .optional(),

  bank_proof_document_url: z.string()
    .url('Invalid bank proof document URL format')
    .optional(),

  // Address Proofs (Step 2 - optional)
  utility_bill_url: z.string()
    .url('Invalid utility bill URL format')
    .optional(),

  rent_agreement_url: z.string()
    .url('Invalid rent agreement URL format')
    .optional(),

  property_tax_receipt_url: z.string()
    .url('Invalid property tax receipt URL format')
    .optional(),

  // Optional fields
  business_logo_url: z.string()
    .url('Invalid business logo URL format')
    .optional()
    .or(z.literal('')),

  user_id: z.string().min(1, 'User ID is required')
});

// Vendor update request validation schema
export const vendorUpdateRequestSchema = z.object({
  request_type: z.enum(['add_category', 'add_branch', 'update_details'])
    .refine((val) => val !== undefined, {
      message: 'Please select a request type'
    }),

  justification: z.string()
    .min(10, 'Justification must be at least 10 characters')
    .max(1000, 'Justification must be less than 1000 characters'),

  newCategories: z.array(z.enum(categories)).optional(),
  newBranches: z.array(branchSchema).optional(),
  updateDetails: z.record(z.string(), z.any()).optional()
});

// Basic vendor details edit schema
export const vendorBasicDetailsSchema = z.object({
  personal_name: z.string()
    .min(2, 'Full name must be at least 2 characters')
    .max(100, 'Full name must be less than 100 characters')
    .regex(/^[a-zA-Z\s]+$/, 'Name can only contain letters and spaces'),

  business_name: z.string()
    .min(2, 'Business name must be at least 2 characters')
    .max(200, 'Business name must be less than 200 characters'),

  email: z.string()
    .email('Invalid email format')
    .max(100, 'Email must be less than 100 characters'),

  mobile: z.string()
    .regex(phoneRegex, 'Invalid mobile number format')
    .min(10, 'Mobile number must be at least 10 digits')
});

export type VendorRegistrationFormData = z.infer<typeof vendorRegistrationSchema>;
export type VendorUpdateRequestFormData = z.infer<typeof vendorUpdateRequestSchema>;
export type VendorBasicDetailsFormData = z.infer<typeof vendorBasicDetailsSchema>;
export type BranchFormData = z.infer<typeof branchSchema>;
export type CategorySpecificDetailsFormData = z.infer<typeof categorySpecificDetailsSchema>;
