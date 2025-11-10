# Vendor Components

## BusinessLogoUploader

A comprehensive business logo upload component with cropping functionality, built on top of the avatar upload pattern.

### Features

- **Image Cropping**: Uses `react-easy-crop` for precise image cropping with zoom controls
- **Drag & Drop**: Supports drag and drop file uploads
- **File Validation**: Validates file type (images only) and size (max 5MB)
- **Circular Preview**: Shows circular preview of the logo
- **Responsive Design**: Works on both desktop and mobile devices
- **Error Handling**: Provides user-friendly error messages via toast notifications

### Usage

```tsx
import BusinessLogoUploader from './BusinessLogoUploader';

<BusinessLogoUploader
  currentLogoUrl={currentLogoUrl}
  vendorId={vendorId}
  businessName={businessName}
  onLogoUpdate={onLogoUpdate}
  isEditable={true}
>
  <Button>Edit Logo</Button>
</BusinessLogoUploader>
```

### Props

- `currentLogoUrl?: string` - Current logo URL to display
- `vendorId: string` - Vendor ID for database operations
- `businessName: string` - Business name for alt text
- `onLogoUpdate: (newLogoUrl: string | null) => void` - Callback when logo is updated
- `isEditable?: boolean` - Whether the logo can be edited (default: true)
- `children?: React.ReactNode` - Trigger element for the modal

### Cropping Workflow

1. User selects or drags an image file
2. Image validation (type and size)
3. Cropping interface appears with zoom controls
4. User adjusts crop area and zoom level
5. User confirms crop or cancels
6. Cropped image is processed and ready for upload
7. User can save the cropped image or cancel

### Dependencies

- `react-easy-crop` - For image cropping functionality
- `@/hooks/use-vendor-logo-upload` - For Supabase upload operations
- `@/components/ui/*` - UI components
- `lucide-react` - Icons

## BusinessLogoEdit

A wrapper component that provides a visual interface for the business logo with edit capabilities.

### Features

- **Visual Display**: Shows current logo or placeholder
- **Hover Effects**: Edit button appears on hover
- **Responsive Design**: Adapts to different screen sizes
- **Integration**: Seamlessly integrates with BusinessLogoUploader

### Usage

```tsx
import BusinessLogoEdit from './BusinessLogoEdit';

<BusinessLogoEdit
  currentLogoUrl={currentLogoUrl}
  vendorId={vendorId}
  businessName={businessName}
  onLogoUpdate={onLogoUpdate}
  isEditable={true}
/>
```
