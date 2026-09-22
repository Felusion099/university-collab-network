const MAX_INPUT_BYTES = 5 * 1024 * 1024; // 5 MB raw file limit
const OUTPUT_SIZE = 256; // square output — resized client-side so the
// persisted data URI stays small enough for the avatarUrl column
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

/** Read an image file, validate type/size, cover-crop to a square and
 * downscale via canvas → JPEG data URL. Throws Error with a user-facing
 * message on invalid input. */
export async function fileToAvatarDataUrl(file: File): Promise<string> {
  if (!ACCEPTED_TYPES.includes(file.type)) {
    throw new Error('Unsupported image type — use JPG, PNG, WebP or GIF.');
  }
  if (file.size > MAX_INPUT_BYTES) {
    throw new Error('Image is too large — pick one under 5 MB.');
  }

  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('Could not read the image file.'));
    reader.readAsDataURL(file);
  });

  const img = new Image();
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error('Could not decode the image.'));
    img.src = dataUrl;
  });

  const canvas = document.createElement('canvas');
  canvas.width = OUTPUT_SIZE;
  canvas.height = OUTPUT_SIZE;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Your browser does not support image processing.');

  // cover-crop to a centered square
  const scale = Math.max(OUTPUT_SIZE / img.width, OUTPUT_SIZE / img.height);
  const w = img.width * scale;
  const h = img.height * scale;
  ctx.drawImage(img, (OUTPUT_SIZE - w) / 2, (OUTPUT_SIZE - h) / 2, w, h);

  return canvas.toDataURL('image/jpeg', 0.85);
}
