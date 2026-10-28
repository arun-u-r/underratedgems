"use client";

import Image from "next/image";
import { useState, type DragEvent } from "react";
import { ArrowDown, ArrowUp, ImagePlus, LoaderCircle, Trash2 } from "lucide-react";
import type { ProductInput } from "@/lib/validation";

type ProductImage = ProductInput["images"][number];

type UploadSignature = {
  cloudName: string;
  apiKey: string;
  timestamp: number;
  folder: string;
  signature: string;
  uploadUrl: string;
};

type CloudinaryUpload = {
  secure_url: string;
  public_id: string;
  original_filename?: string;
};

export function AdminImageManager({
  images,
  onChange,
  onRemovedPublicIds,
}: {
  images: ProductImage[];
  onChange: (images: ProductImage[]) => void;
  onRemovedPublicIds: (publicIds: string[]) => void;
}) {
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  async function upload(files: FileList | null) {
    if (!files?.length) return;
    setError("");

    for (const file of Array.from(files)) {
      if (!file.type.startsWith("image/") || file.size > 10 * 1024 * 1024) {
        setError("Choose an image file no larger than 10 MB.");
        continue;
      }

      try {
        const signedResponse = await fetch("/api/admin/upload/sign", {
          method: "POST",
        });
        const signed = (await signedResponse.json()) as UploadSignature & {
          error?: string;
        };
        if (!signedResponse.ok) {
          throw new Error(signed.error ?? "Unable to prepare image upload.");
        }

        const formData = new FormData();
        formData.append("file", file);
        formData.append("api_key", signed.apiKey);
        formData.append("timestamp", String(signed.timestamp));
        formData.append("folder", signed.folder);
        formData.append("signature", signed.signature);

        const result = await new Promise<CloudinaryUpload>((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.open("POST", signed.uploadUrl);
          xhr.upload.addEventListener("progress", (event) => {
            if (event.lengthComputable) {
              setProgress(Math.round((event.loaded / event.total) * 100));
            }
          });
          xhr.addEventListener("load", () => {
            const response = JSON.parse(xhr.responseText) as
              | CloudinaryUpload
              | { error?: { message?: string } };
            if (xhr.status < 200 || xhr.status >= 300 || !("secure_url" in response)) {
              reject(
                new Error(
                  "error" in response
                    ? response.error?.message ?? "Cloudinary upload failed."
                    : "Cloudinary upload failed.",
                ),
              );
              return;
            }
            resolve(response);
          });
          xhr.addEventListener("error", () => reject(new Error("Image upload failed.")));
          xhr.addEventListener("abort", () => reject(new Error("Image upload was cancelled.")));
          xhr.send(formData);
        });
        onChange([
          ...images,
          {
            url: result.secure_url,
            publicId: result.public_id,
            alt: result.original_filename ?? file.name.replace(/\.[^.]+$/, ""),
            order: images.length,
          },
        ]);
        setProgress(null);
      } catch (reason) {
        setProgress(null);
        setError(reason instanceof Error ? reason.message : "Image upload failed.");
      }
    }
  }

  function reorder(from: number, to: number) {
    if (from === to || to < 0 || to >= images.length) return;
    const reordered = [...images];
    const [image] = reordered.splice(from, 1);
    reordered.splice(to, 0, image);
    onChange(reordered.map((item, index) => ({ ...item, order: index })));
  }

  function drop(event: DragEvent<HTMLDivElement>, index: number) {
    event.preventDefault();
    if (dragIndex !== null) reorder(dragIndex, index);
    setDragIndex(null);
  }

  return (
    <section className="admin-image-manager">
      <div className="admin-subsection-heading">
        <div>
          <h3>Product images</h3>
          <p>Use images you are authorized to publish. Images upload to Cloudinary.</p>
        </div>
        <label className="admin-upload-button">
          <ImagePlus size={16} aria-hidden="true" />
          {progress === null ? "Upload images" : `${progress}%`}
          <input
            accept="image/*"
            disabled={progress !== null}
            multiple
            onChange={(event) => {
              void upload(event.target.files);
              event.target.value = "";
            }}
            type="file"
          />
        </label>
      </div>
      {progress !== null && (
        <div className="upload-progress" aria-live="polite">
          <LoaderCircle size={16} aria-hidden="true" />
          Uploading image: {progress}%
        </div>
      )}
      {error && <p className="admin-form-error">{error}</p>}
      {images.length ? (
        <div className="admin-image-grid">
          {images.map((image, index) => (
            <div
              className={`admin-image-item ${dragIndex === index ? "is-dragging" : ""}`}
              draggable
              key={image.publicId ?? image.url}
              onDragOver={(event) => event.preventDefault()}
              onDragStart={() => setDragIndex(index)}
              onDrop={(event) => drop(event, index)}
            >
              <div className="admin-image-preview">
                <Image
                  alt={image.alt}
                  fill
                  sizes="(max-width: 600px) 44vw, 180px"
                  src={image.url}
                />
                {index === 0 && <span className="primary-image-badge">Primary</span>}
              </div>
              <label>
                <span className="sr-only">Alt text for image {index + 1}</span>
                <input
                  maxLength={250}
                  onChange={(event) =>
                    onChange(
                      images.map((item, itemIndex) =>
                        itemIndex === index
                          ? { ...item, alt: event.target.value }
                          : item,
                      ),
                    )
                  }
                  value={image.alt}
                />
              </label>
              <div className="admin-image-actions">
                <button
                  aria-label={`Move image ${index + 1} up`}
                  disabled={index === 0}
                  onClick={() => reorder(index, index - 1)}
                  type="button"
                >
                  <ArrowUp size={15} aria-hidden="true" />
                </button>
                <button
                  aria-label={`Move image ${index + 1} down`}
                  disabled={index === images.length - 1}
                  onClick={() => reorder(index, index + 1)}
                  type="button"
                >
                  <ArrowDown size={15} aria-hidden="true" />
                </button>
                <button
                  aria-label={`Remove image ${index + 1}`}
                  onClick={() => {
                    if (
                      image.publicId &&
                      !window.confirm("Remove this image from the product?")
                    ) {
                      return;
                    }
                    if (image.publicId) {
                      onRemovedPublicIds([image.publicId]);
                    }
                    onChange(
                      images
                        .filter((_, itemIndex) => itemIndex !== index)
                        .map((item, itemIndex) => ({ ...item, order: itemIndex })),
                    );
                  }}
                  type="button"
                >
                  <Trash2 size={15} aria-hidden="true" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="admin-muted">No images yet. Add authorized images before publishing.</p>
      )}
    </section>
  );
}
