# Vendor Map Location Feature - Implementation Guide

## 🎯 Overview

A beautiful, interactive map-based vendor location finder with sample data covering major Indian cities. Features include:

- ✅ Interactive map visualization
- ✅ Vendor location pins with category-based colors
- ✅ Search and filter functionality
- ✅ Distance calculation from user location
- ✅ Vendor detail cards and modals
- ✅ Responsive design
- ✅ Smooth animations
- ✅ Fullscreen mode

## 📍 Access the Feature

Navigate to: `/vendors/map`

Or add a link in your navigation:
```tsx
<Link href="/vendors/map">Find Vendors</Link>
```

## 🗺️ Sample Data Coverage

The map includes sample vendors in these major Indian cities:

- **Mumbai** (3 vendors)
- **Delhi** (3 vendors)
- **Bangalore** (3 vendors)
- **Chennai** (2 vendors)
- **Hyderabad** (2 vendors)
- **Pune** (2 vendors)
- **Kolkata** (2 vendors)
- **Ahmedabad** (2 vendors)
- **Jaipur** (1 vendor)

**Total: 20 sample vendors** across 9 major cities

## 🎨 Features

### 1. **Interactive Map**
- Custom SVG-based map visualization
- Draggable map
- Zoom in/out controls
- Fullscreen mode
- City labels
- Category-based colored markers

### 2. **Search & Filters**
- Search by vendor name, city, or address
- Filter by city
- Filter by category (shop, services, vehicles)
- Real-time filtering

### 3. **Location Features**
- "Use My Location" button
- Distance calculation from user location
- Sorted results by distance
- User location marker on map

### 4. **Vendor Information**
- Vendor cards with ratings
- Verified badge for verified vendors
- Category tags
- Contact information (phone, email)
- Quick action buttons (Call, Email, Directions)

### 5. **Vendor Detail Modal**
- Full vendor information
- Distance from user (if location enabled)
- Direct call and email buttons
- Get directions link (opens Google Maps)

## 🎨 UI Components Used

- `Card`, `CardContent`, `CardHeader`, `CardTitle`
- `Input`
- `Button`
- `Badge`
- `Select`, `SelectContent`, `SelectItem`, `SelectTrigger`, `SelectValue`
- `motion` from `framer-motion` for animations

## 📁 File Structure

```
src/
├── components/
│   └── vendor/
│       ├── VendorMapView.tsx          # Google Maps embed version
│       └── AdvancedVendorMap.tsx       # Custom SVG map version (recommended)
├── lib/
│   └── data/
│       └── sampleVendors.ts           # Sample vendor data
└── app/
    └── (main)/
        └── vendors/
            └── map/
                └── page.tsx           # Page route
```

## 🔧 Integration with Real Data

To integrate with your actual vendor data:

### Step 1: Update Data Source

Replace `sampleVendors` import in `AdvancedVendorMap.tsx`:

```tsx
// Instead of:
import { sampleVendors } from "@/lib/data/sampleVendors";

// Use:
import { vendorApi } from "@/integrations/supabase/modules/vendors";
import { useQuery } from "@tanstack/react-query";

// Then fetch real data:
const { data: vendors } = useQuery({
  queryKey: ["vendors"],
  queryFn: async () => {
    const { data } = await vendorApi.getAll();
    // Transform to VendorLocation format
    return transformVendorData(data);
  },
});
```

### Step 2: Transform Vendor Data

Create a transformation function:

```tsx
function transformVendorData(vendors: VendorRegistration[]): VendorLocation[] {
  return vendors
    .filter(v => v.status === 'approved' && v.is_verified_by_admin)
    .flatMap(vendor => 
      (vendor.branches || []).map((branch, index) => ({
        id: `${vendor.id}-${index}`,
        businessName: vendor.business_name || vendor.personal_name,
        personalName: vendor.personal_name,
        categories: vendor.categories || [],
        city: branch.city,
        state: branch.state,
        address: `${branch.addressLine1}, ${branch.city}, ${branch.state} ${branch.postalCode}`,
        latitude: branch.latitude || getLatLngFromAddress(branch.city, branch.state).lat,
        longitude: branch.longitude || getLatLngFromAddress(branch.city, branch.state).lng,
        phone: branch.contactPhone || vendor.mobile,
        email: branch.contactEmail || vendor.email,
        rating: 4.5, // Calculate from reviews
        reviewCount: 0, // Get from reviews table
        isVerified: vendor.is_verified_by_admin,
        branchName: branch.branchName,
      }))
    );
}
```

