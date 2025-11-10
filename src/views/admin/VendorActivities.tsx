
import React from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import VendorActivitiesShowcase from '@/components/admin/VendorActivitiesShowcase';

const VendorActivities = () => {
  return (
    <AdminLayout title="Vendor Activities" backLink="/adminVendor">
      <VendorActivitiesShowcase />
    </AdminLayout>
  );
};

export default VendorActivities;
