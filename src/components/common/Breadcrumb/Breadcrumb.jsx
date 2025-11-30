import React from 'react';
import { Link } from 'react-router-dom';
import { FiChevronRight } from 'react-icons/fi';

const Breadcrumb = ({ items }) => {
  return (
    <nav className="flex items-center space-x-2 text-sm text-gray-600 mb-4">
      <Link to="/" className="hover:text-orange-500">
        Home
      </Link>
      {items.map((item, index) => (
        <React.Fragment key={index}>
          <FiChevronRight size={16} />
          {item.link ? (
            <Link to={item.link} className="hover:text-orange-500">
              {item.label}
            </Link>
          ) : (
            <span className="text-gray-900">{item.label}</span>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
};

export default Breadcrumb;