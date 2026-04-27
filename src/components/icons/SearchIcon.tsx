import React from 'react';
import styles from './SidebarIcons.module.css';

interface SearchIconProps extends React.SVGProps<SVGSVGElement> {}

export const SearchIcon: React.FC<SearchIconProps> = ({ className, ...props }) => {
  return (
    <svg
      className={`${styles.icon} ${styles.iconSearch} ${className || ''}`}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      {...props}
    >
      <circle cx="10.5" cy="10.5" r="5.5" />
      <line x1="14.5" y1="14.5" x2="20.5" y2="20.5" />
    </svg>
  );
};
