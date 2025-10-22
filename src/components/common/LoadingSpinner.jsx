import React from 'react';
import './LoadingSpinner.css';

const LoadingSpinner = ({ 
  size = 'medium',
  color = 'primary',
  text = '',
  className = '',
  ...props 
}) => {
  const sizeClass = `spinner-${size}`;
  const colorClass = `spinner-${color}`;
  
  const classes = [
    'loading-spinner',
    sizeClass,
    colorClass,
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={classes} {...props}>
      <div className="spinner"></div>
      {text && <div className="spinner-text">{text}</div>}
    </div>
  );
};

export { LoadingSpinner };
export default LoadingSpinner;
