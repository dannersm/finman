import './globals.css';
import ThemeRegistry from '@/components/ThemeRegistry/ThemeRegistry';
import QueryProvider from '@/components/QueryProvider';
import { Container } from '@mui/material';

export const metadata = {
  title: 'FinMan - Clasificador de Gastos',
  description: 'Una aplicación para clasificar tus movimientos bancarios.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>
        <QueryProvider>
          <ThemeRegistry>
              {children}
          </ThemeRegistry>
        </QueryProvider>
      </body>
    </html>
  );
}
