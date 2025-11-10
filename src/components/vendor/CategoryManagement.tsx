
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { VendorRegistration } from '@/integrations/supabase/modules/vendors';
import { 
  Store, 
  Car, 
  Wrench, 
  Gamepad, 
  Package,
  Plus,
  Edit,
  Eye,
  Calendar,
  BarChart3,
  TrendingUp
} from 'lucide-react';
import NextLink from "next/link";

interface CategoryManagementProps {
  vendorRegistration: VendorRegistration;
}

const CategoryManagement: React.FC<CategoryManagementProps> = ({ vendorRegistration }) => {
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Shop': return <Store className="w-5 h-5" />;
      case 'Vehicle': return <Car className="w-5 h-5" />;
      case 'Service': return <Wrench className="w-5 h-5" />;
      case 'SimRacing': return <Gamepad className="w-5 h-5" />;
      case 'Event': return <Calendar className="w-5 h-5" />;
      default: return <Package className="w-5 h-5" />;
    }
  };

  const getCategoryDescription = (category: string) => {
    switch (category) {
      case 'Shop': return 'Manage your products, inventory, and shop settings';
      case 'Vehicle': return 'List and manage vehicles for sale';
      case 'Service': return 'Manage your services and bookings';
      case 'SimRacing': return 'Manage sim racing equipment and events';
      case 'Event': return 'Organize and manage events';
      default: return 'Manage your category items';
    }
  };

  const getCategoryRoutes = (category: string) => {
    const baseRoute = category.toLowerCase();
    return {
      manage: `/vendor/${baseRoute}-management`,
      create: `/vendor/${baseRoute}/create`,
      view: `/vendor/${baseRoute}s`
    };
  };

  if (!vendorRegistration.is_verified_by_admin) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <Package className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold mb-2">Pending Approval</h3>
          <p className="text-gray-600">
            Your vendor registration is still under review. Category management will be available once approved.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (!vendorRegistration.categories || vendorRegistration.categories.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <Package className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Categories Available</h3>
          <p className="text-gray-600">
            You don't have any approved business categories yet. Contact support to add categories.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Analytics Link */}
      <Card className="bg-gradient-to-r from-blue-500 to-purple-600 text-white">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold mb-2">Business Analytics</h3>
              <p className="text-blue-100">Track your performance across all categories</p>
            </div>
            <NextLink href="/vendor/analytics">
              <Button variant="secondary" className="bg-white text-blue-600 hover:bg-gray-100">
                <BarChart3 className="w-4 h-4 mr-2" />
                View Analytics
              </Button>
            </NextLink>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue={vendorRegistration.categories[0]} className="w-full">
        <TabsList className="w-full" >
         <div className='flex overflow-x-auto md:grid w-full scrollbar-hide' style={{ gridTemplateColumns: `repeat(${vendorRegistration.categories.length}, 1fr)` }}>
          {vendorRegistration.categories.map((category) => (
            <TabsTrigger key={category} value={category} className="flex items-center space-x-2">
              {getCategoryIcon(category)}
              <span>{category}</span>
            </TabsTrigger>
          ))}
          </div>
        </TabsList>

        {vendorRegistration.categories.filter((item)=>item!="SimRacing").map((category) => {
          const routes = getCategoryRoutes(category);
         
          return (
            <TabsContent key={category} value={category}>
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {getCategoryIcon(category)}
                      <CardTitle className="text-xl">{category} Management</CardTitle>
                    </div>
                    <Badge variant="default" className="bg-green-600">
                      Active
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <p className="text-gray-600">
                      {getCategoryDescription(category)}
                    </p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <NextLink href={routes.manage as any} className="w-full">
                        <Button size="lg" className="w-full h-20 flex flex-col items-center justify-center space-y-2">
                          <Edit className="w-6 h-6" />
                          <span>Manage {category}</span>
                        </Button>
                      </NextLink>
                      
                      <NextLink href={routes.create as any} className="w-full">
                        <Button variant="outline" size="lg" className="w-full h-20 flex flex-col items-center justify-center space-y-2">
                          <Plus className="w-6 h-6" />
                          <span>Add New {category.toLocaleLowerCase()=="shop"?"Product":"Item"}</span>
                        </Button>
                      </NextLink>
                      
                      {/* <Link to={routes.view} className="w-full">
                        <Button variant="ghost" size="lg" className="w-full h-20 flex flex-col items-center justify-center space-y-2">
                          <Eye className="w-6 h-6" />
                          <span>View {category}s</span>
                        </Button>
                      </Link> */}
                    </div>

                    {/* <div className="border-t pt-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-semibold">Quick Stats</h4>
                        <Link to="/vendor/analytics" className="text-sm text-blue-600 hover:text-blue-800 flex items-center">
                          <TrendingUp className="w-4 h-4 mr-1" />
                          View Detailed Analytics
                        </Link>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-gray-50 p-3 rounded-lg text-center">
                          <div className="text-2xl font-bold text-blue-600">0</div>
                          <div className="text-sm text-gray-600">Total Items</div>
                        </div>
                        <div className="bg-gray-50 p-3 rounded-lg text-center">
                          <div className="text-2xl font-bold text-green-600">0</div>
                          <div className="text-sm text-gray-600">Active</div>
                        </div>
                        <div className="bg-gray-50 p-3 rounded-lg text-center">
                          <div className="text-2xl font-bold text-yellow-600">0</div>
                          <div className="text-sm text-gray-600">Pending</div>
                        </div>
                        <div className="bg-gray-50 p-3 rounded-lg text-center">
                          <div className="text-2xl font-bold text-purple-600">0</div>
                          <div className="text-sm text-gray-600">Views</div>
                        </div>
                      </div>
                    </div> */}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          );
        })}
             <TabsContent  value={"SimRacing"}>
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {getCategoryIcon("simRacing")}
                      <CardTitle className="text-xl">simRacing Management</CardTitle>
                    </div>
                    <Badge variant="default" className="bg-green-600">
                      Active
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <p className="text-gray-600">
                      {getCategoryDescription("simRacing")}
                    </p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <NextLink href={'/vendor/simracing-management'} className="w-full">
                        <Button size="lg" className="w-full h-20 flex flex-col items-center justify-center space-y-2">
                          <Edit className="w-6 h-6" />
                          <span>Manage All Categories</span>
                        </Button>
                      </NextLink>
                      
                      <NextLink href={"/vendor/simracing-management"} className="w-full">
                        <Button variant="outline" size="lg" className="w-full h-20 flex flex-col items-center justify-center space-y-2">
                          <Eye className="w-6 h-6" />
                          <span>View Products</span>
                        </Button>
                      </NextLink>
                      
                       
                      <NextLink href={"/vendor/simleague-management" as any} className="w-full">
                        <Button variant="outline" size="lg" className="w-full h-20 flex flex-col items-center justify-center space-y-2">
                           <Eye className="w-6 h-6" />
                          <span>View Leagues</span>
                        </Button>
                      </NextLink>
                      <NextLink href={"/vendor/simevent-management" as any} className="w-full">
                        <Button variant="ghost" size="lg" className="w-full h-20 flex flex-col items-center justify-center space-y-2">
                          <Eye className="w-6 h-6" />
                          <span>View Sim Events</span>
                        </Button>
                      </NextLink>
                    </div>

                    {/* <div className="border-t pt-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-semibold">Quick Stats</h4>
                        <Link to="/vendor/analytics" className="text-sm text-blue-600 hover:text-blue-800 flex items-center">
                          <TrendingUp className="w-4 h-4 mr-1" />
                          View Detailed Analytics
                        </Link>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-gray-50 p-3 rounded-lg text-center">
                          <div className="text-2xl font-bold text-blue-600">0</div>
                          <div className="text-sm text-gray-600">Total Items</div>
                        </div>
                        <div className="bg-gray-50 p-3 rounded-lg text-center">
                          <div className="text-2xl font-bold text-green-600">0</div>
                          <div className="text-sm text-gray-600">Active</div>
                        </div>
                        <div className="bg-gray-50 p-3 rounded-lg text-center">
                          <div className="text-2xl font-bold text-yellow-600">0</div>
                          <div className="text-sm text-gray-600">Pending</div>
                        </div>
                        <div className="bg-gray-50 p-3 rounded-lg text-center">
                          <div className="text-2xl font-bold text-purple-600">0</div>
                          <div className="text-sm text-gray-600">Views</div>
                        </div>
                      </div>
                    </div> */}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
      </Tabs>
    </div>
  );
};

export default CategoryManagement;
