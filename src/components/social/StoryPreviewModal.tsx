import { useState, useRef, useEffect, useLayoutEffect } from "react";
import {
  Type,
  X,
  Trash2,
  CheckCircle2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  RotateCw,
  Image,
  Palette,
  Check,
} from "lucide-react";
import html2canvas from "html2canvas";
import { socialApi } from "@/integrations/supabase/modules/social";
import { useAuth } from "@/contexts/AuthContext";
import { useIsMobile } from "@/hooks/useIsMobile";
import NextImage from "next/image";

export interface StoryOverlay {
  id: string;
  type: "text";
  value: string;
  x: number;
  y: number;
  color?: string;
  fontFamily?: string;
  bgColor?: string;
  scale?: number;
  rotation?: number;
  fontSize?: number;
}

export const GRADIENTS = [
  "bg-gradient-to-br from-red-600 to-gray-400",
  "bg-gradient-to-br from-blue-500 to-purple-400",
  "bg-gradient-to-br from-green-400 to-blue-500",
  "bg-gradient-to-br from-yellow-400 to-pink-500",
  "bg-gradient-to-br from-pink-500 to-orange-400",
  "bg-gradient-to-br from-indigo-500 to-blue-300",
  "bg-gradient-to-br from-teal-400 to-lime-300",
  "bg-gradient-to-br from-gray-700 to-gray-300",
  "bg-gradient-to-br from-amber-400 to-fuchsia-500",
  "bg-gradient-to-br from-cyan-400 to-blue-600",
  "bg-gradient-to-br from-emerald-400 to-cyan-600",
  "bg-gradient-to-br from-orange-300 to-rose-500",
];

export const GRADIENT_CSS: Record<string, string> = {
  "bg-gradient-to-br from-red-600 to-gray-400":
    "linear-gradient(to bottom right, #dc2626, #9ca3af)",
  "bg-gradient-to-br from-blue-500 to-purple-400":
    "linear-gradient(to bottom right, #3b82f6, #a78bfa)",
  "bg-gradient-to-br from-green-400 to-blue-500":
    "linear-gradient(to bottom right, #4ade80, #3b82f6)",
  "bg-gradient-to-br from-yellow-400 to-pink-500":
    "linear-gradient(to bottom right, #facc15, #ec4899)",
  "bg-gradient-to-br from-pink-500 to-orange-400":
    "linear-gradient(to bottom right, #ec4899, #fb923c)",
  "bg-gradient-to-br from-indigo-500 to-blue-300":
    "linear-gradient(to bottom right, #6366f1, #60a5fa)",
  "bg-gradient-to-br from-teal-400 to-lime-300":
    "linear-gradient(to bottom right, #2dd4bf, #bef264)",
  "bg-gradient-to-br from-gray-700 to-gray-300":
    "linear-gradient(to bottom right, #374151, #d1d5db)",
  "bg-gradient-to-br from-amber-400 to-fuchsia-500":
    "linear-gradient(to bottom right, #fbbf24, #d946ef)",
  "bg-gradient-to-br from-cyan-400 to-blue-600":
    "linear-gradient(to bottom right, #22d3ee, #2563eb)",
  "bg-gradient-to-br from-emerald-400 to-cyan-600":
    "linear-gradient(to bottom right, #34d399, #0891b2)",
  "bg-gradient-to-br from-orange-300 to-rose-500":
    "linear-gradient(to bottom right, #fdba74, #f43f5e)",
};

interface StoryPreviewModalProps {
  open: boolean;
  media: string | null;
  isVideo: boolean;
  overlays: StoryOverlay[];
  setOverlays: (fn: (prev: StoryOverlay[]) => StoryOverlay[]) => void;
  onClose: () => void;
  mode: "photo" | "text";
  background?: string;
  onBackgroundChange?: (bg: string) => void;
  onExportImage?: (blob: Blob) => void;
  onStoryCreated?: () => void;
}

const fontOptions = [
  { label: "Default", value: "inherit" },
  { label: "Arial", value: "Arial, sans-serif" },
  { label: "Helvetica", value: "Helvetica, Arial, sans-serif" },
  { label: "Times", value: "Times, 'Times New Roman', serif" },
  { label: "Georgia", value: "Georgia, serif" },
  // { label: "Verdana", value: "Verdana, Geneva, sans-serif" },
  // { label: "Courier", value: "'Courier New', Courier, monospace" },
  // { label: "Comic Sans", value: "'Comic Sans MS', cursive, sans-serif" },
  // { label: "Impact", value: "Impact, 'Arial Black', sans-serif" },
  // { label: "Trebuchet", value: "'Trebuchet MS', Helvetica, sans-serif" },
  // {
  //   label: "Palatino",
  //   value: "'Palatino Linotype', 'Book Antiqua', Palatino, serif",
  // },
  { label: "Garamond", value: "Garamond, 'Times New Roman', serif" },
  { label: "Century Gothic", value: "'Century Gothic', sans-serif" },
  { label: "Lucida Console", value: "'Lucida Console', Monaco, monospace" },
  { label: "Tahoma", value: "Tahoma, Geneva, sans-serif" },
];

const bgColorOptions = [
  "#000000",
  "#ffffff",
  "#ff4081",
  "#2196f3",
  "#4caf50",
  "#ffeb3b",
  "#ff9800",
  "#9c27b0",
  "#795548",
  "#607d8b",
];

// Helper to build overlays JSON for backend
function buildOverlaysJson({
  backgroundColor,
  mediaType,
  mediaPosition,
  mediaZoom,
  mediaRotation,
  mediaWidth,
  mediaHeight,
  textOverlays,
}: {
  backgroundColor: string | null | undefined;
  mediaType: "image" | "video";
  mediaPosition: { x: number; y: number };
  mediaZoom: number;
  mediaRotation: number;
  mediaWidth: number;
  mediaHeight: number;
  textOverlays: Array<{
    value: string;
    color?: string;
    bgColor?: string;
    fontFamily?: string;
    fontSize?: number;
    x: number;
    y: number;
    rotation?: number;
    scale?: number;
  }>;
}) {
  return {
    backgroundColor: backgroundColor ?? undefined,
    media: {
      type: mediaType,
      position: mediaPosition,
      scale: mediaZoom,
      rotation: mediaRotation,
      size: { width: mediaWidth, height: mediaHeight },
    },
    texts: textOverlays.map((t) => ({
      text: t.value,
      color: t.color,
      backgroundColor: t.bgColor,
      fontFamily: t.fontFamily,
      fontSize: t.fontSize,
      position: { x: t.x, y: t.y },
      rotation: t.rotation,
      scale: t.scale,
    })),
  };
}

