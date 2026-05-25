import React from 'react';
import { Link } from 'react-router-dom';

const ProQuickLinks = ({ links = [] }) => {
  if (!links.length) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {links.map((l) => (
        <Link key={l.to} to={l.to} className="px-3 py-2 text-sm rounded bg-white shadow border-gray-200  hover:bg-gray-50">
          {l.label}
        </Link>
      ))}
    </div>
  );
};

export default ProQuickLinks;
