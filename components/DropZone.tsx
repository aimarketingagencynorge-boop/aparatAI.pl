
import React, { useState } from 'react';

interface DropZoneProps {
  onUpload: (file: File) => void;
  disabled?: boolean;
}

const DropZone: React.FC<DropZoneProps> = ({ onUpload, disabled }) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (disabled) return;
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (disabled) return;
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      onUpload(files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled) return;
    const files = e.target.files;
    if (files && files.length > 0) {
      onUpload(files[0]);
    }
  };

  return (
    <div 
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`relative w-full h-full rounded-full transition-all duration-500 flex flex-col items-center justify-center p-8 md:p-12 group ${
        isDragging ? 'bg-blue-600/10' : 'bg-transparent'
      } ${disabled ? 'cursor-not-allowed opacity-30' : 'cursor-pointer'}`}
    >
      {!disabled && (
        <input 
          type="file" 
          className="absolute inset-0 opacity-0 cursor-pointer z-10" 
          onChange={handleFileInput}
          disabled={disabled}
          accept="image/*"
        />
      )}
      
      <div className="mb-6 md:mb-8 p-6 md:p-10 rounded-full bg-blue-500/5 border border-blue-500/10 group-hover:scale-110 group-hover:bg-blue-600/10 group-hover:border-blue-500 transition-all duration-500 shadow-[0_0_30px_rgba(37,99,235,0.1)]">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 md:h-16 md:h-16 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 4v16m8-8H4" />
        </svg>
      </div>
      
      <h3 className="text-2xl md:text-3xl font-black italic text-white tracking-tighter mb-4 uppercase italic">INITIATE CORE</h3>
      <p className="text-blue-400/60 text-[9px] md:text-[11px] mono text-center max-w-[200px] leading-relaxed uppercase tracking-widest font-bold">
        WGRAJ PRODUKT DLA <br/><span className="text-blue-500">APARAT AI</span> SYNTEZY 8K
      </p>
      
      <div className="mt-6 md:mt-8 flex gap-4 opacity-30">
        <span className="text-[9px] md:text-[10px] mono text-blue-500 px-3 py-1 border border-blue-500/20 rounded-full font-bold">RAW_DATA</span>
        <span className="text-[9px] md:text-[10px] mono text-blue-500 px-3 py-1 border border-blue-500/20 rounded-full font-bold">8K_READY</span>
      </div>
    </div>
  );
};

export default DropZone;
