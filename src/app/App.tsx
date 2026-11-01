import { QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { RouterProvider } from 'react-router';
import { ToastProvider, TooltipProvider } from '@/components/ui';
import { MetaGate } from './MetaGate';
import { createQueryClient } from './queryClient';
import { createRouter } from './router';
import { ThemeProvider } from './ThemeProvider';

export function App() {
  const [queryClient] = useState(createQueryClient);
  const [router] = useState(createRouter);
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider delayDuration={300}>
          <ToastProvider>
            <MetaGate>
              <RouterProvider router={router} />
            </MetaGate>
          </ToastProvider>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
