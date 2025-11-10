
import React from 'react';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import Layout from '@/components/Layout';
import SimProfileSection from '@/components/sim-racing/SimProfileSection';

const SimRacingProfile: React.FC = () => {
  return (
    <ProtectedRoute>
      <Layout>
        <SimProfileSection />
      </Layout>
    </ProtectedRoute>
  );
};

export default SimRacingProfile;