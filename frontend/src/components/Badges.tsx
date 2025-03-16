"use client";

import React from "react";
import Image from "next/image";

const Badges: React.FC = () => {
  const badges = [
    {
      name: "Next.js",
      src: "https://img.shields.io/badge/Next.js-black?style=for-the-badge&logo=next.js&logoColor=white",
      alt: "Next.js Badge",
      width: 120,
      height: 28,
    },
    {
      name: "TypeScript",
      src: "https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white",
      alt: "TypeScript Badge",
      width: 120,
      height: 28,
    },
    {
      name: "React",
      src: "https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB",
      alt: "React Badge",
      width: 120,
      height: 28,
    },
    {
      name: "Tailwind CSS",
      src: "https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white",
      alt: "Tailwind CSS Badge",
      width: 120,
      height: 28,
    },
    {
      name: "AWS",
      src: "https://img.shields.io/badge/AWS-232F3E?style=for-the-badge&logo=amazon-aws&logoColor=white",
      alt: "AWS Badge",
      width: 120,
      height: 28,
    },
  ];

  return (
    <div className="flex flex-wrap gap-4 justify-center items-center">
      {badges.map((badge) => (
        <Image
          key={badge.name}
          src={badge.src}
          alt={badge.alt}
          width={badge.width}
          height={badge.height}
          unoptimized // Since these are SVG badges from shields.io
        />
      ))}
    </div>
  );
};

export default Badges;
