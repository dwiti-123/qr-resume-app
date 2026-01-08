import { Router, Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const router = Router();

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
);

/**
 * GET /api/view?file=<filename>
 * Redirects to public Supabase PDF URL
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const file = req.query.file as string;

    if (!file) {
      return res.status(400).send('Missing file parameter');
    }

    const filename = decodeURIComponent(file);

    const { data } = supabase.storage
      .from(process.env.BUCKET_NAME!)
      .getPublicUrl(filename);

    if (!data?.publicUrl) {
      return res.status(404).send('PDF not found');
    }

    res.redirect(data.publicUrl);
  } catch (err) {
    console.error(err);
    res.status(500).send('Failed to retrieve PDF');
  }
});

export default router;
