/*
Author: Maaz Haque
File: HealthCheckProvider.tsx
Description: Client component that initializes the health check service
*/

'use client';

import { useEffect } from 'react';
import { healthCheckService } from '@/utils/health-check-service';

export default function HealthCheckProvider({ children }: { children: React.ReactNode }) {
    useEffect(() => {
        // Start the health check service when the app loads
        healthCheckService.start();

        // Cleanup function to stop the service when the app unmounts
        return () => {
            healthCheckService.stop();
        };
    }, []);

    return <>{children}</>;
}