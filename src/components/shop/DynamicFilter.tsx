
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Filter, Check } from "lucide-react";

interface FilterProps{
    isOpen:boolean,
    setIsOpen:(value:boolean)=>void,
    handleCheckboxChange:(category:string,option:string)=>void,
    selectedFilters:{[key:string]:string[]},
    filters:{[key:string]:string[]},
    onApply?:(selected:{[key:string]:string[]})=>void
}

export default function FilterSidebar({isOpen,setIsOpen,handleCheckboxChange,selectedFilters,filters:allFilters,onApply}:FilterProps) {

  const applyFilters = () => {
    if(onApply){
      onApply(selectedFilters)
    }
    setIsOpen(false);
  };

  const getSelectedCount = () => {
    return Object.values(selectedFilters).flat().length;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex justify-end"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/20 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
          />
          
          {/* Sidebar */}
          <motion.aside
            className="relative w-full max-w-sm h-full bg-white shadow-2xl flex flex-col"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center space-x-2">
                <div className="p-1.5 bg-sm-red rounded-md">
                  <Filter className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
                  {getSelectedCount() > 0 && (
                    <p className="text-xs text-gray-600">
                      {getSelectedCount()} selected
                    </p>
                  )}
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 hover:bg-gray-200 rounded-md transition-colors"
              >
                <X className="w-4 h-4 text-gray-600" />
              </button>
            </div>

            {/* Filter Content */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-5">
              {Object.entries(allFilters).map(([category, options]) => (
                <div key={category} className="space-y-2">
                  <h3 className="text-sm font-semibold text-gray-900 border-b border-gray-200 pb-1">
                    {category}
                  </h3>
                  <div className="space-y-1.5">
                    {options.map((option) => {
                      const isSelected = selectedFilters[category]?.includes(option) || false;
                      return (
                        <label
                          key={option}
                          className="flex items-center space-x-2 cursor-pointer group hover:bg-gray-50 px-2 py-1 rounded transition-colors"
                        >
                          <div className="relative">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleCheckboxChange(category, option)}
                              className="sr-only"
                            />
                            <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all ${
                              isSelected 
                                ? 'bg-sm-red border-sm-red' 
                                : 'border-gray-300 group-hover:border-sm-red/50'
                            }`}>
                              {isSelected && (
                                <Check className="w-2.5 h-2.5 text-white" />
                              )}
                            </div>
                          </div>
                          <span className={`text-xs font-medium transition-colors ${
                            isSelected ? 'text-gray-900' : 'text-gray-700 group-hover:text-gray-900'
                          }`}>
                            {option}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="px-4 py-3 border-t border-gray-200 bg-gray-50 space-y-2">
              {getSelectedCount() > 0 && (
                <button
                  onClick={() => {
                    // Clear all filters
                    Object.keys(selectedFilters).forEach(category => {
                      selectedFilters[category]?.forEach(option => {
                        handleCheckboxChange(category, option);
                      });
                    });
                  }}
                  className="w-full py-1.5 px-3 text-xs font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded transition-colors"
                >
                  Clear All
                </button>
              )}
              <button
                onClick={applyFilters}
                className="w-full py-2 px-3 bg-sm-red text-white font-semibold rounded shadow-lg hover:bg-sm-red/90 transition-colors flex items-center justify-center space-x-1.5"
              >
                <Check className="w-3.5 h-3.5" />
                <span className="text-sm">Apply</span>
              </button>
            </div>
          </motion.aside>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
