/*
Author: Maaz Haque
File: use-health-check.ts
Description: Custom hook that runs backend health checks every 5 minutes
*/

import { useEffect, useRef } from 'react';
import { checkBackendHealth } from '@/backend_methods/helpers/backend_routing';

export const useHealthCheck = () => {
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        // Function to perform health check
        const performHealthCheck = async () => {
            try {
                await checkBackendHealth();
                console.log('[Health Check] Backend is healthy at', new Date().toLocaleTimeString());
            } catch (error) {
                console.warn('[Health Check] Backend health check failed at', new Date().toLocaleTimeString(), error);
            }
        };

        // Run initial health check
        performHealthCheck();

        // Set up interval to run every 5 minutes (300,000 ms)
        intervalRef.current = setInterval(performHealthCheck, 5 * 60 * 1000);

        // Cleanup function to clear interval when component unmounts
        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
        };
    }, []);

    // Return a function to manually trigger health check if needed
    const triggerHealthCheck = async () => {
        try {
            await checkBackendHealth();
            console.log('[Manual Health Check] Backend is healthy at', new Date().toLocaleTimeString());
        } catch (error) {
            console.warn('[Manual Health Check] Backend health check failed at', new Date().toLocaleTimeString(), error);
        }
    };

    return { triggerHealthCheck };
};