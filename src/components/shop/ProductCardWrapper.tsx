
import { ProductDetail } from '@/integrations/supabase/modules/shop';
import ProductCard from './ProductCard';

interface ProductCardWrapperProps {
  product: ProductDetail;
}

export const ProductCardWrapper = ({ product }: ProductCardWrapperProps) => {
  return (
    <ProductCard 
      id={product.id}
      name={product.name}
      price={product.price}
      image={product.images?.[0] || ''}
      category={product.category}
    />
  );
};
