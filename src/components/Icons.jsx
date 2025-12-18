import React from 'react';
import Svg, { Path } from 'react-native-svg';

export const LockIcon = ({ color, ...props }) => (
  <Svg
    width={16}
    height={16}
    viewBox="0 0 16 16"
    fill="none"
    {...props}
  >
    <Path
      d="M12.5 7H12V5C12 2.79 10.21 1 8 1S4 2.79 4 5V7H3.5C2.67 7 2 7.67 2 8.5V13.5C2 14.33 2.67 15 3.5 15H12.5C13.33 15 14 14.33 14 13.5V8.5C14 7.67 13.33 7 12.5 7ZM8 11.5C7.17 11.5 6.5 10.83 6.5 10C6.5 9.17 7.17 8.5 8 8.5C8.83 8.5 9.5 9.17 9.5 10C9.5 10.83 8.83 11.5 8 11.5ZM10.5 7H5.5V5C5.5 3.62 6.62 2.5 8 2.5C9.38 2.5 10.5 3.62 10.5 5V7Z"
      fill={color || '#999999'}
    />
  </Svg>
);

export const CheckIcon = ({ color, boxSize, ...props }) => (
  <Svg
    width={boxSize || 16}
    height={boxSize || 16}
    viewBox="0 0 16 16"
    fill="none"
    {...props}
  >
    <Path
      d="M13.5 4L6 11.5L2.5 8"
      stroke={color || '#16a34a'}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export const ChevronDownIcon = ({ color, boxSize, ...props }) => (
  <Svg
    width={boxSize || 20}
    height={boxSize || 20}
    viewBox="0 0 20 20"
    fill="none"
    {...props}
  >
    <Path
      d="M5 7.5L10 12.5L15 7.5"
      stroke={color || '#9ca3af'}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export const ChevronUpIcon = ({ color, boxSize, ...props }) => (
  <Svg
    width={boxSize || 20}
    height={boxSize || 20}
    viewBox="0 0 20 20"
    fill="none"
    {...props}
  >
    <Path
      d="M15 12.5L10 7.5L5 12.5"
      stroke={color || '#9ca3af'}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export const CloseIcon = ({ color, ...props }) => (
  <Svg
    width={16}
    height={16}
    viewBox="0 0 16 16"
    fill="none"
    {...props}
  >
    <Path
      d="M12 4L4 12M4 4L12 12"
      stroke={color || '#9ca3af'}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export const LogoutIcon = ({ color, ...props }) => (
  <Svg
    width={16}
    height={16}
    viewBox="0 0 16 16"
    fill="none"
    {...props}
  >
    <Path
      d="M6 14H3.33333C2.97971 14 2.64057 13.8595 2.39052 13.6095C2.14048 13.3594 2 13.0203 2 12.6667V3.33333C2 2.97971 2.14048 2.64057 2.39052 2.39052C2.64057 2.14048 2.97971 2 3.33333 2H6M10.6667 11.3333L14 8M14 8L10.6667 4.66667M14 8H6"
      stroke={color || '#111827'}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export const MicIcon = ({ color, boxSize, ...props }) => (
  <Svg
    width={boxSize || 24}
    height={boxSize || 24}
    viewBox="0 0 24 24"
    fill="none"
    {...props}
  >
    <Path
      d="M12 1C10.34 1 9 2.34 9 4V12C9 13.66 10.34 15 12 15C13.66 15 15 13.66 15 12V4C15 2.34 13.66 1 12 1Z"
      fill={color || '#166534'}
    />
    <Path
      d="M19 10V12C19 15.87 15.87 19 12 19C8.13 19 5 15.87 5 12V10H3V12C3 16.41 6.32 20.06 10.5 20.85V24H13.5V20.85C17.68 20.06 21 16.41 21 12V10H19Z"
      fill={color || '#166534'}
    />
  </Svg>
);

export const MicOffIcon = ({ color, boxSize, ...props }) => (
  <Svg
    width={boxSize || 24}
    height={boxSize || 24}
    viewBox="0 0 24 24"
    fill="none"
    {...props}
  >
    <Path
      d="M12 1C10.34 1 9 2.34 9 4V12C9 13.66 10.34 15 12 15C13.66 15 15 13.66 15 12V4C15 2.34 13.66 1 12 1Z"
      fill={color || '#6b7280'}
      opacity="0.4"
    />
    <Path
      d="M19 10V12C19 15.87 15.87 19 12 19C8.13 19 5 15.87 5 12V10H3V12C3 16.41 6.32 20.06 10.5 20.85V24H13.5V20.85C17.68 20.06 21 16.41 21 12V10H19Z"
      fill={color || '#6b7280'}
      opacity="0.4"
    />
    <Path
      d="M2.39 1.73L1.11 3L9 10.89V12C9 13.66 10.34 15 12 15C12.41 15 12.81 14.93 13.17 14.79L14.77 16.39C13.98 16.78 13.02 17 12 17C9.24 17 7 14.76 7 12V10.89L5 8.89V12C5 15.53 7.61 18.43 11 18.93V22H13V18.93C14.21 18.76 15.32 18.32 16.27 17.66L20.01 21.4L21.29 20.12L2.39 1.73ZM15 12V6.41L17 4.41V12C17 14.76 14.76 17 12 17L10.12 15.12C12.78 15.12 15 12.78 15 12Z"
      fill={color || '#6b7280'}
    />
  </Svg>
);
