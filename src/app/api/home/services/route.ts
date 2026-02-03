import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';
import { getAllServices } from '@/integrations/supabase/modules/services';

// Cache for 5-10 minutes
export const revalidate = 300;

export async function GET() {
  try {
    const result = await getAllServices();
    
    if (result.error) {
      console.error('Error fetching services:', result.error);
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch services',
        data: [],
      }, { status: 500 });
    }

    // Filter active services and sort by created_at and views
    const services = (result.data || [])
      .filter((service: any) => service.status === 'active' || !service.status)
      .sort((a: any, b: any) => {
        const dateA = new Date(a.created_at || 0).getTime();
        const dateB = new Date(b.created_at || 0).getTime();
        return dateB - dateA;
      })
      .slice(0, 8);

    return NextResponse.json({
      success: true,
      data: services,
    });
  } catch (error: any) {
    console.error('Error fetching services:', error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || 'Failed to fetch services',
        data: [],
      },
      { status: 500 }
    );
  }
}

