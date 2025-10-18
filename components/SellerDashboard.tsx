import React, { useState, useContext, useMemo } from 'react';
import { AppContext } from '../App';
import type { Product, Seller, Order } from '../types';
import { ProductCard } from './ProductCard';
import { ProductForm } from './ProductForm';

interface SellerDashboardProps {
    sellerProducts: Product[];
    sellerOrders: Order[];
    onAddProduct: (product: Product) => void;
    onUpdateProduct: (product: Product) => void;
    currentSeller: Seller;
    onUpdateProfile: (updatedInfo: Partial<Seller>) => Promise<{ success: boolean; error?: string }>;
    unseenOrderIds: string[];
    onViewOrders: () => void;
}

const OrderHistory: React.FC<{ orders: Order[]; unseenOrderIds: string[] }> = ({ orders, unseenOrderIds }) => {
    const context = useContext(AppContext);
    const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

    if (!context) return null;
    const { translations, handleNavigation } = context;

    if (orders.length === 0) {
        return (
            <div className="text-center py-10 bg-white dark:bg-gray-800 rounded-lg shadow-md">
                <p className="text-gray-500 dark:text-gray-400">{translations.no_orders_yet}</p>
            </div>
        );
    }
    
    const toggleOrder = (orderId: string) => {
        setExpandedOrderId(prevId => (prevId === orderId ? null : orderId));
    };

    return (
        <div className="space-y-4">
            {orders.map(order => {
                const isUnseen = unseenOrderIds.includes(order.id);
                return (
                <div key={order.id} className={`bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden transition-colors ${isUnseen ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}>
                    <div className="w-full p-4 text-left bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors focus:outline-none">
                        <div className="flex justify-between items-center">
                            <div onClick={() => toggleOrder(order.id)} className="flex-grow cursor-pointer pr-4">
                                <div className="flex items-center space-x-2">
                                    <p className="font-semibold text-primary dark:text-blue-400">{translations.order_id}: {order.id}</p>
                                    {isUnseen && (
                                        <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full animate-pulse">NEW</span>
                                    )}
                                </div>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{translations.date}: {new Date(order.date).toLocaleDateString()}</p>
                            </div>
                            <div className="flex items-center space-x-4">
                                <div onClick={() => toggleOrder(order.id)} className="text-right cursor-pointer">
                                    <p className="font-bold text-lg text-gray-800 dark:text-gray-100">SLL {new Intl.NumberFormat('en-US').format(order.total)}</p>
                                    <span className="text-sm text-gray-500 dark:text-gray-400">{order.items.length} item(s)</span>
                                </div>
                                <button 
                                    onClick={() => handleNavigation('track-order', { orderId: order.id })}
                                    className="text-sm font-semibold bg-secondary text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors whitespace-nowrap"
                                >
                                    {translations.track_order}
                                </button>
                            </div>
                        </div>
                    </div>
                    {expandedOrderId === order.id && (
                        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                <div>
                                    <h4 className="font-semibold text-gray-700 dark:text-gray-200 mb-2">{translations.buyer_information}</h4>
                                    <p className="text-sm text-gray-600 dark:text-gray-300">{order.buyerInfo.fullName}</p>
                                    <p className="text-sm text-gray-600 dark:text-gray-300">{order.buyerInfo.phoneNumber}</p>
                                    <p className="text-sm text-gray-600 dark:text-gray-300">{order.buyerInfo.deliveryAddress}</p>
                                </div>
                                <div>
                                    <h4 className="font-semibold text-gray-700 dark:text-gray-200 mb-2">{translations.items_in_order}</h4>
                                    <ul className="space-y-2">
                                        {order.items.map(item => (
                                            <li key={item.product.id} className="flex items-center space-x-3 text-sm">
                                                <img src={item.product.images[0]} alt={item.product.name} className="w-10 h-10 object-cover rounded" />
                                                <span className="flex-grow text-gray-700 dark:text-gray-200">{item.product.name}</span>
                                                <span className="text-gray-500 dark:text-gray-400">Qty: {item.quantity}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
                );
            })}
        </div>
    );
};

const MyProfile: React.FC<{ currentSeller: Seller; onUpdateProfile: (updatedInfo: Partial<Seller>) => Promise<{ success: boolean; error?: string }> }> = ({ currentSeller, onUpdateProfile }) => {
    const context = useContext(AppContext);
    const [storeName, setStoreName] = useState(currentSeller.storeName);
    const [email, setEmail] = useState(currentSeller.email);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    if (!context) return null;
    const { translations } = context;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage(null);

        if (!storeName || !email) {
            setMessage({ type: 'error', text: 'Please fill in all fields.' }); // This is a fallback, should have a translation key
            return;
        }

        const updatedInfo: Partial<Seller> = {};
        if (storeName !== currentSeller.storeName) updatedInfo.storeName = storeName;
        if (email !== currentSeller.email) updatedInfo.email = email;

        if (Object.keys(updatedInfo).length > 0) {
            const result = await onUpdateProfile(updatedInfo);
            if (result.success) {
                setMessage({ type: 'success', text: translations.profile_updated_success });
            } else {
                setMessage({ type: 'error', text: translations[result.error!] || translations.profile_update_error });
            }
        }
    };

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md max-w-lg mx-auto">
            <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4">{translations.my_profile}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label htmlFor="storeName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{translations.store_name}</label>
                    <input type="text" name="storeName" id="storeName" value={storeName} onChange={e => setStoreName(e.target.value)} required className="mt-1 w-full p-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md" />
                </div>
                <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{translations.email}</label>
                    <input type="email" name="email" id="email" value={email} onChange={e => setEmail(e.target.value)} required className="mt-1 w-full p-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md" />
                </div>
                {message && (
                    <p className={`text-sm ${message.type === 'success' ? 'text-green-600' : 'text-red-500'}`}>{message.text}</p>
                )}
                <button type="submit" className="w-full bg-primary text-white py-2 px-4 rounded-md font-semibold hover:bg-blue-800">
                    {translations.update_profile}
                </button>
            </form>
        </div>
    );
};

const PerformanceCard: React.FC<{ title: string; value: string; icon: React.ReactNode; note?: string }> = ({ title, value, icon, note }) => (
    <div className="bg-lightgray dark:bg-gray-700/50 p-6 rounded-lg flex items-center space-x-4">
        <div className="bg-primary/20 text-primary dark:text-blue-300 p-3 rounded-full">{icon}</div>
        <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
            <p className="text-3xl font-bold text-gray-800 dark:text-gray-100">{value}</p>
            {note && <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{note}</p>}
        </div>
    </div>
);


export const SellerDashboard: React.FC<SellerDashboardProps> = ({ sellerProducts, sellerOrders, onAddProduct, onUpdateProduct, currentSeller, onUpdateProfile, unseenOrderIds, onViewOrders }) => {
    const context = useContext(AppContext);
    const [activeTab, setActiveTab] = useState('dashboard');
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);

    if (!context) return null;
    const { translations } = context;
    
    const performanceMetrics = useMemo(() => {
        const totalSales = sellerOrders.reduce((sum, order) => sum + order.total, 0);
        const averageOrderValue = sellerOrders.length > 0 ? totalSales / sellerOrders.length : 0;

        const allReviews = sellerProducts.flatMap(p => p.reviews || []);
        const totalRating = allReviews.reduce((sum, review) => sum + review.rating, 0);
        const customerSatisfaction = allReviews.length > 0 ? (totalRating / allReviews.length) : 0;

        return {
            totalSales,
            averageOrderValue,
            customerSatisfaction,
            totalReviews: allReviews.length
        };
    }, [sellerOrders, sellerProducts]);

    const topSellingProducts = useMemo(() => {
        // Create a map of current products for efficient lookup and up-to-date details.
        const sellerProductMap = new Map(sellerProducts.map(p => [p.id, p]));
        
        // Aggregate sales data from all orders.
        const salesData: { [productId: number]: { unitsSold: number; product: Product | undefined } } = {};

        sellerOrders.forEach(order => {
            order.items.forEach(item => {
                const id = item.product.id;
                if (!salesData[id]) {
                    // Initialize with the most current product data, falling back to order data if product was deleted.
                    salesData[id] = { unitsSold: 0, product: sellerProductMap.get(id) ?? item.product };
                }
                salesData[id].unitsSold += item.quantity;
            });
        });

        // Sort, slice, and format the aggregated data.
        return Object.values(salesData)
            .filter(data => data.product) // Ensure product information exists.
            .sort((a, b) => b.unitsSold - a.unitsSold)
            .slice(0, 5)
            .map(data => ({ ...data.product!, unitsSold: data.unitsSold }));
            
    }, [sellerOrders, sellerProducts]);
    
    const handleStartEdit = (product: Product) => {
        setEditingProduct(product);
        setActiveTab('add-product');
    };

    const handleFormSubmit = (productData: Product) => {
        if (editingProduct) { // It's an update
            onUpdateProduct(productData);
        } else { // It's a new product
            onAddProduct(productData);
        }
        setEditingProduct(null);
        setActiveTab('my-products');
    };

    const handleCancelEdit = () => {
        setEditingProduct(null);
        setActiveTab('my-products');
    };

    const tabs = [
        { id: 'dashboard', label: translations.dashboard },
        { id: 'my-products', label: translations.my_products },
        { id: 'add-product', label: editingProduct ? 'Edit Product' : translations.add_new_product },
        { id: 'order-history', label: translations.order_history },
        { id: 'my-profile', label: translations.my_profile },
    ];
    
    const handleTabClick = (tabId: string) => {
        // If user navigates away from the form while editing, cancel the edit.
        if (editingProduct && tabId !== 'add-product') {
            setEditingProduct(null);
        }
        setActiveTab(tabId);
        if (tabId === 'order-history') {
            onViewOrders();
        }
    };

    return (
        <main className="container mx-auto px-4 py-8">
            <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-6">{translations.seller_dashboard}</h2>
            
            <div role="tablist" aria-label="Seller dashboard sections" className="flex flex-wrap items-center gap-2 mb-6">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        id={`tab-${tab.id}`}
                        role="tab"
                        aria-selected={activeTab === tab.id}
                        aria-controls={`panel-${tab.id}`}
                        onClick={() => handleTabClick(tab.id)}
                        className={`relative flex-1 min-w-[120px] text-center px-4 py-2.5 rounded-md text-sm font-semibold transition-all duration-300 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary ${
                            activeTab === tab.id
                            ? 'bg-primary text-white shadow-md'
                            : 'text-gray-500 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 dark:hover:text-gray-100'
                        }`}
                    >
                        {tab.label}
                        {tab.id === 'order-history' && unseenOrderIds.length > 0 && (
                           <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center ring-2 ring-white dark:ring-gray-800" aria-label={`${unseenOrderIds.length} new orders`}>
                               {unseenOrderIds.length}
                           </span>
                        )}
                    </button>
                ))}
            </div>
            
            <div className="mt-6">
                <div id="panel-dashboard" role="tabpanel" tabIndex={0} aria-labelledby="tab-dashboard" className="focus:outline-none space-y-8" hidden={activeTab !== 'dashboard'}>
                    <div>
                        <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-4">Performance Overview</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <PerformanceCard 
                                title="Total Sales"
                                value={`SLL ${new Intl.NumberFormat('en-US').format(performanceMetrics.totalSales)}`}
                                icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>}
                            />
                            <PerformanceCard 
                                title="Average Order Value"
                                value={`SLL ${new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(performanceMetrics.averageOrderValue)}`}
                                icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>}
                            />
                            <PerformanceCard 
                                title="Customer Satisfaction"
                                value={performanceMetrics.totalReviews > 0 ? `${performanceMetrics.customerSatisfaction.toFixed(1)} / 5.0` : 'N/A'}
                                note={performanceMetrics.totalReviews > 0 ? `Based on ${performanceMetrics.totalReviews} reviews` : '(No reviews yet)'}
                                icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>}
                            />
                        </div>
                    </div>
                     <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                        <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4">{translations.top_selling_products}</h3>
                        {topSellingProducts.length > 0 ? (
                            <div className="space-y-4">
                                {topSellingProducts.map(product => (
                                    <div key={product.id} className="flex items-center space-x-4 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-md">
                                        <img src={product.images[0]} alt={product.name} className="w-16 h-16 object-cover rounded-md flex-shrink-0" />
                                        <div className="flex-grow">
                                            <p className="font-semibold text-gray-800 dark:text-gray-100">{product.name}</p>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">{product.category}</p>
                                        </div>
                                        <div className="text-right flex-shrink-0">
                                            <p className="text-lg font-bold text-primary dark:text-blue-400">{product.unitsSold}</p>
                                            <p className="text-sm text-gray-600 dark:text-gray-300">{translations.units_sold}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-gray-500 dark:text-gray-400">{translations.no_orders_yet}</p>
                        )}
                     </div>
                </div>

                <div id="panel-my-products" role="tabpanel" tabIndex={0} aria-labelledby="tab-my-products" className="focus:outline-none" hidden={activeTab !== 'my-products'}>
                    {sellerProducts.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {sellerProducts.map(p => <ProductCard key={p.id} product={p} isSellerView={true} onEdit={handleStartEdit} onUpdate={onUpdateProduct} />)}
                        </div>
                    ) : (
                        <div className="text-center py-10 bg-white dark:bg-gray-800 rounded-lg shadow-md">
                            <p className="text-gray-500 dark:text-gray-400">{translations.no_products_added}</p>
                        </div>
                    )}
                </div>
                
                <div id="panel-add-product" role="tabpanel" tabIndex={0} aria-labelledby="tab-add-product" className="focus:outline-none" hidden={activeTab !== 'add-product'}>
                   <ProductForm
                        key={editingProduct ? editingProduct.id : 'new'} // Force re-mount on product change
                        onFormSubmit={handleFormSubmit}
                        productToEdit={editingProduct}
                        currentSeller={currentSeller}
                        onCancel={handleCancelEdit}
                    />
                </div>
                
                <div id="panel-order-history" role="tabpanel" tabIndex={0} aria-labelledby="tab-order-history" className="focus:outline-none" hidden={activeTab !== 'order-history'}>
                    <OrderHistory orders={sellerOrders} unseenOrderIds={unseenOrderIds} />
                </div>
                
                <div id="panel-my-profile" role="tabpanel" tabIndex={0} aria-labelledby="tab-my-profile" className="focus:outline-none" hidden={activeTab !== 'my-profile'}>
                    <MyProfile currentSeller={currentSeller} onUpdateProfile={onUpdateProfile} />
                </div>
            </div>
        </main>
    );
};
