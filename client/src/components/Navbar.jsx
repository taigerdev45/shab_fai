import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/auth";
import { LogOut, LayoutDashboard, ShieldCheck, User } from "lucide-react";

const Navbar = () => {
  const { userData, logout, isAdmin } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <nav className="glass-card mx-4 mt-4 px-6 py-3 flex justify-between items-center sticky top-4 z-50">
      <Link to="/" className="flex items-center gap-2">
        <img src="/Logo_shabfai.png" alt="ShabaFAI Logo" className="h-10 w-auto object-contain" />
        <span className="text-2xl font-bold bg-gradient-to-r from-white to-blue-400 bg-clip-text text-transparent hidden sm:inline">
          ShabaFAI
        </span>
      </Link>
      
      <div className="flex items-center gap-6">
        {isAdmin ? (
          <Link to="/admin" className="flex items-center gap-2 hover:text-blue-400 transition-colors">
            <ShieldCheck size={20} />
            <span className="hidden sm:inline">Admin</span>
          </Link>
        ) : (
          <Link to="/dashboard" className="flex items-center gap-2 hover:text-blue-400 transition-colors">
            <LayoutDashboard size={20} />
            <span className="hidden sm:inline">Dashboard</span>
          </Link>
        )}
        
        <div className="flex items-center gap-4 pl-6 border-l border-white/10">
          <Link to="/profile" className="flex items-center gap-2 hover:text-blue-400 transition-colors">
            <User size={20} className="text-blue-400" />
            <span className="hidden sm:inline font-medium">{userData?.fullName}</span>
          </Link>
          <button 
            onClick={handleLogout}
            className="p-2 hover:bg-white/10 rounded-full text-red-400 transition-colors"
            title="Déconnexion"
          >
            <LogOut size={20} />
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;