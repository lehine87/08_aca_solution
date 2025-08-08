import { Noto_Sans_KR } from "next/font/google";
import "./globals.css";

const notoSansKr = Noto_Sans_KR({
  variable: "--font-noto-sans-kr",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

export const metadata = {
  title: "학원관리시스템",
  description: "학원 관리를 위한 시스템",
};

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <body
        className={`${notoSansKr.variable} font-sans antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
