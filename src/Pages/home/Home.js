import AiCapabilities from '../../components/landing/AiCapabilities';
import BeyondChat from '../../components/landing/BeyondChat';
import BusinessCapabilities from '../../components/landing/BusinessCapabilities';
import CTA from '../../components/landing/CTA';
import FAQs from '../../components/landing/FAQS';
import Features from '../../components/landing/Features';
import Hero from '../../components/landing/Hero';
import HowItWorks from '../../components/landing/HowItWorks';
import PowerConversations from '../../components/landing/PowerConversations';
import Pricing from '../../components/landing/Pricing';
import TrustCompliance from '../../components/landing/TrustCompliance';
import Footer from "../../components/Footer"

export default function Home() {
  return (
    <main>
      <Hero />
      <Features/>
      <PowerConversations/>
      <TrustCompliance/>
      <AiCapabilities/>
       <BeyondChat/>
       <HowItWorks/>
       <BusinessCapabilities/>
       <Pricing/>
       <FAQs/>
       <CTA/>
       <Footer/>

      {/* Future homepage sections */}
    
      {/* <HowItWorks /> */}
      {/* <Pricing /> */}
      {/* <FAQs /> */}
    </main>
  );
}