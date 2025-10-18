import React, { useContext } from 'react';
import { AppContext } from '../../App';
import { ProductGrid } from '../ProductGrid';
import type { Product } from '../../types';

interface WishlistProps {
    products: Product[];
    onOpenProductModal: (product: Product) => void;
}

export const Wishlist: React.FC<WishlistProps> = ({ products, onOpenProductModal }) => {
    const context = useContext(AppContext);
    if (!context) return null;
    const { translations } = context;

    return (
        <main className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold text-base-content mb-6">{translations.my_wishlist}</h1>
            {products.length > 0 ? (
                 <ProductGrid products={products} onOpenProductModal={onOpenProductModal} />
            ) : (
                <div className="text-center py-16 bg-base-200 dark:bg-gray-800 rounded-lg shadow-inner">
                    <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-16 w-16 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                    <h2 className="mt-4 text-2xl font-semibold text-base-content">{translations.empty_wishlist}</h2>
                    <p className="mt-2 text-gray-500 dark:text-gray-400">{translations.empty_wishlist_prompt}</p>
                </div>
            )}
        </main>
    );
};