import type { Metadata } from "next";
import "./globals.css";
import VisualEditsMessenger from "../visual-edits/VisualEditsMessenger";
import ErrorReporter from "@/components/ErrorReporter";
import Script from "next/script";

export const metadata: Metadata = {
  title: "WeatherLux",
  description: "Professional weather dashboard with real-time forecasts and beautiful design",
  icons: {
    icon: "https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/project-uploads/0349498c-0edd-46e1-8fb0-e3c313de8790/generated_images/weather-app-favicon-icon%2c-minimalist-d-dddbf640-20250904005152.jpg",
    shortcut: "https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/project-uploads/0349498c-0edd-46e1-8fb0-e3c313de8790/generated_images/weather-app-favicon-icon%2c-minimalist-d-dddbf640-20250904005152.jpg",
    apple: "https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/project-uploads/0349498c-0edd-46e1-8fb0-e3c313de8790/generated_images/weather-app-favicon-icon%2c-minimalist-d-dddbf640-20250904005152.jpg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <ErrorReporter />
        <Script
          src="https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/scripts//route-messenger.js"
          strategy="afterInteractive"
          data-target-origin="*"
          data-message-type="ROUTE_CHANGE"
          data-include-search-params="true"
          data-only-in-iframe="true"
          data-debug="true"
          data-custom-data='{"appName": "YourApp", "version": "1.0.0", "greeting": "hi"}'
        />
        {children}
        <VisualEditsMessenger />
      </body>
    </html>
  );
}