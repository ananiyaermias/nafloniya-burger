import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import nafloniyaBurgerWebp from "@/assets/nafloniya-burger.webp";
import nafloniyaBurgerPng from "@/assets/nafloniya-burger-optimized.png";
import { ArrowRight } from "lucide-react";

export const RedefiningSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.3 });

  return (
    <section ref={ref} className="min-h-screen bg-background flex items-center py-16 sm:py-20 relative overflow-hidden">
      {/* Background accents */}
      <div className="absolute top-1/2 left-0 w-[500px] h-[500px] bg-accent/5 rounded-full blur-[150px] -translate-y-1/2 pointer-events-none" />
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-12 relative z-10">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          {/* 3D Burger Card */}
          <motion.div
            initial={{ opacity: 0, x: -100, rotateY: -20 }}
            animate={isInView ? { 
              opacity: 1, 
              x: 0,
              rotateY: 0
            } : {}}
            transition={{ 
              duration: 1, 
              ease: [0.34, 1.56, 0.64, 1]
            }}
            className="relative perspective-1000 order-1"
          >
            <motion.div 
              className="bg-card rounded-3xl p-6 sm:p-8 lg:p-12 shadow-3d relative overflow-hidden preserve-3d cursor-pointer"
              whileHover={{ 
                rotateY: 10, 
                rotateX: -5,
                scale: 1.02 
              }}
              whileTap={{ 
                rotateY: 15, 
                rotateX: -8,
                scale: 0.98 
              }}
              transition={{ type: "spring", stiffness: 200 }}
            >
              {/* Decorative gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-accent/10 to-transparent pointer-events-none" />
              
              <motion.picture
                animate={isInView ? {
                  y: [0, -12, 0],
                  rotate: [0, 1, 0, -1, 0],
                } : {}}
                transition={{
                  duration: 5,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 0.5
                }}
                className="w-full max-w-sm sm:max-w-lg mx-auto relative z-10 drop-shadow-2xl block"
              >
                <source srcSet={nafloniyaBurgerWebp} type="image/webp" />
                <img
                  src={nafloniyaBurgerPng}
                  alt="Nafloniya Burger Experience - Redefining Taste"
                  width={500}
                  height={658}
                  className="w-full"
                  loading="lazy"
                  decoding="async"
                />
              </motion.picture>
              
              {/* Floating badge */}
              <motion.div
                className="absolute top-4 right-4 sm:top-6 sm:right-6 bg-accent text-accent-foreground px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-bold shadow-glow"
                animate={{ 
                  scale: [1, 1.05, 1],
                }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                ⭐ Best Seller
              </motion.div>
            </motion.div>
          </motion.div>

          {/* Text & CTAs */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8, ease: "easeOut", delay: 0.3 }}
            className="space-y-6 order-2 text-center lg:text-left"
          >
            <motion.span 
              className="inline-block text-accent font-semibold text-sm uppercase tracking-widest"
              initial={{ opacity: 0 }}
              animate={isInView ? { opacity: 1 } : {}}
              transition={{ delay: 0.5 }}
            >
              Our Philosophy
            </motion.span>
            
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-foreground leading-tight">
              Redefining the Experience
            </h2>
            <p className="text-base sm:text-lg text-muted-foreground max-w-xl mx-auto lg:mx-0">
              At Nafloniya Burger, we don't just serve food—we create memories. Each burger is a masterpiece, combining innovation with tradition to deliver an experience that transcends taste.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Button 
                asChild 
                size="lg" 
                className="bg-accent hover:bg-accent/90 text-white font-semibold px-6 sm:px-8 py-6 text-lg shadow-glow touch-target transition-bounce hover:scale-105 active:scale-95 group"
              >
                <Link to="/order" className="flex items-center gap-2">
                  Order Now
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="font-semibold px-6 sm:px-8 py-6 text-lg touch-target transition-bounce hover:scale-105 active:scale-95"
              >
                Learn More
              </Button>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};