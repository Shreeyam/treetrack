import { Leaf } from 'lucide-react'
import React from 'react';

export default function Logo() {
  return (
    <div className="flex items-center">
      <Leaf className="h-6 w-6 text-primary mr-2" /> {/* Added mr-2 for spacing */}
      <span className="text-xl font-bold">Treetrack</span>
    </div>
  );
}