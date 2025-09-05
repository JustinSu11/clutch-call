import * as React from 'react'
import { Button } from '@/components/ui/button'
import {Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle} from "@/components/ui/card";
import { Shield, TrendingUp, Clock, Square } from "lucide-react"
import WelcomeHero from "@/components/WelcomeHero"

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-zinc-50 text-zinc-900">
        <main className="flex-1">
            <WelcomeHero />
        </main>
    </div>
  );
}