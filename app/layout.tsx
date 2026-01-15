import type { Metadata } from "next";
import { Playfair_Display } from "next/font/google";
import "./globals.css";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Providers } from "./providers";

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "600"],
  variable: "--font-playfair",
});

export const metadata: Metadata = {
  title: "LACENA | ¿Qué como hoy? Inspiración y recetas en tu alacena",
  description: "¿No sabes qué cocinar hoy? Entra en LACENA y encuentra el golpe de inspiración que necesitas. Busca recetas por ingredientes o déjate sorprender por nuestra alacena inteligente. La solución para tu próxima comida está aquí.",
  keywords: ["qué como hoy", "recetas fáciles", "ideas para cenar", "inspiración de recetas", "cocina con lo que tienes", "buscador de recetas por ingredientes", "planificador de comidas", "cocina con sobras", "qué cocinar con lo que hay", "alacena inteligente"],
  openGraph: {
    title: "LACENA | Recetas que salen de tu alacena",
    description: "¿No sabes qué cocinar? Encuentra la inspiración que necesitas con recetas por ingredientes. La solución para tu próxima comida está aquí.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={playfair.variable}>
      <head>
        <meta charSet="utf-8" />
      </head>
      <body>
        <Providers>
          {children}
        </Providers>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
