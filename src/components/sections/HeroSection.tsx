import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import nafloniyaBurgerWebp from "@/assets/nafloniya-burger.webp";
import nafloniyaBurgerPng from "@/assets/nafloniya-burger-optimized.png";
import { Sparkles } from "lucide-react";

export const HeroSection = () => {
  return (
    <section className="min-h-screen bg-dark flex items-center relative overflow-hidden">
      {/* Ambient glow effects */}
      <div className="absolute inset-0 gradient-radial opacity-60 pointer-events-none" />
      <div className="absolute top-1/4 -left-32 w-64 h-64 bg-accent/20 rounded-full blur-[100px]" />
      <div className="absolute bottom-1/4 -right-32 w-64 h-64 bg-accent/10 rounded-full blur-[120px]" />
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-12 relative z-10">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          {/* Mobile: Burger first, Desktop: Text first */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="space-y-6 sm:space-y-8 order-2 lg:order-1 text-center lg:text-left"
          >
            <motion.div 
              className="inline-flex items-center gap-2 bg-accent/20 backdrop-blur-sm px-4 py-2 rounded-full"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Sparkles className="w-4 h-4 text-accent" />
              <span className="text-sm font-medium text-light">Premium Gourmet Burgers</span>
            </motion.div>
            
            <div>
              <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl text-accent font-bold tracking-wide mb-4 sm:mb-6">
                Nafloniya Burger
              </h2>
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-light leading-tight">
              Taste the Legendary Flavor Now!
            </h1>
            <p className="text-lg sm:text-xl text-light/80 max-w-xl mx-auto lg:mx-0">
              Crafted with passion, served with excellence. Every bite is a journey into flavor perfection.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Button 
                asChild 
                size="lg" 
                className="bg-accent hover:bg-accent/90 text-dark font-semibold px-8 py-6 text-lg shadow-glow touch-target transition-bounce hover:scale-105 active:scale-95"
              >
                <Link to="/order">Order Now</Link>
              </Button>
              <Button 
                asChild
                size="lg" 
                variant="outline" 
                className="border-light/30 text-light hover:bg-light/10 font-semibold px-8 py-6 text-lg touch-target transition-bounce hover:scale-105 active:scale-95"
              >
                <Link to="/order">Explore the Menu</Link>
              </Button>
            </div>
          </motion.div>

          {/* 3D Burger Visual */}
          <div className="relative flex items-center justify-center order-1 lg:order-2 perspective-1000">
            <motion.div
              initial={{ opacity: 0, scale: 0.8, rotateY: -30 }}
              animate={{ opacity: 1, scale: 1, rotateY: 0 }}
              transition={{ duration: 1, delay: 0.3, ease: "easeOut" }}
              className="relative z-10 preserve-3d"
            >
              {/* Outer glow ring */}
              <div className="absolute inset-0 w-72 h-72 sm:w-80 sm:h-80 md:w-96 md:h-96 rounded-full bg-accent/20 blur-2xl animate-pulse" />
              
              {/* Main burger container with 3D effect */}
              <motion.div 
                className="w-72 h-72 sm:w-80 sm:h-80 md:w-96 md:h-96 rounded-full bg-gradient-to-br from-card to-card/80 shadow-3d flex items-center justify-center overflow-hidden relative border-4 border-accent/20 cursor-pointer"
                whileHover={{ 
                  rotateY: 10, 
                  rotateX: -10,
                  scale: 1.05 
                }}
                whileTap={{ 
                  rotateY: 15, 
                  rotateX: -15,
                  scale: 1.1 
                }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                {/* Inner glow */}
                <div className="absolute inset-0 shadow-inner-glow rounded-full" />
                
                <picture>
                  <source srcSet={nafloniyaBurgerWebp} type="image/webp" />
                  <img 
                    src={nafloniyaBurgerPng} 
                    alt="Nafloniya Burger - Premium Gourmet Burger" 
                    width={512}
                    height={512}
                    className="w-full h-full object-cover"
                    loading="eager"
                    decoding="sync"
                  />
                </picture>
              </motion.div>
              
              {/* Floating accent elements */}
              <motion.div
                className="absolute -top-4 -right-4 w-8 h-8 bg-accent rounded-full shadow-glow"
                animate={{ 
                  y: [0, -15, 0],
                  scale: [1, 1.2, 1]
                }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              />
              <motion.div
                className="absolute -bottom-2 -left-6 w-6 h-6 bg-accent/60 rounded-full shadow-glow"
                animate={{ 
                  y: [0, 10, 0],
                  x: [0, 5, 0]
                }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
              />
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
};