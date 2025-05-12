import { LoaderCircle } from 'lucide-react';

function Loading({ size = 24, className = '' }) {
  return (
    <div
      role="status"
      aria-label="Loading"
      className={`flex items-center justify-center ${className}`}
    >
      <LoaderCircle className="animate-spin" size={size} />
    </div>
  );
}

export default Loading;
