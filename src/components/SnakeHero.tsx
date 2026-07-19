import React from "react";

export interface MetadataItem {
  label: string;
  value: string;
  icon?: React.ReactNode;
}

export interface SnakeHeroProps {
  logoText?: string;
  eyebrow: string;
  eyebrowIcon?: React.ReactNode;
  title: React.ReactNode;
  description: string;
  metadata: MetadataItem[];
  ctaText?: string;
  backgroundColor?: string;
  textColor?: string;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
}

export const SnakeHero: React.FC<SnakeHeroProps> = ({
  logoText = "SNAKE ATLAS",
  eyebrow,
  eyebrowIcon,
  title,
  description,
  metadata,
  ctaText = "Discover Species",
  backgroundColor = "#ebb11c",
  textColor = "text-neutral-900",
  canvasRef,
}) => {
  return (
    <div 
      className={`relative w-screen h-screen overflow-hidden flex flex-col justify-between transition-colors duration-1000 ${textColor}`}
      style={{ backgroundColor }}
    >
      {/* 1. Header Navigation (Not Sticky) */}
      <nav className="relative z-20 w-full px-6 md:px-12 py-8 flex items-center justify-between pointer-events-auto">
        {/* Logo */}
        <div className="flex items-center gap-3 select-none">
          <svg 
            viewBox="0 0 100 100" 
            className="w-10 h-10 fill-current"
          >
            {/* Elegant minimalist stylized snake silhouette */}
            <path d="M25,28 C35,26 45,30 50,32 C55,30 65,26 75,28 C79,31 82,35 84,39 C80,36 74,35 69,38 C64,41 58,40 50,35 C42,40 36,41 31,38 C26,35 20,36 16,39 C18,35 21,31 25,28 Z" />
            <path d="M14,39 C12,41 11,44 12,47 C14,50 18,52 23,49 C21,46 18,43 14,39 Z" />
            <path d="M86,39 C88,41 89,44 88,47 C86,50 82,52 77,49 C79,46 82,43 86,39 Z" />
            <path d="M27,39 C31,38 34,35 37,39 C34,42 30,42 27,39 Z" />
            <path d="M73,39 C69,38 66,35 63,39 C66,42 70,42 73,39 Z" />
            <path d="M28,42 L39,63 L45,43 Z" />
            <path d="M72,42 L61,63 L55,43 Z" />
            <path d="M38,59 L50,82 L62,59 C56,62 50,65 44,62 Z" />
          </svg>
          <span className="font-sans font-bold tracking-[0.25em] text-xs md:text-sm select-none">
            {logoText}
          </span>
        </div>

        {/* Explore outline button */}
        <button 
          className={`px-7 py-2.5 rounded-full border border-current text-xs font-sans font-semibold tracking-wider hover:bg-neutral-900 hover:text-white transition-all duration-300 flex items-center gap-2 cursor-pointer`}
        >
          Explore <span className="text-[14px]">→</span>
        </button>
      </nav>

      {/* 2. Full-Screen Canvas in Background (z-0) */}
      <canvas 
        ref={canvasRef} 
        className="absolute inset-0 w-full h-full object-cover z-0 pointer-events-none animation-canvas" 
      />

      {/* 3. Content overlay container (z-10) */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-6 md:px-12 flex-1 flex flex-col justify-center pointer-events-none pb-12">
        <main className="w-full md:w-[50%] lg:w-[45%] flex flex-col justify-center items-start text-left pointer-events-auto">
          
          {/* Eyebrow */}
          <div className="flex items-center gap-2 mb-5 select-none opacity-80">
            {eyebrowIcon && <span className="w-4 h-4 flex items-center justify-center fill-current">{eyebrowIcon}</span>}
            <span className="text-[10px] md:text-[11px] font-sans font-bold tracking-[0.3em] uppercase">
              {eyebrow}
            </span>
          </div>

          {/* Heading */}
          <h1 className="font-serif font-light tracking-tight leading-[0.95] text-[40px] sm:text-[56px] md:text-[68px] lg:text-[80px] uppercase select-none mb-6">
            {title}
          </h1>

          {/* Divider */}
          <div className="w-14 h-[1px] bg-current opacity-30 mb-8" />

          {/* Description */}
          <p className="font-sans font-light text-sm sm:text-base leading-relaxed mb-10 opacity-90 max-w-[480px]">
            {description}
          </p>

          {/* Metadata Row */}
          <div className="flex items-center flex-nowrap gap-x-6 sm:gap-x-8 mb-10 select-none w-full max-w-lg lg:max-w-xl">
            {metadata.map((item, idx) => (
              <React.Fragment key={idx}>
                {idx > 0 && (
                  <div className={`h-8 w-[1px] bg-current opacity-20`} />
                )}
                <div className="flex items-start gap-3">
                  {item.icon && (
                    <span className="w-5 h-5 flex items-center justify-center mt-0.5 fill-current opacity-70">
                      {item.icon}
                    </span>
                  )}
                  <div className="flex flex-col whitespace-nowrap">
                    <span className="text-[9px] font-sans font-bold tracking-widest uppercase opacity-50 mb-0.5">
                      {item.label}
                    </span>
                    <span className="text-xs sm:text-sm font-sans font-semibold">
                      {item.value}
                    </span>
                  </div>
                </div>
              </React.Fragment>
            ))}
          </div>

          {/* CTA Button */}
          <button 
            className={`px-6 py-2.5 rounded-full border border-current text-xs font-sans font-semibold tracking-wider transition-all duration-300 flex items-center gap-2 cursor-pointer shadow-sm ${
              textColor.includes("text-white") 
                ? "hover:bg-white hover:text-neutral-950" 
                : "hover:bg-neutral-950 hover:text-white"
            }`}
          >
            {ctaText} <span className="text-[14px]">→</span>
          </button>

        </main>
      </div>

      {/* Decorative Empty Footer space */}
      <div className="h-16" />
    </div>
  );
};

export default SnakeHero;
