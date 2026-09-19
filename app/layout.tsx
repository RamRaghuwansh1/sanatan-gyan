import './globals.css';
import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'Sanatan Gyan', description: 'Sanatan Gyan — Granth, Jiwan Charitra and knowledge platform.' };
export default function RootLayout({children}:{children:React.ReactNode}){return <>{children}</>}
