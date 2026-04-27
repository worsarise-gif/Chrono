import React from 'react';
import styles from './SidebarIcons.module.css';

interface EditIconProps extends React.SVGProps<SVGSVGElement> {}

export const EditIcon: React.FC<EditIconProps> = ({ className, ...props }) => {
  return (
    <svg
      className={`${styles.icon} ${styles.iconEdit} ${className || ''}`}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      {...props}
    >
      <path d="M12 4H10a6 6 0 0 0-6 6v4a6 6 0 0 0 6 6h4a6 6 0 0 0 6-6v-3" />
      <path className={styles.pencil} d="M18.5 2.5a2.5 2.5 0 0 1 3.5 3.5L12.5 15.5l-4.5 1.5 1.5-4.5 9-10z" />
    </svg>
  );
};
