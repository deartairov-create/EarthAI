import type { Metadata } from "next";
import "./globals.css";
export const metadata:Metadata={title:"AI Earth Ultra",description:"Private autonomous AI society simulator"};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}</body></html>;}
