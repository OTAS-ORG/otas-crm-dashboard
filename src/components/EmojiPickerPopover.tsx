import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Search, X, Smile, ThumbsUp, Heart, Briefcase, Zap } from 'lucide-react';

export interface EmojiPickerPopoverProps {
  onSelect: (emoji: string) => void;
  onClose: () => void;
  anchorEl?: HTMLElement | null;
  className?: string;
}

const EMOJI_CATEGORIES = [
  {
    id: 'frequent',
    name: 'Frequent & Quick',
    icon: Zap,
    emojis: ['👍', '👎', '❤️', '🔥', '🎉', '🚀', '👀', '😂', '👏', '💯', '✨', '🙏', '✅', '⚠️', '📌', '💡'],
  },
  {
    id: 'smileys',
    name: 'Smileys',
    icon: Smile,
    emojis: [
      '😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '🥲', '☺️',
      '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😋',
      '😛', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🥸', '🤩', '🥳',
      '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '😣', '😖', '😫',
      '😩', '🥺', '😢', '😭', '😤', '😠', '😡', '🤯', '😳', '🥵',
      '🥶', '😱', '😨', '😰', '😥', '😓', '🤗', '🤔', '🤭', '🤫',
      '🤥', '😶', '😐', '😑', '😬', '🙄', '😯', '😦', '😧', '😮',
      '😲', '🥱', '😴', '🤤', '😪', '😵', '🤐', '🥴', '🤢', '🤮',
    ],
  },
  {
    id: 'gestures',
    name: 'Gestures',
    icon: ThumbsUp,
    emojis: [
      '👋', '🤚', '🖐️', '✋', '🖖', '👌', '🤌', '🤏', '✌️', '🤞',
      '🫰', '🤟', '🤘', '🤙', '👈', '👉', '👆', '🖕', '👇', '☝️',
      '👍', '👎', '✊', '👊', '🤛', '🤜', '👏', '🙌', '👐', '🤲',
      '🤝', '🙏', '✍️', '💅', '🤳', '💪',
    ],
  },
  {
    id: 'hearts',
    name: 'Hearts',
    icon: Heart,
    emojis: [
      '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔',
      '❤️‍🔥', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟',
    ],
  },
  {
    id: 'work',
    name: 'Work & Objects',
    icon: Briefcase,
    emojis: [
      '💻', '🖥️', '📱', '⌨️', '🖱️', '🖨️', '💾', '💿', '📁', '📂',
      '📄', '📃', '📊', '📈', '📉', '📋', '📌', '📍', '📎', '🖇️',
      '🎯', '🚀', '💡', '⚡', '🔔', '📣', '📢', '💬', '💭', '☕',
      '🛠️', '🔧', '⚙️', '🔒', '🔑', '✅', '❌', '⚠️', '⭐', '🏆',
    ],
  },
];

export const EmojiPickerPopover: React.FC<EmojiPickerPopoverProps> = ({
  onSelect,
  onClose,
  anchorEl,
  className = '',
}) => {
  const [activeCategory, setActiveCategory] = useState<string>('frequent');
  const [search, setSearch] = useState<string>('');
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!anchorEl) return;

    const updatePosition = () => {
      const rect = anchorEl.getBoundingClientRect();
      const popoverHeight = 310;
      const popoverWidth = 288;

      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;

      let top = rect.bottom + 6;
      // If not enough space below, open above the anchor
      if (spaceBelow < popoverHeight && spaceAbove > spaceBelow) {
        top = Math.max(10, rect.top - popoverHeight - 6);
      }

      let left = rect.left;
      // If it overflows the right edge of screen, align to right
      if (left + popoverWidth > window.innerWidth - 12) {
        left = Math.max(12, window.innerWidth - popoverWidth - 12);
      }

      setCoords({ top, left });
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);
    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [anchorEl]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(event.target as Node) &&
        (!anchorEl || !anchorEl.contains(event.target as Node))
      ) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose, anchorEl]);

  const allEmojis = EMOJI_CATEGORIES.flatMap((c) => c.emojis);
  const currentCategoryData = EMOJI_CATEGORIES.find((c) => c.id === activeCategory);
  const displayedEmojis = search.trim()
    ? allEmojis.filter((emoji) => emoji.includes(search.trim()))
    : currentCategoryData?.emojis || [];

  const content = (
    <div
      ref={popoverRef}
      style={
        anchorEl
          ? {
              position: 'fixed',
              top: coords ? `${coords.top}px` : '50%',
              left: coords ? `${coords.left}px` : '50%',
              zIndex: 9999,
            }
          : undefined
      }
      className={`bg-white rounded-2xl shadow-2xl border border-slate-200/90 w-72 p-3 z-50 animate-in fade-in zoom-in-95 duration-150 select-none ${className}`}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Search Input */}
      <div className="relative mb-2.5">
        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search emoji..."
          className="w-full pl-8 pr-7 py-1.5 text-xs bg-slate-50 border border-slate-200/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary placeholder-slate-400"
          autoFocus
        />
        {search && (
          <button
            type="button"
            onClick={() => setSearch('')}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded cursor-pointer"
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* Category Tabs (if not searching) */}
      {!search.trim() && (
        <div className="flex items-center justify-between gap-1 pb-2 border-b border-slate-100 mb-2">
          {EMOJI_CATEGORIES.map((category) => {
            const Icon = category.icon;
            const isActive = activeCategory === category.id;
            return (
              <button
                key={category.id}
                type="button"
                onClick={() => setActiveCategory(category.id)}
                title={category.name}
                className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                  isActive
                    ? 'bg-blue-50 text-primary shadow-2xs'
                    : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
              </button>
            );
          })}
        </div>
      )}

      {/* Emoji Grid */}
      <div className="max-h-48 overflow-y-auto pr-1 grid grid-cols-7 gap-1">
        {displayedEmojis.length === 0 ? (
          <div className="col-span-7 py-6 text-center text-xs text-slate-400">
            No emoji found
          </div>
        ) : (
          displayedEmojis.map((emoji, idx) => (
            <button
              key={`${emoji}-${idx}`}
              type="button"
              onClick={() => onSelect(emoji)}
              className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-lg transition-transform hover:scale-125 cursor-pointer active:scale-95"
            >
              {emoji}
            </button>
          ))
        )}
      </div>
    </div>
  );

  if (anchorEl) {
    return createPortal(content, document.body);
  }

  return content;
};

export default EmojiPickerPopover;