const StoryPreviewModal = ({
  open,
  media,
  isVideo,
  overlays,
  setOverlays,
  onClose,
  mode,
  background,
  onBackgroundChange,
  onExportImage,
  onStoryCreated,
}: StoryPreviewModalProps) => {
  const [zoom, setZoom] = useState(1); // Media zoom
  const [rotation, setRotation] = useState(0); // Media rotation
  const { user } = useAuth();
  const [showTextInput, setShowTextInput] = useState(false);
  const [textInputValue, setTextInputValue] = useState("");
  const [textInputColor, setTextInputColor] = useState("#ffffff");
  const [textInputFont, setTextInputFont] = useState("inherit");
  const textInputRef = useRef<HTMLInputElement>(null);
  const [editingOverlayId, setEditingOverlayId] = useState<string | null>(null);
  const [editingTextValue, setEditingTextValue] = useState("");
  const [editingColor, setEditingColor] = useState("#ffffff");
  const [editingFont, setEditingFont] = useState("inherit");
  const [editingBgColor, setEditingBgColor] = useState<string | undefined>(
    undefined
  );
  const [leftPanel, setLeftPanel] = useState<null | "color" | "font" | "bg">(
    null
  );
  const isMobile = useIsMobile();

  // Drag state for overlays (mouse & touch)
  const [draggedOverlayId, setDraggedOverlayId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number } | null>(
    null
  );

  // Drag state for media (mouse & touch pan)
  const [draggingMedia, setDraggingMedia] = useState(false);
  const [mediaOffset, setMediaOffset] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [mediaPos, setMediaPos] = useState<{ x: number; y: number }>({
    x: 0,
    y: 0,
  });
  const previewRef = useRef<HTMLDivElement>(null);
  const [showBgModal, setShowBgModal] = useState(false);

  // States for media touch gestures (zoom, rotate)
  const [gestureStartZoom, setGestureStartZoom] = useState(1);
  const [gestureStartRotation, setGestureStartRotation] = useState(0);
  const [initialPinchDistance, setInitialPinchDistance] = useState<
    number | null
  >(null);
  const [initialFingerAngle, setInitialFingerAngle] = useState<number | null>(
    null
  );
  const [isMediaGesturing, setIsMediaGesturing] = useState(false);

  // States for text overlay touch gestures (scale, rotate)
  const [activeTextGestureOverlayId, setActiveTextGestureOverlayId] = useState<
    string | null
  >(null);
  const [initialTextPinchDistance, setInitialTextPinchDistance] = useState<
    number | null
  >(null);
  const [gestureStartTextScale, setGestureStartTextScale] = useState(1);
  const [initialTextFingerAngle, setInitialTextFingerAngle] = useState<
    number | null
  >(null);
  const [gestureStartTextRotation, setGestureStartTextRotation] = useState(0);
  const [isTextTransforming, setIsTextTransforming] = useState(false);

  const [backgroundColor, setBackgroundColor] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [mediaWidth, setMediaWidth] = useState(0);
  const [mediaHeight, setMediaHeight] = useState(0);
  const [showDiscardConfirmModal, setShowDiscardConfirmModal] = useState(false);

  const leftPanelRef = useRef<HTMLDivElement | null>(null);
  const textInputContainerRef = useRef<HTMLDivElement | null>(null);

  // State for which option bar is open in text mode
  const [textModeOption, setTextModeOption] = useState<
    null | "background" | "color" | "font"
  >(null);

  // Ref for bottom bar (color/font)
  const bottomBarRef = useRef<HTMLDivElement | null>(null);

  // Dynamic font size for text story textarea/overlay
  const [dynamicFontSize, setDynamicFontSize] = useState(12); // start large
  const dynamicTextareaRef = useRef<HTMLTextAreaElement>(null);
  const mirrorDivRef = useRef<HTMLDivElement>(null);
  const storyBoxRef = useRef<HTMLDivElement>(null);

  // Helper to get current text value
  const currentTextValue = editingOverlayId ? editingTextValue : textInputValue;

  // Auto-resize textarea when value changes
  useEffect(() => {
    if (dynamicTextareaRef.current) {
      dynamicTextareaRef.current.style.height = "auto";
      dynamicTextareaRef.current.style.height =
        dynamicTextareaRef.current.scrollHeight + "px";
    }
  }, [overlays[0]?.value]);

  // Adjust font size to always fit the box
  useLayoutEffect(() => {
    if (mode !== "text" || !showTextInput) return;
    const textarea = dynamicTextareaRef.current;
    if (!textarea) return;
    let fontSize = isMobile ? 20 : 30;
    textarea.style.fontSize = fontSize + "px";
    // Reduce font size until content fits in the visible area (4 rows)
    while (fontSize > 14 && textarea.scrollHeight > textarea.clientHeight) {
      fontSize -= 2;
      textarea.style.fontSize = fontSize + "px";
    }
    setDynamicFontSize(fontSize);
  }, [currentTextValue, showTextInput, mode, isMobile]);

  // Automatically open text input for text story type
  useEffect(() => {
    if (open && mode === "text") {
      setShowTextInput(true);
    }
  }, [open, mode]);

  // Helper to check if text overlays are valid (for text stories)
  const isTextStoryValid =
    mode === "text"
      ? overlays.some((o) => o.value && o.value.trim() !== "")
      : true;

  // Prevent background scroll when modal is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  // Add effect to close leftPanel on outside click/touch
  useEffect(() => {
    if (!leftPanel) return;
    function handleClick(e: MouseEvent | TouchEvent) {
      const panel = leftPanelRef.current;
      const input = textInputContainerRef.current;
      if (
        panel &&
        !panel.contains(e.target as Node) &&
        input &&
        !input.contains(e.target as Node)
      ) {
        setLeftPanel(null);
      }
    }
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("touchstart", handleClick);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("touchstart", handleClick);
    };
  }, [leftPanel]);

  // Close color/font bar on outside click
  useEffect(() => {
    if (textModeOption !== "color" && textModeOption !== "font") return;
    function handleClick(e: MouseEvent | TouchEvent) {
      if (
        bottomBarRef.current &&
        !bottomBarRef.current.contains(e.target as Node)
      ) {
        setTextModeOption(null);
      }
    }
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("touchstart", handleClick);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("touchstart", handleClick);
    };
  }, [textModeOption]);

  // --- Overlay Drag (Mouse) ---
  const handleOverlayMouseDown = (
    e: React.MouseEvent,
    overlay: StoryOverlay
  ) => {
    if (mode === "text" || showTextInput) return; // Disable drag in text mode or when text input is open in media mode
    if (
      (e.target as HTMLElement).tagName === "INPUT" ||
      (e.target as HTMLElement).tagName === "SELECT" ||
      (e.target as HTMLElement).tagName === "BUTTON"
    )
      return;
    if (editingOverlayId === overlay.id) return;

    e.stopPropagation();
    const previewRect = previewRef.current?.getBoundingClientRect();
    const overlayDiv = e.currentTarget as HTMLDivElement;
    if (!previewRect || !overlayDiv) return;

    // Get the overlay's center in page coordinates
    const overlayRect = overlayDiv.getBoundingClientRect();
    const overlayCenterX = overlayRect.left + overlayRect.width / 2;
    const overlayCenterY = overlayRect.top + overlayRect.height / 2;

    setDraggedOverlayId(overlay.id);
    setDragOffset({
      x: e.clientX - overlayCenterX,
      y: e.clientY - overlayCenterY,
    });
    setActiveTextGestureOverlayId(null);
    setIsTextTransforming(false);
  };

  // --- Media Drag (Mouse) ---
  const handleMediaMouseDown = (e: React.MouseEvent) => {
    if (mode === "text" || showTextInput) return; // No media drag in text mode or when text input is open in media mode
    if ((e.target as HTMLElement).dataset.overlay === "true") return;
    e.stopPropagation();
    const previewRect = previewRef.current?.getBoundingClientRect();
    if (!previewRect) return;
    setDraggingMedia(true);
    setIsMediaGesturing(true);
    setMediaOffset({
      x: e.clientX - (previewRect.left + mediaPos.x),
      y: e.clientY - (previewRect.top + mediaPos.y),
    });
  };

  // --- Global Mouse Move (Preview Area) ---
  const handlePreviewMouseMove = (e: React.MouseEvent) => {
    if (mode === "text") return; // No drag in text mode
    if (draggedOverlayId && dragOffset) {
      const preview = previewRef.current;
      if (!preview) return;
      const rect = preview.getBoundingClientRect();
      const x = ((e.clientX - rect.left - dragOffset.x) / rect.width) * 100;
      const y = ((e.clientY - rect.top - dragOffset.y) / rect.height) * 100;
      setOverlays((prev) =>
        prev.map((o) => (o.id === draggedOverlayId ? { ...o, x, y } : o))
      );
    } else if (draggingMedia && mediaOffset && mode === "photo") {
      const preview = previewRef.current;
      if (!preview) return;
      const rect = preview.getBoundingClientRect();
      const x = e.clientX - rect.left - mediaOffset.x;
      const y = e.clientY - rect.top - mediaOffset.y;
      setMediaPos({ x, y });
    }
  };

  // --- Global Mouse Up (Preview Area) ---
  const handlePreviewMouseUp = () => {
    if (mode === "text") return; // No drag in text mode
    if (draggedOverlayId) {
      setDraggedOverlayId(null);
      setDragOffset(null);
    }
    if (draggingMedia) {
      setDraggingMedia(false);
      setIsMediaGesturing(false);
      setMediaOffset(null);
    }
  };

  // --- Text Overlay Touch Start ---
  const handleTextOverlayTouchStart = (
    e: React.TouchEvent,
    overlay: StoryOverlay
  ) => {
    if (mode === "text" || showTextInput) return; // Disable drag/transform in text mode or when text input is open in media mode
    if (editingOverlayId === overlay.id) return;
    e.stopPropagation();

    const currentOverlay = overlays.find((o) => o.id === overlay.id);
    if (!currentOverlay) return;

    setActiveTextGestureOverlayId(overlay.id);

    if (e.touches.length === 2) {
      e.preventDefault();
      setDraggedOverlayId(null);
      setDragOffset(null);
      setIsTextTransforming(true);

      const touch1 = e.touches[0];
      const touch2 = e.touches[1];

      const distance = Math.hypot(
        touch2.clientX - touch1.clientX,
        touch2.clientY - touch1.clientY
      );
      setInitialTextPinchDistance(distance);
      setGestureStartTextScale(currentOverlay.scale || 1);

      const angle =
        Math.atan2(
          touch2.clientY - touch1.clientY,
          touch2.clientX - touch1.clientX
        ) *
        (180 / Math.PI);
      setInitialTextFingerAngle(angle);
      setGestureStartTextRotation(currentOverlay.rotation || 0);
    } else if (e.touches.length === 1) {
      const previewRect = previewRef.current?.getBoundingClientRect();
      if (!previewRect) return;

      setDraggedOverlayId(overlay.id);
      setDragOffset({
        x:
          e.touches[0].clientX -
          (previewRect.left + (currentOverlay.x / 100) * previewRect.width),
        y:
          e.touches[0].clientY -
          (previewRect.top + (currentOverlay.y / 100) * previewRect.height),
      });
      setInitialTextPinchDistance(null);
      setInitialTextFingerAngle(null);
      setIsTextTransforming(false);
    }
  };

  // --- Media Touch Start (on Preview Area) ---
  const handleMediaTouchStart = (e: React.TouchEvent) => {
    if (mode === "text" || showTextInput) return; // No media drag in text mode or when text input is open in media mode
    if (mode !== "photo") return;
    if ((e.target as HTMLElement).closest('[data-overlay="true"]')) {
      return;
    }
    if (activeTextGestureOverlayId) return;

    if (e.touches.length === 2) {
      e.preventDefault();
      setDraggingMedia(false);
      setIsMediaGesturing(true);
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const distance = Math.hypot(
        touch2.clientX - touch1.clientX,
        touch2.clientY - touch1.clientY
      );
      setInitialPinchDistance(distance);
      setGestureStartZoom(zoom);
      const angle =
        Math.atan2(
          touch2.clientY - touch1.clientY,
          touch2.clientX - touch1.clientX
        ) *
        (180 / Math.PI);
      setInitialFingerAngle(angle);
      setGestureStartRotation(rotation);
    } else if (e.touches.length === 1) {
      setInitialPinchDistance(null);
      setInitialFingerAngle(null);
      const touch = e.touches[0];
      const previewRect = previewRef.current?.getBoundingClientRect();
      if (!previewRect) return;
      setDraggingMedia(true);
      setIsMediaGesturing(true);
      setMediaOffset({
        x: touch.clientX - (previewRect.left + mediaPos.x),
        y: touch.clientY - (previewRect.top + mediaPos.y),
      });
    }
  };

  // --- Global Touch Move (on Preview Area) ---
  const handlePreviewTouchMove = (e: React.TouchEvent) => {
    if (mode === "text") return; // No drag in text mode
    if (
      activeTextGestureOverlayId &&
      initialTextPinchDistance != null &&
      initialTextFingerAngle != null &&
      e.touches.length === 2
    ) {
      e.preventDefault();
      setIsTextTransforming(true);
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];

      const currentDistance = Math.hypot(
        touch2.clientX - touch1.clientX,
        touch2.clientY - touch1.clientY
      );
      let newScale =
        gestureStartTextScale * (currentDistance / initialTextPinchDistance);
      newScale = Math.max(0.3, Math.min(4, newScale));

      const currentAngle =
        Math.atan2(
          touch2.clientY - touch1.clientY,
          touch2.clientX - touch1.clientX
        ) *
        (180 / Math.PI);
      const angleDifference = currentAngle - initialTextFingerAngle;
      const newRotation = gestureStartTextRotation + angleDifference;

      setOverlays((prevOverlays) =>
        prevOverlays.map((o) =>
          o.id === activeTextGestureOverlayId
            ? { ...o, scale: newScale, rotation: newRotation }
            : o
        )
      );
    } else if (
      draggedOverlayId &&
      dragOffset &&
      e.touches.length === 1 &&
      activeTextGestureOverlayId === draggedOverlayId
    ) {
      const touch = e.touches[0];
      const preview = previewRef.current;
      if (!preview) return;
      const rect = preview.getBoundingClientRect();
      const x = ((touch.clientX - rect.left - dragOffset.x) / rect.width) * 100;
      const y = ((touch.clientY - rect.top - dragOffset.y) / rect.height) * 100;
      setOverlays((prevOverlays) =>
        prevOverlays.map((o) =>
          o.id === draggedOverlayId ? { ...o, x, y } : o
        )
      );
    } else if (
      mode === "photo" &&
      !activeTextGestureOverlayId &&
      !draggedOverlayId
    ) {
      if (
        e.touches.length === 2 &&
        initialPinchDistance !== null &&
        initialFingerAngle !== null
      ) {
        e.preventDefault();
        setIsMediaGesturing(true);
        const touch1 = e.touches[0];
        const touch2 = e.touches[1];
        const currentDistance = Math.hypot(
          touch2.clientX - touch1.clientX,
          touch2.clientY - touch1.clientY
        );
        if (initialPinchDistance > 0) {
          const scaleFactor = currentDistance / initialPinchDistance;
          setZoom(Math.max(0.5, Math.min(3, gestureStartZoom * scaleFactor)));
        }
        const currentFingerAngle =
          Math.atan2(
            touch2.clientY - touch1.clientY,
            touch2.clientX - touch1.clientX
          ) *
          (180 / Math.PI);
        setRotation(
          gestureStartRotation + (currentFingerAngle - initialFingerAngle)
        );
      } else if (e.touches.length === 1 && draggingMedia && mediaOffset) {
        setIsMediaGesturing(true);
        const touch = e.touches[0];
        const preview = previewRef.current;
        if (!preview) return;
        const rect = preview.getBoundingClientRect();
        const x = touch.clientX - rect.left - mediaOffset.x;
        const y = touch.clientY - rect.top - mediaOffset.y;
        setMediaPos({ x, y });
      }
    }
  };

  // --- Global Touch End/Cancel (on Preview Area) ---
  const handlePreviewTouchEnd = (e: React.TouchEvent) => {
    if (mode === "text") return; // No drag in text mode
    if (activeTextGestureOverlayId) {
      if (initialTextPinchDistance != null || initialTextFingerAngle != null) {
        if (e.touches.length < 2) {
          setInitialTextPinchDistance(null);
          setInitialTextFingerAngle(null);
        }
      }
      if (
        draggedOverlayId === activeTextGestureOverlayId &&
        e.touches.length === 0
      ) {
        setDraggedOverlayId(null);
        setDragOffset(null);
      }

      if (e.touches.length === 0) {
        setActiveTextGestureOverlayId(null);
        setIsTextTransforming(false);
      }
    } else if (draggedOverlayId && e.touches.length === 0) {
      setDraggedOverlayId(null);
      setDragOffset(null);
    }

    if (mode === "photo") {
      if (e.touches.length < 2) {
        setInitialPinchDistance(null);
        setInitialFingerAngle(null);
      }
      if (
        (draggingMedia && e.touches.length === 0) ||
        (isMediaGesturing && e.touches.length === 0)
      ) {
        setDraggingMedia(false);
        setIsMediaGesturing(false);
        setMediaOffset(null);
      }
    }
  };

  const renderToolbar = (isEditing: boolean) => (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 flex gap-2 sm:gap-4 items-center rounded-full px-2 sm:px-3 md:px-2 py-1 sm:py-2 md:py-1">
      <button
        onClick={() => setLeftPanel("color")}
        className="w-9 h-9 sm:w-10 sm:h-10 md:w-9 md:h-9 flex items-center justify-center rounded-full border border-gray-300 bg-white"
        type="button"
        disabled={loading}
      >
        <Palette className="w-5 h-5 sm:w-6 sm:h-6 md:w-4 md:h-4 text-gray-700" />
      </button>
      <button
        onClick={() => setLeftPanel("font")}
        className="w-9 h-9 sm:w-10 sm:h-10 md:w-9 md:h-9 flex items-center justify-center rounded-full border border-gray-300 bg-white"
        type="button"
        disabled={loading}
      >
        <span className="font-bold text-md sm:text-lg md:text-base">Aa</span>
      </button>

      <button
        className="w-14 h-8 sm:w-16 sm:h-10 md:w-12 md:h-8 flex items-center justify-center rounded-full bg-blue-600 text-white font-semibold text-sm sm:text-base md:text-xs"
        onClick={() => {
          if (loading) return;
          if (isEditing) {
            if (editingTextValue.trim() === "") {
              setOverlays((prev) =>
                prev.filter((o) => o.id !== editingOverlayId)
              );
            } else {
              setOverlays((prev) =>
                prev.map((o) =>
                  o.id === editingOverlayId
                    ? {
                        ...o,
                        value: editingTextValue,
                        color: editingColor,
                        fontFamily: editingFont,
                        bgColor: editingBgColor,
                        fontSize: 24 * (o.scale || 1),
                      }
                    : o
                )
              );
            }
            setEditingOverlayId(null);
          } else {
            if (textInputValue.trim() !== "") {
              setOverlays((prev) => [
                ...prev,
                {
                  id: Date.now().toString(),
                  type: "text",
                  value: textInputValue,
                  x: 50,
                  y: 50,
                  color: textInputColor,
                  fontFamily: textInputFont,
                  bgColor: editingBgColor,
                  scale: 1,
                  rotation: 0,
                  fontSize: 24,
                },
              ]);
            }
            setShowTextInput(false);
            setTextInputValue("");
          }
          setLeftPanel(null);
        }}
        type="button"
        disabled={loading}
      >
        Done
      </button>
    </div>
  );

  // Render top-left horizontal icon buttons for text mode
  const renderTextModeTopLeftIcons = () => (
    <div
      className={`absolute top-7 z-[55] flex flex-row gap-3 items-center ${
        mode !== "text" && showTextInput
          ? "left-1/2 -translate-x-1/2 justify-center"
          : "left-4"
      }`}
      style={
        mode !== "text" && showTextInput
          ? { transform: "translateX(-50%)" }
          : {}
      }
    >
      {mode === "text" && (
        <button
          className={`w-8 h-8 flex items-center justify-center rounded-full border ${
            textModeOption === "background"
              ? "border-blue-500 bg-blue-100"
              : "border-gray-300 bg-white"
          }`}
          onClick={() => {
            setShowBgModal(true); // Always open modal for background selection
            setTextModeOption(null); // Remove bottom bar logic
          }}
          type="button"
        >
          <Palette className="w-5 h-5 text-gray-700" />
        </button>
      )}
      <button
        className={`w-8 h-8 flex items-center justify-center rounded-full border ${
          textModeOption === "color"
            ? "border-blue-500 bg-blue-100"
            : "border-gray-300 bg-white"
        }`}
        onClick={() =>
          setTextModeOption(textModeOption === "color" ? null : "color")
        }
        type="button"
      >
        <span
          className="w-5 h-5 rounded-full border border-gray-400"
          style={{
            background: editingOverlayId ? editingColor : textInputColor,
          }}
        />
      </button>
      <button
        className={`w-8 h-8 flex items-center justify-center rounded-full border ${
          textModeOption === "font"
            ? "border-blue-500 bg-blue-100"
            : "border-gray-300 bg-white"
        }`}
        onClick={() =>
          setTextModeOption(textModeOption === "font" ? null : "font")
        }
        type="button"
      >
        <span
          className="font-bold text-md"
          style={{ fontFamily: editingOverlayId ? editingFont : textInputFont }}
        >
          Aa
        </span>
      </button>
    </div>
  );

  // Remove the bottom bar for gradients in text mode
  const renderTextModeBottomBar = () => {
    if (!textModeOption) return null;
    if (textModeOption === "background") {
      return (
        <div
          className="absolute bottom-0 left-0 right-0 z-[60] flex items-center justify-center py-4 px-2  rounded-full"
          style={{ width: "100%" }}
        >
          <div className="flex flex-row gap-2 overflow-x-auto scrollbar-hide px-2">
            {GRADIENTS.map((g) => (
              <button
                key={g}
                className={`w-8 h-8 rounded-full relative flex items-center justify-center transition-all duration-150 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400 ${
                  background === g
                    ? "border-2 border-blue-500 ring-1 ring-blue-500"
                    : "border-2 border-gray-300"
                } ${g}`}
                onClick={() => {
                  setBackgroundColor(null);
                  onBackgroundChange?.(g);
                  setTextModeOption(null);
                }}
                tabIndex={0}
                aria-label="Select background"
              >
                {background === g && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Check size={18} className="text-white drop-shadow" />
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      );
    }
    if (textModeOption === "color") {
      return (
        <div
          ref={bottomBarRef}
          className="absolute left-0 right-0 bottom-0 z-[999] flex items-center justify-center gap-2 py-3 px-2 pb-2"
          style={{
            width: "100%",

            borderBottomLeftRadius: "1.5rem",
            borderBottomRightRadius: "1.5rem",
          }}
        >
          {[
            "#ffffff",
            "#000000",
            "#ff4081",
            "#2196f3",
            "#4caf50",
            "#ffeb3b",
            "#ff9800",
            "#9c27b0",
            "#795548",
            "#00bcd4",
          ].map((c) => (
            <button
              key={c}
              className={`w-7 h-7 rounded-full border-2 ${
                overlays[0]?.color === c ||
                (!overlays[0] && textInputColor === c)
                  ? "border-blue-500 ring-1 ring-blue-500"
                  : "border-gray-300"
              }`}
              style={{ background: c }}
              onClick={() => {
                if (overlays[0]) {
                  setOverlays((prev) =>
                    prev.length > 0 ? [{ ...prev[0], color: c }] : prev
                  );
                } else {
                  setTextInputColor(c);
                }
              }}
            />
          ))}
        </div>
      );
    }
    if (textModeOption === "font") {
      return (
        <div
          ref={bottomBarRef}
          className="absolute left-0 right-0 bottom-0 z-[999] flex items-center justify-center gap-2 py-3 px-2 pb-2"
          style={{
            width: "100%",

            borderBottomLeftRadius: "1.5rem",
            borderBottomRightRadius: "1.5rem",
          }}
        >
          {fontOptions.map((opt) => {
            const isSelected =
              overlays[0]?.fontFamily === opt.value ||
              (!overlays[0] && textInputFont === opt.value);
            return (
              <button
                key={opt.value}
                className={`w-9 h-9 flex items-center justify-center rounded-full border-2 font-bold text-md transition-all ${
                  isSelected
                    ? "border-red-500 bg-white text-red-500"
                    : "border-black bg-black text-white"
                }`}
                style={{ fontFamily: opt.value }}
                onClick={() => {
                  if (overlays[0]) {
                    setOverlays((prev) =>
                      prev.length > 0
                        ? [{ ...prev[0], fontFamily: opt.value }]
                        : prev
                    );
                  } else {
                    setTextInputFont(opt.value);
                  }
                }}
              >
                Aa
              </button>
            );
          })}
        </div>
      );
    }
    return null;
  };

  // When in text mode and editing input, update input style immediately on color/font change
  useEffect(() => {
    if (
      mode === "text" &&
      overlays.length === 0 &&
      (textModeOption === "color" || textModeOption === "font")
    ) {
      // If no overlay yet, update input color/font from last picked
      if (textModeOption === "color" && overlays.length === 0) {
        setTextInputColor((prev) => prev); // force re-render
      }
      if (textModeOption === "font" && overlays.length === 0) {
        setTextInputFont((prev) => prev);
      }
    }
  }, [mode, overlays, textModeOption, textInputColor, textInputFont]);

  // Unified Create Story handler for both text and media stories
  const handleCreateStory = async () => {
    if (
      (mode === "text" &&
        (!isTextStoryValid ||
          showTextInput ||
          editingOverlayId ||
          activeTextGestureOverlayId ||
          draggedOverlayId ||
          loading ||
          success)) ||
      (mode !== "text" && (loading || success))
    ) {
      return;
    }
    setError(null);
    setSuccess(false);
    setLoading(true);
    try {
      if (!user || !user.id) throw new Error("Not authenticated");
      let storyType: "text" | "image" | "video" = isVideo ? "video" : "image";
      let mediaUrl = media || "";
      let overlaysJson: {
        backgroundColor?: string;
        texts?: any[];
        media?: any;
        textOverlays?: any[];
      };
      if (mode === "text") {
        storyType = "text";
        mediaUrl = "";
        overlaysJson = {
          backgroundColor: backgroundColor || background,
          texts: overlays.map((o) => ({
            text: o.value,
            color: o.color,
            fontFamily: o.fontFamily,
            fontSize: o.fontSize,
          })),
        };
      } else {
        overlaysJson = buildOverlaysJson({
          backgroundColor: (backgroundColor || background) ?? undefined,
          mediaType: isVideo ? "video" : "image",
          mediaPosition: mediaPos,
          mediaZoom: zoom,
          mediaRotation: rotation,
          mediaWidth,
          mediaHeight,
          textOverlays: overlays.map((o) => ({
            value: o.value,
            color: o.color,
            bgColor: o.bgColor,
            fontFamily: o.fontFamily,
            fontSize: o.fontSize,
            x: o.x,
            y: o.y,
            rotation: o.rotation,
            scale: o.scale,
          })),
        });
      }
      const { error: apiError } = await socialApi.createStory({
        user_id: user.id,
        media_url: mediaUrl,
        story_type: storyType,
        overlays: overlaysJson,
      });
      if (apiError)
        throw new Error(apiError.message || "Failed to create story");
      setSuccess(true);
      if (typeof onStoryCreated === "function") onStoryCreated();
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (err) {
      let message = "Failed to create story";
      if (err instanceof Error) {
        message = err.message;
      } else if (typeof err === "string") {
        message = err;
      }
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  // Separate handlers for text and media stories
  const handleCreateTextStory = async () => {
    if (!isTextStoryValid || loading || success) return;
    setLoading(true);
    setError(null);
    try {
      const overlaysJson = {
        backgroundColor: backgroundColor || background,
        texts: overlays.map((o) => ({
          text: o.value,
          color: o.color,
          fontFamily: o.fontFamily,
          fontSize: o.fontSize,
        })),
      };
      if (!user) return;
      await socialApi.createStory({
        user_id: user.id,
        media_url: "",
        story_type: "text",
        overlays: overlaysJson,
      });
      setSuccess(true);
      if (typeof onStoryCreated === "function") onStoryCreated();
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (err) {
      setError("Failed to create story");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateMediaStory = async () => {
    if (loading || success) return;
    setLoading(true);
    setError(null);
    try {
      const overlaysJson = buildOverlaysJson({
        backgroundColor: backgroundColor || background,
        mediaType: isVideo ? "video" : "image",
        mediaPosition: mediaPos,
        mediaZoom: zoom,
        mediaRotation: rotation,
        mediaWidth,
        mediaHeight,
        textOverlays: overlays.map((o) => ({
          value: o.value,
          color: o.color,
          bgColor: o.bgColor,
          fontFamily: o.fontFamily,
          fontSize: o.fontSize,
          x: o.x,
          y: o.y,
          rotation: o.rotation,
          scale: o.scale,
        })),
      });
      if (!user) return;
      await socialApi.createStory({
        user_id: user.id,
        media_url: media || "",
        story_type: isVideo ? "video" : "image",
        overlays: overlaysJson,
      });
      setSuccess(true);
      if (typeof onStoryCreated === "function") onStoryCreated();
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (err) {
      setError("Failed to create story");
    } finally {
      setLoading(false);
    }
  };

  // Separate disabled logic for text and media stories
  const isTextStoryButtonDisabled =
    !isTextStoryValid ||
    !!editingOverlayId ||
    !!activeTextGestureOverlayId ||
    !!draggedOverlayId ||
    loading ||
    success;

  const isMediaStoryButtonDisabled = loading || success;

  if (!open) return null;

  const showOverlay = textModeOption === "color" || textModeOption === "font";

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60">
      {/* Centered 9:16 aspect ratio container for the entire story UI */}
      <div
        className="relative flex flex-col items-stretch w-full max-w-[calc(100dvh*9/16)] aspect-[9/16] h-full sm:max-h-[90dvh] sm:rounded-2xl shadow-lg overflow-hidden bg-black mx-auto"
        style={{
          background: "transparent",
          paddingTop: "env(safe-area-inset-top)",
          paddingBottom: "env(safe-area-inset-bottom)",
          width: isMobile ? "100vw" : undefined,
          height: isMobile ? "100dvh" : undefined,
          maxWidth: isMobile ? "100vw" : undefined,
          maxHeight: isMobile ? "100dvh" : undefined,
          borderRadius: isMobile ? 0 : undefined,
        }}
      >
        {mode === "text" || showTextInput ? (
          <>
            <div className="absolute top-4 right-4 z-50 flex items-center">
              {mode === "text" && (
                <button
                  className="px-2 py-1  md:px-3 md:py-1.5 lg:px-3 lg:py-1.5 rounded-full bg-white/90 text-red-600 font-semibold shadow border border-gray-200 hover:bg-red-100 "
                  style={{
                    fontSize: "1rem",
                    marginTop: "0.6rem",
                  }}
                  onClick={() => {
                    if (loading) return;
                    setShowDiscardConfirmModal(true);
                  }}
                  type="button"
                  disabled={loading}
                >
                  Discard
                </button>
              )}
            </div>
            {/* Show top-left icon bar: in text mode show all, in media mode only font/color */}
            <div className="absolute top-7 left-4 z-[55] flex flex-row gap-3 items-center ">
              {mode === "text" && (
                <button
                  className={`w-8 h-8 flex items-center justify-center rounded-full border ${
                    textModeOption === "background"
                      ? "border-blue-500 bg-blue-100"
                      : "border-gray-300 bg-white"
                  }`}
                  onClick={() => {
                    setShowBgModal(true); // Always open modal for background selection
                    setTextModeOption(null); // Remove bottom bar logic
                  }}
                  type="button"
                >
                  <Palette className="w-5 h-5 text-gray-700" />
                </button>
              )}
              <button
                className={`w-8 h-8 flex items-center justify-center rounded-full border ${
                  textModeOption === "color"
                    ? "border-blue-500 bg-blue-100"
                    : "border-gray-300 bg-white"
                }`}
                onClick={() =>
                  setTextModeOption(textModeOption === "color" ? null : "color")
                }
                type="button"
              >
                <span
                  className="w-5 h-5 rounded-full border border-gray-400"
                  style={{
                    background: editingOverlayId
                      ? editingColor
                      : textInputColor,
                  }}
                />
              </button>
              <button
                className={`w-8 h-8 flex items-center justify-center rounded-full border ${
                  textModeOption === "font"
                    ? "border-blue-500 bg-blue-100"
                    : "border-gray-300 bg-white"
                }`}
                onClick={() =>
                  setTextModeOption(textModeOption === "font" ? null : "font")
                }
                type="button"
              >
                <span
                  className="font-bold text-md"
                  style={{
                    fontFamily: editingOverlayId ? editingFont : textInputFont,
                  }}
                >
                  Aa
                </span>
              </button>
            </div>
          </>
        ) : (
          (showTextInput || editingOverlayId) &&
          renderToolbar(!!editingOverlayId)
        )}
        {/* Show overlay and bottom bar for selected option in text mode */}
        {showOverlay && (
          <div className="absolute inset-0 z-[59] bg-black/30 pointer-events-none transition-opacity" />
        )}
        {(mode === "text" || showTextInput) &&
          (textModeOption === "color" || textModeOption === "font") &&
          renderTextModeBottomBar()}
        {!(showTextInput || editingOverlayId) && (
          <div
            className="flex items-center justify-between px-4 pt-4 pb-2 gap-1 sm:gap-2 w-full"
            style={{
              top: `calc(env(safe-area-inset-top, 0px) + 16px)`,
              paddingTop: isMobile ? "15px" : "",
              left: 0,
              right: 0,
              position: "absolute",
              zIndex: 51,
            }}
          >
            <div className="flex gap-2  flex-wrap">
              {mode !== "text" && (
                <button
                  className="p-2 rounded-full bg-white/90 shadow flex items-center justify-center border border-gray-200"
                  onClick={() => {
                    setShowTextInput(true);
                    setTextInputValue("");
                    setTextInputColor("#ffffff");
                    setTextInputFont("inherit");
                    setEditingBgColor(undefined);
                    setEditingOverlayId(null);
                  }}
                  title="Add Text"
                  type="button"
                  disabled={loading}
                >
                  <Type className="w-5 h-5 text-gray-700" />
                </button>
              )}
              <button
                className="p-2 rounded-full bg-white/90 shadow flex items-center justify-center border border-gray-200"
                onClick={() => setShowBgModal(true)}
                title="Change Background"
                type="button"
                disabled={loading}
              >
                <Palette className="w-5 h-5 text-gray-700" />
              </button>
              {mode === "photo" && (
                <>
                  <button
                    className="p-2 rounded-full bg-white/90 shadow border border-gray-200 hidden lg:flex items-center justify-center"
                    onClick={() => setZoom((z) => Math.max(0.5, z - 0.1))}
                    type="button"
                    title="Zoom Out"
                    disabled={loading}
                  >
                    <ZoomOut className="w-5 h-5 text-gray-700" />
                  </button>
                  <button
                    className="p-2 rounded-full bg-white/90 shadow border border-gray-200 hidden lg:flex items-center justify-center"
                    onClick={() => setZoom((z) => Math.min(3, z + 0.1))}
                    type="button"
                    title="Zoom In"
                    disabled={loading}
                  >
                    <ZoomIn className="w-5 h-5 text-gray-700" />
                  </button>
                  <button
                    className="p-2 rounded-full bg-white/90 shadow border border-gray-200 hidden lg:flex items-center justify-center"
                    onClick={() => setRotation((r) => r - 15)}
                    type="button"
                    title="Rotate Left"
                    disabled={loading}
                  >
                    <RotateCcw className="w-5 h-5 text-gray-700" />
                  </button>
                  <button
                    className="p-2 rounded-full bg-white/90 shadow border border-gray-200 hidden lg:flex items-center justify-center"
                    onClick={() => setRotation((r) => r + 15)}
                    type="button"
                    title="Rotate Right"
                    disabled={loading}
                  >
                    <RotateCw className="w-5 h-5 text-gray-700" />
                  </button>
                </>
              )}
            </div>
            <button
              className="px-2 py-1  md:px-3 md:py-1.5 lg:px-3 lg:py-1.5 rounded-full bg-white/90 text-red-600 font-semibold shadow border border-gray-200 hover:bg-red-100 "
              style={{
                fontSize: "1rem",
                // marginTop: "0.2rem",
              }}
              // className="px-2 py-1 md:px-3 md:py-1.5 lg:px-3 lg:py-1.5 rounded-full bg-white/90 text-red-600 font-semibold shadow border border-gray-200 hover:bg-red-100 text-xs md:text-sm lg:text-base"
              onClick={() => {
                if (loading) return;
                setShowDiscardConfirmModal(true);
              }}
              type="button"
              disabled={loading}
            >
              Discard
            </button>
          </div>
        )}
        {showBgModal && (
          <div
            className="absolute inset-0 z-[60] flex items-center justify-center"
            onClick={() => setShowBgModal(false)}
          >
            <div
              className="bg-white rounded-xl p-4 flex flex-col gap-4 w-80 max-w-[90%]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex flex-wrap gap-2 justify-center">
                {GRADIENTS.map((g) => (
                  <button
                    key={g}
                    className={`w-20 h-12 rounded-lg border-2 relative flex items-center justify-center ${
                      background === g
                        ? "border-blue-600"
                        : "border-transparent"
                    } ${g}`}
                    onClick={() => {
                      setBackgroundColor(null);
                      onBackgroundChange?.(g);
                      setShowBgModal(false);
                    }}
                  >
                    {background === g && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Check size={24} className="text-white drop-shadow" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
              <button
                className="mt-2 px-4 py-1 rounded bg-gray-200 hover:bg-gray-300 self-center"
                onClick={() => setShowBgModal(false)}
              >
                {" "}
                Cancel{" "}
              </button>
            </div>
          </div>
        )}
        {/* Preview Area (fills available space between toolbar and button) */}
        <div
          className="relative flex-1 flex items-center justify-center overflow-hidden"
          ref={previewRef}
          onMouseMove={
            loading || mode === "text" ? undefined : handlePreviewMouseMove
          }
          onMouseUp={
            loading || mode === "text" ? undefined : handlePreviewMouseUp
          }
          onTouchStart={
            loading || mode === "text" ? undefined : handleMediaTouchStart
          }
          onTouchMove={
            loading || mode === "text" ? undefined : handlePreviewTouchMove
          }
          onTouchEnd={
            loading || mode === "text" ? undefined : handlePreviewTouchEnd
          }
          onTouchCancel={
            loading || mode === "text" ? undefined : handlePreviewTouchEnd
          }
          // Remove modal-wide opacity/pointerEvents during loading
          // style={loading ? { pointerEvents: "none", opacity: 0.7 } : {}}
        >
          {/* Gradient background behind story content */}
          <div
            ref={storyBoxRef}
            className="absolute inset-0 w-full h-full z-0 pointer-events-none"
            style={{
              background:
                backgroundColor || GRADIENT_CSS[background || GRADIENTS[0]],
            }}
          />
          {/* Media preview for photo/video stories */}
          {mode !== "text" && media && (
            <div
              style={{
                transform: `translate(${mediaPos.x}px, ${mediaPos.y}px) scale(${zoom}) rotate(${rotation}deg)`,
                transition: isMediaGesturing
                  ? "none"
                  : "transform 0.2s ease-out",
                width: "100%",
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: draggingMedia ? "grabbing" : "grab",
                touchAction: "none",
                zIndex: 1,
              }}
              onMouseDown={handleMediaMouseDown}
            >
              {isVideo ? (
                <video
                  src={media}
                  className="h-full w-full object-contain pointer-events-none"
                  autoPlay
                  loop
                  playsInline
                  controls={false}
                  onLoadedMetadata={(e) => {
                    const video = e.currentTarget;
                    setMediaWidth(video.videoWidth);
                    setMediaHeight(video.videoHeight);
                  }}
                />
              ) : (
                <NextImage
                  src={media}
                  alt="Preview"
                  fill
                  className="object-contain pointer-events-none"
                  sizes="100vw"
                  onLoad={(e) => {
                    const img = e.currentTarget as HTMLImageElement;
                    setMediaWidth(img.naturalWidth);
                    setMediaHeight(img.naturalHeight);
                  }}
                />
              )}
            </div>
          )}
          {(showTextInput || editingOverlayId) && (
            <div className="absolute inset-0 z-40 bg-black/20 backdrop-blur-sm pointer-events-none" />
          )}
          {leftPanel && (
            <div
              ref={leftPanelRef}
              className="absolute left-2 top-1/2 -translate-y-1/2 z-[55] bg-white/90 rounded-xl shadow-lg p-3 flex flex-col gap-3 items-center"
              style={{ minWidth: 50 }}
            >
              <button
                className="absolute top-1 right-1 text-gray-400 hover:text-gray-700"
                onClick={() => setLeftPanel(null)}
                type="button"
              >
                {" "}
                <X className="w-4 h-4" />{" "}
              </button>
              {leftPanel === "color" && (
                <div className="flex flex-col gap-1.5 mt-5">
                  {[
                    "#ffffff",
                    "#000000",
                    "#ff4081",
                    "#2196f3",
                    "#4caf50",
                    "#ffeb3b",
                    "#ff9800",
                    "#9c27b0",
                  ].map((c) => (
                    <button
                      key={c}
                      className={`w-7 h-7 rounded-full border-2 ${
                        (editingOverlayId ? editingColor : textInputColor) === c
                          ? "border-blue-500 ring-1 ring-blue-500"
                          : "border-gray-300"
                      }`}
                      style={{ background: c }}
                      onClick={() => {
                        if (editingOverlayId) {
                          setEditingColor(c);
                        } else {
                          setTextInputColor(c);
                        }
                      }}
                      type="button"
                    />
                  ))}
                </div>
              )}
              {leftPanel === "font" && (
                <div className="flex flex-col gap-1.5 mt-5">
                  {fontOptions.map((opt) => (
                    <button
                      key={opt.value}
                      className={`w-9 h-9 flex items-center justify-center rounded-full border-2 font-bold text-md transition-all ${
                        (editingOverlayId ? editingFont : textInputFont) ===
                        opt.value
                          ? "bg-white border-pink-500 text-pink-500 shadow"
                          : "bg-black border-black text-white"
                      }`}
                      style={{ fontFamily: opt.value }}
                      onClick={() => {
                        if (editingOverlayId) {
                          setEditingFont(opt.value);
                        } else {
                          setTextInputFont(opt.value);
                        }
                      }}
                    >
                      Aa
                    </button>
                  ))}
                </div>
              )}
              {/* {leftPanel === "bg" && (
                <div className="flex flex-col gap-1.5 mt-5">
                  <label className="flex items-center gap-2 mb-2">
                    <input
                      type="checkbox"
                      checked={!!editingBgColor}
                      onChange={(e) => {
                        if (editingOverlayId) {
                          if (e.target.checked) {
                            setEditingBgColor(bgColorOptions[0]); // default to first color
                          } else {
                            setEditingBgColor(undefined);
                          }
                        }
                      }}
                      disabled={loading}
                    />
                    <span className="text-sm">Enable Background</span>
                  </label>
                  {bgColorOptions.map((c) => (
                    <button
                      key={c}
                      className={`w-7 h-7 rounded-full border-2 ${
                        (editingOverlayId ? editingBgColor : undefined) === c
                          ? "border-blue-500 ring-1 ring-blue-500"
                          : "border-gray-300"
                      }`}
                      style={{
                        background: c,
                        opacity: editingBgColor ? 1 : 0.5,
                      }}
                      onClick={() => {
                        if (editingOverlayId && editingBgColor)
                          setEditingBgColor(c);
                      }}
                      type="button"
                      disabled={!editingBgColor || loading}
                    />
                  ))}
                  <button
                    className="w-7 h-7 rounded-full border-2 border-gray-300 bg-white flex items-center justify-center"
                    onClick={() => {
                      if (editingOverlayId) setEditingBgColor(undefined);
                    }}
                    type="button"
                    disabled={loading}
                  >
                    <X className="w-3 h-3 text-gray-700" />
                  </button>
                </div>
              )} */}
            </div>
          )}

          {mode === "photo" && !media && (
            <div className="flex flex-col items-center justify-center w-full h-full">
              <Image className="w-16 h-16 text-white/60" />
              <span className="text-white/60 mt-2">No media selected</span>
            </div>
          )}

          {/* Render overlays for photo mode only */}
          {mode !== "text" &&
            !showTextInput &&
            overlays.map((overlay) => {
              // Use live editing color/font for the overlay being edited
              const isSelected = editingOverlayId === overlay.id;
              const color = isSelected
                ? editingColor
                : overlay.color || "#ffffff";
              const fontFamily = isSelected
                ? editingFont
                : overlay.fontFamily || "inherit";
              const bgColor = overlay.bgColor;
              const currentScale = overlay.scale || 1;
              const currentRotation = overlay.rotation || 0;

              // Increase font size for media overlays
              const baseFontSize = 32; // was 24

              return (
                <div
                  key={overlay.id}
                  data-overlay="true"
                  style={{
                    position: "absolute",
                    left: `${overlay.x}%`,
                    top: `${overlay.y}%`,
                    color,
                    fontWeight: "bold",
                    fontFamily,
                    cursor:
                      draggedOverlayId === overlay.id ||
                      activeTextGestureOverlayId === overlay.id
                        ? "grabbing"
                        : "grab",
                    userSelect: "none",
                    MozUserSelect: "none",
                    WebkitUserSelect: "none",
                    zIndex: 40,
                    fontSize: overlay.fontSize
                      ? `calc(20px * ${isSelected ? 1 : currentScale})`
                      : `calc(20px * ${isSelected ? 1 : currentScale})`,
                    padding: `calc(2px * ${currentScale}) calc(4px * ${currentScale})`,
                    borderRadius: `calc(4px * ${currentScale})`,
                    minWidth: `calc(40px * ${currentScale})`,
                    minHeight: `calc(32px * ${currentScale})`,
                    display: isSelected ? "inline-block" : "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    textAlign: "center",
                    transformOrigin: "center center",
                    transform: `translate(-50%, -50%) scale(${currentScale}) rotate(${currentRotation}deg)`,
                    transition:
                      isTextTransforming &&
                      activeTextGestureOverlayId === overlay.id
                        ? "transform 0s"
                        : "transform 0.2s ease-out",
                    border: isSelected
                      ? `2px solid ${bgColor || "#2196f3"}`
                      : undefined,
                    boxShadow: isSelected
                      ? `0 0 0 4px ${bgColor || "#2196f3"}44`
                      : undefined,
                    width: "300px",
                    maxWidth: "90%",
                    wordBreak: "break-word",
                    overflowWrap: "break-word",
                  }}
                  onMouseDown={(e) => {
                    if (loading) return;
                    handleOverlayMouseDown(e, overlay);
                  }}
                  onDoubleClick={() => {
                    if (
                      loading ||
                      showTextInput ||
                      activeTextGestureOverlayId ||
                      draggedOverlayId
                    )
                      return;
                    // This block only renders when mode !== "text", so mode is "photo" here
                    if (mode === "photo") {
                      setEditingOverlayId(overlay.id);
                      setEditingTextValue(overlay.value);
                      setEditingColor(overlay.color || "#ffffff");
                      setEditingFont(overlay.fontFamily || "inherit");
                      setTextInputValue(overlay.value); // for safety, but not used in edit
                      setTextInputColor("#ffffff"); // reset for new overlays
                      setTextInputFont("inherit"); // reset for new overlays
                      setEditingBgColor(overlay.bgColor);
                      setShowTextInput(true);
                      setLeftPanel(null);
                    }
                  }}
                  onTouchStart={(e) => {
                    if (loading) return;
                    handleTextOverlayTouchStart(e, overlay);
                  }}
                >
                  {editingOverlayId === overlay.id ? null : overlay.value}
                </div>
              );
            })}
          {/* In text mode, show a single centered overlay, not draggable */}
          {mode === "text" && overlays[0] && !showTextInput && (
            <div
              className="absolute left-1/2 top-1/2 z-40 flex items-center justify-center w-full px-4"
              style={{
                transform: "translate(-50%, -50%)",
                color: overlays[0].color || "#ffffff",
                fontWeight: "bold",
                fontFamily: overlays[0].fontFamily || "inherit",
                fontSize: `${dynamicFontSize}px`,
                textAlign: "center",
                userSelect: "none",
                pointerEvents: "none",
                whiteSpace: "pre-line",
                wordBreak: "break-word",
              }}
            >
              {overlays[0].value}
            </div>
          )}
          {/* Always show textarea in text story mode, editing overlays only in photo mode */}
          {(mode === "text" || showTextInput) && (
            <div
              className="absolute left-1/2 top-1/2 z-50 flex items-center"
              style={{
                transform: "translate(-50%, -50%)",
                left: "50%",
                top: "50%",
              }}
              ref={textInputContainerRef}
            >
              <div
                className="flex items-center justify-center w-full h-full"
                style={{
                  minWidth: 40,
                  minHeight: 40,
                  height: "100%",
                }}
              >
                <textarea
                  ref={dynamicTextareaRef}
                  className="bg-transparent border-none focus:outline-none w-full min-w-[370px] max-w-[100vw] text-center font-bold resize-none leading-snug"
                  placeholder={
                    mode === "text"
                      ? "Type your story..."
                      : overlays.some((o) => o.value && o.value.trim() !== "")
                      ? ""
                      : "Type your story..."
                  }
                  value={
                    editingOverlayId
                      ? editingTextValue
                      : mode === "text"
                      ? overlays[0]?.value || ""
                      : textInputValue
                  }
                  autoFocus
                  maxLength={300}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (editingOverlayId) {
                      setEditingTextValue(val);
                    } else if (mode === "text") {
                      setOverlays((prev) =>
                        prev.length > 0
                          ? [{ ...prev[0], value: val }]
                          : [
                              {
                                id: Date.now().toString(),
                                type: "text",
                                value: val,
                                x: 50,
                                y: 50,
                                color: textInputColor,
                                fontFamily: textInputFont,
                                bgColor: editingBgColor,
                                scale: 1,
                                rotation: 0,
                                fontSize: 24,
                              },
                            ]
                      );
                    } else {
                      setTextInputValue(val);
                    }
                    // Auto-resize logic
                    if (dynamicTextareaRef.current) {
                      dynamicTextareaRef.current.style.height = "auto";
                      dynamicTextareaRef.current.style.height =
                        dynamicTextareaRef.current.scrollHeight + "px";
                    }
                  }}
                  style={{
                    color: editingOverlayId
                      ? editingColor
                      : mode === "text"
                      ? overlays[0]?.color || textInputColor
                      : textInputColor,
                    fontFamily: editingOverlayId
                      ? editingFont
                      : mode === "text"
                      ? overlays[0]?.fontFamily || textInputFont
                      : textInputFont,
                    background: "transparent",
                    whiteSpace: "pre-line",
                    overflow: "hidden",
                    fontSize: 20,
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Escape") {
                      // Clear text
                      if (editingOverlayId) {
                        setEditingTextValue("");
                      } else {
                        setOverlays((prev) =>
                          prev.length > 0 ? [{ ...prev[0], value: "" }] : prev
                        );
                      }
                      setLeftPanel(null);
                    }
                  }}
                />
              </div>
            </div>
          )}
          {/* Add useEffect for auto-resize on value change */}
          {/* Add a ref to the story box for measuring */}
          <div
            ref={storyBoxRef}
            className="absolute inset-0 w-full h-full z-0 pointer-events-none"
            style={{
              background:
                backgroundColor || GRADIENT_CSS[background || GRADIENTS[0]],
            }}
          />
          {/* Hidden mirror for font size calculation */}
          {mode === "text" && showTextInput && (
            <div
              ref={mirrorDivRef}
              style={{
                position: "absolute",
                visibility: "hidden",
                zIndex: -1,
                left: 0,
                top: 0,
                width: "100%",
                padding: "0 16px",
                fontWeight: "bold",
                fontFamily: editingOverlayId
                  ? editingFont
                  : overlays[0]?.fontFamily || textInputFont,
                whiteSpace: "pre-line",
                wordBreak: "break-word",
                textAlign: "center",
                pointerEvents: "none",
                lineHeight: 1.2,
              }}
            >
              {currentTextValue || " "}
            </div>
          )}
        </div>
        {/* Bottom Create Story Button (inside aspect ratio) */}
        {!showOverlay &&
          !textModeOption &&
          (mode === "text"
            ? isTextStoryValid && (
                <button
                  className="absolute left-1/2 z-50 -translate-x-1/2 flex items-center justify-center gap-2 px-3 py-1.5 sm:px-5 sm:py-2 md:px-4 md:py-1.5 rounded-full bg-blue-600 text-white font-semibold shadow hover:bg-blue-700 transition"
                  style={{
                    bottom: `calc(env(safe-area-inset-bottom, 0px) + 16px)`,
                    fontSize: "1rem",
                  }}
                  onClick={handleCreateTextStory}
                  disabled={isTextStoryButtonDisabled}
                  type="button"
                >
                  {loading ? (
                    <svg
                      className="animate-spin  h-5 w-5 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                      ></path>
                    </svg>
                  ) : (
                    <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5" />
                  )}
                  {success ? "Created!" : loading ? null : "Create Story"}
                </button>
              )
            : !showTextInput && (
                <button
                  className="absolute left-1/2 z-50 -translate-x-1/2 flex items-center justify-center gap-2 px-3 py-1.5 sm:px-5 sm:py-2 md:px-4 md:py-1.5 rounded-full bg-blue-600 text-white font-semibold shadow hover:bg-blue-700 transition"
                  style={{
                    bottom: `calc(env(safe-area-inset-bottom, 0px) + 16px)`,
                    fontSize: "1rem",
                  }}
                  onClick={handleCreateMediaStory}
                  disabled={isMediaStoryButtonDisabled}
                  type="button"
                >
                  {loading ? (
                    <svg
                      className="animate-spin  h-5 w-5 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                      ></path>
                    </svg>
                  ) : (
                    <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5" />
                  )}
                  {success ? "Created!" : loading ? null : "Create Story"}
                </button>
              ))}
        {/* Error message (inside aspect ratio) */}
        {error && (
          <div className="absolute left-1/2 bottom-20 -translate-x-1/2 z-50 bg-red-500 text-white px-4 py-2 rounded shadow">
            {error}
          </div>
        )}
        {/* Discard confirm modal (centered over aspect container) */}
        {showDiscardConfirmModal && (
          <div
            className="absolute inset-0 z-[60] flex items-center justify-center bg-black/50"
            onClick={() => setShowDiscardConfirmModal(false)}
          >
            <div
              className="bg-white rounded-xl p-6 flex flex-col items-center gap-4 shadow-lg w-72 max-w-[90%]"
              onClick={(e) => e.stopPropagation()}
            >
              <p className="text-lg font-semibold text-gray-800 text-center">
                Discard Story?
              </p>
              <p className="text-sm text-gray-600 text-center">
                Are you sure you want to discard this story? All unsaved changes
                will be lost.
              </p>
              <div className="flex gap-4 mt-2">
                <button
                  className="px-4 py-2 rounded-full bg-gray-200 text-gray-800 font-semibold hover:bg-gray-300 transition"
                  onClick={() => setShowDiscardConfirmModal(false)}
                  type="button"
                >
                  Cancel
                </button>
                <button
                  className="px-4 py-2 rounded-full bg-red-600 text-white font-semibold hover:bg-red-700 transition"
                  onClick={() => {
                    setShowDiscardConfirmModal(false);
                    setTimeout(() => {
                      onClose();
                    }, 100);
                  }}
                  type="button"
                >
                  Discard
                </button>
              </div>
            </div>
          </div>
        )}
        {/* Done button for media text input/editing */}
        {showTextInput && mode !== "text" && (
          <button
            className="absolute top-4 right-4 z-50 px-4 py-2 rounded-full bg-blue-600 text-white font-semibold shadow hover:bg-blue-700 transition"
            onClick={() => {
              if (editingOverlayId) {
                // Editing existing overlay
                if (editingTextValue.trim() === "") {
                  setOverlays((prev) =>
                    prev.filter((o) => o.id !== editingOverlayId)
                  );
                } else {
                  setOverlays((prev) =>
                    prev.map((o) =>
                      o.id === editingOverlayId
                        ? {
                            ...o,
                            value: editingTextValue,
                            color: editingColor,
                            fontFamily: editingFont,
                            bgColor: editingBgColor,
                            fontSize: 32,
                          }
                        : o
                    )
                  );
                }
                setEditingOverlayId(null);
                setShowTextInput(false);
                setTextInputValue("");
                setEditingTextValue("");
                setTextInputColor("#ffffff");
                setTextInputFont("inherit");
                setEditingColor("#ffffff");
                setEditingFont("inherit");
                setEditingBgColor(undefined);
              } else if (textInputValue.trim() !== "") {
                // Adding new overlay
                const randomOffset = () => 45 + Math.random() * 10; // 45% to 55%
                setOverlays((prev) => [
                  ...prev,
                  {
                    id: Date.now().toString(),
                    type: "text",
                    value: textInputValue,
                    x: randomOffset(),
                    y: randomOffset(),
                    color: textInputColor,
                    fontFamily: textInputFont,
                    bgColor: editingBgColor,
                    scale: 1,
                    rotation: 0,
                    fontSize: 20,
                  },
                ]);
                setShowTextInput(false);
                setTextInputValue("");
                setTextInputColor("#ffffff");
                setTextInputFont("inherit");
                setEditingBgColor(undefined);
              } else {
                setShowTextInput(false);
                setTextInputValue("");
                setTextInputColor("#ffffff");
                setTextInputFont("inherit");
                setEditingBgColor(undefined);
              }
            }}
            type="button"
          >
            Done
          </button>
        )}
      </div>
    </div>
  );
};

export default StoryPreviewModal;
