import '@fontsource/ibm-plex-sans/400.css'
import '@fontsource/ibm-plex-sans/500.css'
import '@fontsource/ibm-plex-sans/600.css'
import '@fontsource/ibm-plex-mono/400.css'
import '@fontsource/ibm-plex-mono/500.css'
import '@fontsource/shippori-mincho-b1/800.css'
import './globals.css'

export const metadata = {
  title: { default: 'Haru Sushi', template: '%s · Haru Sushi' },
  robots: { index: false, follow: false }
}

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  )
}
