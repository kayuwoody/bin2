/**
 * Standalone layout for seamless payment return page
 * Prevents CartProvider inheritance to avoid sync loops
 */
export default function SeamlessReturnLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
