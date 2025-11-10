
import { ExtendedVehicle } from '@/integrations/supabase/modules/vehicles';
import VehicleCard from './VehicleCard';

interface VehicleCardWrapperProps {
  vehicle: ExtendedVehicle;
}

export const VehicleCardWrapper = ({ vehicle }: VehicleCardWrapperProps) => {
  // Default image if no images are available
  const defaultImage = "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?ixlib=rb-1.2.1&auto=format&fit=crop&w=1200&q=80";
  
  return (
    <VehicleCard 
      id={vehicle.id}
      title={vehicle.title || `${vehicle.year} ${vehicle.make} ${vehicle.model} `}
      price={vehicle.price || 0}
      image={vehicle.images?.[0] || defaultImage}
      year={vehicle.year || new Date().getFullYear()}
      mileage={vehicle.mileage || 0}
      fuelType={vehicle.fuel_type || 'Gasoline'}
      transmission={vehicle.transmission || 'Automatic'}
      location={vehicle.location || 'Unknown'}
      seats={vehicle.seats || 4}
      status={vehicle?.status|| ""}
      isFeatured={vehicle.isFeatured || false}
    />
  );
};
