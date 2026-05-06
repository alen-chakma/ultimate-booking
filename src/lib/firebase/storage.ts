import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
  StorageReference,
} from "firebase/storage";
import { getClientFirebase } from "./client";

const THUMB_SIZE = 300;
const FULL_SIZE = 1200;

function getStorage() {
  return getClientFirebase().storage;
}

export async function uploadImage(
  path: string,
  file: File
): Promise<{ fullUrl: string; thumbUrl: string }> {
  const storage = getStorage();

  const fullRef = ref(storage, `${path}/full_${Date.now()}_${file.name}`);
  const thumbRef = ref(storage, `${path}/thumb_${Date.now()}_${file.name}`);

  // Resize to two sizes using canvas
  const [fullBlob, thumbBlob] = await Promise.all([
    resizeImage(file, FULL_SIZE),
    resizeImage(file, THUMB_SIZE),
  ]);

  await Promise.all([
    uploadBytes(fullRef, fullBlob, { contentType: "image/webp" }),
    uploadBytes(thumbRef, thumbBlob, { contentType: "image/webp" }),
  ]);

  const [fullUrl, thumbUrl] = await Promise.all([
    getDownloadURL(fullRef),
    getDownloadURL(thumbRef),
  ]);

  return { fullUrl, thumbUrl };
}

async function resizeImage(file: File, maxSize: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const canvas = document.createElement("canvas");
      const scale = Math.min(maxSize / img.width, maxSize / img.height, 1);
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error("Canvas toBlob failed"))),
        "image/webp",
        0.85
      );
    };
    img.onerror = reject;
    img.src = url;
  });
}

export async function uploadTenantLogo(
  tenantId: string,
  file: File
): Promise<{ fullUrl: string; thumbUrl: string }> {
  return uploadImage(`tenants/${tenantId}/logo`, file);
}

export async function uploadTenantBanner(
  tenantId: string,
  file: File
): Promise<{ fullUrl: string; thumbUrl: string }> {
  return uploadImage(`tenants/${tenantId}/banner`, file);
}

export async function uploadResourceImage(
  tenantId: string,
  resourceId: string,
  file: File
): Promise<{ fullUrl: string; thumbUrl: string }> {
  return uploadImage(`tenants/${tenantId}/resources/${resourceId}`, file);
}

export async function uploadInventoryImage(
  tenantId: string,
  inventoryId: string,
  file: File
): Promise<{ fullUrl: string; thumbUrl: string }> {
  return uploadImage(`tenants/${tenantId}/inventories/${inventoryId}`, file);
}

export async function uploadUserAvatar(
  userId: string,
  file: File
): Promise<{ fullUrl: string; thumbUrl: string }> {
  return uploadImage(`users/${userId}/avatar`, file);
}

export async function deleteStorageFile(url: string): Promise<void> {
  const storage = getStorage();
  const fileRef = ref(storage, url);
  await deleteObject(fileRef);
}

export async function uploadBookingNote(
  bookingId: string,
  content: string
): Promise<string> {
  const storage = getStorage();
  const logRef = ref(storage, `bookings/${bookingId}/notes/${Date.now()}.txt`);
  const blob = new Blob([content], { type: "text/plain" });
  await uploadBytes(logRef, blob);
  return getDownloadURL(logRef);
}
