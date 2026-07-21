import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Button } from "@/components/ui/button";
import nafloniyaBurgerWebp from "@/assets/nafloniya-burger.webp";
import nafloniyaBurgerPng from "@/assets/nafloniya-burger-optimized.png";

export const ElevateSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.3 });

  return (
    <section ref={ref} className="min-h-screen bg-dark flex items-center py-20">
      <div className="container mx-auto px-6 lg:px-12">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left: Text & CTAs */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="space-y-6"
          >
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-light leading-tight">
              Elevate Your Burger Game
            </h2>
            <p className="text-lg text-light/80 max-w-xl">
              From classic favorites to innovative creations, our menu offers something extraordinary for every palate. Prepared fresh daily with locally sourced ingredients.
            </p>
            <Button size="lg" className="bg-accent hover:bg-accent/90 text-white font-semibold px-8 py-6 text-lg shadow-glow">
              View Full Menu
            </Button>
          </motion.div>

          {/* Right: Burgers on Plates */}
          <div className="relative h-[500px]">
            {/* Large Plate with Burger */}
            <motion.div
              initial={{ y: -200, opacity: 0 }}
              animate={isInView ? { y: 0, opacity: 1 } : {}}
              transition={{ 
                duration: 1.2, 
                ease: [0.34, 1.56, 0.64, 1],
                delay: 0.3
              }}
              className="absolute top-10 left-1/4 transform -translate-x-1/2"
            >
              <motion.div 
                className="relative cursor-pointer"
                whileHover={{ scale: 1.05, rotateY: 10, rotateX: -5 }}
                whileTap={{ scale: 0.95, rotateY: 15, rotateX: -10 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                {/* White Plate */}
                <div className="w-64 h-64 rounded-full bg-white shadow-elevated flex items-center justify-center overflow-hidden">
                  <picture>
                    <source srcSet={nafloniyaBurgerWebp} type="image/webp" />
                    <img
                      src={nafloniyaBurgerPng}
                      alt="Nafloniya Burger"
                      width={256}
                      height={256}
                      className="w-full h-full object-cover"
                      loading="lazy"
                      decoding="async"
                    />
                  </picture>
                </div>
              </motion.div>
            </motion.div>

            {/* Small Plate with Burger */}
            <motion.div
              initial={{ y: -200, opacity: 0 }}
              animate={isInView ? { y: 0, opacity: 1 } : {}}
              transition={{ 
                duration: 1.2, 
                ease: [0.34, 1.56, 0.64, 1],
                delay: 0.5
              }}
              className="absolute bottom-10 right-1/4 transform translate-x-1/2"
            >
              <motion.div 
                className="relative cursor-pointer"
                whileHover={{ scale: 1.05, rotateY: -10, rotateX: 5 }}
                whileTap={{ scale: 0.95, rotateY: -15, rotateX: 10 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                {/* White Plate */}
                <div className="w-48 h-48 rounded-full bg-white shadow-elevated flex items-center justify-center overflow-hidden">
                  <picture>
                    <source srcSet={nafloniyaBurgerWebp} type="image/webp" />
                    <img
                      src={nafloniyaBurgerPng}
                      alt="Nafloniya Burger"
                      width={192}
                      height={192}
                      className="w-full h-full object-cover"
                      loading="lazy"
                      decoding="async"
                    />
                  </picture>
                </div>
              </motion.div>
            </motion.div>

            {/* Decorative Lines */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={isInView ? { opacity: 0.2 } : {}}
              transition={{ delay: 1, duration: 1 }}
              className="absolute inset-0 pointer-events-none"
            >
              <svg className="w-full h-full" viewBox="0 0 400 400">
                <path
                  d="M 50,50 L 200,200 L 350,100"
                  stroke="currentColor"
                  strokeWidth="1"
                  fill="none"
                  className="text-light"
                  strokeDasharray="5,5"
                />
              </svg>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
};
