
import { supabase } from "../client";
import { serviceCategories } from "@/data/serviceCategories";
import type { Json } from "../types";

// Type definitions for service
export interface ServiceData {
  id?: string;
  title: string;
  description: string;
  price: string;
  duration?: string;
  availability?: Json;
  location: string;
  contact?: string;
  category:string
  media_urls?: string[];
}

export interface ServicePost {
  id?: string;
  title: string | null;
  description: string | null;
  price: string | null;
  duration?: string | null;
  availability?: Json | null;
  location: string | null;
  contact?: string | null;
  category: string | null;
  media_urls?: string[] | null;
  profile?: {
    username: string | null;
    full_name: string | null;
    avatar_url: string | null;
    id?: string;
  } | null;
  created_at?: string;
}

/**
 * Create a new service
 */
export const createService = async (
  serviceData: ServiceData,
  userId: string
): Promise<{ data: ServicePost | null; error: Error | unknown }> => {
  try {
    // Get the category name from the categoryId
    // const selectedCategory = serviceCategories.find(
    //   (cat) => cat.id === serviceData.categoryId
    // );

    // Format content for storage
    // We'll store structured data in the content field as it's easier to parse later
    const formattedContent = `${serviceData.title}\n\n${serviceData.description}${
      serviceData.price ? `\n\nPrice: ${serviceData.price}` : ''
    }${serviceData.duration ? `\n\nDuration: ${serviceData.duration}` : ''}${
      serviceData.availability ? `\n\nAvailability: ${serviceData.availability}` : ''
    }${serviceData.contact ? `\n\nContact: ${serviceData.contact}` : ''}`;

    const { data, error } = await supabase
      .from('services')
      .insert({
        // content: formattedContent,
        media_urls: serviceData.media_urls || [],
        category: serviceData.category,
        location: serviceData.location,
        // tags: [selectedCategory?.name || "", "service"],
        vendor_id: userId,
        description:serviceData.description,
        duration:serviceData.duration,
        availability:serviceData.availability,
        title:serviceData.title,
        contact:serviceData.contact,
        price:serviceData.price
        // likes_count: 0,
        // comments_count: 0,
        // reference_id: null
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating service:", error);
      return { data: null, error };
    }

    return { data, error: null };
  } catch (error) {
    console.error("Error creating service:", error);
    return { data: null, error };
  }
};


export const getAllServices = async (): Promise<{ 
  data: ServicePost[] | null; 
  error: Error | unknown 
}> => {
  try {
    const { data, error } = await supabase
      .from("services")
      .select(`
        *,
        profile:profiles(username, full_name, avatar_url)
      `)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching services:", error);
      return { data: null, error };
    }
    
    return { data, error: null };
  } catch (error) {
    console.error("Error fetching services:", error);
    return { data: null, error };
  }
};
/**
 * Get all services by vendor id
 */
export const getServices = async (id:string): Promise<{ 
  data: ServicePost[] | null; 
  error: Error | unknown 
}> => {
  try {
    const { data, error } = await supabase
      .from("services")
      .select(`
        *,
        profile:profiles(username, full_name, avatar_url)
      `)
      .eq("vendor_id",id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching services:", error);
      return { data: null, error };
    }

    return { data, error: null };
  } catch (error) {
    console.error("Error fetching services:", error);
    return { data: null, error };
  }
};

export const getServiceByCategory=async(category:string):Promise<{data:ServicePost[]|null;error:Error | string | unknown;}>=>{
  try {
    const {data,error} = await supabase
      .from("services")
      .select(`
        *,
        profile:profiles(username, full_name, avatar_url)
      `)
      .eq("category", category)
    

    if (error) {
      console.error("Error fetching service:", error);
      return { data: null, error };
    }

    if (!data) {
      return { data: null, error: "Service not found" };
    }

    // Parse the content to extract service details
   

    return { data, error: null};
  } catch (error) {
    console.error("Error fetching service:", error);
    return { data: null, error };
  }
}
/**
 * Get a specific service by ID
 */
export const getServiceById = async (id: string): Promise<{ 
  data: ServicePost | null; 
  error: Error | unknown;
  parsedData?: ServiceData;
}> => {
  try {
    const { data, error } = await supabase
      .from("services")
      .select(`
        *,
        profile:profiles(username, full_name, avatar_url,id)
      `)
      .eq("id", id)
      .single();

    if (error) {
      console.error("Error fetching service:", error);
      return { data: null, error };
    }

    if (!data) {
      return { data: null, error: "Service not found" };
    }

    // Parse the content to extract service details
  
 
    return { data, error: null};
  } catch (error) {
    console.error("Error fetching service:", error);
    return { data: null, error };
  }
};

