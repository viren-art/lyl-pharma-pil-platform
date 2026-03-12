import React, { useState } from 'react';

interface ArtworkUploadProps {
  revisionRoundId: number;
  canUpload: boolean;
  onUploadSuccess: (version: any) => void;
}

export const ArtworkUpload: React.FC<ArtworkUploadProps> = ({
  revisionRoundId,
  canUpload,
  onUploadSuccess,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [notes, setNotes] = useState('');
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type === 'application/pdf') {
        setSelectedFile(file);
      } else {
        alert('Please upload a PDF file');
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    try {
      setUploading(true);
      // Mock API call
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const mockVersion = {
        id: Date.now(),
        versionNumber: 2,
        artworkPath: `s3://bucket/artwork-v2.pdf`,
        status: 'uploaded',
        uploadedBy: 'Current User',
        createdAt: new Date().toISOString(),
        notes,
      };

      onUploadSuccess(mockVersion);
      setSelectedFile(null);
      setNotes('');
    } catch (error) {
      console.error('Upload failed', error);
      alert('Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  if (!canUpload) {
    return (
      <div className="bg-zinc-800/50 rounded-2xl p-8 border border-white/[0.06] text-center">
        <div className="text-zinc-400 text-lg">
          Upload is not available for this revision round
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Upload Area */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={`bg-zinc-800/50 rounded-2xl p-8 border-2 border-dashed transition-all ${
          dragActive
            ? 'border-violet-500 bg-violet-500/10'
            : 'border-white/10 hover:border-white/20'
        }`}
      >
        <div className="text-center">
          <div className="text-6xl mb-4">📄</div>
          <h3 className="text-lg font-bold text-white mb-2">
            {selectedFile ? selectedFile.name : 'Upload Artwork PDF'}
          </h3>
          <p className="text-sm text-zinc-400 mb-4">
            Drag and drop your PDF file here, or click to browse
          </p>
          <input
            type="file"
            accept="application/pdf"
            onChange={handleFileChange}
            className="hidden"
            id="file-upload"
          />
          <label
            htmlFor="file-upload"
            className="inline-block px-6 py-3 bg-violet-600 hover:bg-violet-700 text-white font-semibold rounded-xl cursor-pointer transition-colors"
          >
            Choose File
          </label>
          {selectedFile && (
            <div className="mt-4 text-sm text-zinc-300">
              Size: {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
            </div>
          )}
        </div>
      </div>

      {/* Notes */}
      <div>
        <label className="block text-sm font-semibold text-white mb-2">
          Notes (Optional)
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Add any notes about this version..."
          className="w-full px-4 py-3 bg-zinc-800 border border-white/10 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500"
          rows={4}
        />
      </div>

      {/* Upload Button */}
      <button
        onClick={handleUpload}
        disabled={!selectedFile || uploading}
        className="w-full px-6 py-4 bg-violet-600 hover:bg-violet-700 disabled:bg-zinc-700 disabled:text-zinc-500 text-white font-bold rounded-xl transition-colors"
      >
        {uploading ? 'Uploading...' : 'Upload Artwork'}
      </button>
    </div>
  );
};