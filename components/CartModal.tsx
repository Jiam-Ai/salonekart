import React, { useContext, useMemo, useState, useEffect, useRef } from 'react';
import { AppContext } from '../App';
import { CartItem } from '../types';

interface CartModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCheckout: () => void;
}

const CartModalRow: React.FC<{ item: CartItem }> = ({ item }) => {
    const context = useContext(AppContext);
    if (!context) return null;
    const { updateQuantity, removeFromCart } = context;
    const formattedPrice = new Intl.NumberFormat('en-US').format(item.product.price);

    const variantText = item.variant 
        ? Object.entries(item.variant).map(([, value]) => value).join(', ')
        : null;

    return (
        <div className="flex items-center justify-between py-4 border-b border-base-300 dark:border-gray-700 last:border-b-0">
            <div className="flex items-center space-x-4 flex-1 min-w-0">
                <img src={item.product.images[0]} alt={item.product.name} className="w-16 h-16 object-cover rounded-md flex-shrink-0" />
                <div className="min-w-0">
                    <p className="font-semibold text-base-content truncate">{item.product.name}</p>
                    {variantText && <p className="text-xs text-gray-500 dark:text-gray-400">{variantText}</p>}
                    <p className="text-sm text-gray-500 dark:text-gray-400">SLL {formattedPrice}</p>
                </div>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-4 ml-2">
                 <div className="flex items-center">
                    <button onClick={() => updateQuantity(item.cartItemId, item.quantity - 1)} className="w-7 h-7 flex items-center justify-center rounded-full border border-base-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-base-200 dark:hover:bg-gray-700 active:scale-95 transition-all" aria-label="Decrease quantity">-</button>
                    <span className="w-10 text-center font-semibold text-base-content" aria-label="Current quantity">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.cartItemId, item.quantity + 1)} className="w-7 h-7 flex items-center justify-center rounded-full border border-base-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-base-200 dark:hover:bg-gray-700 active:scale-95 transition-all" aria-label="Increase quantity">+</button>
                </div>
                <button onClick={() => removeFromCart(item.cartItemId)} className="text-gray-400 dark:text-gray-500 hover:text-error dark:hover:text-red-400 transition-colors p-1" aria-label="Remove item">
                   <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
            </div>
        </div>
    );
};

export const CartModal: React.FC<CartModalProps> = ({ isOpen, onClose, onCheckout }) => {
    const context = useContext(AppContext);
    const [isSubtotalAnimating, setIsSubtotalAnimating] = useState(false);
    const prevSubtotalRef = useRef<number>();

    if (!context) return null;

    const { cart, translations } = context;

    const subtotal = useMemo(() => {
        return cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
    }, [cart]);
    const formattedSubtotal = new Intl.NumberFormat('en-US').format(subtotal);

    useEffect(() => {
        if (prevSubtotalRef.current !== undefined && prevSubtotalRef.current !== subtotal) {
            setIsSubtotalAnimating(true);
            const timer = setTimeout(() => setIsSubtotalAnimating(false), 500); // Animation duration
            return () => clearTimeout(timer);
        }
        prevSubtotalRef.current = subtotal;
    }, [subtotal]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center animate-fade-in" aria-modal="true" role="dialog" onClick={onClose}>
            <div className="bg-base-100 dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl m-4 transform animate-scale-in" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center p-5 border-b border-base-300 dark:border-gray-700">
                    <h2 className="text-2xl font-bold text-base-content">{translations.shopping_cart}</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200" aria-label="Close cart">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                    </button>
                </div>

                <div className="p-5 max-h-[60vh] overflow-y-auto">
                    {cart.length === 0 ? (
                         <div className="text-center py-12">
                            <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-16 w-16 text-gray-300 dark:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                            <h3 className="mt-4 text-xl font-semibold text-base-content">{translations.empty_cart}</h3>
                            <p className="mt-1 text-gray-500 dark:text-gray-400">Looks like you haven't added anything yet.</p>
                        </div>
                    ) : (
                        cart.map(item => <CartModalRow key={item.cartItemId} item={item} />)
                    )}
                </div>
                
                {cart.length > 0 && (
                    <div className="p-5 border-t border-base-300 dark:border-gray-700 bg-base-200/50 dark:bg-gray-900/50 rounded-b-lg">
                        <div className="flex justify-between items-center mb-4">
                            <span className="text-lg font-medium text-gray-600 dark:text-gray-300">{translations.subtotal}:</span>
                            <span 
                                className={`text-2xl font-bold text-primary dark:text-blue-400 transition-transform duration-500 ${isSubtotalAnimating ? 'scale-110' : 'scale-100'}`}
                                aria-live="polite"
                            >
                                SLL {formattedSubtotal}
                            </span>
                        </div>
                        <button 
                            onClick={onCheckout}
                            className="w-full bg-secondary text-secondary-content py-3 rounded-lg font-semibold text-lg hover:bg-secondary-focus transition-all duration-300 transform hover:scale-105 flex items-center justify-center gap-2"
                        >
                             <span>{translations.proceed_to_checkout}</span>
                             <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};