/**
 * Update an existing service
 */
export const updateService = async (
  id: string,
  serviceData: ServiceData
): Promise<{ success: boolean; error: Error | unknown }> => {
  try {
    // Get the category name from the categoryId
    // const selectedCategory = serviceCategories.find(
    //   (cat) => cat.id === serviceData.categoryId
    // );

    // Format content for storage
    const formattedContent = `${serviceData.title}\n\n${serviceData.description}${
      serviceData.price ? `\n\nPrice: ${serviceData.price}` : ''
    }${serviceData.duration ? `\n\nDuration: ${serviceData.duration}` : ''}${
      serviceData.availability ? `\n\nAvailability: ${serviceData.availability}` : ''
    }${serviceData.contact ? `\n\nContact: ${serviceData.contact}` : ''}`;
    console.log(serviceData)
    const { error } = await supabase
      .from('services')
      .update({
        // content: formattedContent,
        media_urls: serviceData.media_urls || [],
        category: serviceData.category,
        location: serviceData.location,
        // tags: [selectedCategory?.name || "", "service"],
        description:serviceData.description,
        duration:serviceData.duration,
        availability:serviceData.availability,
        title:serviceData.title,
        contact:serviceData.contact,
        price:serviceData.price
      })
      .eq("id", id)
      

    if (error) {
      console.error("Error updating service:", error);
      return { success: false, error };
    }

    return { success: true, error: null };
  } catch (error) {
    console.error("Error updating service:", error);
    return { success: false, error };
  }
};

/**
 * Book a service (records the booking intent)
 */
export const bookService = async (
  serviceId: string,
  userId: string,
  vendorId: string,
  bookingDetails: {
    date: string
    time: string
    notes?: string
  }
): Promise<{ success: boolean; error: Error | unknown }> => {
  try {
    const { error } = await supabase.from('service_bookings').insert({
      service_id: serviceId,
      user_id: userId,
      vendor_id: vendorId,
      booking_date: bookingDetails.date,
      booking_slot: bookingDetails.time,
      notes: bookingDetails.notes || null,
      status: 'pending', 
      created_at: new Date().toISOString(),
    })

    if (error) {
      console.error("Error booking service:", error)
      return { success: false, error }
    }

    return { success: true, error: null }
  } catch (error) {
    console.error("Error booking service:", error)
    return { success: false, error }
  }
}

/**
 * Delete a service by ID
 */
export const deleteService = async (id: string): Promise<{ 
  success: boolean; 
  error: Error | unknown 
}> => {
  try {
    const { error } = await supabase
      .from("posts")
      .delete()
      .eq("id", id)
      .eq("category", "Service");

    if (error) {
      console.error("Error deleting service:", error);
      return { success: false, error };
    }

    return { success: true, error: null };
  } catch (error) {
    console.error("Error deleting service:", error);
    return { success: false, error };
  }
};

/**
 * Upload service images to storage
 */
export const uploadServiceImages = async (
  files: File[]
): Promise<{ urls: string[]; error: Error | unknown }> => {
  try {
    const imageUrls: string[] = [];
    
    for (const file of files) {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
    
      const filePath = `services/${fileName}`;
      
      const { error: uploadError } = await supabase.storage
        .from('services')
        .upload(filePath, file);
        
      if (uploadError) throw uploadError;
      
      const { data: { publicUrl } } = supabase.storage
        .from('services')
        .getPublicUrl(filePath);
        
      imageUrls.push(publicUrl);
    }

    return { urls: imageUrls, error: null };
  } catch (error) {
    console.error("Error uploading images:", error);
    return { urls: [], error };
  }
};

/**
 * Helper function to parse service content into structured data
 */
export function parseServiceContent(servicePost: ServicePost): ServiceData {
  // Use the category directly from the service post
  return {
    id: servicePost.id,
    title: servicePost.title || '',
    description: servicePost.description || '',
    category: servicePost.category || '',
    price: servicePost.price || '',
    duration: servicePost.duration || '',
    availability: servicePost.availability,
    location: servicePost.location || '',
    contact: servicePost.contact || '',
    media_urls: servicePost.media_urls || undefined
  };
}
