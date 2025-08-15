export const metadata = {
  title: "Inside My Head — Portfolio",
  description: "Dive inside my mind. Pick a lobe to explore the work.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
