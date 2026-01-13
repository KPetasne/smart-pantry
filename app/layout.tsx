import type { Metadata } from "next";
import "./globals.css";
import { SpeedInsights } from "@vercel/speed-insights/next";

export const metadata: Metadata = {
  title: "¿Qué como? - Inspiración de recetas para tu día",
  description: "¿No sabes qué cocinar hoy? Encuentra inspiración con recetas fáciles y deliciosas. Descubre ideas para el desayuno, almuerzo y cena usando ingredientes que tienes en casa.",
  keywords: ["qué cocinar", "ideas de comida", "inspiración recetas", "qué como hoy", "recetas fáciles", "no sé qué cocinar"],
  openGraph: {
    title: "¿Qué como? - Inspiración diaria de recetas",
    description: "¿No sabes qué cocinar? Encuentra la inspiración que necesitas con recetas deliciosas y fáciles de preparar",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <head>
        <meta charSet="utf-8" />
      </head>
      <body>
        {children}
        <SpeedInsights />
      </body>
    </html>
  );
}
