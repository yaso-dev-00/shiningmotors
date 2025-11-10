"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Search, Edit, Trash2, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import  AdminLayout  from "@/components/admin/AdminLayout";

interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  inventory: number;
  status: string;
  created_at: string;
}

const ProductManagement = () => {
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const router = useRouter();
  
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        const userId = user?.id;
        
        if (!userId) {
          toast({
            title: "Error",
            description: "User not authenticated",
            variant: "destructive",
          });
          setLoading(false);
          return;
        }
     
        const { data, error } = await supabase
          .from('products')
          .select('*').eq("seller_id", userId);
        
        if (error) throw error;
        
        const transformedProducts = (data || []).map(product => ({
          ...product,
          status: product.inventory > 10 ? "In Stock" : 
                 product.inventory > 0 ? "Low Stock" : "Out of Stock"
        }));
        
        setProducts(transformedProducts);
      } catch (error) {
        console.error("Error fetching products:", error);
        toast({
          title: "Error",
          description: "Failed to load products",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchProducts();
  }, [toast]);

  const handleAddProduct = () => {
    router.push("/admin/products/create" as any);
  };
  
  const handleEditProduct = (id: string) => {
    router.push(`/admin/products/edit/${id}` as any);
  };
  
  const handleDeleteProduct = async (id: string) => {
    if (confirm("Are you sure you want to delete this product?")) {
      try {
        const { error } = await supabase
          .from('products')
          .delete()
          .eq('id', id);
        
        if (error) throw error;
        
        toast({
          title: "Product deleted",
          description: "The product has been deleted successfully",
        });
        
        setProducts(products.filter(product => product.id !== id));
      } catch (error) {
        console.error("Error deleting product:", error);
        toast({
          title: "Error",
          description: "Failed to delete product",
          variant: "destructive",
        });
      }
    }
  };
  
  const filteredProducts = products.filter(product => 
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.category.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  return (
    <AdminLayout title="Product Management" backLink="/admin">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="relative flex w-full max-w-md items-center">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input 
            placeholder="Search products..." 
            className="pl-10" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <Button 
          className="bg-sm-red hover:bg-sm-red-light"
          onClick={handleAddProduct}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Product
        </Button>
      </div>
      
      <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList>
          <TabsTrigger value="all">All Products</TabsTrigger>
          <TabsTrigger value="in-stock">In Stock</TabsTrigger>
          <TabsTrigger value="low-stock">Low Stock</TabsTrigger>
          <TabsTrigger value="out-of-stock">Out of Stock</TabsTrigger>
        </TabsList>
        
        <TabsContent value={activeTab} className="mt-6">
          <Card>
            <CardContent className="p-0">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 size={32} className="mr-2 animate-spin text-sm-red" />
                  <span>Loading products...</span>
                </div>
              ) : filteredProducts.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Stock</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProducts
                      .filter(product => {
                        if (activeTab === "all") return true;
                        if (activeTab === "in-stock") return product.status === "In Stock";
                        if (activeTab === "low-stock") return product.status === "Low Stock";
                        if (activeTab === "out-of-stock") return product.status === "Out of Stock";
                        return true;
                      })
                      .map((product) => (
                        <TableRow key={product.id}>
                          <TableCell className="font-medium">{product.name}</TableCell>
                          <TableCell>{product.category}</TableCell>
                          <TableCell>
                          {new Intl.NumberFormat('en-IN', {
                style: 'currency',
                currency: 'INR'
              }).format(Number(product.price.toFixed(2)))}</TableCell>
                          <TableCell>{product.inventory}</TableCell>
                          <TableCell>
                            <span 
                              className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                                product.status === "In Stock"
                                  ? "bg-green-100 text-green-800"
                                  : product.status === "Low Stock"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : "bg-red-100 text-red-800"
                              }`}
                            >
                              {product.status}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleEditProduct(product.id)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="text-red-500"
                              onClick={() => handleDeleteProduct(product.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="flex flex-col items-center justify-center py-12">
                  <p className="mb-4 text-gray-500">No products found</p>
                  <Button 
                    className="bg-sm-red hover:bg-sm-red-light"
                    onClick={handleAddProduct}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Your First Product
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </AdminLayout>
  );
};

export default ProductManagement;
