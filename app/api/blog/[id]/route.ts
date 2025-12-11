import { supabaseAdmin } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    
    // Fetch the specific published blog post with business info
    const { data, error } = await supabaseAdmin
      .from("blogs")
      .select(`
        id, 
        title, 
        content, 
        thumbnail_image, 
        published, 
        status, 
        created_at, 
        updated_at,
        businesses(business_name)
      `)
      .eq('id', id)
      .eq('published', true)
      .eq('status', 'published')
      .single();

    if (error || !data) {
      console.error('Database error:', error);
      return NextResponse.json({ error: 'Blog post not found' }, { status: 404 });
    }

    // Transform data for frontend
    const blogPost = {
      id: data.id,
      title: data.title,
      content: data.content,
      author: data.businesses?.business_name || 'ReviewTrust Team',
      date: data.created_at ? new Date(data.created_at).toLocaleDateString() : 'Unknown date',
      image: data.thumbnail_image || '/placeholder.svg?key=blog_featured',
      readTime: Math.max(1, Math.floor((data.content?.length || 0) / 200)) + ' min read'
    };

    return NextResponse.json(blogPost);
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}