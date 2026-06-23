"use client";

import React, { useRef, useState } from "react";
import { FileText, UploadCloud, X, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface FileUploadProps {
  onFileSelect: (file: File | null) => void;
  selectedFile: File | null;
  allowedExtensions?: string[]; // e.g. ['.docx', '.pdf']
}

export default function FileUpload({
  onFileSelect,
  selectedFile,
  allowedExtensions = [".docx", ".pdf"],
}: FileUploadProps) {
  const [isDragActive, setIsDragActive] = useState(false);
  const [error, setError] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): boolean => {
    setError("");
    const fileName = file.name.toLowerCase();
    const isAllowed = allowedExtensions.some((ext) => fileName.endsWith(ext));

    if (!isAllowed) {
      setError(`Invalid file type. Only ${allowedExtensions.join(" or ")} files are supported.`);
      return false;
    }

    // Limit to 10MB
    if (file.size > 10 * 1024 * 1024) {
      setError("File size exceeds 10MB limit.");
      return false;
    }

    return true;
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (validateFile(file)) {
        onFileSelect(file);
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (validateFile(file)) {
        onFileSelect(file);
      }
    }
  };

  const onButtonClick = () => {
    fileInputRef.current?.click();
  };

  const removeFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    onFileSelect(null);
    setError("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const isPdf = selectedFile?.name.toLowerCase().endsWith(".pdf");

  return (
    <div className="w-full">
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept={allowedExtensions.join(",")}
        onChange={handleChange}
      />

      <div
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={onButtonClick}
        className={`relative flex flex-col items-center justify-center w-full min-h-[160px] p-6 border-2 border-dashed rounded-xl cursor-pointer transition-all duration-300 ${
          isDragActive
            ? "border-accent bg-accent/5 scale-[1.01]"
            : "border-border-custom bg-card/40 hover:bg-card/70 hover:border-accent/50"
        }`}
      >
        <AnimatePresence mode="wait">
          {!selectedFile ? (
            <motion.div
              key="upload-prompt"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex flex-col items-center justify-center text-center space-y-2"
            >
              <div className="p-3 bg-accent/10 text-accent rounded-full mb-1">
                <UploadCloud className="w-6 h-6" />
              </div>
              <p className="text-sm font-medium text-text">
                Drag & drop your report or{" "}
                <span className="text-accent underline decoration-2 underline-offset-2 font-semibold">
                  browse files
                </span>
              </p>
              <p className="text-xs text-text-muted">
                Supports {allowedExtensions.join(" / ").toUpperCase()} up to 10MB
              </p>
            </motion.div>
          ) : (
            <motion.div
              key="file-preview"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex items-center justify-between w-full p-4 bg-card border border-border-custom rounded-lg shadow-sm"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center space-x-3 overflow-hidden">
                <div
                  className={`p-2.5 rounded-lg shrink-0 ${
                    isPdf ? "bg-rose-500/10 text-rose-500" : "bg-blue-500/10 text-blue-500"
                  }`}
                >
                  <FileText className="w-6 h-6" />
                </div>
                <div className="text-left overflow-hidden">
                  <p className="text-sm font-semibold text-text truncate max-w-[200px] md:max-w-[350px]">
                    {selectedFile.name}
                  </p>
                  <p className="text-xs text-text-muted">
                    {(selectedFile.size / 1024).toFixed(1)} KB
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={removeFile}
                className="p-1 text-text-muted hover:text-rose-500 hover:bg-rose-500/10 rounded-full transition-colors duration-200"
                aria-label="Remove file"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="flex items-center space-x-2 mt-2 text-rose-500 text-xs font-medium"
          >
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
