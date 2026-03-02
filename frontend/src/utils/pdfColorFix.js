/**
 * pdfColorFix.js
 * 
 * Tailwind v4 uses oklch() color values which html2canvas cannot parse.
 * This utility injects a <style> block into the cloned document that maps
 * Tailwind utility classes → their exact hex equivalents.
 * 
 * Usage: pass as html2canvas `onclone` callback.
 *   html2canvas: { onclone: injectPdfColorFix }
 */

const TAILWIND_HEX = `
  /* Slate */
  .text-slate-50  { color: #f8fafc !important; }
  .text-slate-100 { color: #f1f5f9 !important; }
  .text-slate-200 { color: #e2e8f0 !important; }
  .text-slate-300 { color: #cbd5e1 !important; }
  .text-slate-400 { color: #94a3b8 !important; }
  .text-slate-500 { color: #64748b !important; }
  .text-slate-600 { color: #475569 !important; }
  .text-slate-700 { color: #334155 !important; }
  .text-slate-800 { color: #1e293b !important; }
  .text-slate-900 { color: #0f172a !important; }

  .bg-slate-50  { background-color: #f8fafc !important; }
  .bg-slate-100 { background-color: #f1f5f9 !important; }
  .bg-slate-200 { background-color: #e2e8f0 !important; }
  .bg-slate-300 { background-color: #cbd5e1 !important; }
  .bg-slate-400 { background-color: #94a3b8 !important; }
  .bg-slate-500 { background-color: #64748b !important; }
  .bg-slate-700 { background-color: #334155 !important; }
  .bg-slate-800 { background-color: #1e293b !important; }
  .bg-slate-900 { background-color: #0f172a !important; }

  .border-slate-50  { border-color: #f8fafc !important; }
  .border-slate-100 { border-color: #f1f5f9 !important; }
  .border-slate-200 { border-color: #e2e8f0 !important; }
  .border-slate-300 { border-color: #cbd5e1 !important; }

  /* Indigo */
  .text-indigo-50  { color: #eef2ff !important; }
  .text-indigo-100 { color: #e0e7ff !important; }
  .text-indigo-300 { color: #a5b4fc !important; }
  .text-indigo-500 { color: #6366f1 !important; }
  .text-indigo-600 { color: #4f46e5 !important; }
  .text-indigo-700 { color: #4338ca !important; }
  .text-indigo-900 { color: #312e81 !important; }

  .bg-indigo-50  { background-color: #eef2ff !important; }
  .bg-indigo-100 { background-color: #e0e7ff !important; }
  .bg-indigo-600 { background-color: #4f46e5 !important; }
  .bg-indigo-700 { background-color: #4338ca !important; }
  .bg-indigo-900 { background-color: #312e81 !important; }

  .border-indigo-100 { border-color: #e0e7ff !important; }
  .border-indigo-200 { border-color: #c7d2fe !important; }

  /* White / Black */
  .text-white  { color: #ffffff !important; }
  .text-black  { color: #000000 !important; }
  .bg-white    { background-color: #ffffff !important; }
  .bg-black    { background-color: #000000 !important; }

  /* Red */
  .text-red-400 { color: #f87171 !important; }
  .text-red-500 { color: #ef4444 !important; }
  .text-red-600 { color: #dc2626 !important; }
  .text-red-700 { color: #b91c1c !important; }
  .bg-red-50    { background-color: #fef2f2 !important; }
  .bg-red-100   { background-color: #fee2e2 !important; }

  /* Green */
  .text-green-600 { color: #16a34a !important; }
  .text-green-700 { color: #15803d !important; }
  .bg-green-50    { background-color: #f0fdf4 !important; }
  .bg-green-100   { background-color: #dcfce7 !important; }

  /* Amber / Yellow */
  .text-amber-600 { color: #d97706 !important; }
  .text-amber-700 { color: #b45309 !important; }
  .bg-amber-50    { background-color: #fffbeb !important; }

  /* Dividers and shadows */
  .divide-slate-100 > * + * { border-color: #f1f5f9 !important; }
  .divide-y > * + *          { border-color: #f1f5f9 !important; }
`;

/**
 * onclone callback for html2canvas.
 * Injects a stylesheet that replaces oklch-based Tailwind colors with hex.
 */
export function injectPdfColorFix(clonedDoc) {
    const style = clonedDoc.createElement('style');
    style.id = 'pdf-color-fix';
    style.textContent = TAILWIND_HEX;
    clonedDoc.head.appendChild(style);
}
