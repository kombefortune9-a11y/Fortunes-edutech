import { saveAs } from "file-saver";

/**
 * Downloads a blob directly to device storage with multi-layer fallback.
 */
export function downloadBlobDirect(blob: Blob, fileName: string): boolean {
  try {
    // 1. FileSaver saveAs
    saveAs(blob, fileName);

    // 2. Anchor click fallback with blob URL
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = blobUrl;
    a.download = fileName;
    a.style.display = "none";
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      if (document.body.contains(a)) {
        document.body.removeChild(a);
      }
      setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);
    }, 500);

    return true;
  } catch (err) {
    console.warn("Direct blob download error:", err);
    return false;
  }
}

/**
 * Shares a PDF blob using Web Share API when user gesture is active.
 */
export async function shareFileDirect(
  blob: Blob,
  fileName: string,
  title?: string
): Promise<{ shared: boolean; error?: any }> {
  if (typeof navigator === "undefined" || !navigator.share) {
    return { shared: false, error: new Error("Web Share not supported") };
  }

  const mimeType = blob.type || "application/pdf";
  const file = new File([blob], fileName, { type: mimeType });

  try {
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({
        files: [file],
        title: title || fileName,
        text: `Share or Save ${fileName}`
      });
      return { shared: true };
    }

    // Fallback: share without file attachment
    await navigator.share({
      title: title || fileName,
      text: `Document: ${fileName}`
    });
    return { shared: true };
  } catch (err: any) {
    return { shared: false, error: err };
  }
}

/**
 * General helper to share or save PDF blobs across platforms.
 */
export async function shareOrSavePdfBlob(
  pdfBlob: Blob,
  fileName: string,
  title?: string
): Promise<{ shared: boolean; downloaded: boolean }> {
  const pdfFile = new File([pdfBlob], fileName, { type: "application/pdf" });
  let sharedSuccessfully = false;

  // Try Web Share if allowed
  if (
    typeof navigator !== "undefined" &&
    navigator.canShare &&
    navigator.canShare({ files: [pdfFile] })
  ) {
    try {
      await navigator.share({
        files: [pdfFile],
        title: title || fileName,
        text: `Share or Save ${fileName}`
      });
      sharedSuccessfully = true;
      return { shared: true, downloaded: false };
    } catch (shareErr: any) {
      console.log("Web share not completed or cancelled, proceeding with download:", shareErr);
    }
  }

  // Fallback: Direct Download
  const downloaded = downloadBlobDirect(pdfBlob, fileName);
  return { shared: sharedSuccessfully, downloaded };
}
