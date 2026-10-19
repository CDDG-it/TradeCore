-- Trade screenshots: a hard size limit and image-only uploads on the bucket.
--
-- The app already keeps uploads small (very large files are repacked as
-- lossless WebP and anything still over 10 MB is refused before it is sent),
-- but that is the browser's promise. This makes Storage itself refuse a file
-- over 10 MB, or one that is not an image, whatever sends it. Together with
-- the app deleting a trade's charts when the trade is deleted, it keeps the
-- bucket well inside the Free plan's 1 GB.
--
-- Safe to run more than once. Existing files are not touched.

update storage.buckets
set
  file_size_limit = 10485760, -- 10 MB
  allowed_mime_types = array[
    'image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/heic', 'image/heif'
  ]
where id = 'trade-screenshots';

-- Check: one row, with the limit and the list above.
select id, public, file_size_limit, allowed_mime_types
from storage.buckets
where id = 'trade-screenshots';
