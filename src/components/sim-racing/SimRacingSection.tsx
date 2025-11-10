
import React from 'react';
import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import NextLink from "next/link";

interface SimRacingSectionProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  linkTo?: string;
  linkText?: string;
  className?: string;
}

export const SimRacingSection: React.FC<SimRacingSectionProps> = ({
  title,
  description,
  children,
  linkTo,
  linkText = "View all",
  className = "",
}) => {
  return (
    <section className={`py-8 ${className}`}>
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{title}</h2>
            {description && (
              <p className="text-gray-600 dark:text-gray-300">{description}</p>
            )}
          </div>
          {linkTo && (
            <motion.div whileHover={{ x: 5 }} transition={{ type: "spring", stiffness: 300 }}>
              <NextLink 
                href={linkTo as any}
                className="flex items-center text-sm-purple hover:text-purple-700 font-medium"
              >
              <span className='hidden sm:block'>{linkText}</span>
                <ChevronRight size={16} className="ml-1 hidden sm:block" />
                   <ChevronRight size={20} className="ml-1 block sm:hidden" />
              </NextLink>
            </motion.div>
          )}
        </div>
        {children}
      </div>
    </section>
  );
};
