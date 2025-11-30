import React, { useState, useRef, useEffect } from 'react';
import { FiChevronDown, FiSearch } from 'react-icons/fi';
import { CATEGORIES } from '../../utils/constants';

const CategoryDropdown = ({ value, onChange, required = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef(null);

  // Filter categories based on search
  const filteredCategories = CATEGORIES.filter(cat =>
    cat.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Get selected category name
  const selectedCategory = CATEGORIES.find(cat => cat.id === value);

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-orange-500 text-left flex items-center justify-between bg-white hover:bg-gray-50 transition"
      >
        <span className="flex items-center gap-2">
          {selectedCategory ? (
            <>
              <span>{selectedCategory.icon}</span>
              <span>{selectedCategory.name}</span>
            </>
          ) : (
            <span className="text-gray-500">Select a category</span>
          )}
        </span>
        <FiChevronDown
          className={`transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-50">
          {/* Search Input */}
          <div className="p-2 border-b border-gray-200 sticky top-0 bg-white">
            <div className="relative">
              <FiSearch className="absolute left-3 top-2.5 text-gray-400" size={16} />
              <input
                type="text"
                placeholder="Search categories..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-3 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:border-orange-500"
                autoFocus
              />
            </div>
          </div>

          {/* Category List */}
          <div className="max-h-64 overflow-y-auto">
            {filteredCategories.length > 0 ? (
              filteredCategories.map((category) => (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => {
                    onChange({ 
                      target: { 
                        name: 'category',
                        value: category.id 
                      } 
                    });
                    setIsOpen(false);
                    setSearchTerm('');
                  }}
                  className={`w-full text-left px-4 py-2.5 flex items-center gap-2 hover:bg-orange-50 transition ${
                    value === category.id ? 'bg-orange-100 text-orange-700 font-semibold' : ''
                  }`}
                >
                  <span className="text-lg">{category.icon}</span>
                  <span className="flex-1">{category.name}</span>
                  {value === category.id && (
                    <span className="text-orange-600">✓</span>
                  )}
                </button>
              ))
            ) : (
              <div className="px-4 py-3 text-center text-gray-500 text-sm">
                No categories found
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoryDropdown;
