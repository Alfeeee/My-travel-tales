
import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="bg-white shadow-md sticky top-0 z-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <span className="font-bold text-2xl text-slate-800">MyTravelTales 🧭</span>
          </div>
          <div className="flex items-center">
            <img 
              className="h-10 w-10 rounded-full object-cover" 
              src="https://picsum.photos/id/237/100/100" 
              alt="User Avatar" 
            />
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
