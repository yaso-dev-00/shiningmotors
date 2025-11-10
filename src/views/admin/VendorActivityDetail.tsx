"use client";
import React, { useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import VendorDetailedActivity from '@/components/admin/VendorDetailedActivity';

const VendorActivityDetail = () => {
  useEffect(()=>{
       window.scrollTo(0,0)
  },[])
  return (
    <AdminLayout title="Vendor Activity Details" backLink="/admin/vendor-activities">
      <VendorDetailedActivity />
    </AdminLayout>
  );
};

export default VendorActivityDetail;
