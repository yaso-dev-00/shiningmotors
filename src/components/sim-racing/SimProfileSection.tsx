
import React from 'react';
import { motion } from 'framer-motion';
import { SimRacingSection } from './SimRacingSection';
import SimUserProfile from './SimUserProfile';

const SimProfileSection: React.FC = () => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <SimRacingSection 
        title="SIM Racing Profile" 
        description="Manage your sim racing identity, track your progress, and connect with others"
      >
        <SimUserProfile />
      </SimRacingSection>
    </motion.div>
  );
};

export default SimProfileSection;