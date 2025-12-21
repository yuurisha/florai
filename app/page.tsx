// app/page.tsx
"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Leaf, MapPin, Cloud, BarChart3 } from "lucide-react";
import  {Button} from "../components/button";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="border-b shadow-sm bg-green-100">
        <div className="container flex h-16 items-center justify-between px-4 md:px-6">
          <Link href="/" className="flex items-center gap-2">
            <Leaf className="h-6 w-6 text-green-600" />
            <span className="text-xl font-bold">FlorAI</span>
          </Link>
          <nav className="hidden md:flex gap-6">
            <Link href="#features" className="text-sm font-medium hover:underline underline-offset-4">Features</Link>
          </nav>
          <div className="flex items-center gap-4">
            <Link href="/login"><Button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded">Log in</Button></Link>
            <Link href="/signup"><Button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded">Sign up</Button></Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="w-full py-12 md:py-24 lg:py-32 bg-green-50">
        <div className="container px-4 md:px-6 grid gap-6 lg:grid-cols-2 lg:gap-12 items-center">
          <div className="space-y-4">
            <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl">
              Monitor and Manage Your Green Spaces
            </h1>
            <p className="max-w-[600px] text-gray-500 md:text-xl">Track plant growth, analyze weather patterns, and visualize ecosystem health.</p>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Link href="/signup">
                <Button className="bg-green-600 hover:bg-green-700">Get Started <ArrowRight className="ml-2 h-4 w-4" /></Button>
              </Link>
              <Link href="#features">
                <Button className="border border-green-600 text-green-600 bg-transparent hover:bg-green-50">Learn More</Button>
              </Link>
            </div>
          </div>
            <div className="w-full lg:w-auto mx-auto lg:ml-auto">
            <Image
              src="/placeholder.jpeg"
              alt="Green space visualization"
              width={800}
              height={550}
              className="rounded-lg object-cover w-full h-auto max-w-full"
              priority
            />
            </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="w-full py-12 md:py-24 lg:py-32 bg-white">
        <div className="container px-4 md:px-6 text-center">
          <h2 className="text-3xl font-bold sm:text-4xl md:text-5xl">Key Features</h2>
          <p className="text-gray-500 md:text-xl mt-2 max-w-2xl mx-auto">
            Everything you need to monitor and manage your green spaces effectively.
          </p>
          <div className="mt-12 grid gap-6 lg:grid-cols-3">
            {[{
              icon: <MapPin className="h-12 w-12 text-green-600" />,
              title: "Interactive Maps",
              desc: "Visualize green spaces with detailed, interactive maps."
            }, {
              icon: <Cloud className="h-12 w-12 text-green-600" />,
              title: "Weather Data",
              desc: "Access real-time and historical weather insights."
            }, {
              icon: <BarChart3 className="h-12 w-12 text-green-600" />,
              title: "Plant Health and Spread Prediction",
              desc: "Analyze plant health and receive invasive plant species alerts."
            }].map((feature, i) => (
              <div key={i} className="border p-6 rounded-lg shadow-sm text-left space-y-4">
                {feature.icon}
                <h3 className="text-xl font-bold">{feature.title}</h3>
                <p className="text-gray-500">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="w-full py-12 md:py-24 lg:py-32 bg-green-600 text-white text-center">
        <div className="container px-4 md:px-6 space-y-4">
          <h2 className="text-3xl font-bold sm:text-4xl md:text-5xl">
            Ready to Transform Your Green Space Management?
          </h2>
          <Link href="/signup">
            <Button className="w-full max-w-sm mx-auto bg-white text-green-600 hover:bg-green-50">Sign Up for Free</Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-gray-50">
        <div className="container flex flex-col md:flex-row justify-between items-start gap-10 px-4 md:px-6 py-10">
          <div>
            <Link href="/" className="flex items-center gap-2">
              <Leaf className="h-6 w-6 text-green-600" />
              <span className="text-xl font-bold">FlorAI</span>
            </Link>
            <p className="text-sm text-gray-500 mt-2">© 2025 FlorAI. All rights reserved.</p>
          </div>
          <div className="grid grid-cols-2 gap-10 sm:grid-cols-3 text-sm">
            <div>

            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
