/*
Author: Justin Nguyen
Last updated: 09/08/2025
Purpose: This section highlights key features of ClutchCall, each feature is shown on a FeatureCard component
*/

import FeatureCard from "@/components/WelcomeViewComponents/FeatureCard"
import { TrendingUp, Clock, Shield } from "lucide-react"

export default function WhyChooseSection() {
    return (
        <section id="how-it-works" className="py-20 bg-background">
            <div className="container mx-auto px-6">
                <div className="text-center">
                    <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-text-primary mb-3">
                        Why Choose ClutchCall?
                    </h2>
                    <p className="mx-auto max-w-3xl text-text-secondary text-lg">
                        Our platform offers unparalleled accuracy, real-time updates, and secure access to sports predictions.
                    </p>
                </div>
                <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
                    <FeatureCard icon={<TrendingUp className="h-8 w-8 text-primary" />} title="High Accuracy" description="Our AI models are trained on extensive datasets to provide highly accurate predictions." />
                    <FeatureCard icon={<Clock className="h-8 w-8 text-primary" />} title="Daily Updates" description="Stay ahead with predictions updated every day with new data." />
                    {/*Will be changed later, we shouldn't be storing any user data*/}
                    <FeatureCard icon={<Shield className="h-8 w-8 text-primary" />} title="Secure Access" description="Your data and predictions are protected with state-of-the-art security measures." />
                </div>
            </div>
        </section>
    )
}