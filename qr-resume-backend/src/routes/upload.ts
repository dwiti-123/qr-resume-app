import { Router, Request, Response } from 'express';
import multer from 'multer';
import QRCode from 'qrcode';
import { v4 as uuidv4 } from 'uuid';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
);

// In-memory map of uniqueId -> filename
const pdfMap: Record<string, string> = {};

router.post('/', upload.single('pdf'), async (req: Request, res: Response) => {
  try {
    const pdfFile = req.file;
    const profileLink = req.body.profileLink || '';

    if (!pdfFile) return res.json({ success: false, error: 'No PDF uploaded' });

    const uniqueId = uuidv4();
    const filename = `${uniqueId}-${pdfFile.originalname}`;

    // Upload PDF to Supabase bucket
    const { error: uploadError } = await supabase.storage
      .from(process.env.BUCKET_NAME!)
      .upload(filename, pdfFile.buffer, { contentType: 'application/pdf' });

    if (uploadError) throw uploadError;

    // Save mapping for view API
    pdfMap[uniqueId] = filename;

    // Generate QR code pointing to /api/view/:id
    const viewUrl = `${process.env.BASE_URL}/api/view/${uniqueId}`;
    const qrCodeDataUrl = await QRCode.toDataURL(viewUrl);

    res.json({
      success: true,
      uniqueId,
      resumeUrl: viewUrl,
      qrCode: qrCodeDataUrl,
      profileLink,
    });
  } catch (err) {
    console.error(err);
    res.json({ success: false, error: 'Failed to upload PDF' });
  }
});

export default router;
