import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const getGoogleDrivePreviewUrl = (url: string | null): string => {
  if (!url) return "";
  if (url.includes("drive.google.com") || url.includes("docs.google.com")) {
    const match = url.match(/\/file\/d\/([^/]+)/) || url.match(/[?&]id=([^&]+)/);
    if (match && match[1]) {
      return `https://drive.google.com/file/d/${match[1]}/preview`;
    }
  }
  return url;
};

export const getGoogleDriveDownloadUrl = (url: string | null): string => {
  if (!url) return "";
  if (url.includes("drive.google.com") || url.includes("docs.google.com")) {
    const match = url.match(/\/file\/d\/([^/]+)/) || url.match(/[?&]id=([^&]+)/);
    if (match && match[1]) {
      return `https://docs.google.com/uc?export=download&id=${match[1]}`;
    }
  }
  return url;
};
