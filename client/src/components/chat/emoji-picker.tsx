import { useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";

interface EmojiPickerProps {
  onEmojiSelect: (emoji: string) => void;
  onClose: () => void;
}

const emojis = [
  "😀", "😃", "😄", "😁", "😆", "😅", "🤣", "😂",
  "🙂", "🙃", "😉", "😊", "😇", "🥰", "😍", "🤩",
  "😘", "😗", "😚", "😙", "🥲", "😋", "😛", "😜",
  "🤪", "😝", "🤑", "🤗", "🤭", "🤫", "🤔", "🤐",
  "🤨", "😐", "😑", "😶", "😏", "😒", "🙄", "😬",
  "🤥", "😔", "😪", "🤤", "😴", "😷", "🤒", "🤕",
  "🤢", "🤮", "🤧", "🥵", "🥶", "🥴", "😵", "🤯",
  "🤠", "🥳", "🥸", "😎", "🤓", "🧐", "😕", "😟",
  "🙁", "😮", "😯", "😲", "😳", "🥺", "😦", "😧",
  "😨", "😰", "😥", "😢", "😭", "😱", "😖", "😣",
  "😞", "😓", "😩", "😫", "🥱", "😤", "😡", "😠",
  "🤬", "😈", "👿", "💀", "☠️", "💩", "🤡", "👹",
  "👺", "👻", "👽", "👾", "🤖", "😺", "😸", "😹",
  "❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍",
  "🤎", "💕", "💞", "💓", "💗", "💖", "💘", "💝",
  "👍", "👎", "👌", "🤌", "🤏", "✌️", "🤞", "🤟",
  "🤘", "🤙", "👈", "👉", "👆", "🖕", "👇", "☝️",
  "👋", "🤚", "🖐", "✋", "🖖", "👏", "🙌", "🤲",
  "🤝", "🙏", "✍️", "💅", "🤳", "💪", "🦾", "🦿",
  "🎉", "🎊", "🎈", "🎁", "🎀", "🎂", "🍰", "🧁",
  "🔥", "💯", "💫", "⭐", "🌟", "✨", "⚡", "💥",
];

export default function EmojiPicker({ onEmojiSelect, onClose }: EmojiPickerProps) {
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  return (
    <Card 
      ref={pickerRef}
      className="absolute bottom-12 right-0 w-80 h-64 p-4 z-50"
      data-testid="emoji-picker"
    >
      <div className="h-full overflow-y-auto">
        <div className="grid grid-cols-8 gap-1">
          {emojis.map((emoji, index) => (
            <button
              key={index}
              className="text-xl hover:bg-secondary rounded p-1 transition-colors"
              onClick={() => onEmojiSelect(emoji)}
              data-testid={`emoji-${index}`}
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>
    </Card>
  );
}
