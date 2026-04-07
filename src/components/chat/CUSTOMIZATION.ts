/**
 * CUSTOMIZATION: Message Bubble Colors
 * 
 * If you don't want to use the default green-500 color,
 * customize it here!
 */

/* ============================================
   OPTION 1: Custom Tailwind Colors (Recommended)
   ============================================ */

/* 
 * Edit your tailwind.config.ts file:
 * 
 * export default {
 *   theme: {
 *     extend: {
 *       colors: {
 *         'message-own': '#007AFF',    // iOS Blue (like iMessage)
 *         'message-other': '#E5E5EA',  // iOS Light Gray
 *       }
 *     }
 *   }
 * }
 * 
 * Then update MessageItemNew.tsx line 213:
 * 
 * <div className={`px-4 py-2 rounded-2xl ${
 *     isCurrentUser
 *         ? 'bg-message-own text-white rounded-br-none shadow-md'
 *         : 'bg-message-other text-gray-900 rounded-bl-none shadow-sm border border-gray-300'
 * }`}>
 */

/* ============================================
   OPTION 2: Semantic Color Names
   ============================================ */

/*
 * Zalo Style (Current - Green)
 */
const ZALO_STYLE = {
    own: 'bg-green-500 text-white',     // Xanh Zalo
    other: 'bg-gray-100 text-gray-900', // Xám nhạt
};

/*
 * Messenger Style (Facebook)
 */
const MESSENGER_STYLE = {
    own: 'bg-blue-500 text-white',      // Xanh dương FB
    other: 'bg-gray-200 text-gray-900', // Xám
};

/*
 * iMessage Style (Apple)
 */
const IMESSAGE_STYLE = {
    own: 'bg-blue-500 text-white',      // Xanh dương Apple
    other: 'bg-gray-300 text-gray-900', // Xám đậm
};

/*
 * Modern Dark Theme
 */
const DARK_THEME = {
    own: 'bg-blue-600 text-white',           // Xanh dương tối
    other: 'bg-gray-700 text-gray-100',      // Xám tối
};

/*
 * Corporate / Professional
 */
const CORPORATE_STYLE = {
    own: 'bg-indigo-600 text-white',    // Tím chuyên nghiệp
    other: 'bg-gray-100 text-gray-800', // Xám nhẹ
};

/*
 * Vibrant Pink (Telegram-inspired)
 */
const VIBRANT_STYLE = {
    own: 'bg-pink-500 text-white',      // Hồng sáng
    other: 'bg-gray-100 text-gray-900', // Xám
};

/* ============================================
   OPTION 3: CSS Custom Properties (Advanced)
   ============================================ */

/*
 * If you prefer CSS variables, add to tailwind.config.ts:
 * 
 * export default {
 *   theme: {
 *     extend: {
 *       backgroundColor: {
 *         'chat-own': 'var(--chat-own-bg, #22c55e)',
 *         'chat-other': 'var(--chat-other-bg, #f3f4f6)',
 *       },
 *       textColor: {
 *         'chat-own': 'var(--chat-own-text, #ffffff)',
 *         'chat-other': 'var(--chat-other-text, #111827)',
 *       }
 *     }
 *   }
 * }
 * 
 * Then in your HTML or component:
 * 
 * <div style={{
 *   '--chat-own-bg': '#007AFF',  // Blue
 *   '--chat-other-bg': '#E5E5EA',
 * }}>
 *   <MessageItemNew ... />
 * </div>
 */

/* ============================================
   OPTION 4: Component-Level Customization
   ============================================ */

/*
 * Create a wrapper component with theme props:
 */

import React from 'react';
import { MessageItemNew, type Message } from './MessageItemNew';

type ThemeConfig = {
    ownBackground: string;  // Tailwind class or color
    ownText: string;
    otherBackground: string;
    otherText: string;
    otherBorder?: string;
};

const THEME_PRESETS = {
    zalo: {
        ownBackground: 'bg-green-500',
        ownText: 'text-white',
        otherBackground: 'bg-gray-100',
        otherText: 'text-gray-900',
        otherBorder: 'border-gray-200',
    },
    messenger: {
        ownBackground: 'bg-blue-500',
        ownText: 'text-white',
        otherBackground: 'bg-gray-200',
        otherText: 'text-gray-900',
        otherBorder: 'border-gray-300',
    },
    imessage: {
        ownBackground: 'bg-blue-500',
        ownText: 'text-white',
        otherBackground: 'bg-gray-300',
        otherText: 'text-gray-900',
        otherBorder: 'border-gray-400',
    },
} satisfies Record<string, ThemeConfig>;

