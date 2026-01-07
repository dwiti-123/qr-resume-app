import React, { useState, type ChangeEvent, type MouseEvent } from 'react';
import { Download, Copy, Check, AlertCircle } from 'lucide-react';

interface QRData {
  qrCode: string;
  resumeUrl: string;
  profileLink: string;
}

interface UploadResponse {
  success: boolean;
  uniqueId?: string;
  resumeUrl?: string;
  qrCode?: string;
  profileLink?: string;
  error?: string;
}

const App: React.FC = () => {
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [profileLink, setProfileLink] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [qrData, setQrData] = useState<QRData | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const API_URL = 'https://qr-resume-app.onrender.com';

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>): void => {
    const file = e.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      setPdfFile(file);
      setError('');
    } else {
      setError('Please upload a PDF file only');
      setPdfFile(null);
    }
  };

  const handleGenerateQR = async (): Promise<void> => {
    if (!pdfFile) {
      setError('Please select a PDF file');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('pdf', pdfFile);
      formData.append('profileLink', profileLink);

      const response = await fetch(`${API_URL}/api/upload`, {
        method: 'POST',
        body: formData
      });

      const data: UploadResponse = await response.json();

      if (data.success && data.qrCode && data.resumeUrl) {
        setQrData({
          qrCode: data.qrCode,
          resumeUrl: data.resumeUrl,
          profileLink: data.profileLink || ''
        });
        setPdfFile(null);
        setProfileLink('');
      } else {
        setError(data.error || 'Failed to generate QR code');
      }
    } catch (err) {
      setError('Connection error. Make sure backend is running on port 5000');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadQR = (e: MouseEvent<HTMLButtonElement>): void => {
    e.preventDefault();
    if (!qrData) return;

    const link = document.createElement('a');
    link.href = qrData.qrCode;
    link.download = 'resume-qr-code.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCopyLink = async (e: MouseEvent<HTMLButtonElement>): Promise<void> => {
    e.preventDefault();
    if (!qrData) return;

    try {
      await navigator.clipboard.writeText(qrData.resumeUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      setError('Failed to copy link');
    }
  };

  const handleGenerateAnother = (e: MouseEvent<HTMLButtonElement>): void => {
    e.preventDefault();
    setQrData(null);
    setPdfFile(null);
    setProfileLink('');
  };

  return (
    <div className="w-screen h-screen bg-linear-to-br from-blue-50 to-indigo-100 p-4 sm:p-6 md:p-8 overflow-hidden flex flex-col">
      <div className="flex-1 flex flex-col justify-center">
        <div className="w-full max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-800 mb-1 sm:mb-2">
              Resume QR Generator
            </h1>
            <p className="text-xs sm:text-sm md:text-base text-gray-600">
              Generate a QR code for your resume and share it instantly
            </p>
          </div>

          {/* Main Container */}
          <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6 md:p-8">
            {!qrData ? (
              // Upload Form - Compact Layout
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                {/* Left Side - Form */}
                <div className="space-y-4 sm:space-y-5 flex flex-col justify-center">
                  {/* Error Message */}
                  {error && (
                    <div className="flex items-start gap-2 p-3 sm:p-4 bg-red-50 border border-red-200 rounded-lg">
                      <AlertCircle className="text-red-600 shrink-0 mt-0.5" size={18} />
                      <p className="text-red-700 text-xs sm:text-sm">{error}</p>
                    </div>
                  )}

                  {/* PDF Upload */}
                  <div>
                    <label htmlFor="pdf-upload" className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2">
                      Upload Resume (PDF)
                    </label>
                    <div className="relative">
                      <input
                        id="pdf-upload"
                        type="file"
                        accept=".pdf"
                        onChange={handleFileChange}
                        title="Select a PDF file to upload"
                        aria-label="Upload PDF resume file"
                        className="block w-full text-xs sm:text-sm text-gray-600 file:mr-2 sm:file:mr-4 file:py-1 sm:file:py-2 file:px-2 sm:file:px-4 file:rounded file:border-0 file:text-xs sm:file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer border border-gray-300 rounded-lg p-2 sm:p-3"
                      />
                    </div>
                    {pdfFile && (
                      <p className="mt-1 text-xs sm:text-sm text-green-600">✓ {pdfFile.name.substring(0, 20)}...</p>
                    )}
                  </div>

                  {/* Profile Link */}
                  <div>
                    <label htmlFor="profile-link" className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2">
                      Profile Link (Optional)
                    </label>
                    <input
                      id="profile-link"
                      type="url"
                      placeholder="https://linkedin.com/in/yourprofile"
                      value={profileLink}
                      onChange={(e: ChangeEvent<HTMLInputElement>) => setProfileLink(e.target.value)}
                      title="Enter your LinkedIn or portfolio URL"
                      aria-label="Profile Link URL"
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-xs sm:text-sm"
                    />
                    <p className="mt-1 text-xs text-gray-500">Add your LinkedIn or portfolio link</p>
                  </div>

                  {/* Generate Button */}
                  <button
                    onClick={handleGenerateQR}
                    disabled={loading}
                    title="Generate a QR code for your resume"
                    aria-label="Generate QR code button"
                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-2 sm:py-3 px-4 rounded-lg transition duration-200 flex items-center justify-center gap-2 text-sm sm:text-base"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin h-4 w-4 sm:h-5 sm:w-5 border-2 border-white border-t-transparent rounded-full"></div>
                        Generating...
                      </>
                    ) : (
                      'Generate QR Code'
                    )}
                  </button>
                </div>

                {/* Right Side - Info */}
                <div className="hidden md:block">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 sm:p-6 h-full flex flex-col justify-center">
                    <h3 className="font-semibold text-gray-800 mb-3 text-sm sm:text-base">ℹ️ How it works:</h3>
                    <ul className="space-y-2 text-xs sm:text-sm text-gray-700 list-disc list-inside">
                      <li>Upload your PDF resume</li>
                      <li>Optionally add your profile link</li>
                      <li>Generate a unique QR code</li>
                      <li>Share with recruiters</li>
                      <li>Anyone can scan and view</li>
                    </ul>
                  </div>
                </div>
              </div>
            ) : (
              // QR Code Display - Compact Layout
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 items-center">
                {/* QR Code Display */}
                <div className="flex flex-col items-center justify-center">
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-3 sm:mb-4 text-center">
                    Your QR Code
                  </h2>
                  <div className="bg-gray-100 p-3 sm:p-4 rounded-lg">
                    <img
                      src={qrData.qrCode}
                      alt="Resume QR Code"
                      className="w-40 h-40 sm:w-48 sm:h-48 md:w-56 md:h-56"
                    />
                  </div>
                </div>

                {/* Details and Actions */}
                <div className="space-y-3 sm:space-y-4">
                  {/* Resume URL */}
                  <div>
                    <label htmlFor="resume-url" className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1 sm:mb-2">
                      Resume URL
                    </label>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <input
                        id="resume-url"
                        type="text"
                        value={qrData.resumeUrl}
                        readOnly
                        title="Your shareable resume URL"
                        placeholder="Resume URL"
                        aria-label="Resume URL"
                        className="flex-1 px-3 sm:px-4 py-2 sm:py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-600 text-xs sm:text-sm overflow-x-auto"
                      />
                      <button
                        onClick={handleCopyLink}
                        title={copied ? "Copied to clipboard" : "Copy URL to clipboard"}
                        aria-label={copied ? "Copied to clipboard" : "Copy URL to clipboard"}
                        className="flex items-center justify-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 sm:py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition duration-200 text-xs sm:text-sm whitespace-nowrap"
                      >
                        {copied ? (
                          <>
                            <Check size={16} />
                            <span className="hidden sm:inline">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy size={16} />
                            <span className="hidden sm:inline">Copy</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Profile Link Display */}
                  {qrData.profileLink && (
                    <div>
                      <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1 sm:mb-2">
                        Profile Link
                      </label>
                      <a
                        href={qrData.profileLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 underline text-xs sm:text-sm truncate"
                      >
                        {qrData.profileLink}
                      </a>
                    </div>
                  )}

                  {/* Download Button */}
                  <button
                    onClick={handleDownloadQR}
                    title="Download the QR code image"
                    aria-label="Download QR code"
                    className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold py-2 sm:py-3 px-4 rounded-lg transition duration-200 text-sm sm:text-base"
                  >
                    <Download size={18} />
                    Download QR Code
                  </button>

                  {/* Generate New */}
                  <button
                    onClick={handleGenerateAnother}
                    title="Generate another QR code"
                    aria-label="Generate another QR code"
                    className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 sm:py-3 px-4 rounded-lg transition duration-200 text-sm sm:text-base"
                  >
                    Generate Another
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Info Section */}
      <div className="md:hidden mt-4 text-center">
        <p className="text-xs text-gray-600">Upload PDF • Add profile link • Generate QR • Share with recruiters</p>
      </div>
    </div>
  );
};

export default App;