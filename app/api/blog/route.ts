import { supabaseAdmin } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Fetch all published blog posts with business info
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
      .eq('published', true)
      .eq('status', 'published')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({ error: 'Failed to fetch blog posts' }, { status: 500 });
    }

    // Transform data for frontend
    const blogPosts = data.map(post => ({
      id: post.id,
      title: post.title,
      excerpt: post.content ? post.content.substring(0, 150) + '...' : '',
      author: post.businesses?.business_name || 'ReviewTrust Team',
      date: post.created_at ? new Date(post.created_at).toLocaleDateString() : 'Unknown date',
      image: post.thumbnail_image || '/placeholder.svg?key=blog_default',
      readTime: Math.max(1, Math.floor((post.content?.length || 0) / 200)) + ' min read'
    }));

    return NextResponse.json(blogPosts);
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}