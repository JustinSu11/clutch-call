/*
Author: Maaz Haque
File: HealthCheckStatus.tsx
Description: Component to display health check service status and controls
*/

'use client';

import { useState, useEffect } from 'react';
import { healthCheckService } from '@/utils/health-check-service';

export default function HealthCheckStatus() {
    const [status, setStatus] = useState({ isRunning: false, intervalId: false });
    const [lastUpdate, setLastUpdate] = useState<string>('');

    useEffect(() => {
        // Update status every second
        const updateStatus = () => {
            const currentStatus = healthCheckService.getStatus();
            setStatus(currentStatus);
            setLastUpdate(new Date().toLocaleTimeString());
        };

        updateStatus();
        const statusInterval = setInterval(updateStatus, 1000);

        return () => clearInterval(statusInterval);
    }, []);

    const handleManualCheck = async () => {
        await healthCheckService.triggerManualCheck();
    };

    const handleToggleService = () => {
        if (status.isRunning) {
            healthCheckService.stop();
        } else {
            healthCheckService.start();
        }
    };

    return (
        <div className="p-4 border rounded-lg bg-gray-50">
            <h3 className="text-lg font-semibold mb-3">Health Check Service Status</h3>
            
            <div className="space-y-2 mb-4">
                <p>
                    <span className="font-medium">Status:</span>{' '}
                    <span className={`px-2 py-1 rounded text-sm ${
                        status.isRunning ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                        {status.isRunning ? 'Running' : 'Stopped'}
                    </span>
                </p>
                <p>
                    <span className="font-medium">Interval Active:</span>{' '}
                    {status.intervalId ? 'Yes' : 'No'}
                </p>
                <p>
                    <span className="font-medium">Last Status Update:</span> {lastUpdate}
                </p>
                <p className="text-sm text-gray-600">
                    Health checks run every 5 minutes automatically
                </p>
            </div>

            <div className="space-x-2">
                <button
                    onClick={handleManualCheck}
                    className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
                >
                    Manual Health Check
                </button>
                <button
                    onClick={handleToggleService}
                    className={`px-3 py-1 rounded text-sm ${
                        status.isRunning
                            ? 'bg-red-500 text-white hover:bg-red-600'
                            : 'bg-green-500 text-white hover:bg-green-600'
                    }`}
                >
                    {status.isRunning ? 'Stop Service' : 'Start Service'}
                </button>
            </div>

            <div className="mt-3 text-xs text-gray-500">
                Check the browser console for health check logs
            </div>
        </div>
    );
}