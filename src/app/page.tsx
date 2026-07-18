"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
import { useScroll, useSpring, useMotionValueEvent } from "framer-motion";
import { MapPin, Shield, Ruler } from "lucide-react";
import SnakeHero, { MetadataItem } from "@/components/SnakeHero";

const TOTAL_FRAMES = 82;

export default function Page() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imagesRef = useRef<HTMLImageElement[]>([]);
  const lastRenderedIndexRef = useRef<number>(-1);
  const animationFrameIdRef = useRef<number | null>(null);

  const [imagesLoaded, setImagesLoaded] = useState(0);
  const [loading, setLoading] = useState(true);

  // Scroll Progress Tracking over the 200vh container height
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  // Spring physics interpolation (damping: 32, stiffness: 180 for deliberate Apple-style response)
  const smoothProgress = useSpring(scrollYProgress, {
    damping: 32,
    stiffness: 180,
    mass: 0.12,
    restDelta: 0.0001,
  });

  // Frame Draw logic with high performance subpixel canvas scaling
  const drawImage = useCallback((index: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = imagesRef.current[index];
    if (!img || !img.complete) return;

    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;
    const imgWidth = img.width;
    const imgHeight = img.height;

    const imgRatio = imgWidth / imgHeight;
    const canvasRatio = canvasWidth / canvasHeight;

    let drawWidth = canvasWidth;
    let drawHeight = canvasHeight;
    let drawX = 0;
    let drawY = 0;

    // Scale aspect-fill
    if (canvasRatio > imgRatio) {
      drawWidth = canvasWidth;
      drawHeight = canvasWidth / imgRatio;
      drawY = (canvasHeight - drawHeight) / 2;
    } else {
      drawHeight = canvasHeight;
      drawWidth = canvasHeight * imgRatio;
      drawX = (canvasWidth - drawWidth) / 2;
    }

    // Anchor visual alignment to the right of the screen (matching layout composition)
    if (drawWidth > canvasWidth) {
      drawX = canvasWidth - drawWidth;
    }

    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(
      img, 
      Math.round(drawX), 
      Math.round(drawY), 
      Math.round(drawWidth), 
      Math.round(drawHeight)
    );
  }, []);

  // Preload all 82 frame assets
  useEffect(() => {
    let loadedCount = 0;
    const preloadedImages: HTMLImageElement[] = [];

    for (let i = 1; i <= TOTAL_FRAMES; i++) {
      const img = new Image();
      const paddedIndex = String(i).padStart(3, '0');
      img.src = `/ezgif-76043ac373ec0fe4-jpg/ezgif-frame-${paddedIndex}.jpg`;

      img.onload = () => {
        if (typeof img.decode === "function") {
          img.decode()
            .then(() => {
              loadedCount++;
              setImagesLoaded(loadedCount);
              if (loadedCount === TOTAL_FRAMES) {
                setTimeout(() => setLoading(false), 450);
              }
            })
            .catch(() => {
              loadedCount++;
              setImagesLoaded(loadedCount);
              if (loadedCount === TOTAL_FRAMES) {
                setTimeout(() => setLoading(false), 450);
              }
            });
        } else {
          loadedCount++;
          setImagesLoaded(loadedCount);
          if (loadedCount === TOTAL_FRAMES) {
            setTimeout(() => setLoading(false), 450);
          }
        }
      };

      img.onerror = () => {
        loadedCount++;
        setImagesLoaded(loadedCount);
        if (loadedCount === TOTAL_FRAMES) {
          setTimeout(() => setLoading(false), 450);
        }
      };

      preloadedImages.push(img);
    }
    imagesRef.current = preloadedImages;
  }, []);

  // Handle canvas resize and draw immediately
  useEffect(() => {
    if (loading) return;

    const handleResize = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;

      canvas.width = Math.round(rect.width * dpr);
      canvas.height = Math.round(rect.height * dpr);

      const frameIndex = Math.max(0, Math.min(TOTAL_FRAMES - 1, Math.floor(smoothProgress.get() * TOTAL_FRAMES)));
      lastRenderedIndexRef.current = frameIndex;
      drawImage(frameIndex);
    };

    window.addEventListener("resize", handleResize);
    handleResize();

    return () => window.removeEventListener("resize", handleResize);
  }, [loading, drawImage, smoothProgress]);

  // Sync canvas drawing on scroll progress updates using requestAnimationFrame (60 FPS)
  useMotionValueEvent(smoothProgress, "change", (latest) => {
    const frameIndex = Math.max(0, Math.min(TOTAL_FRAMES - 1, Math.floor(latest * TOTAL_FRAMES)));
    
    if (frameIndex !== lastRenderedIndexRef.current) {
      lastRenderedIndexRef.current = frameIndex;

      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }

      animationFrameIdRef.current = requestAnimationFrame(() => {
        drawImage(frameIndex);
      });
    }
  });

  const loadingPercentage = Math.round((imagesLoaded / TOTAL_FRAMES) * 100);

  // Metadata specifications
  const metadata: MetadataItem[] = [
    {
      label: "VENOM",
      value: "Non-venomous",
      icon: (
        <svg viewBox="0 0 100 100" className="w-5 h-5 fill-current">
          <path d="M50,15 C40,25 32,38 32,52 C32,65 40,75 50,75 C60,75 68,65 68,52 C68,38 60,25 50,15 Z" />
        </svg>
      )
    },
    {
      label: "SIZE",
      value: "Up to 6.5 m",
      icon: <Ruler className="w-5 h-5" />
    },
    {
      label: "STATUS",
      value: "Least Concern",
      icon: <Shield className="w-5 h-5" />
    }
  ];

  return (
    <main>
      {/* Cinematic Loader Screen */}
      <div className={`preloader ${!loading ? "fade-out" : ""}`}>
        <div className="loader-container">
          <span className="loader-brand">Preloading Atlas</span>
          <span className="loader-progress-text">
            {String(loadingPercentage).padStart(3, "0")}%
          </span>
          <div className="loader-bar-outer">
            <div 
              className="loader-bar-inner" 
              style={{ width: `${loadingPercentage}%` }} 
            />
          </div>
        </div>
      </div>

      {/* Film Grain Texture Overlay */}
      <div className="noise-overlay" />

      {/* Interactive Scroll Arena */}
      <div ref={containerRef} className="scroll-container">
        <div className="sticky-viewport">
          <SnakeHero
            eyebrow="Native to Southeast Asia"
            eyebrowIcon={<MapPin className="w-4 h-4" />}
            title="RETICULATED PYTHON"
            description="The world's longest snake, capable of exceeding 6 meters. A master of camouflage and ambush, moving silently through the rainforests."
            metadata={metadata}
            ctaText="Discover this species"
            backgroundColor="#ebb11c"
            textColor="text-neutral-950"
            canvasRef={canvasRef}
          />
        </div>
      </div>
    </main>
  );
}
