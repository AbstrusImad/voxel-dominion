import type { Metadata } from 'next';
import { Chakra_Petch, Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';

const display = Chakra_Petch({
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
});

const body = Inter({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
});

const mono = JetBrains_Mono({
  weight: ['400', '500', '700'],
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL('https://voxel-dominion.pages.dev'),
  title: 'VOXEL DOMINION - a war for territory judged by the World Spirit',
  description:
    'Raise voxel structures on a floating world, let the on-chain World Spirit judge them against the living age, and seize the map. An interactive WebGL strategy game on GenLayer Bradbury Testnet.',
  openGraph: {
    title: 'VOXEL DOMINION',
    description:
      'Raise structures. Let the World Spirit judge them. Seize the map. An on-chain voxel strategy game ruled by AI under validator consensus.',
    type: 'website',
    images: [{ url: '/og.jpg', width: 1200, height: 675, alt: 'A floating voxel island war world' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'VOXEL DOMINION',
    description:
      'Build voxel claims, beat the standing score, capture territory. Judged by an on-chain World Spirit under consensus on GenLayer.',
    images: ['/og.jpg'],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${display.variable} ${body.variable} ${mono.variable}`}>{children}</body>
    </html>
  );
}
