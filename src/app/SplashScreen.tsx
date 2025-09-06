"use client";
import { useState, useEffect } from "react";
import Image from "next/image";

export default function SplashScreen({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 2000); // show splash for 2 seconds
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <div className="relative h-screen w-screen">
        {/* Background image fills the screen */}
        <Image
          src="/assests/img/YOU ARE INVITED.png" // your background image
          alt="Splash background"
          fill
          className="object-cover"
          priority
        />

        {/* Centered overlay text */}
        <div className="absolute inset-0 flex items-center justify-center bg-black/30">
          <h1 className="text-white text-4xl md:text-[250px] font-bold text-center">
            You&apos;re Invited
          </h1>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