interface ThemedMessageItemProps {
    theme: keyof typeof THEME_PRESETS;
    [key: string]: any;
}

/**
 * Themed Message Item Component
 * Allows easy theme switching
 */
export const ThemedMessageItem: React.FC<ThemedMessageItemProps> = ({
    theme,
    ...props
}) => {
    // NOTE: This is a concept - actual implementation would require
    // modifying MessageItemNew to accept theme props
    
    return (
        <div className={`theme-${theme}`}>
            <MessageItemNew {...props} />
        </div>
    );
};

/* ============================================
   COLOR PALETTE REFERENCE
   ============================================ */

/*
 * GREEN (Default - Zalo Style):
 * - Own: bg-green-500 (#22c55e)
 * - Other: bg-gray-100 (#f3f4f6)
 * Best for: Vietnamese apps, Zalo-like UI
 * 
 * BLUE (Messenger/iMessage Style):
 * - Own: bg-blue-500 (#3b82f6) 
 * - Other: bg-gray-200 (#e5e7eb)
 * Best for: Modern, professional, international
 * 
 * INDIGO (Professional):
 * - Own: bg-indigo-600 (#4f46e5)
 * - Other: bg-gray-100 (#f3f4f6)
 * Best for: Corporate, enterprise apps
 * 
 * TEAL (Fresh):
 * - Own: bg-teal-500 (#14b8a6)
 * - Other: bg-gray-100 (#f3f4f6)
 * Best for: Modern, trendy UI
 * 
 * PINK (Vibrant):
 * - Own: bg-pink-500 (#ec4899)
 * - Other: bg-gray-100 (#f3f4f6)
 * Best for: Creative, social apps
 */

/* ============================================
   QUICK CUSTOMIZATION STEPS
   ============================================ */

/* 
 * 1. Open MessageItemNew.tsx, find line ~213
 * 
 * 2. Replace:
 *    className={`px-4 py-2 rounded-2xl ${
 *        isCurrentUser
 *            ? 'bg-green-500 text-white rounded-br-none shadow-md'
 *            : 'bg-gray-100 text-gray-900 rounded-bl-none shadow-sm border border-gray-200'
 *    }`}
 * 
 * 3. With your preferred style, e.g., for Blue:
 *    className={`px-4 py-2 rounded-2xl ${
 *        isCurrentUser
 *            ? 'bg-blue-500 text-white rounded-br-none shadow-md'
 *            : 'bg-gray-200 text-gray-900 rounded-bl-none shadow-sm border border-gray-300'
 *    }`}
 * 
 * 4. Test and adjust!
 */

/* ============================================
   HEXADECIMAL COLOR CODES
   ============================================ */

const HEX_COLORS = {
    // Blues
    'facebook-blue': '#007AFF',      // iOS Facebook blue
    'messenger-blue': '#005eff',     // Messenger
    'telegram-blue': '#0088cc',      // Telegram
    'discord-blue': '#5865F2',       // Discord
    'twitter-blue': '#1DA1F2',       // Twitter
    
    // Greens
    'zalo-green': '#0084FF',         // Zalo brand
    'whatsapp-green': '#25D366',     // WhatsApp
    'lime-green': '#84cc16',         // Bright
    
    // Grays
    'light-gray': '#f3f4f6',         // Gray-100
    'medium-gray': '#e5e7eb',        // Gray-200
    'dark-gray': '#d1d5db',         // Gray-300
    
    // Examples
    'premium-purple': '#8B5CF6',     // Vibrant purple
    'coral': '#FF6B6B',              // Warm coral
    'teal': '#14b8a6',               // Modern teal
};

/* ============================================
   TESTING YOUR CUSTOM COLORS
   ============================================ */

/*
 * After customizing, check:
 * 
 * 1. Text contrast: Use https://webaim.org/resources/contrastchecker/
 *    Ensure white text on colored background has ratio > 4.5:1
 * 
 * 2. Visual balance:
 *    - Left message should be darker than background (#f5f7fa)
 *    - Right message should be clearly distinct
 * 
 * 3. Emoji compatibility:
 *    Some colors may not show emoji clearly
 *    Test with reactions in your custom color
 * 
 * 4. Dark mode (if applicable):
 *    Adjust colors for dark theme separately
 */

export {
    ZALO_STYLE,
    MESSENGER_STYLE,
    IMESSAGE_STYLE,
    DARK_THEME,
    CORPORATE_STYLE,
    VIBRANT_STYLE,
    THEME_PRESETS,
    HEX_COLORS,
};
