/**
 * Dynamically loads the html2pdf.js library on demand.
 */
export function loadHtml2Pdf(): Promise<any> {
  if ((window as any).html2pdf) {
    return Promise.resolve((window as any).html2pdf);
  }

  return new Promise((resolve, reject) => {
    // Check if the script is already in the document head
    const existingScript = document.querySelector('script[src*="html2pdf.bundle.min.js"]');
    if (existingScript) {
      // Wait for existing script to load if it's there but not initialized yet
      let attempts = 0;
      const interval = setInterval(() => {
        if ((window as any).html2pdf) {
          clearInterval(interval);
          resolve((window as any).html2pdf);
        } else {
          attempts++;
          if (attempts > 50) { // 5 seconds timeout
            clearInterval(interval);
            reject(new Error('Timeout waiting for html2pdf to initialize.'));
          }
        }
      }, 100);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
    script.crossOrigin = 'anonymous';
    script.referrerPolicy = 'no-referrer';
    
    script.onload = () => {
      if ((window as any).html2pdf) {
        resolve((window as any).html2pdf);
      } else {
        reject(new Error('html2pdf was not defined on the window object after script loaded.'));
      }
    };
    
    script.onerror = (err) => {
      reject(new Error('Failed to load the PDF generation script. Please check your internet connection or use browser print.'));
    };

    document.head.appendChild(script);
  });
}
