'use client'

/**
 * Utility to print only the specified element (e.g. invoice sheet) cleanly
 * into an isolated print iframe, ensuring zero interference from the application shell,
 * sidebars, navigation bars, and dark mode themes.
 */
export function printInvoiceDocument(elementId: string, invoiceNumber?: string) {
  const element = document.getElementById(elementId)
  if (!element) {
    window.print()
    return
  }

  // Remove previous print iframe if it exists
  const prev = document.getElementById('fatoora-print-iframe')
  if (prev) {
    prev.remove()
  }

  const iframe = document.createElement('iframe')
  iframe.id = 'fatoora-print-iframe'
  iframe.style.position = 'fixed'
  iframe.style.top = '-9999px'
  iframe.style.left = '-9999px'
  iframe.style.width = '0px'
  iframe.style.height = '0px'
  iframe.style.border = 'none'

  document.body.appendChild(iframe)

  const doc = iframe.contentDocument || iframe.contentWindow?.document
  if (!doc) {
    window.print()
    return
  }

  // Collect all stylesheets and Tailwind links from the active page
  const headElements = Array.from(
    document.querySelectorAll('link[rel="stylesheet"], style')
  )
    .map((el) => el.outerHTML)
    .join('\n')

  const title = invoiceNumber ? `Facture_${invoiceNumber}` : 'Facture'

  doc.open()
  doc.write(`
    <!DOCTYPE html>
    <html lang="fr" class="light">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>${title}</title>
        ${headElements}
        <style>
          @page {
            size: A4 portrait;
            margin: 10mm 12mm;
          }
          *, *::before, *::after {
            box-sizing: border-box;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
          }
          html, body {
            background-color: #ffffff !important;
            color: #18181b !important;
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
          }
          #invoice-document {
            border: none !important;
            box-shadow: none !important;
            padding: 0 !important;
            margin: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            background: #ffffff !important;
          }
        </style>
      </head>
      <body class="bg-white text-zinc-900">
        <div style="width: 100%; max-width: 100%; margin: 0 auto; background: #ffffff;">
          ${element.outerHTML}
        </div>
      </body>
    </html>
  `)
  doc.close()

  // Wait for images & styles to render before triggering print
  setTimeout(() => {
    try {
      iframe.contentWindow?.focus()
      iframe.contentWindow?.print()
    } catch (err) {
      console.error('Error invoking iframe print:', err)
      window.print()
    }
  }, 350)
}
