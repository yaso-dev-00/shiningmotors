"use client";
import { createContext, ReactNode, useContext, useRef, useState, Dispatch, SetStateAction, RefObject } from "react";

export interface ContextTypes {
  isDrag: boolean;
  setDrag: Dispatch<SetStateAction<boolean>>;
  muted: boolean;
  setMuted: Dispatch<SetStateAction<boolean>>;
  videoRefs: RefObject<(HTMLVideoElement | null)[]>;
  scrollRef: RefObject<HTMLDivElement | null>;
  homeVideoMute: boolean;
  setHomeVideoMute: Dispatch<SetStateAction<boolean>>;
}

const Context = createContext<ContextTypes | undefined>(undefined);

export const useMyContext = () => {
  const context = useContext(Context);
  return context;
};

export default function GlobalContext({ children }: { children: ReactNode }) {
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [homeVideoMute, setHomeVideoMute] = useState(false);
  const [isDrag, setDrag] = useState(false);
  const [muted, setMuted] = useState(false);
  const values: ContextTypes = {
    isDrag,
    setDrag,
    setMuted,
    muted,
    videoRefs,
    scrollRef,
    homeVideoMute,
    setHomeVideoMute,
  };
  return <Context.Provider value={values}>{children}</Context.Provider>;
}
