import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { ChefHat, Leaf, Award } from "lucide-react";
import nafloniyaBurgerWebp from "@/assets/nafloniya-burger.webp";
import nafloniyaBurgerPng from "@/assets/nafloniya-burger-optimized.png";

const features = [
  {
    icon: ChefHat,
    title: "Master Craftsmanship",
    description: "Prepared by expert chefs with decades of culinary expertise",
    delay: 0.3
  },
  {
    icon: Leaf,
    title: "Fresh Ingredients",
    description: "Only the finest locally sourced, organic ingredients",
    delay: 0.5
  },
  {
    icon: Award,
    title: "Award Winning",
    description: "Recognized for excellence in gourmet fast-casual dining",
    delay: 0.7
  }
];

export const ArtSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.3 });

  return (
    <section ref={ref} className="min-h-screen bg-dark flex items-center py-16 sm:py-20 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 gradient-radial opacity-40 pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-accent/10 rounded-full blur-[150px] pointer-events-none" />
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-12 relative z-10">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          {/* Text & Icons */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="space-y-6 sm:space-y-8 order-2 lg:order-1 text-center lg:text-left"
          >
            <motion.span 
              className="inline-block text-accent font-semibold text-sm uppercase tracking-widest"
              initial={{ opacity: 0 }}
              animate={isInView ? { opacity: 1 } : {}}
              transition={{ delay: 0.2 }}
            >
              Why Choose Us
            </motion.span>
            
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-light leading-tight">
              The Art of Making Perfection
            </h2>
            <p className="text-base sm:text-lg text-light/80 max-w-xl mx-auto lg:mx-0">
              Every burger we create is a testament to our commitment to quality, innovation, and culinary excellence.
            </p>
            
            <div className="space-y-4 sm:space-y-6">
              {features.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, x: -30 }}
                  animate={isInView ? { opacity: 1, x: 0 } : {}}
                  transition={{ delay: feature.delay, duration: 0.6 }}
                  className="flex items-start gap-4 text-left"
                >
                  <motion.div 
                    className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-accent/20 flex items-center justify-center flex-shrink-0 shadow-glow"
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <feature.icon className="w-6 h-6 sm:w-7 sm:h-7 text-accent" />
                  </motion.div>
                  <div>
                    <h3 className="text-lg sm:text-xl font-bold text-light mb-1 sm:mb-2">{feature.title}</h3>
                    <p className="text-sm sm:text-base text-light/70">{feature.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* 3D Burger Panel */}
          <motion.div
            initial={{ opacity: 0, x: 100, rotateY: 20 }}
            animate={isInView ? { 
              opacity: 1, 
              x: 0,
              rotateY: 0
            } : {}}
            transition={{ 
              duration: 1.2, 
              ease: [0.34, 1.56, 0.64, 1]
            }}
            className="relative perspective-1000 order-1 lg:order-2"
          >
            <motion.div 
              className="glass-dark rounded-3xl p-6 sm:p-8 lg:p-12 preserve-3d cursor-pointer"
              whileHover={{ 
                rotateY: -8, 
                rotateX: 5,
                scale: 1.02 
              }}
              whileTap={{ 
                rotateY: -12, 
                rotateX: 8,
                scale: 0.98 
              }}
              transition={{ type: "spring", stiffness: 200 }}
            >
              {/* Decorative corner accents */}
              <div className="absolute top-4 left-4 w-16 h-16 border-l-2 border-t-2 border-accent/30 rounded-tl-2xl" />
              <div className="absolute bottom-4 right-4 w-16 h-16 border-r-2 border-b-2 border-accent/30 rounded-br-2xl" />
              
              <motion.picture
                animate={isInView ? {
                  y: [0, -15, 0],
                  scale: [1, 1.02, 1],
                } : {}}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 1
                }}
                className="w-full max-w-sm sm:max-w-lg mx-auto drop-shadow-2xl relative z-10 block"
              >
                <source srcSet={nafloniyaBurgerWebp} type="image/webp" />
                <img
                  src={nafloniyaBurgerPng}
                  alt="Nafloniya Burger - The Art of Perfection"
                  width={500}
                  height={658}
                  className="w-full"
                  loading="lazy"
                  decoding="async"
                />
              </motion.picture>
            </motion.div>
            
            {/* Floating elements for depth */}
            <motion.div
              className="absolute -top-4 -left-4 w-8 h-8 bg-accent/40 rounded-full blur-sm"
              animate={{ 
                y: [0, -20, 0],
                opacity: [0.4, 0.8, 0.4]
              }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div
              className="absolute -bottom-6 -right-6 w-12 h-12 bg-accent/30 rounded-full blur-md"
              animate={{ 
                y: [0, 15, 0],
                x: [0, 10, 0]
              }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            />
          </motion.div>
        </div>
      </div>
    </section>
  );
};