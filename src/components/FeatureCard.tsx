/*
Author: Justin Nguyen
Last updated: 09/08/2025
Purpose: A card component to display a feature of the app, used in the WhyChooseSection component 
*/

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import * as React from "react"

export default function FeatureCard({
    icon,
    title,
    description,
}: {
    icon: React.ReactNode;
    title: string;
    description: string;
}) {
    return (
        <Card className="border-zinc-200 shadow-sm">
            <CardHeader className="flex flex-col items-center text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100 mb-4">
                    {icon}
                </div>
                <CardTitle className="text-xl">{title}</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-zinc-600 text-base text-center leading-relaxed">{description}</p>
            </CardContent>
        </Card>
    )
}