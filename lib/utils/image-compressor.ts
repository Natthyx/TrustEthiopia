/**
 * Compress an image file to reduce its size
 * @param file - The image file to compress
 * @param maxSizeInKB - Maximum size in KB (default 500KB)
 * @returns A promise that resolves to the compressed image blob
 */
export async function compressImage(file: File, maxSizeInKB: number = 500): Promise<Blob> {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      // If canvas context is not available, return original file
      resolve(file);
      return;
    }

    const img = new Image();
    img.src = URL.createObjectURL(file);
    
    img.onload = () => {
      // Calculate new dimensions maintaining aspect ratio
      let { width, height } = img;
      const maxSize = maxSizeInKB * 1024; // Convert KB to bytes
      
      // Start with quality 0.8 and adjust if needed
      let quality = 0.8;
      
      // Calculate initial canvas size
      canvas.width = width;
      canvas.height = height;
      
      // Draw white background first to handle transparency
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, width, height);
      
      // Draw the image on canvas
      ctx.drawImage(img, 0, 0, width, height);
      
      // Convert to blob and check size
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            // If blob creation failed, return original file
            resolve(file);
            return;
          }
          
          // If the blob is already smaller than max size, return it
          if (blob.size <= maxSize) {
            URL.revokeObjectURL(img.src); // Clean up
            resolve(blob);
            return;
          }
          
          // If too large, reduce quality and try again
          let currentQuality = quality;
          let currentBlob = blob;
          
          // Iteratively reduce quality until size is acceptable or quality is too low
          const reduceQuality = () => {
            if (currentBlob.size <= maxSize || currentQuality <= 0.1) {
              URL.revokeObjectURL(img.src); // Clean up
              resolve(currentBlob);
              return;
            }
            
            currentQuality -= 0.1;
            canvas.toBlob(
              (newBlob) => {
                if (newBlob) {
                  currentBlob = newBlob;
                }
                reduceQuality();
              },
              'image/jpeg',
              currentQuality
            );
          };
          
          reduceQuality();
        },
        'image/jpeg',
        quality
      );
    };
    
    img.onerror = () => {
      // If image loading fails, return original file
      resolve(file);
    };
  });
}