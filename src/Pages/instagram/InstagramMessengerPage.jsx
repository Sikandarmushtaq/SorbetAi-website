
import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

import InstagramMessengerHero from "./components/InstagramMessengerHero";

import {
  SocialBenefits,
  SocialHowItWorks,
  SocialChannelFeatures,
  SocialCommentAutomation,
  SocialRequirements,
  SocialFAQ,
  SocialRelated,
  SocialCTA,
} from "./components/InstagramMessengerSections";

import "./InstagramMessengerPage.css"
import Footer from "../../components/Footer";

gsap.registerPlugin(ScrollTrigger, useGSAP);

export default function InstagramMessengerPage() {
  const pageRef = useRef(null);

  useGSAP(
    () => {
      const reducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      ).matches;

      if (reducedMotion) return;

      // Hero animation
      gsap.fromTo(
        ".im-hero-reveal",
        { opacity: 0, y: 35, rotate: 0.8 },
        {
          opacity: 1,
          y: 0,
          rotate: 0,
          duration: 0.85,
          stagger: 0.12,
          ease: "back.out(1.35)",
        }
      );

      // Scroll animations
      gsap.utils.toArray(".im-reveal").forEach((el) => {
        gsap.fromTo(
          el,
          { opacity: 0, y: 28 },
          {
            opacity: 1,
            y: 0,
            duration: 0.7,
            ease: "power2.out",
            scrollTrigger: {
              trigger: el,
              start: "top 92%",
              once: true,
            },
          }
        );
      });

      // Organic blobs
      gsap.to(".im-blob", {
        rotation: 360,
        duration: 48,
        repeat: -1,
        ease: "none",
      });

      // Floating channel badges
      gsap.to(".im-float", {
        y: -12,
        duration: 2.6,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
        stagger: 0.35,
      });
    },
    { scope: pageRef }
  );

  return (
    <main className="im-page" ref={pageRef}>
      <InstagramMessengerHero />
      <SocialBenefits />
      <SocialHowItWorks />
      <SocialChannelFeatures />
      <SocialCommentAutomation />
      <SocialRequirements />
      <SocialFAQ />
      <SocialRelated />
      <SocialCTA />
      <Footer/>
    </main>
  );
}