### Step 3: Geocoding Addresses

You'll need to geocode addresses to get latitude/longitude. Options:

1. **Google Geocoding API** (Recommended)
2. **Mapbox Geocoding API**
3. **OpenStreetMap Nominatim** (Free, but rate-limited)

Example with Google Geocoding:

```tsx
async function geocodeAddress(address: string): Promise<{ lat: number; lng: number }> {
  const response = await fetch(
    `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`
  );
  const data = await response.json();
  if (data.results && data.results.length > 0) {
    const location = data.results[0].geometry.location;
    return { lat: location.lat, lng: location.lng };
  }
  return { lat: 0, lng: 0 };
}
```

## 🗺️ Google Maps Integration (Optional)

If you want to use Google Maps instead of the custom SVG map:

1. Get Google Maps API Key from [Google Cloud Console](https://console.cloud.google.com/)
2. Add to `.env.local`:
   ```
   NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_api_key_here
   ```
3. Install Google Maps React library:
   ```bash
   npm install @react-google-maps/api
   ```
4. Use `VendorMapView.tsx` instead of `AdvancedVendorMap.tsx`

## 🎨 Customization

### Change Category Colors

Edit `getCategoryColor` function in `AdvancedVendorMap.tsx`:

```tsx
const getCategoryColor = (category: string) => {
  const colors: Record<string, string> = {
    shop: "bg-blue-500",        // Change to your color
    services: "bg-green-500",   // Change to your color
    vehicles: "bg-red-500",    // Change to your color
  };
  return colors[category] || "bg-gray-500";
};
```

### Adjust Map Zoom Levels

Change the zoom range in the component:

```tsx
const [zoom, setZoom] = useState(6); // Initial zoom
// ...
<Button onClick={() => setZoom(Math.min(zoom + 1, 10))}> // Max zoom
<Button onClick={() => setZoom(Math.max(zoom - 1, 3))}>  // Min zoom
```

### Add More Cities

Add to `src/lib/data/sampleVendors.ts`:

```tsx
export const cityCoordinates: Record<string, { lat: number; lng: number }> = {
  // ... existing cities
  "New City": { lat: 28.6139, lng: 77.2090 },
};
```

## 📱 Mobile Responsiveness

The component is fully responsive:
- Sidebar collapses on mobile
- Map takes full width on small screens
- Touch-friendly controls
- Responsive vendor cards

## 🚀 Performance Optimizations

- Memoized filtered vendors
- Debounced search (can be added)
- Lazy loading of vendor details
- Optimized animations with Framer Motion

## 🔐 Privacy & Permissions

- User location is only requested when "Use My Location" is clicked
- Location data is not stored
- All location processing happens client-side

## 📊 Future Enhancements

Potential improvements:
- [ ] Cluster markers for multiple vendors in same area
- [ ] Route planning between multiple vendors
- [ ] Save favorite vendors
- [ ] Share vendor location
- [ ] Vendor availability status
- [ ] Real-time vendor tracking
- [ ] Reviews and ratings integration
- [ ] Booking integration
- [ ] Vendor photos in cards

## 🐛 Troubleshooting

### Map not showing
- Check if SVG rendering is working
- Verify container has proper dimensions
- Check browser console for errors

### Location not working
- Ensure HTTPS (required for geolocation API)
- Check browser permissions
- Verify navigator.geolocation is available

### Vendors not appearing
- Check filter settings
- Verify vendor data format
- Check console for data loading errors

## 📝 Notes

- The custom SVG map is a simplified visualization
- For production, consider using Google Maps or Mapbox
- Sample data includes realistic Indian addresses
- All coordinates are approximate for major city centers

## 🎉 Enjoy!

Your vendor map feature is ready to use! Navigate to `/vendors/map` to see it in action.


