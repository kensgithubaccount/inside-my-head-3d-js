export const metadata = {
  title: "Inside My Head — Portfolio",
  description:
    "Dive inside my mind. Pick a lobe to explore the work: Amtrak, Parietal lobe, Nestlé Waters, Call of Duty MW3.",
  openGraph: {
    title: "Inside My Head — Portfolio",
    description:
      "Dive inside my mind. Pick a lobe to explore the work.",
    images: ["/og-hero.jpg"], // optional if you have one
  },
};

import "./globals.css";

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
