import React from 'react';
import type { Product } from '../types';
import { ProductCard } from './ProductCard';

interface ProductShelfProps {
    title: string;
    products: Product[];
    onOpenProductModal: (product: Product) => void;
}

export const ProductShelf: React.FC<ProductShelfProps> = ({ title, products, onOpenProductModal }) => {
    if (products.length === 0) {
        return null;
    }

    return (
        <section className="py-4 sm:py-6">
            <style>{`
                .horizontal-scrollbar::-webkit-scrollbar {
                    height: 6px;
                }
                .horizontal-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .horizontal-scrollbar::-webkit-scrollbar-thumb {
                    background-color: #E5E5E5;
                    border-radius: 10px;
                }
                .dark .horizontal-scrollbar::-webkit-scrollbar-thumb {
                    background-color: #4a4e57;
                }
                .horizontal-scrollbar {
                    scrollbar-width: thin;
                    scrollbar-color: #E5E5E5 transparent;
                }
                .dark .horizontal-scrollbar {
                     scrollbar-color: #4a4e57 transparent;
                }
            `}</style>
            <div className="flex justify-between items-center mb-3 px-4">
                <h2 className="text-xl sm:text-2xl font-bold text-base-content">{title}</h2>
                <button className="text-sm font-semibold text-primary dark:text-blue-400 hover:underline">
                    See All
                </button>
            </div>
            <div className="flex space-x-3 overflow-x-auto pb-4 px-4 -mb-4 horizontal-scrollbar">
                {products.map(product => (
                    <div key={product.id} className="flex-shrink-0 w-32 sm:w-40">
                        <ProductCard 
                            product={product} 
                            onQuickView={() => onOpenProductModal(product)} 
                            viewMode="shelf"
                        />
                    </div>
                ))}
                 <div className="flex-shrink-0 w-1"></div>
            </div>
        </section>
    );
};
