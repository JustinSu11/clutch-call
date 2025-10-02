/*
Author: Maaz Haque
File: health-check-service.ts
Description: Global health check service that runs every 5 minutes
*/

import { checkBackendHealth } from '@/backend_methods/helpers/backend_routing';

class HealthCheckService {
    private intervalId: NodeJS.Timeout | null = null;
    private isRunning: boolean = false;

    // Start the health check service
    start() {
        if (this.isRunning) {
            console.log('[Health Check Service] Already running');
            return;
        }

        console.log('[Health Check Service] Starting health checks every 5 minutes');
        
        // Run initial health check
        this.performHealthCheck();

        // Set up interval to run every 5 minutes (300,000 ms)
        this.intervalId = setInterval(() => {
            this.performHealthCheck();
        }, 5 * 60 * 1000);

        this.isRunning = true;
    }

    // Stop the health check service
    stop() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
        this.isRunning = false;
        console.log('[Health Check Service] Stopped');
    }

    // Perform a single health check
    private async performHealthCheck() {
        try {
            await checkBackendHealth();
            console.log('[Health Check Service] Backend is healthy at', new Date().toLocaleTimeString());
        } catch (error) {
            console.warn('[Health Check Service] Backend health check failed at', new Date().toLocaleTimeString(), error);
        }
    }

    // Manual health check trigger
    async triggerManualCheck() {
        console.log('[Health Check Service] Manual check triggered');
        await this.performHealthCheck();
    }

    // Get service status
    getStatus() {
        return {
            isRunning: this.isRunning,
            intervalId: this.intervalId !== null
        };
    }
}

// Export singleton instance
export const healthCheckService = new HealthCheckService();