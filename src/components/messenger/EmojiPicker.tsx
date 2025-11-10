import React, { useState, useEffect } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Clock, Search, Smile } from "lucide-react";

interface EmojiPickerProps {
  onEmojiSelect: (emoji: string) => void;
  onClose: () => void;
}

// More comprehensive emoji selection organized by categories
const emojiCategories = [
  {
    name: "Frequently used",
    emojis: [
      "👍",
      "😀",
      "😍",
      "🥰",
      "😂",
      "😊",
      "😁",
      "🤣",
      "😉",
      "🙂",
      "🤗",
      "😋",
      "😄",
    ],
  },
  {
    name: "Smileys & People",
    emojis: [
      "😀",
      "😃",
      "😄",
      "😁",
      "😆",
      "😅",
      "😂",
      "🤣",
      "😊",
      "😇",
      "🙂",
      "🙃",
      "😉",
      "😌",
      "😍",
      "🥰",
      "😘",
      "😗",
      "😙",
      "😚",
      "😋",
      "😛",
      "😝",
      "😜",
      "🤪",
      "🤨",
      "🧐",
      "🤓",
      "😎",
      "🤩",
      "🥳",
      "😏",
      "😒",
      "😞",
      "😔",
      "😟",
      "😕",
      "🙁",
      "☹️",
      "😣",
      "😖",
      "😫",
      "😩",
      "🥺",
      "😢",
      "😭",
      "😤",
      "😠",
      "😡",
      "🤬",
      "🤯",
      "😳",
      "🥵",
      "🥶",
      "😱",
      "😨",
      "😰",
      "😥",
      "😓",
      "🤗",
      "🤔",
      "🤭",
      "🤫",
      "🤥",
      "😶",
      "😐",
      "😑",
      "😬",
      "🙄",
      "😯",
    ],
  },
  {
    name: "Animals & Nature",
    emojis: [
      "🐶",
      "🐱",
      "🐭",
      "🐹",
      "🐰",
      "🦊",
      "🐻",
      "🐼",
      "🐨",
      "🐯",
      "🦁",
      "🐮",
      "🐷",
      "🐸",
      "🐵",
    ],
  },
  {
    name: "Food & Drink",
    emojis: [
      "🍎",
      "🍐",
      "🍊",
      "🍋",
      "🍌",
      "🍉",
      "🍇",
      "🍓",
      "🍈",
      "🍒",
      "🍑",
      "🥭",
      "🍍",
      "🥥",
      "🥝",
    ],
  },
  {
    name: "Activities",
    emojis: [
      "⚽",
      "🏀",
      "🏈",
      "⚾",
      "🥎",
      "🎾",
      "🏐",
      "🏉",
      "🥏",
      "🎱",
      "🏓",
      "🏸",
      "🏒",
      "🏑",
      "🥍",
    ],
  },
  {
    name: "Objects",
    emojis: [
      "⌚",
      "📱",
      "💻",
      "⌨️",
      "🖥️",
      "🖨️",
      "💿",
      "📷",
      "🎮",
      "🎧",
      "🎤",
      "🎬",
      "🎨",
      "🎭",
      "🚗",
    ],
  },
];

const MAX_RECENT_EMOJIS = 16;

const EmojiPicker: React.FC<EmojiPickerProps> = ({
  onEmojiSelect,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<string>("smileys");
  const [recentEmojis, setRecentEmojis] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const savedRecentEmojis = localStorage.getItem("recentEmojis");
    if (savedRecentEmojis) {
      setRecentEmojis(JSON.parse(savedRecentEmojis));
    }
  }, []);

  const handleEmojiSelect = (emoji: string) => {
    onEmojiSelect(emoji);

    // Update recent emojis
    setRecentEmojis((prev) => {
      const filteredEmojis = prev.filter((e) => e !== emoji);
      const updatedEmojis = [emoji, ...filteredEmojis].slice(
        0,
        MAX_RECENT_EMOJIS
      );
      localStorage.setItem("recentEmojis", JSON.stringify(updatedEmojis));
      return updatedEmojis;
    });
  };

  const filteredEmojis = searchTerm
    ? emojiCategories
        .map((category) => ({
          ...category,
          emojis: category.emojis.filter(
            (emoji) =>
              emoji.includes(searchTerm) ||
              category.name.toLowerCase().includes(searchTerm.toLowerCase())
          ),
        }))
        .filter((category) => category.emojis.length > 0)
    : emojiCategories;

  return (
    <div
      className={`w-64 h-80 p-2 bg-white border-gray-200 border rounded-md shadow-lg`}
    >
      <div className="flex justify-between items-center mb-2 px-2">
        <h3 className={`text-sm font-medium text-gray-800`}>Emojis</h3>
        <button
          onClick={onClose}
          className={`text-gray-500 hover:text-racing-red text-sm`}
        >
          ×
        </button>
      </div>

      {/* Search box */}
      <div className={`px-2 pb-2 bg-white`}>
        <div
          className={`flex items-center gap-2 border border-gray-200 bg-gray-50 rounded-md px-3 py-1.5`}
        >
          <Search className={`h-4 w-4 text-gray-500`} />
          <input
            type="text"
            placeholder="Search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`text-sm bg-transparent border-none outline-none w-full text-gray-800 placeholder:text-gray-500`}
          />
        </div>
      </div>

      {/* Category tabs */}
      <div className="flex space-x-1 border-b mb-2">
        <button
          className={`flex items-center justify-center p-2 ${
            activeTab === "recent" ? "border-b-2 border-blue-500" : ""
          }`}
          onClick={() => setActiveTab("recent")}
        >
          <Clock className="h-5 w-5" />
        </button>
        <button
          className={`flex items-center justify-center p-2 ${
            activeTab === "smileys" ? "border-b-2 border-blue-500" : ""
          }`}
          onClick={() => setActiveTab("smileys")}
        >
          <Smile className="h-5 w-5" />
        </button>
      </div>

      <ScrollArea className="h-[calc(100%-7rem)]">
        {activeTab === "recent" && recentEmojis.length > 0 && (
          <div className="mb-4 px-2">
            <h4 className={`text-xs font-medium text-gray-500 mb-2`}>Recent</h4>
            <div className="grid grid-cols-7 gap-1">
              {recentEmojis.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => handleEmojiSelect(emoji)}
                  className={`h-8 w-8 flex items-center justify-center hover:bg-gray-100 rounded cursor-pointer text-lg`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        )}

        {filteredEmojis.map((category) => (
          <div key={category.name} className="mb-4 px-2">
            <h4 className={`text-xs font-medium text-gray-500 mb-2`}>
              {category.name}
            </h4>
            <div className="grid grid-cols-7 gap-1">
              {category.emojis.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => handleEmojiSelect(emoji)}
                  className={`h-8 w-8 flex items-center justify-center hover:bg-gray-100 rounded cursor-pointer text-lg`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        ))}
      </ScrollArea>
    </div>
  );
};

export { EmojiPicker };
