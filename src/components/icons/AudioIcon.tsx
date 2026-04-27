import React from 'react';
import styles from './SidebarIcons.module.css';

interface AudioIconProps extends React.SVGProps<SVGSVGElement> {}

export const AudioIcon: React.FC<AudioIconProps> = ({ className, ...props }) => {
  return (
    <svg
      className={`${styles.icon} ${styles.iconAudio} ${className || ''}`}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      {...props}
    >
      <line x1="4" y1="10.5" x2="4" y2="13.5" />
      <line x1="8" y1="6.5" x2="8" y2="17.5" />
      <line x1="12" y1="3.5" x2="12" y2="20.5" />
      <line x1="16" y1="6.5" x2="16" y2="17.5" />
      <line x1="20" y1="10.5" x2="20" y2="13.5" />
    </svg>
  );
};
