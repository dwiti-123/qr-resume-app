import { Router, Request, Response } from "express";
import multer from "multer";
import QRCode from "qrcode";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
);

router.post("/", upload.single("pdf"), async (req: Request, res: Response) => {
  try {
    const pdfFile = req.file;

    if (!pdfFile) {
      console.error("No PDF uploaded");
      return res.status(400).json({ success: false, error: "No PDF uploaded" });
    }

    // Generate a safe filename: replace spaces with underscores
    const timestamp = Date.now();
    const safeFilename = `${timestamp}-${pdfFile.originalname.replace(/\s+/g, "_")}`;

    console.log("Uploading PDF with filename:", safeFilename);

    // Upload PDF to Supabase bucket
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(process.env.BUCKET_NAME!)
      .upload(safeFilename, pdfFile.buffer, { contentType: "application/pdf" });

    if (uploadError) {
      console.error("Supabase upload error:", uploadError);
      return res
        .status(500)
        .json({ success: false, error: "Failed to upload PDF", details: uploadError });
    }

    // Use `path` (relative to bucket) to generate public URL
    const filePath = uploadData?.path;
    if (!filePath) {
      return res.status(500).json({ success: false, error: "Upload succeeded but path missing" });
    }

    const { data: urlData } = supabase.storage
      .from(process.env.BUCKET_NAME!)
      .getPublicUrl(filePath);

    const publicUrl = urlData?.publicUrl;
    if (!publicUrl) {
      return res.status(500).json({ success: false, error: "Failed to get public URL" });
    }

    console.log("Public URL:", publicUrl);

    // Generate QR code from public URL
    const qrCode = await QRCode.toDataURL(publicUrl);
    console.log("QR code generated successfully");

    res.json({
      success: true,
      resumeUrl: publicUrl,
      qrCode,
    });
  } catch (err) {
    console.error("Unexpected error:", err);
    res.status(500).json({ success: false, error: "Upload failed", details: err });
  }
});

export default router;
