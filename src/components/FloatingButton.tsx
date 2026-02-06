import React, { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  PencilIcon,
  Home,
  Globe,
  ShoppingCart,
  Car,
  Hammer,
  Calendar,
  Gamepad2,
  Bike,
  Settings,
  X,
  MessageCircle,
} from "lucide-react";
import NextLink from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useMyContext } from "@/contexts/GlobalContext";

const allOptions = [
  { label: "Home", icon: <Home size={20} />, path: "/" },
  { label: "Social Media Wall", icon: <Globe size={20} />, path: "/social" },
  { label: "Shop", icon: <ShoppingCart size={20} />, path: "/shop" },
  { label: "Vehicles", icon: <Car size={20} />, path: "/vehicles" },
  {
    label: "Messenger",
    icon: <MessageCircle size={20} />,
    path: "/messenger",
  },
  { label: "Services", icon: <Hammer size={20} />, path: "/services" },
  { label: "Events", icon: <Calendar size={20} />, path: "/events" },
  { label: "Sim Racing", icon: <Gamepad2 size={20} />, path: "/sim-racing" },
  {
    label: "Moto Revolution",
    icon: <Bike size={20} />,
    path: "/moto-revolution",
  },
 
];

export default function FloatingQuickSettings() {
  const [open, setOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selected, setSelected] = useState([
    "Home",
    "Social Media Wall",
    "Shop",
    "Vehicles",
    "Services",
    "Events",
  ]);
  const ctx = useMyContext();
  const setDrag = ctx?.setDrag ?? (() => {});
  useEffect(() => {
    const storage = localStorage.getItem("navs");
    const items = storage ? storage.split(",") : [];
    if (items.length > 0 && items[0] != "") {
      setSelected([...items]);
    }
  }, []);
  // console.log("hello"); // Removed for performance
  const toggleItem = (label: string) => {
    if (selected.includes(label)) {
      setSelected((prev) => prev.filter((l) => l !== label));

      localStorage.setItem(
        "navs",
        selected.filter((l) => l !== label).toString()
      );
    } else if (selected.length < 6) {
      setSelected((prev) => [...prev, label]);

      localStorage.setItem("navs", [...selected, label].toString());
    }
  };

  const getItemData = (label: string) => allOptions.find((opt) => opt.label === label)!;
  const navBox = useRef<HTMLDivElement>(null);
  const closeBox = useRef<HTMLDivElement>(null);
  const pathname = usePathname() ?? "/";
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    if (!open) {
      setEditMode(false);
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const router = useRouter();
  const handleNavigate = (path: string) => {
    setOpen(false);
    router.push(path as any);
  };
  return (
    <>
      {(!open && (
        <motion.div
          drag
          dragMomentum={false}
          onDragStart={() => {
            setDrag(true);
          }}
          onDragEnd={() => {
            setDrag(false);
          }}
          animate={{ rotate: 0 }}
          transition={{ duration: 0.4 }}
          className="fixed bottom-[140px] right-4 z-[999999] bg-blue-600 text-white w-12 h-12 flex items-center justify-center rounded-full shadow-xl text-3xl cursor-pointer lg:hidden"
          onClick={(e) => {
            setOpen(true);
          }}
          exit={{ opacity: 0 }}
          whileHover={{ scale: 1.1 }}
        >
          <img
            src={
              "https://rzrroghnzintpxspwauf.supabase.co/storage/v1/object/public/outsource//turbo.jpg"
            }
            alt=""
            className="object-cover rounded-full "
          />
        </motion.div>
      )) || (
        <motion.div
          ref={closeBox}
          exit={{ opacity: 0 }}
          animate={{ rotate: -90 }}
          transition={{ duration: 0.4 }}
          className="fixed bottom-[70px] right-4 z-[999999] bg-blue-600 text-white w-12 h-12 flex items-center justify-center rounded-full shadow-xl text-3xl cursor-pointer lg:hidden"
          onClick={() => {
            setOpen(false);
          }}
          whileHover={{ scale: 1.1 }}
        >
          <img
            src={
              "https://rzrroghnzintpxspwauf.supabase.co/storage/v1/object/public/outsource//turbo.jpg"
            }
            alt=""
            className="object-cover w-12 h-12 rounded-full "
          />
        </motion.div>
      )}
      {/* Modal */}
      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-50 overflow-hidden z-50 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
            ref={navBox}
          >
            {editMode ? (
              // Edit Mode
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                transition={{ type: "spring", stiffness: 260, damping: 20 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-[#1f1f1f] text-white rounded-2xl p-5 w-[300px] shadow-2xl"
              >
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-base font-semibold">Edit Settings</h2>
                  <button
                    onClick={() => setEditMode(false)}
                    className="text-sm text-blue-400"
                  >
                    Done
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  {allOptions.map(({ label, icon }) => {
                    const isSelected = selected.includes(label);
                    return (
                      <button
                        key={label}
                        onClick={() => toggleItem(label)}
                        className={`flex flex-col items-center justify-center h-20 rounded-xl transition-all duration-200 ${
                          isSelected
                            ? "bg-white text-black"
                            : "bg-[#333] text-gray-400"
                        }`}
                      >
                        <div className="text-xl">{icon}</div>
                        <div className="mt-1 text-xs text-center px-1">
                          {label}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            ) : (
              // Confirmed Mode
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                transition={{ type: "spring", stiffness: 260, damping: 20 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-[#1f2937] text-white rounded-2xl p-6 w-80 grid grid-cols-3 gap-6 text-center shadow-2xl"
              >
                {!selected.length ? (
                  <div className="w-full col-span-3 justify-center">
                    Choose you own settings options
                  </div>
                ) : (
                  ""
                )}
                {selected.map((label) => {
                  const { icon, path } = getItemData(label);
                  return (
                    <div
                      onClick={() => handleNavigate(path)}
                      key={label}
                      className="flex flex-col items-center justify-center space-y-2 hover:opacity-90"
                    >
                      <div className="text-2xl">{icon}</div>
                      <div className="text-sm text-center">{label}</div>
                    </div>
                  );
                })}

                {/* Edit toggle */}
                <div className="col-span-3 mt-2 flex justify-center">
                  <button
                    onClick={() => setEditMode(true)}
                    className="text-blue-400 text-sm flex items-center gap-1"
                  >
                    <PencilIcon className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
