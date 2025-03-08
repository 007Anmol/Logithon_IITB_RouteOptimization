"use client"

import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"
import { Truck, Ship, Plane, Train, ArrowRight, ChevronDown, FileSpreadsheet } from "lucide-react"
import Link from "next/link"
import { useRef } from "react"
import { WavyBackground } from "@/components/ui/wavy-background"

export function HeroSection() {
  const scrollRef = useRef<HTMLDivElement>(null)

  const scrollToContent = () => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.3,
      },
    },
  }

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } },
  }

  return (
    <>
      <div className="relative overflow-hidden min-h-[90vh] flex items-center">
        {/* Wavy Background */}
        <WavyBackground 
          colors={["#0F172A", "#1E40AF", "#3B82F6", "#2563EB"]} 
          waveWidth={60}
          backgroundFill="#020617"
          blur={5}
          speed="slow"
          waveOpacity={0.6}
          className="absolute inset-0"
        />

        {/* Main content */}
        <div className="container relative z-10 py-20">
          <motion.div
            className="max-w-3xl mx-auto text-center space-y-8"
            variants={container}
            initial="hidden"
            animate="show"
          >
            <motion.div variants={item}>
              <span className="inline-block px-4 py-1.5 rounded-full bg-blue-500/20 text-blue-400 font-medium text-sm mb-4 backdrop-blur-sm">
                Intelligent Route Optimization
              </span>
            </motion.div>

            <motion.h1
              className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-white"
              variants={item}
            >
              Ship Smarter, Not Harder
            </motion.h1>

            <motion.p className="text-lg md:text-xl text-blue-100/80 max-w-2xl mx-auto" variants={item}>
              Get the most efficient shipping routes with our advanced AI-powered optimization algorithms. Save time,
              reduce costs, and minimize your carbon footprint.
            </motion.p>

            <motion.div className="flex flex-col sm:flex-row gap-4 justify-center pt-4" variants={item}>
              <Button size="lg" className="rounded-full px-8 group bg-blue-600 hover:bg-blue-700">
                Get Started
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
              <Button size="lg" variant="outline" className="rounded-full px-8 text-white border-white/20 bg-white/10 backdrop-blur-sm hover:bg-white/20">
                View Demo
              </Button>
            </motion.div>

            <motion.div className="pt-8 flex justify-center" variants={item}>
              <div className="flex flex-col sm:flex-row gap-6 sm:gap-8 p-6 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/10 shadow-xl">
                <div className="text-center">
                  <p className="text-3xl font-bold text-blue-300">30%</p>
                  <p className="text-sm text-blue-100/70">Cost Savings</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-blue-300">45%</p>
                  <p className="text-sm text-blue-100/70">Time Saved</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-blue-300">25%</p>
                  <p className="text-sm text-blue-100/70">CO₂ Reduction</p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2 cursor-pointer"
          onClick={scrollToContent}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.5, duration: 0.5 }}
        >
          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY, repeatType: "loop" }}
          >
            <ChevronDown className="h-10 w-10 text-blue-300/70" />
          </motion.div>
        </motion.div>
      </div>

      {/* Ref for scroll target */}
      <div ref={scrollRef} />

      {/* Feature highlights */}
        <div className="container py-16 bg-[#020617] text-white">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
            {
                title: "Batch Processing",
                description: "Upload multiple shipments at once and get optimized routes instantly",
                icon: FileSpreadsheet,
                color: "from-blue-500 to-cyan-400",
            },
            {
                title: "Multiple Route Options",
                description: "Compare 7 different route options for each shipment based on your priorities",
                icon: Ship,
                color: "from-indigo-500 to-purple-400",
            },
            {
                title: "Real-time Tracking",
                description: "Track your shipments in real-time across all transportation modes",
                icon: Truck,
                color: "from-blue-600 to-blue-400",
            },
            ].map((feature, index) => (
            <motion.div
                key={index}
                className="relative p-8 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md shadow-lg hover:shadow-xl hover:bg-white/10 hover:border-white/20 transition-all"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
            >
                <div className={`mb-6 inline-flex rounded-xl bg-gradient-to-r ${feature.color} p-0.5`}>
                <div className="bg-black/40 backdrop-blur-md p-4 rounded-xl">
                    <feature.icon className="h-8 w-8 text-white" />
                </div>
                </div>
                
                <h3 className="text-xl font-semibold mb-3 text-white">{feature.title}</h3>
                <p className="text-gray-300 mb-4">{feature.description}</p>
                
                <Link 
                href="#" 
                className="inline-flex items-center text-blue-400 hover:text-blue-300 font-medium group"
                >
                Learn more
                <motion.div
                    initial={{ x: 0 }}
                    whileHover={{ x: 5 }}
                >
                    <ArrowRight className="ml-2 h-4 w-4" />
                </motion.div>
                </Link>
                
                {/* Subtle glow effect */}
                <div className={`absolute -z-10 inset-0 rounded-2xl bg-gradient-to-br ${feature.color} opacity-5 blur-xl`} />
            </motion.div>
            ))}
        </div>
        </div>
    </>
  )
}