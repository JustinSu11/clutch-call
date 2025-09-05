import FeatureCard from "./FeatureCard"
import { TrendingUp, Clock, Shield } from "lucide-react"

//This section highlights key features of ClutchCall, each feature is shown on a FeatureCard component

export default function WhyChooseSection() {
    return (
        <section id="how-it-works" className="py-20 bg-white">
            <div className="container mx-auto px-6">
                <div className="text-center">
                    <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-zinc-900 mb-3">
                        Why Choose ClutchCall?
                    </h2>
                    <p className="mx-auto max-w-3xl text-zinc-600 text-lg">
                        Our platform offers unparalleled accuracy, real-time updates, and secure access to sports predictions.
                    </p>
                </div>
                <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
                    <FeatureCard icon={<TrendingUp className="h-8 w-8 text-red-500" />} title="High Accuracy" description="Our AI models are trained on extensive datasets to provide highly accurate predictions." />
                    <FeatureCard icon={<Clock className="h-8 w-8 text-red-500" />} title="Daily Updates" description="Stay ahead with predictions updated every day with new data." />
                    {/*Will be changed later, we shouldn't be storing any user data*/}
                    <FeatureCard icon={<Shield className="h-8 w-8 text-red-500" />} title="Secure Access" description="Your data and predictions are protected with state-of-the-art security measures." />
                </div>
            </div>
        </section>
    )
}