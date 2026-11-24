
import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

import WebsiteChatHero from "./components/WebsiteChatHero";

import {
  WebsiteChatBenefits,
  WebsiteChatHowItWorks,
  WebsiteChatVisitorExperience,
  WebsiteChatControls,
  WebsiteChatTeamResults,
  WebsiteChatRequirements,
  WebsiteChatFAQ,
  WebsiteChatRelated,
  WebsiteChatCTA,
} from "./components/WebsiteChatSections";

import "./WebsiteChatPage.css";


gsap.registerPlugin(ScrollTrigger, useGSAP);

export default function WebsiteChatPage() {
  const pageRef = useRef(null);

  useGSAP(
    () => {
      const reducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      ).matches;

      if (reducedMotion) return;

      gsap.fromTo(
        ".wc-hero-reveal",
        { y: 38, opacity: 0, rotate: 1 },
        {
          y: 0,
          opacity: 1,
          rotate: 0,
          stagger: 0.11,
          duration: 0.9,
          ease: "back.out(1.4)",
        }
      );

      gsap.utils.toArray(".wc-reveal").forEach((element) => {
        gsap.fromTo(
          element,
          { y: 30, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.75,
            ease: "power2.out",
            scrollTrigger: {
              trigger: element,
              start: "top 92%",
              once: true,
            },
          }
        );
      });

      gsap.to(".wc-blob", {
        rotate: 360,
        duration: 45,
        ease: "none",
        repeat: -1,
      });

      gsap.to(".wc-floating-label", {
        y: -10,
        duration: 2.6,
        repeat: -1,
        yoyo: true,
        stagger: 0.4,
        ease: "sine.inOut",
      });
    },
    { scope: pageRef }
  );

  return (
    <main className="wc-page" ref={pageRef}>
      <WebsiteChatHero />
      <WebsiteChatBenefits />
      <WebsiteChatHowItWorks />
      <WebsiteChatVisitorExperience />
      <WebsiteChatControls />
      <WebsiteChatTeamResults />
      <WebsiteChatRequirements />
      <WebsiteChatFAQ />
      <WebsiteChatRelated />
      <WebsiteChatCTA />
      
    </main>
  );
}
