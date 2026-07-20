"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
import { useScroll, useSpring, useMotionValueEvent, useTransform, motion } from "framer-motion";
import { MapPin, Shield, Ruler } from "lucide-react";
import SnakeHero, { MetadataItem } from "@/components/SnakeHero";

const TOTAL_FRAMES_1 = 82;
const TOTAL_FRAMES_2 = 118;
const TOTAL_FRAMES_3 = 200;

const INITIAL_VISIBLE_FRAMES = 15;

export default function Page() {
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Canvas refs for all chapters
  const canvasRef1 = useRef<HTMLCanvasElement>(null);
  const canvasRef2 = useRef<HTMLCanvasElement>(null);
  const canvasRef3 = useRef<HTMLCanvasElement>(null);

  // Preloaded image reference lists
  const images1Ref = useRef<HTMLImageElement[]>([]);
  const images2Ref = useRef<HTMLImageElement[]>([]);
  const images3Ref = useRef<HTMLImageElement[]>([]);

  const chapter2PreloadTriggered = useRef(false);
  const chapter3PreloadTriggered = useRef(false);

  // Tracking drawing states
  const lastRenderedIndex1Ref = useRef<number>(-1);
  const lastRenderedIndex2Ref = useRef<number>(-1);
  const lastRenderedIndex3Ref = useRef<number>(-1);

  // Cached Aspect Ratio Coordinates
  type DrawCoords = { drawX: number; drawY: number; drawWidth: number; drawHeight: number };
  const drawCoords1Ref = useRef<DrawCoords | null>(null);
  const drawCoords2Ref = useRef<DrawCoords | null>(null);
  const drawCoords3Ref = useRef<DrawCoords | null>(null);

  // requestAnimationFrame handle caches
  const animationFrameId1Ref = useRef<number | null>(null);
  const animationFrameId2Ref = useRef<number | null>(null);
  const animationFrameId3Ref = useRef<number | null>(null);

  const [imagesLoaded, setImagesLoaded] = useState(0);
  const [loading, setLoading] = useState(true);
  const [activeIdx, setActiveIdx] = useState(0);

  // Scroll Progress Tracking over the 700vh container height
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  // Spring physics interpolation for buttery-smooth Apple-style frame response
  const smoothProgress = useSpring(scrollYProgress, {
    damping: 32,
    stiffness: 180,
    mass: 0.12,
    restDelta: 0.0001,
  });

  // Opacity transitions for seamless chapter cross-fade at 33% and 66% boundaries
  // Chapter 1 fades out from 0.31 to 0.35
  const opacity1 = useTransform(smoothProgress, [0.31, 0.35], [1, 0]);
  // Chapter 2 fades in from 0.32 to 0.36, and fades out from 0.64 to 0.68
  const opacity2 = useTransform(smoothProgress, [0.32, 0.36, 0.64, 0.68], [0, 1, 1, 0]);
  // Chapter 3 fades in from 0.65 to 0.69
  const opacity3 = useTransform(smoothProgress, [0.65, 0.69], [0, 1]);

  // Track active index based on scroll boundaries
  useMotionValueEvent(smoothProgress, "change", (latest) => {
    let nextIdx = 0;
    if (latest >= 0.333 && latest < 0.666) nextIdx = 1;
    else if (latest >= 0.666) nextIdx = 2;
    
    if (nextIdx !== activeIdx) {
      setActiveIdx(nextIdx);
    }
  });

  // Frame Draw logic with high performance subpixel canvas aspect-fill
  const drawImage = useCallback((
    canvasRef: React.RefObject<HTMLCanvasElement | null>,
    imagesList: HTMLImageElement[],
    index: number,
    coordsRef: React.MutableRefObject<DrawCoords | null>
  ) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = imagesList[index];
    if (!img || !img.complete) return;

    // Cache coords if invalidated or empty
    if (!coordsRef.current) {
      const canvasRatio = canvas.width / canvas.height;
      const imgRatio = img.width / img.height;
      let drawWidth = canvas.width;
      let drawHeight = canvas.height;
      let drawX = 0;
      let drawY = 0;

      if (canvasRatio > imgRatio) {
        drawHeight = canvas.width / imgRatio;
        drawY = (canvas.height - drawHeight) / 2;
      } else {
        drawWidth = canvas.height * imgRatio;
        drawX = (canvas.width - drawWidth) / 2;
      }

      if (drawWidth > canvas.width) {
        drawX = canvas.width - drawWidth;
      }

      coordsRef.current = { drawX, drawY, drawWidth, drawHeight };
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Adaptive image smoothing based on actual device DPR
    ctx.imageSmoothingEnabled = true;
    const actualDpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
    ctx.imageSmoothingQuality = actualDpr <= 1.5 ? "high" : "medium";

    const coords = coordsRef.current;
    ctx.drawImage(
      img, 
      Math.round(coords.drawX), 
      Math.round(coords.drawY), 
      Math.round(coords.drawWidth), 
      Math.round(coords.drawHeight)
    );
  }, []);

  // Initial Page Load: Only process Chapter 1
  useEffect(() => {
    let chapter1Loaded = 0;
    const temp1: HTMLImageElement[] = [];

    const triggerChapter1Loaded = () => {
      chapter1Loaded++;
      setImagesLoaded(chapter1Loaded);
      // Fast path: Unblock UI after initial frames load, remaining Chapter 1 loads natively in bg
      if (chapter1Loaded === INITIAL_VISIBLE_FRAMES) {
        setTimeout(() => setLoading(false), 450);
      }
    };

    for (let i = 1; i <= TOTAL_FRAMES_1; i++) {
      const img = new Image();
      const paddedIndex = String(i).padStart(3, '0');
      img.src = `/Reticulated-python-1/ezgif-frame-${paddedIndex}.jpg`;
      img.onload = () => {
        if (typeof img.decode === "function") {
          img.decode().then(triggerChapter1Loaded).catch(triggerChapter1Loaded);
        } else {
          triggerChapter1Loaded();
        }
      };
      img.onerror = triggerChapter1Loaded;
      temp1.push(img);
    }
    images1Ref.current = temp1;
  }, []);

  // Scroll-Triggered Progressive Preloading (Chapters 2 & 3)
  useEffect(() => {
    const requestIdle = typeof window !== 'undefined' && window.requestIdleCallback 
      ? window.requestIdleCallback 
      : (cb: () => void) => setTimeout(cb, 1);
    
    const triggerSilentLoad = () => {};

    const preloadChapter2 = () => {
      if (chapter2PreloadTriggered.current) return;
      chapter2PreloadTriggered.current = true;
      requestIdle(() => {
        const temp2: HTMLImageElement[] = [];
        for (let i = 1; i <= TOTAL_FRAMES_2; i++) {
          const img = new Image();
          const paddedIndex = String(i).padStart(3, '0');
          img.src = `/snake22/ezgif-frame-${paddedIndex}.png`;
          img.onload = () => {
            if (typeof img.decode === "function") img.decode().catch(triggerSilentLoad);
          };
          img.onerror = triggerSilentLoad;
          temp2.push(img);
        }
        images2Ref.current = temp2;
      });
    };

    const preloadChapter3 = () => {
      if (chapter3PreloadTriggered.current) return;
      chapter3PreloadTriggered.current = true;
      requestIdle(() => {
        const temp3: HTMLImageElement[] = [];
        for (let i = 1; i <= TOTAL_FRAMES_3; i++) {
          const img = new Image();
          const paddedIndex = String(i).padStart(3, '0');
          img.src = `/snake33/ezgif-frame-${paddedIndex}.png`;
          img.onload = () => {
            if (typeof img.decode === "function") img.decode().catch(triggerSilentLoad);
          };
          img.onerror = triggerSilentLoad;
          temp3.push(img);
        }
        images3Ref.current = temp3;
      });
    };

    const unsubscribe = smoothProgress.on("change", (latest) => {
      if (latest >= 0.20) preloadChapter2();
      if (latest >= 0.60) preloadChapter3();
    });

    return () => unsubscribe();
  }, [smoothProgress]);

  // Handle canvases resize and redraw immediately
  useEffect(() => {
    if (loading) return;

    const handleResize = () => {
      const currentScroll = smoothProgress.get();
      const dpr = typeof window !== 'undefined' ? Math.min(window.devicePixelRatio || 1, 1.5) : 1;

      // Handle Canvas 1 resizing
      const canvas1 = canvasRef1.current;
      if (canvas1) {
        const rect = canvas1.getBoundingClientRect();
        canvas1.width = Math.round(rect.width * dpr);
        canvas1.height = Math.round(rect.height * dpr);
        drawCoords1Ref.current = null; // Invalidate cache

        const progress1 = Math.min(1, Math.max(0, currentScroll * 3));
        const frameIndex1 = Math.max(0, Math.min(TOTAL_FRAMES_1 - 1, Math.floor(progress1 * TOTAL_FRAMES_1)));
        lastRenderedIndex1Ref.current = frameIndex1;
        drawImage(canvasRef1, images1Ref.current, frameIndex1, drawCoords1Ref);
      }

      // Handle Canvas 2 resizing
      const canvas2 = canvasRef2.current;
      if (canvas2) {
        const rect = canvas2.getBoundingClientRect();
        canvas2.width = Math.round(rect.width * dpr);
        canvas2.height = Math.round(rect.height * dpr);
        drawCoords2Ref.current = null; // Invalidate cache

        const progress2 = Math.min(1, Math.max(0, (currentScroll - 0.3333) * 3));
        const frameIndex2 = Math.max(0, Math.min(TOTAL_FRAMES_2 - 1, Math.floor(progress2 * TOTAL_FRAMES_2)));
        lastRenderedIndex2Ref.current = frameIndex2;
        drawImage(canvasRef2, images2Ref.current, frameIndex2, drawCoords2Ref);
      }

      // Handle Canvas 3 resizing
      const canvas3 = canvasRef3.current;
      if (canvas3) {
        const rect = canvas3.getBoundingClientRect();
        canvas3.width = Math.round(rect.width * dpr);
        canvas3.height = Math.round(rect.height * dpr);
        drawCoords3Ref.current = null; // Invalidate cache

        const progress3 = Math.min(1, Math.max(0, (currentScroll - 0.6666) * 3));
        const frameIndex3 = Math.max(0, Math.min(TOTAL_FRAMES_3 - 1, Math.floor(progress3 * TOTAL_FRAMES_3)));
        lastRenderedIndex3Ref.current = frameIndex3;
        drawImage(canvasRef3, images3Ref.current, frameIndex3, drawCoords3Ref);
      }
    };

    window.addEventListener("resize", handleResize);
    handleResize();

    return () => window.removeEventListener("resize", handleResize);
  }, [loading, drawImage, smoothProgress]);

  // Sync canvases redraw on scroll progress updates using requestAnimationFrame (60 FPS)
  useMotionValueEvent(smoothProgress, "change", (latest) => {
    // Reticulated Python (mapped over 0.0 to 0.333 progress)
    const progress1 = Math.min(1, Math.max(0, latest * 3));
    const frameIndex1 = Math.max(0, Math.min(TOTAL_FRAMES_1 - 1, Math.floor(progress1 * TOTAL_FRAMES_1)));
    
    if (frameIndex1 !== lastRenderedIndex1Ref.current) {
      lastRenderedIndex1Ref.current = frameIndex1;

      if (animationFrameId1Ref.current) {
        cancelAnimationFrame(animationFrameId1Ref.current);
      }

      animationFrameId1Ref.current = requestAnimationFrame(() => {
        drawImage(canvasRef1, images1Ref.current, frameIndex1, drawCoords1Ref);
      });
    }

    // Green Tree Python (mapped over 0.333 to 0.666 progress)
    const progress2 = Math.min(1, Math.max(0, (latest - 0.3333) * 3));
    const frameIndex2 = Math.max(0, Math.min(TOTAL_FRAMES_2 - 1, Math.floor(progress2 * TOTAL_FRAMES_2)));

    if (frameIndex2 !== lastRenderedIndex2Ref.current) {
      lastRenderedIndex2Ref.current = frameIndex2;

      if (animationFrameId2Ref.current) {
        cancelAnimationFrame(animationFrameId2Ref.current);
      }

      animationFrameId2Ref.current = requestAnimationFrame(() => {
        drawImage(canvasRef2, images2Ref.current, frameIndex2, drawCoords2Ref);
      });
    }

    // King Cobra (mapped over 0.666 to 1.0 progress)
    const progress3 = Math.min(1, Math.max(0, (latest - 0.6666) * 3));
    const frameIndex3 = Math.max(0, Math.min(TOTAL_FRAMES_3 - 1, Math.floor(progress3 * TOTAL_FRAMES_3)));

    if (frameIndex3 !== lastRenderedIndex3Ref.current) {
      lastRenderedIndex3Ref.current = frameIndex3;

      if (animationFrameId3Ref.current) {
        cancelAnimationFrame(animationFrameId3Ref.current);
      }

      animationFrameId3Ref.current = requestAnimationFrame(() => {
        drawImage(canvasRef3, images3Ref.current, frameIndex3, drawCoords3Ref);
      });
    }
  });

  const loadingPercentage = Math.min(100, Math.round((imagesLoaded / INITIAL_VISIBLE_FRAMES) * 100));

  // Metadata specifications
  const metadata1: MetadataItem[] = [
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

  const metadata2: MetadataItem[] = [
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
      value: "Up to 2 m",
      icon: <Ruler className="w-5 h-5" />
    },
    {
      label: "STATUS",
      value: "Least Concern",
      icon: <Shield className="w-5 h-5" />
    }
  ];

  const metadata3: MetadataItem[] = [
    {
      label: "VENOM",
      value: "Highly Venomous",
      icon: (
        <svg viewBox="0 0 100 100" className="w-5 h-5 fill-current">
          <path d="M50,15 C40,25 32,38 32,52 C32,65 40,75 50,75 C60,75 68,65 68,52 C68,38 60,25 50,15 Z" />
        </svg>
      )
    },
    {
      label: "SIZE",
      value: "Up to 5.5 m",
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
          
          {/* Chapter 1: Reticulated Python */}
          <motion.div 
            style={{ 
              opacity: opacity1,
              pointerEvents: activeIdx === 0 ? "auto" : "none"
            }} 
            className="absolute inset-0 w-full h-full"
          >
            <SnakeHero
              eyebrow="Native to Southeast Asia"
              eyebrowIcon={<MapPin className="w-4 h-4" />}
              title={
                <>
                  RETICULATED
                  <br />
                  PYTHON
                </>
              }
              description="The world's longest snake, capable of exceeding 6 meters. A master of camouflage and ambush, moving silently through the rainforests."
              metadata={metadata1}
              ctaText="Discover Species"
              backgroundColor="#ebb11c"
              textColor="text-neutral-950"
              canvasRef={canvasRef1}
            />
          </motion.div>

          {/* Chapter 2: Green Tree Python */}
          <motion.div 
            style={{ 
              opacity: opacity2,
              pointerEvents: activeIdx === 1 ? "auto" : "none"
            }} 
            className="absolute inset-0 w-full h-full"
          >
            <SnakeHero
              eyebrow="Native to South America"
              eyebrowIcon={<MapPin className="w-4 h-4" />}
              title={
                <>
                  <span className="text-[#70a35c]">GREEN TREE</span>
                  <br />
                  <span>PYTHON</span>
                </>
              }
              description="A vibrant arboreal snake known for its brilliant emerald coloration and exceptional camouflage among rainforest canopies."
              metadata={metadata2}
              ctaText="Discover Species"
              backgroundColor="#030303"
              textColor="text-white"
              canvasRef={canvasRef2}
            />
          </motion.div>

          {/* Chapter 3: King Cobra */}
          <motion.div 
            style={{ 
              opacity: opacity3,
              pointerEvents: activeIdx === 2 ? "auto" : "none"
            }} 
            className="absolute inset-0 w-full h-full"
          >
            <SnakeHero
              eyebrow="NATIVE TO SOUTH ASIA"
              eyebrowIcon={<MapPin className="w-4 h-4" />}
              title={
                <>
                  KING
                  <br />
                  COBRA
                </>
              }
              description="The world's longest venomous snake, feared and revered. A majestic guardian of the wild, moving with power and purpose."
              metadata={metadata3}
              ctaText="Discover this species"
              backgroundColor="#111612"
              textColor="text-white"
              canvasRef={canvasRef3}
            />
          </motion.div>

        </div>
      </div>
    </main>
  );
}
