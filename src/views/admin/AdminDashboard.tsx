"use client";
import { useState, useEffect } from "react";
import { Line, Bar, PieChart, Pie, Cell } from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ArrowUpRight,
  Users,
  ShoppingBag,
  Truck,
  DollarSign,
  TrendingUp,
  Car,
  Building,
  ArrowRight,
} from "lucide-react";
import NextLink from "next/link";
import AdminLayout from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Vehicle } from "@/integrations/supabase/modules/vehicles";

const AdminDashboard = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);

  console.log("dashboard");

  useEffect(() => {
    const fetchVehicles = async () => {
      try {
        const { data, error } = await supabase.from("vehicles").select("*");

        if (error) throw error;

        // Add default status if it's missing
        const vehiclesWithStatus = data.map((vehicle) => ({
          ...vehicle,
          status: vehicle.status || "Available",
        }));

        setVehicles(vehiclesWithStatus);
      } catch (error) {
        console.error("Error fetching vehicles:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchVehicles();
  }, []);

  // Sample data for charts
  const salesData = [
    { name: "Jan", total: 1200 },
    { name: "Feb", total: 2100 },
    { name: "Mar", total: 1800 },
    { name: "Apr", total: 2400 },
    { name: "May", total: 3200 },
    { name: "Jun", total: 4100 },
    { name: "Jul", total: 4800 },
  ];

  const categoryData = [
    { name: "Performance", value: 40 },
    { name: "OEM Parts", value: 30 },
    { name: "Tools", value: 20 },
    { name: "Others", value: 10 },
  ];

  return (
    <AdminLayout title="Admin Dashboard">
      <div className="space-y-6">
        {/* <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">$45,231.89</div>
              <p className="text-xs text-muted-foreground">
                +20.1% from last month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">New Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">+2,350</div>
              <p className="text-xs text-muted-foreground">
                +180.1% from last month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Sales</CardTitle>
              <ShoppingBag className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">+12,234</div>
              <p className="text-xs text-muted-foreground">
                +19% from last month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Vehicles Sold</CardTitle>
              <Car className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">+573</div>
              <p className="text-xs text-muted-foreground">
                +201 from last month
              </p>
            </CardContent>
          </Card>
        </div> */}

        {/* Quick Access Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <NextLink href={"/admin/vendor-management" as any}>
            <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Building className="w-5 h-5 mr-2" />
                  Vendor Management
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 text-sm">
                  Manage vendor registrations, approvals, and view vendor data
                </p>
                <div className="mt-4 flex items-center text-blue-600">
                  <span className="text-sm font-medium">Manage Vendors</span>
                  <ArrowRight className="w-4 h-4 ml-1" />
                </div>
              </CardContent>
            </Card>
          </NextLink>

          <NextLink href={"/admin/vendor-activities" as any}>
            <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <TrendingUp className="w-5 h-5 mr-2" />
                  Vendor Activities
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 text-sm">
                  Monitor vendor performance, revenue, growth metrics, and business analytics
                </p>
                <div className="mt-4 flex items-center text-blue-600">
                  <span className="text-sm font-medium">View Activities</span>
                  <ArrowRight className="w-4 h-4 ml-1" />
                </div>
              </CardContent>
            </Card>
          </NextLink>

          <NextLink href={"/admin/products" as any}>
            <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <ShoppingBag className="w-5 h-5 mr-2" />
                  Product Management
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 text-sm">
                  Manage products, inventory, and vendor listings
                </p>
                <div className="mt-4 flex items-center text-blue-600">
                  <span className="text-sm font-medium">Manage Products</span>
                  <ArrowRight className="w-4 h-4 ml-1" />
                </div>
              </CardContent>
            </Card>
          </NextLink>
        </div>

        {/* <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Recent Sales</CardTitle>
              <CardDescription>You made 265 sales this month</CardDescription>
            </CardHeader>
            <CardContent>
              
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Top Products</CardTitle>
              <CardDescription>
                Your best selling products this month
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center">
                  <div className="h-9 w-9 rounded-full bg-gray-100"></div>
                  <div className="ml-4 space-y-1">
                    <p className="text-sm font-medium leading-none">
                      Performance Exhaust
                    </p>
                    <p className="text-sm text-muted-foreground">$1,999.00</p>
                  </div>
                  <div className="ml-auto font-medium">+42%</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div> */}
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
