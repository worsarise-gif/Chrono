import React from 'react';
import styles from './SidebarIcons.module.css';

interface GalleryIconProps extends React.SVGProps<SVGSVGElement> {}

export const GalleryIcon: React.FC<GalleryIconProps> = ({ className, ...props }) => {
  return (
    <svg
      className={`${styles.icon} ${styles.iconImage} ${className || ''}`}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      {...props}
    >
      <rect x="3" y="3" width="18" height="18" rx="7" />
      <circle cx="15.5" cy="8.5" r="1.8" className={`${styles.filled} ${styles.sun}`} />
      <path className={styles.mountain} d="M 3 16 C 6 12, 8 12, 10 15 C 12 18, 15 11, 18 11 C 19.5 11, 20.5 13, 21 15" />
    </svg>
  );
};
