"use client";

import { useEffect } from "react";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Instagram } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import MotoHero from "@/components/moto-revolution/MotoHero";
import MotoMission from "@/components/moto-revolution/MotoMission";
import MotoJoin from "@/components/moto-revolution/MotoJoin";
import MotoTimeline from "@/components/moto-revolution/MotoTimeline";
import MotoStats from "@/components/moto-revolution/MotoStats";
import MotoClosing from "@/components/moto-revolution/MotoClosing";

const MotoRevolution = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <Layout>
      <MotoHero />
      
      <section className="py-10 px-4 md:px-8 bg-black text-white">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-8">What is MotoRevolution</h2>
          <p className="text-lg md:text-xl leading-relaxed">
            MotoRevolution is more than a campaign — it's a movement.<br /><br />
            Born from the legacy of Shining Motors (est. 1930s), it's a call to unite all racers,
            tuners, workshops, garages, and car lovers across India and beyond.<br /><br />
            We aim to support local motorsport culture, empower creators, and reignite the
            automotive fire in every heart.
          </p>
        </div>
      </section>

      <MotoMission />
      <MotoJoin />
      <MotoTimeline />
      <MotoStats />
      <MotoClosing />
    </Layout>
  );
};

export default MotoRevolution;
