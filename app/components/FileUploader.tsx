import { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { formatSize } from "../lib/utils";

interface FileUploaderProps {
    onFileSelect?: (file: File | null) => void;
}

const FileUploader = ({ onFileSelect }: FileUploaderProps) => {

    // 📥 When file is dropped/selected
    const onDrop = useCallback((acceptedFiles: File[]) => {
        const file = acceptedFiles[0] || null;

        console.log("📂 Selected File:", file); // ✅ DEBUG

        onFileSelect?.(file);
    }, [onFileSelect]);

    // 📏 Max file size (20MB)
    const maxFileSize = 20 * 1024 * 1024;

    const {
        getRootProps,
        getInputProps,
        isDragActive,
        acceptedFiles
    } = useDropzone({
        onDrop,
        multiple: false,
        accept: { "application/pdf": [".pdf"] },
        maxSize: maxFileSize,
    });

    const file = acceptedFiles[0] || null;

    return (
        <div className="w-full gradient-border">
            <div
                {...getRootProps()}
                className="p-6 text-center cursor-pointer border rounded-xl bg-white hover:bg-gray-50 transition"
            >
                <input {...getInputProps()} />

                <div className="space-y-4">

                    {/* ✅ FILE SELECTED UI */}
                    {file ? (
                        <div
                            className="flex items-center justify-between bg-gray-100 p-4 rounded-lg"
                            onClick={(e) => e.stopPropagation()} // prevent re-open dialog
                        >
                            <div className="flex items-center space-x-3">
                                <img
                                    src="/images/pdf.png"
                                    alt="pdf"
                                    className="w-10 h-10"
                                />

                                <div>
                                    <p className="text-sm font-medium text-gray-700 truncate max-w-xs">
                                        {file.name}
                                    </p>
                                    <p className="text-sm text-gray-500">
                                        {formatSize(file.size)}
                                    </p>
                                </div>
                            </div>

                            {/* ❌ REMOVE BUTTON */}
                            <button
                                className="p-2 hover:bg-red-100 rounded"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    console.log("❌ File removed");
                                    onFileSelect?.(null);
                                }}
                            >
                                <img
                                    src="/icons/cross.svg"
                                    alt="remove"
                                    className="w-4 h-4"
                                />
                            </button>
                        </div>

                    ) : (

                        /* 📤 UPLOAD UI */
                        <div>
                            <div className="mx-auto w-16 h-16 flex items-center justify-center mb-2">
                                <img
                                    src="/icons/info.svg"
                                    alt="upload"
                                    className="w-16 h-16"
                                />
                            </div>

                            <p className="text-lg text-gray-600">
                <span className="font-semibold">
                  {isDragActive ? "Drop here..." : "Click to upload"}
                </span>{" "}
                                or drag and drop
                            </p>

                            <p className="text-sm text-gray-500">
                                PDF only (max {formatSize(maxFileSize)})
                            </p>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
};

export default FileUploader;