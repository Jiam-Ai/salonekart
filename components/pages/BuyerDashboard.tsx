import React, { useState, useContext, useMemo } from 'react';
import { AppContext } from '../../App';
import type { Buyer, Order, Product } from '../../types';
import { ProductGrid } from '../ProductGrid';

const OrderHistoryTab: React.FC = () => {
    const context = useContext(AppContext);
    const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

    if (!context) return null;
    const { translations, orders, currentBuyer, handleNavigation } = context;

    const buyerOrders = useMemo(() => {
        if (!currentBuyer) return [];
        return orders
            .filter(order => order.buyerId === currentBuyer.id)
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [orders, currentBuyer]);

    if (buyerOrders.length === 0) {
        return (
            <div className="text-center py-10 bg-base-100 dark:bg-gray-800 rounded-lg shadow-md">
                <p className="text-gray-500 dark:text-gray-400">{translations.no_orders_yet}</p>
            </div>
        );
    }
    
    const toggleOrder = (orderId: string) => {
        setExpandedOrderId(prevId => (prevId === orderId ? null : orderId));
    };

    return (
        <div className="space-y-4">
            {buyerOrders.map(order => (
                <div key={order.id} className="bg-base-100 dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
                    <div className="w-full p-4 text-left bg-base-200/50 dark:bg-gray-700/50 hover:bg-base-200 dark:hover:bg-gray-700 transition-colors focus:outline-none">
                        <div className="flex justify-between items-center">
                            <div onClick={() => toggleOrder(order.id)} className="flex-grow cursor-pointer pr-4">
                                <p className="font-semibold text-primary dark:text-blue-400">{translations.order_id}: {order.id}</p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">{translations.date}: {new Date(order.date).toLocaleDateString()}</p>
                            </div>
                            <div className="flex items-center space-x-4">
                                <div onClick={() => toggleOrder(order.id)} className="text-right cursor-pointer">
                                    <p className="font-bold text-lg text-base-content">SLL {new Intl.NumberFormat('en-US').format(order.total)}</p>
                                    <span className="text-sm text-gray-500 dark:text-gray-400">{order.items.length} item(s)</span>
                                </div>
                                <button 
                                    onClick={() => handleNavigation('track-order', { orderId: order.id })}
                                    className="text-sm font-semibold bg-secondary text-secondary-content px-4 py-2 rounded-md hover:bg-secondary-focus transition-colors whitespace-nowrap"
                                >
                                    {translations.track_order}
                                </button>
                            </div>
                        </div>
                    </div>
                    {expandedOrderId === order.id && (
                        <div className="p-4 border-t border-base-300 dark:border-gray-700">
                            <h4 className="font-semibold text-base-content mb-2">{translations.items_in_order}</h4>
                            <ul className="space-y-2">
                                {order.items.map(item => (
                                    <li key={item.cartItemId} className="flex items-center space-x-3 text-sm">
                                        <img src={item.product.images[0]} alt={item.product.name} className="w-12 h-12 object-cover rounded" />
                                        <div className="flex-grow">
                                            <p className="text-base-content font-semibold">{item.product.name}</p>
                                            <p className="text-gray-500 dark:text-gray-400">Sold by: {item.product.vendor}</p>
                                        </div>
                                        <span className="text-gray-600 dark:text-gray-300">Qty: {item.quantity}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
};


const MyProfileTab: React.FC = () => {
    const context = useContext(AppContext);
    
    if (!context || !context.currentBuyer) return null;
    
    const { translations, currentBuyer, updateBuyerProfile } = context;

    const [fullName, setFullName] = useState(currentBuyer.fullName);
    const [email, setEmail] = useState(currentBuyer.email);
    const [phoneNumber, setPhoneNumber] = useState(currentBuyer.phoneNumber);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const inputClasses = "mt-1 w-full p-2 border border-base-300 dark:border-gray-600 bg-base-100 dark:bg-gray-700 text-base-content rounded-md focus:outline-none focus:ring-2 focus:ring-primary";

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage(null);

        if (!fullName || !email || !phoneNumber) {
            setMessage({ type: 'error', text: 'Please fill in all fields.' });
            return;
        }

        const updatedInfo: Partial<Buyer> = {};
        if (fullName !== currentBuyer.fullName) updatedInfo.fullName = fullName;
        if (email !== currentBuyer.email) updatedInfo.email = email;
        if (phoneNumber !== currentBuyer.phoneNumber) updatedInfo.phoneNumber = phoneNumber;

        if (Object.keys(updatedInfo).length > 0) {
            const result = await updateBuyerProfile(updatedInfo);
            if (result.success) {
                setMessage({ type: 'success', text: translations.profile_updated_success });
            } else {
                setMessage({ type: 'error', text: translations[result.error!] || translations.profile_update_error });
            }
        }
    };

    return (
        <div className="bg-base-100 dark:bg-gray-800 p-6 rounded-lg shadow-md max-w-lg mx-auto">
            <h3 className="text-xl font-bold text-base-content mb-4">{translations.my_profile}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label htmlFor="fullName" className="block text-sm font-medium text-base-content">{translations.full_name}</label>
                    <input type="text" name="fullName" id="fullName" value={fullName} onChange={e => setFullName(e.target.value)} required className={inputClasses} />
                </div>
                 <div>
                    <label htmlFor="email" className="block text-sm font-medium text-base-content">{translations.email}</label>
                    <input type="email" name="email" id="email" value={email} onChange={e => setEmail(e.target.value)} required className={inputClasses} />
                </div>
                <div>
                    <label htmlFor="phoneNumber" className="block text-sm font-medium text-base-content">{translations.phone_number}</label>
                    <input type="tel" name="phoneNumber" id="phoneNumber" value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)} required className={inputClasses} />
                </div>
                {message && (
                    <p className={`text-sm ${message.type === 'success' ? 'text-green-600' : 'text-red-500'}`}>{message.text}</p>
                )}
                <button type="submit" className="w-full bg-primary text-primary-content py-2 px-4 rounded-md font-semibold hover:bg-primary-focus transition-colors">
                    {translations.update_profile}
                </button>
            </form>
        </div>
    );
};

const WishlistTab: React.FC<{ products: Product[], onOpenProductModal: (product: Product) => void }> = ({ products, onOpenProductModal }) => {
    const context = useContext(AppContext);
    if (!context) return null;
    const { translations } = context;

    if (products.length === 0) {
        return (
            <div className="text-center py-16 bg-base-200 dark:bg-gray-800 rounded-lg shadow-inner">
                 <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-16 w-16 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                <h2 className="mt-4 text-2xl font-semibold text-base-content">{translations.empty_wishlist}</h2>
                <p className="mt-2 text-gray-500 dark:text-gray-400">{translations.empty_wishlist_prompt}</p>
            </div>
        );
    }

    return <ProductGrid products={products} onOpenProductModal={onOpenProductModal} />;
};


export const BuyerDashboard: React.FC = () => {
    const context = useContext(AppContext);
    const [activeTab, setActiveTab] = useState('order-history');

    if (!context) return null;
    const { translations, handleNavigation, wishlist, products, openCart } = context;

     const wishlistedProducts = useMemo(() => {
        const wishlistSet = new Set(wishlist);
        return products.filter(p => wishlistSet.has(p.id));
    }, [wishlist, products]);
    
    const tabs = [
        { id: 'order-history', label: translations.order_history },
        { id: 'my-wishlist', label: translations.my_wishlist },
        { id: 'my-profile', label: translations.my_profile },
    ];
    
    return (
        <main className="container mx-auto px-4 py-8">
            <h2 className="text-3xl font-bold text-base-content mb-6">{translations.buyer_dashboard}</h2>
            
            <div role="tablist" aria-label="Buyer dashboard sections" className="flex flex-wrap items-center gap-2 mb-6">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        id={`tab-${tab.id}`}
                        role="tab"
                        aria-selected={activeTab === tab.id}
                        aria-controls={`panel-${tab.id}`}
                        onClick={() => setActiveTab(tab.id)}
                        className={`relative flex-1 min-w-[120px] text-center px-4 py-2.5 rounded-md text-sm font-semibold transition-all duration-300 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary ${
                            activeTab === tab.id
                            ? 'bg-primary text-primary-content shadow-md'
                            : 'bg-base-200 hover:bg-base-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                        }`}
                    >
                        {tab.label}
                         {tab.id === 'my-wishlist' && wishlistedProducts.length > 0 && (
                           <span className="absolute -top-2 -right-2 bg-secondary text-secondary-content text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center ring-2 ring-base-100 dark:ring-gray-800" aria-label={`${wishlistedProducts.length} items in wishlist`}>
                               {wishlistedProducts.length}
                           </span>
                        )}
                    </button>
                ))}
            </div>
            
            <div className="mt-6">
                 <div id="panel-order-history" role="tabpanel" tabIndex={0} aria-labelledby="tab-order-history" className="focus:outline-none" hidden={activeTab !== 'order-history'}>
                    <OrderHistoryTab />
                </div>
                 <div id="panel-my-wishlist" role="tabpanel" tabIndex={0} aria-labelledby="tab-my-wishlist" className="focus:outline-none" hidden={activeTab !== 'my-wishlist'}>
                    <WishlistTab products={wishlistedProducts} onOpenProductModal={(p) => openCart()} />
                </div>
                
                <div id="panel-my-profile" role="tabpanel" tabIndex={0} aria-labelledby="tab-my-profile" className="focus:outline-none" hidden={activeTab !== 'my-profile'}>
                    <MyProfileTab />
                </div>
            </div>
        </main>
    );
};