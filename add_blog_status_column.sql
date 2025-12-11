ALTER TABLE blogs ADD COLUMN status TEXT DEFAULT 'drafted' CHECK (status IN ('pending', 'drafted', 'approved', 'withdrawn', 'published'));
