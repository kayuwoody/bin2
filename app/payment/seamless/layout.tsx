import "@/globals.css";

export const metadata = {
  title: "Payment Processing",
  description: "Fiuu Seamless Payment",
};

// Standalone layout without CartProvider to prevent sync loops
export default function SeamlessLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
