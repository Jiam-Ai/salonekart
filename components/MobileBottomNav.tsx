import React, { useContext } from 'react';
import { AppContext } from '../App';
import type { View } from '../types';

interface MobileBottomNavProps {
}

// FIX: Replaced `JSX.Element` with `React.ReactNode` to resolve namespace error.
const NavItem: React.FC<{ active: boolean, label: string, icon: React.ReactNode, onClick: () => void }> = ({ active, label, icon, onClick }) => {
    return (
        <button onClick={onClick} className="flex flex-col items-center justify-center w-full pt-2 pb-1 transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-md">
            <div className={`transition-colors duration-200 ${active ? 'text-primary' : 'text-gray-500 dark:text-gray-400'}`}>
                {icon}
            </div>
            <span className={`text-xs mt-1 transition-colors duration-200 ${active ? 'text-primary font-semibold' : 'text-gray-600 dark:text-gray-300'}`}>
                {label}
            </span>
        </button>
    );
};


export const MobileBottomNav: React.FC<MobileBottomNavProps> = () => {
    const context = useContext(AppContext);
    if (!context) return null;

    const { cart, translations, currentSeller, currentBuyer, handleNavigation, view, openCart, wishlist } = context;
    const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

    const handleAccountClick = () => {
        if (currentSeller) {
            handleNavigation('seller');
        } else if (currentBuyer) {
            handleNavigation('buyer-dashboard');
        } else {
            handleNavigation('auth');
        }
    };
    
    const isAccountActive = ['seller', 'buyer-dashboard', 'auth'].includes(view);

    return (
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-base-100 dark:bg-gray-800 shadow-[0_-2px_10px_rgba(0,0,0,0.08)] z-40 h-16 border-t border-base-300 dark:border-gray-700">
            <div className="flex justify-around items-center h-full max-w-md mx-auto">
                <NavItem 
                    active={view === 'shop'} 
                    label="Home" 
                    onClick={() => handleNavigation('shop')} 
                    icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>}
                />
                <div className="relative w-full h-full flex items-center justify-center">
                     <NavItem 
                        active={view === 'wishlist'}
                        label={translations.wishlist}
                        onClick={() => handleNavigation('wishlist')}
                        icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>}
                    />
                     {wishlist.length > 0 && (
                        <span className="absolute top-2 right-1/2 transform translate-x-[20px] bg-secondary text-secondary-content text-[10px] font-bold rounded-full h-4 w-4 flex items-center justify-center pointer-events-none ring-2 ring-base-100 dark:ring-gray-800">
                            {wishlist.length > 9 ? '9+' : wishlist.length}
                        </span>
                    )}
                </div>
                <div className="relative w-full h-full flex items-center justify-center">
                    <NavItem 
                        active={false}
                        label={translations.shopping_cart.split(' ')[0]} // "Cart"
                        onClick={openCart}
                        icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>}
                    />
                    {cartItemCount > 0 && (
                        <span className="absolute top-2 right-1/2 transform translate-x-[20px] bg-secondary text-secondary-content text-[10px] font-bold rounded-full h-4 w-4 flex items-center justify-center pointer-events-none ring-2 ring-base-100 dark:ring-gray-800">
                            {cartItemCount > 9 ? '9+' : cartItemCount}
                        </span>
                    )}
                </div>
                <NavItem 
                    active={isAccountActive}
                    label={translations.my_account} 
                    onClick={handleAccountClick} 
                    icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>}
                />
            </div>
        </nav>
    );
};