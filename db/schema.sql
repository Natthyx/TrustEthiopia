-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles table for all users (users, business owners, admins)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL PRIMARY KEY,
  name TEXT,
  email TEXT,
  role TEXT CHECK (role IN ('user', 'business', 'admin')),
  is_banned BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Categories table
CREATE TABLE categories (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  icon TEXT,
  bg_color TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Subcategories table
CREATE TABLE subcategories (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  category_id UUID REFERENCES categories(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(name, category_id)
);

-- Businesses table
CREATE TABLE businesses (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  business_name TEXT NOT NULL,
  business_owner_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  location TEXT,
  description TEXT,
  website TEXT,
  is_banned BOOLEAN DEFAULT FALSE,
  rating_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Business documents table
CREATE TABLE business_documents (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE NOT NULL,
  document_url TEXT NOT NULL,
  document_name TEXT,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected'))
);

-- Business categories junction table (many-to-many)
CREATE TABLE business_categories (
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE NOT NULL,
  category_id UUID REFERENCES categories(id) ON DELETE CASCADE NOT NULL,
  PRIMARY KEY (business_id, category_id)
);

-- Business subcategories junction table (many-to-many)
CREATE TABLE business_subcategories (
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE NOT NULL,
  subcategory_id UUID REFERENCES subcategories(id) ON DELETE CASCADE NOT NULL,
  PRIMARY KEY (business_id, subcategory_id)
);

-- Reviews table
CREATE TABLE reviews (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5) NOT NULL,
  comment TEXT,
  reviewee_id UUID REFERENCES businesses(id) ON DELETE CASCADE NOT NULL,
  reviewer_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(reviewer_id, reviewee_id) -- One review per user per business
);

-- Review comments table (for business responses to reviews)
CREATE TABLE review_comments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  review_id UUID REFERENCES reviews(id) ON DELETE CASCADE NOT NULL,
  commenter_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  comment TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Blogs table
CREATE TABLE blogs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  thumbnail_image TEXT,
  read_count INTEGER DEFAULT 0,
  published BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User reads tracking
CREATE TABLE user_reads (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  blog_id UUID REFERENCES blogs(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, blog_id)
);

-- User review tracking (track which reviews a user has written)
CREATE TABLE user_reviews (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  review_id UUID REFERENCES reviews(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, review_id)
);

-- Row Level Security (RLS) Policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE subcategories ENABLE ROW LEVEL SECURITY;
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_subcategories ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE blogs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_reads ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_reviews ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Profiles are viewable by themselves" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Categories policies (public read)
CREATE POLICY "Categories are viewable by everyone" ON categories
  FOR SELECT USING (true);

-- Subcategories policies (public read)
CREATE POLICY "Subcategories are viewable by everyone" ON subcategories
  FOR SELECT USING (true);

-- Businesses policies
CREATE POLICY "Businesses are viewable by everyone" ON businesses
  FOR SELECT USING (true);

CREATE POLICY "Business owners can insert their own business" ON businesses
  FOR INSERT WITH CHECK (auth.uid() = business_owner_id);

CREATE POLICY "Business owners can update their own business" ON businesses
  FOR UPDATE USING (auth.uid() = business_owner_id);

-- Business documents policies
CREATE POLICY "Business documents are viewable by everyone" ON business_documents
  FOR SELECT USING (true);

CREATE POLICY "Business owners can insert their own documents" ON business_documents
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM businesses 
      WHERE businesses.id = business_documents.business_id 
      AND businesses.business_owner_id = auth.uid()
    )
  );

-- Business categories policies
CREATE POLICY "Business categories are viewable by everyone" ON business_categories
  FOR SELECT USING (true);

CREATE POLICY "Business owners can insert their own business categories" ON business_categories
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM businesses 
      WHERE businesses.id = business_categories.business_id 
      AND businesses.business_owner_id = auth.uid()
    )
  );

CREATE POLICY "Business owners can delete their own business categories" ON business_categories
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM businesses 
      WHERE businesses.id = business_categories.business_id 
      AND businesses.business_owner_id = auth.uid()
    )
  );

