import React from "react";

const Badges: React.FC = () => {
  const badges = [
    {
      alt: "MIT License",
      src: "https://img.shields.io/badge/License-MIT-blue.svg",
      href: "https://opensource.org/licenses/MIT",
    },
    {
      alt: "React",
      src: "https://img.shields.io/badge/React-19-blue",
      href: "https://reactjs.org/",
    },
    {
      alt: "TypeScript",
      src: "https://img.shields.io/badge/TypeScript-5-blue",
      href: "https://www.typescriptlang.org/",
    },
    {
      alt: "AWS",
      src: "https://img.shields.io/badge/AWS-Powered-orange",
      href: "https://aws.amazon.com/",
    },
    {
      alt: "Terraform",
      src: "https://img.shields.io/badge/Terraform-1.0+-purple",
      href: "https://www.terraform.io/",
    },
    {
      alt: "Next.js",
      src: "https://img.shields.io/badge/Next.js-15-black",
      href: "https://nextjs.org/",
    },
  ];

  return (
    <div className="flex flex-wrap gap-2 items-center justify-center my-4">
      {badges.map((badge) => (
        <a
          key={badge.alt}
          href={badge.href}
          target="_blank"
          rel="noopener noreferrer"
          className="transition-transform hover:scale-105"
        >
          <img src={badge.src} alt={badge.alt} className="h-5" />
        </a>
      ))}
    </div>
  );
};

export default Badges;
