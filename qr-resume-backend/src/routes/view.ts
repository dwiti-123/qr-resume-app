import { Router, Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const router = Router();

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
);

// In-memory map (demo)
const pdfMap: Record<string, string> = {};

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const filename = pdfMap[id];

    if (!filename) return res.status(404).send('PDF not found');

    // Supabase v2: getPublicUrl() returns only { data: { publicUrl } }
    const { data } = supabase.storage
      .from(process.env.BUCKET_NAME!)
      .getPublicUrl(filename);

    if (!data?.publicUrl) {
      return res.status(500).send('Failed to get public URL');
    }

    // Redirect to PDF
    res.redirect(data.publicUrl);
  } catch (err) {
    console.error(err);
    res.status(500).send('Failed to retrieve PDF');
  }
});

export default router;