-- Business subcategories policies
CREATE POLICY "Business subcategories are viewable by everyone" ON business_subcategories
  FOR SELECT USING (true);

CREATE POLICY "Business owners can insert their own business subcategories" ON business_subcategories
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM businesses 
      WHERE businesses.id = business_subcategories.business_id 
      AND businesses.business_owner_id = auth.uid()
    )
  );

CREATE POLICY "Business owners can delete their own business subcategories" ON business_subcategories
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM businesses 
      WHERE businesses.id = business_subcategories.business_id 
      AND businesses.business_owner_id = auth.uid()
    )
  );

-- Reviews policies
CREATE POLICY "Reviews are viewable by everyone" ON reviews
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own reviews" ON reviews
  FOR INSERT WITH CHECK (auth.uid() = reviewer_id);

CREATE POLICY "Users can update their own reviews" ON reviews
  FOR UPDATE USING (auth.uid() = reviewer_id);

-- Review comments policies
CREATE POLICY "Review comments are viewable by everyone" ON review_comments
  FOR SELECT USING (true);

CREATE POLICY "Authorized users can insert review comments" ON review_comments
  FOR INSERT WITH CHECK (
    auth.uid() = commenter_id AND
    EXISTS (
      SELECT 1 FROM reviews r
      JOIN businesses b ON r.reviewee_id = b.id
      WHERE r.id = review_comments.review_id 
      AND (b.business_owner_id = auth.uid() OR r.reviewer_id = auth.uid())
    )
  );

-- Blogs policies
CREATE POLICY "Published blogs are viewable by everyone" ON blogs
  FOR SELECT USING (published = true);

CREATE POLICY "Business owners can view their own blogs" ON blogs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM businesses 
      WHERE businesses.id = blogs.business_id 
      AND businesses.business_owner_id = auth.uid()
    )
  );

CREATE POLICY "Business owners can insert their own blogs" ON blogs
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM businesses 
      WHERE businesses.id = blogs.business_id 
      AND businesses.business_owner_id = auth.uid()
    )
  );

CREATE POLICY "Business owners can update their own blogs" ON blogs
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM businesses 
      WHERE businesses.id = blogs.business_id 
      AND businesses.business_owner_id = auth.uid()
    )
  );

-- User reads policies
CREATE POLICY "Users can view their own reads" ON user_reads
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own reads" ON user_reads
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- User reviews policies
CREATE POLICY "Users can view their own reviews" ON user_reviews
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own reviews" ON user_reviews
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Functions and triggers for automatic profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'role', 'user'));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Set function owner immediately after creation
ALTER FUNCTION public.handle_new_user() OWNER TO postgres;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Indexes for better performance
CREATE INDEX idx_businesses_owner ON businesses(business_owner_id);
CREATE INDEX idx_reviews_reviewee ON reviews(reviewee_id);
CREATE INDEX idx_reviews_reviewer ON reviews(reviewer_id);
CREATE INDEX idx_review_comments_review ON review_comments(review_id);
CREATE INDEX idx_blogs_business ON blogs(business_id);
CREATE INDEX idx_user_reads_user ON user_reads(user_id);
CREATE INDEX idx_user_reads_blog ON user_reads(blog_id);
CREATE INDEX idx_user_reviews_user ON user_reviews(user_id);
CREATE INDEX idx_user_reviews_review ON user_reviews(review_id);
CREATE INDEX idx_business_categories_business ON business_categories(business_id);
CREATE INDEX idx_business_categories_category ON business_categories(category_id);
CREATE INDEX idx_business_subcategories_business ON business_subcategories(business_id);
CREATE INDEX idx_business_subcategories_subcategory ON business_subcategories(subcategory_id);
CREATE INDEX idx_subcategories_category ON subcategories(category_id);

CREATE POLICY "Service role can insert profiles"
ON profiles
FOR INSERT
TO service_role
WITH CHECK (true);
