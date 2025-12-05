/**
 * Standalone layout for modern seamless payment page
 * Prevents CartProvider inheritance to avoid sync loops
 */
export default function ModernSeamlessLayout({
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
