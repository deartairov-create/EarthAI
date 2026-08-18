import type { Metadata } from "next";
import "./globals.css";
export const metadata:Metadata={title:"AI Yer — Haqiqiy 3D",description:"100 mustaqil AI agent yashaydigan shaxsiy 3D dunyo"};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="uz"><body>{children}</body></html>;}
