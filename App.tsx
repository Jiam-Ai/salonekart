import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { CartModal } from './components/CartModal';
import { CheckoutModal } from './components/CheckoutModal';
import { VendorAIAssistant } from './components/VendorAIAssistant';
import { SellerDashboard } from './components/SellerDashboard';
import { Auth } from './components/Auth';
import { ProductModal } from './components/ProductModal';
import { FlashDeals } from './components/FlashDeals';
import { ChatbotWidget } from './components/ChatbotWidget';
import { ChatbotModal } from './components/ChatbotModal';
import { ComparisonTray } from './components/ComparisonTray';
import { ComparisonModal } from './components/ComparisonModal';
import { MobileBottomNav } from './components/MobileBottomNav';
import { ProductShelf } from './components/ProductShelf';

// Page Components
import { AboutUs } from './components/pages/AboutUs';
import { Careers } from './components/pages/Careers';
import { HelpCenter } from './components/pages/HelpCenter';
import { HowToBuy } from './components/pages/HowToBuy';
import { PrivacyPolicy } from './components/pages/PrivacyPolicy';
import { ReturnsRefunds } from './components/pages/ReturnsRefunds';
import { SuccessStories } from './components/pages/SuccessStories';
import { TermsConditions } from './components/pages/TermsConditions';
import { TrackOrder } from './components/pages/TrackOrder';
import { VendorHub } from './components/pages/VendorHub';
import { BuyerDashboard } from './components/pages/BuyerDashboard';
import { Wishlist } from './components/pages/Wishlist';


import type { Product, CartItem, Language, Seller, Order, BuyerInfo, Review, View, ChatMessage, Buyer, Theme } from './types';
import { MOCK_PRODUCTS, CATEGORIES, TRANSLATIONS, LOCAL_STORAGE_KEYS, SESSION_STORAGE_KEYS, MOCK_ORDERS } from './constants';
import { createChatSession } from './services/geminiService';
import { Chat } from '@google/genai';

const mockBuyerForDisplay: Buyer = {
    id: 'buyer-demo-1',
    email: 'demo.user@salonekart.sl',
    password: 'password123',
    fullName: 'Demo User',
    phoneNumber: '077-123-456',
    wishlist: [1, 5]
};

export const AppContext = React.createContext<{
    language: Language;
    translations: Record<string, string>;
    setLanguage: (lang: Language) => void;
    cart: CartItem[];
    addToCart: (product: Product, quantity?: number, variant?: { [key: string]: string }) => void;
    removeFromCart: (cartItemId: string) => void;
    updateQuantity: (cartItemId: string, quantity: number) => void;
    currentSeller: Seller | null;
    currentBuyer: Buyer | null;
    logout: () => void;
    updateSellerProfile: (updatedInfo: Partial<Seller>) => Promise<{ success: boolean; error?: string }>;
    updateBuyerProfile: (updatedInfo: Partial<Buyer>) => Promise<{ success: boolean; error?: string }>;
    handleNavigation: (view: View, payload?: { orderId?: string }) => void;
    orders: Order[];
    theme: Theme;
    toggleTheme: () => void;
    comparisonList: Product[];
    toggleCompare: (product: Product) => void;
    clearCompareList: () => void;
    openCart: () => void;
    view: View;
    wishlist: number[];
    toggleWishlist: (productId: number) => void;
} | null>(null);


const App: React.FC = () => {
    const [products, setProducts] = useState<Product[]>([]);
    const [orders, setOrders] = useState<Order[]>([]);
    const [view, setView] = useState<View>('shop');
    const [prefilledOrderId, setPrefilledOrderId] = useState<string | null>(null);
    const [currentSeller, setCurrentSeller] = useState<Seller | null>(null);
    const [currentBuyer, setCurrentBuyer] = useState<Buyer | null>(mockBuyerForDisplay);
    const [searchTerm, setSearchTerm] = useState('');
    const [language, setLanguage] = useState<Language>('en');
    const [cart, setCart] = useState<CartItem[]>([]);
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
    const [unseenOrderIds, setUnseenOrderIds] = useState<string[]>([]);
    const [productModal, setProductModal] = useState<{ isOpen: boolean; product: Product | null }>({ isOpen: false, product: null });
    
    // Chatbot State
    const [isChatbotOpen, setIsChatbotOpen] = useState(false);
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
    const [isBotTyping, setIsBotTyping] = useState(false);
    const [chatSession, setChatSession] = useState<Chat | null>(null);

    // Theme State
    const [theme, setTheme] = useState<Theme>('light');
    
    // Comparison State
    const [comparisonList, setComparisonList] = useState<Product[]>([]);
    const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);
    
    // Wishlist State
    const [wishlist, setWishlist] = useState<number[]>(mockBuyerForDisplay.wishlist);


    useEffect(() => {
        // Load products, orders, and sessions
        try {
            const sellerProductsJSON = localStorage.getItem(LOCAL_STORAGE_KEYS.PRODUCTS);
            const localProducts: Product[] = sellerProductsJSON ? JSON.parse(sellerProductsJSON) : [];
            const mockProductIds = new Set(MOCK_PRODUCTS.map(p => p.id));
            const uniqueLocalProducts = localProducts.filter(p => !mockProductIds.has(p.id));
            setProducts([...MOCK_PRODUCTS, ...uniqueLocalProducts]);

            const ordersJSON = localStorage.getItem(LOCAL_STORAGE_KEYS.ORDERS);
            const localOrders: Order[] = ordersJSON ? JSON.parse(ordersJSON) : [];
            const allOrders = [...MOCK_ORDERS, ...localOrders];
            const uniqueOrders = Array.from(new Map(allOrders.map(o => [o.id, o])).values());
            setOrders(uniqueOrders);

            // Check for active seller session
            const loggedInSellerId = sessionStorage.getItem(SESSION_STORAGE_KEYS.SELLER_ID);
            if (loggedInSellerId) {
                const sellersJSON = localStorage.getItem(LOCAL_STORAGE_KEYS.SELLERS);
                const sellers: Seller[] = sellersJSON ? JSON.parse(sellersJSON) : [];
                const loggedInSeller = sellers.find(s => s.id === loggedInSellerId);
                if (loggedInSeller) {
                    setCurrentSeller(loggedInSeller);
                    const unseenOrdersJSON = localStorage.getItem(`unseen_orders_${loggedInSeller.id}`);
                    setUnseenOrderIds(unseenOrdersJSON ? JSON.parse(unseenOrdersJSON) : []);
                }
            }

            /*
            // Check for active buyer session
            const loggedInBuyerId = sessionStorage.getItem(SESSION_STORAGE_KEYS.BUYER_ID);
            if (loggedInBuyerId) {
                const buyersJSON = localStorage.getItem(LOCAL_STORAGE_KEYS.BUYERS);
                const buyers: Buyer[] = buyersJSON ? JSON.parse(buyersJSON) : [];
                const loggedInBuyer = buyers.find(b => b.id === loggedInBuyerId);
                if (loggedInBuyer) {
                    setCurrentBuyer(loggedInBuyer);
                    setWishlist(loggedInBuyer.wishlist || []);
                }
            }
            */

        } catch (error) {
            console.error("Failed to load data from localStorage", error);
            setProducts(MOCK_PRODUCTS);
            setOrders(MOCK_ORDERS);
        }
        
        // Initialize Chatbot
        try {
            const session = createChatSession();
            setChatSession(session);
            setChatMessages([{ sender: 'bot', text: TRANSLATIONS[language].chatbot_greeting }]);
        } catch (error) {
            console.error("Failed to initialize chatbot:", error);
            setChatMessages([{ sender: 'bot', text: TRANSLATIONS[language].chatbot_error }]);
        }

        // Initialize Theme
        const savedTheme = localStorage.getItem(LOCAL_STORAGE_KEYS.THEME) as Theme;
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        if (savedTheme) {
            setTheme(savedTheme);
        } else if (prefersDark) {
            setTheme('dark');
        }

    }, []);

    // Effect to apply theme changes to the DOM
    useEffect(() => {
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
            document.body.style.backgroundColor = '#1f2937';
            document.body.style.color = '#F9FAFB';
        } else {
            document.documentElement.classList.remove('dark');
            document.body.style.backgroundColor = '#FFFFFF';
            document.body.style.color = '#2a2e37';
        }
        try {
            localStorage.setItem(LOCAL_STORAGE_KEYS.THEME, theme);
        } catch (error) {
            console.error("Failed to save theme to localStorage", error);
        }
    }, [theme]);
    
    // Update chatbot greeting if language changes
    useEffect(() => {
        if (chatMessages.length === 1 && chatMessages[0].sender === 'bot') {
             setChatMessages([{ sender: 'bot', text: TRANSLATIONS[language].chatbot_greeting }]);
        }
    }, [language]);
    
    const handleOpenProductModal = (product: Product) => setProductModal({ isOpen: true, product });
    const handleCloseProductModal = () => setProductModal({ isOpen: false, product: null });

    const handleNavigation = (targetView: View, payload?: { orderId?: string }) => {
        if (targetView === 'track-order' && payload?.orderId) {
            setPrefilledOrderId(payload.orderId);
        } else {
            setPrefilledOrderId(null);
        }

        if ((targetView === 'seller' || targetView === 'vendor-hub') && !currentSeller) {
            setView('auth');
        } else if ((targetView === 'buyer-dashboard' || targetView === 'wishlist') && !currentBuyer) {
            setView('auth');
        } else {
            setView(targetView);
        }
        window.scrollTo(0, 0);
    };

    const handlePlaceOrderFromChat = (productName: string, quantity: number, buyerInfo: BuyerInfo): { success: boolean; orderId?: string; error?: string } => {
        const product = products.find(p => p.name.toLowerCase() === productName.toLowerCase());

        if (!product) {
            return { success: false, error: 'Product not found.' };
        }
        
        const cartItem: CartItem = { product, quantity, cartItemId: `${product.id}-none` };

        const newOrder: Order = {
            id: `SK-${Date.now()}`,
            date: new Date().toISOString(),
            buyerInfo,
            items: [cartItem],
            total: product.price * quantity,
            buyerId: currentBuyer ? currentBuyer.id : undefined,
        };

        const updatedOrders = [...orders, newOrder];
        setOrders(updatedOrders);
        
        try {
            localStorage.setItem(LOCAL_STORAGE_KEYS.ORDERS, JSON.stringify(updatedOrders));
        } catch (error) {
            console.error("Failed to save order to localStorage", error);
            return { success: false, error: 'Failed to save order.' };
        }
        
        return { success: true, orderId: newOrder.id };
    };
    
    const handleCancelOrderFromChat = (orderId: string): { success: boolean; error?: string } => {
        const orderExists = orders.some(o => o.id === orderId);
        if (!orderExists) {
            return { success: false, error: 'Order ID not found.' };
        }

        const updatedOrders = orders.filter(o => o.id !== orderId);
        setOrders(updatedOrders);

        try {
            localStorage.setItem(LOCAL_STORAGE_KEYS.ORDERS, JSON.stringify(updatedOrders));
        } catch (error) {
            console.error("Failed to update orders in localStorage", error);
            return { success: false, error: 'Failed to cancel order.' };
        }

        return { success: true };
    };

    const findProductsFromChat = (category?: string, onSale?: boolean, bestSelling?: boolean, limit: number = 3): { products: { name: string, price: number }[] } => {
        let results = [...products];
        if (category) {
            results = results.filter(p => p.category.toLowerCase() === category.toLowerCase());
        }
        if (onSale) {
            results = results.filter(p => p.saleEndDate && new Date(p.saleEndDate) > new Date());
        }
        // A simple "best-selling" logic based on reviews count for this demo
        if (bestSelling) {
            results.sort((a, b) => b.reviewsCount - a.reviewsCount);
        }
        return {
            products: results.slice(0, limit).map(p => ({ name: p.name, price: p.price }))
        };
    };
    
    const handleSendChatMessage = async (message: string) => {
        if (!chatSession || !message.trim()) return;

        const userMessage: ChatMessage = { sender: 'user', text: message };
        setChatMessages(prev => [...prev, userMessage]);
        setIsBotTyping(true);

        try {
            let response = await chatSession.sendMessage({ message });
            
            // --- Handle Function Calls ---
            if (response.functionCalls && response.functionCalls.length > 0) {
                const fc = response.functionCalls[0];
                let toolResult;

                if (fc.name === 'place_order') {
                    const { productName, quantity, fullName, phoneNumber, deliveryAddress } = fc.args;
                    toolResult = handlePlaceOrderFromChat(productName, quantity, { fullName, phoneNumber, deliveryAddress });
                } else if (fc.name === 'cancel_order') {
                    toolResult = handleCancelOrderFromChat(fc.args.orderId);
                } else if (fc.name === 'find_products') {
                    const { category, onSale, bestSelling, limit } = fc.args;
                    toolResult = findProductsFromChat(category, onSale, bestSelling, limit);
                }

                // Send result back to the model
                response = await chatSession.sendMessage({
                  toolResponse: {
                    functionResponses: {
                      id: fc.id,
                      name: fc.name,
                      response: toolResult,
                    },
                  },
                });
            }
            // --- End Handle Function Calls ---

            const botMessage: ChatMessage = { sender: 'bot', text: response.text };
            setChatMessages(prev => [...prev, botMessage]);

        } catch (error) {
            console.error("Chatbot error:", error);
            const errorMessage: ChatMessage = { sender: 'bot', text: TRANSLATIONS[language].chatbot_error };
            setChatMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsBotTyping(false);
        }
    };

    const handleSellerLoginSuccess = (seller: Seller) => {
        setCurrentSeller(seller);
        sessionStorage.setItem(SESSION_STORAGE_KEYS.SELLER_ID, seller.id);
        
        try {
            const unseenOrdersJSON = localStorage.getItem(`unseen_orders_${seller.id}`);
            setUnseenOrderIds(unseenOrdersJSON ? JSON.parse(unseenOrdersJSON) : []);
        } catch (error) {
            console.error("Failed to load unseen orders", error);
            setUnseenOrderIds([]);
        }
        
        setView('seller');
    };

    const handleBuyerLoginSuccess = (buyer: Buyer) => {
        setCurrentBuyer(buyer);
        setWishlist(buyer.wishlist || []);
        sessionStorage.setItem(SESSION_STORAGE_KEYS.BUYER_ID, buyer.id);
        setView('shop'); // Or redirect to buyer dashboard: setView('buyer-dashboard');
    };

    const handleLogout = () => {
        setCurrentSeller(null);
        setCurrentBuyer(mockBuyerForDisplay); // Revert to mock buyer for demo purposes
        setWishlist(mockBuyerForDisplay.wishlist);
        setUnseenOrderIds([]);
        sessionStorage.removeItem(SESSION_STORAGE_KEYS.SELLER_ID);
        sessionStorage.removeItem(SESSION_STORAGE_KEYS.BUYER_ID);
        setView('shop');
    };

    const wishlistedProducts = useMemo(() => {
        if (view !== 'wishlist' || !currentBuyer) return [];
        const wishlistSet = new Set(wishlist);
        return products.filter(p => wishlistSet.has(p.id));
    }, [products, view, wishlist, currentBuyer]);


    const flashDealProducts = useMemo(() => {
        return products
            .filter(p => p.saleEndDate && new Date(p.saleEndDate) > new Date())
            .filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()))
            .sort((a, b) => new Date(a.saleEndDate!).getTime() - new Date(b.saleEndDate!).getTime());
    }, [products, searchTerm]);
    
    const sellerOrders = useMemo(() => {
        if (!currentSeller) return [];
        
        const relevantOrders = orders.map(order => {
            const sellerItems = order.items.filter(item => item.product.sellerId === currentSeller.id);
            if (sellerItems.length === 0) return null;
            
            return {
                ...order,
                items: sellerItems,
                total: sellerItems.reduce((acc, item) => acc + item.product.price * item.quantity, 0),
            };
        }).filter((order): order is Order => order !== null);
        
        return relevantOrders.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [orders, currentSeller]);


    const addProduct = useCallback((newProduct: Product) => {
        const updatedProducts = [...products, newProduct];
        setProducts(updatedProducts);
        
        try {
            const sellerProductsJSON = localStorage.getItem(LOCAL_STORAGE_KEYS.PRODUCTS);
            const localProducts = sellerProductsJSON ? JSON.parse(sellerProductsJSON) : [];
            localStorage.setItem(LOCAL_STORAGE_KEYS.PRODUCTS, JSON.stringify([...localProducts, newProduct]));
        } catch (error) {
            console.error("Failed to save product to localStorage", error);
        }
    }, [products]);

    const updateProduct = useCallback((updatedProduct: Product) => {
        const updatedProducts = products.map(p => p.id === updatedProduct.id ? updatedProduct : p);
        setProducts(updatedProducts);

        try {
            const sellerProductsJSON = localStorage.getItem(LOCAL_STORAGE_KEYS.PRODUCTS);
            const localProducts: Product[] = sellerProductsJSON ? JSON.parse(sellerProductsJSON) : [];
            const updatedLocalProducts = localProducts.map(p => p.id === updatedProduct.id ? updatedProduct : p);
            localStorage.setItem(LOCAL_STORAGE_KEYS.PRODUCTS, JSON.stringify(updatedLocalProducts));
        } catch (error) {
            console.error("Failed to update product in localStorage", error);
        }
    }, [products]);
    
    const addProductReview = useCallback((productId: number, review: Review) => {
        const updatedProducts = products.map(p => {
            if (p.id === productId) {
                const existingReviews = p.reviews || [];
                const updatedReviews = [...existingReviews, review];
                const totalRating = updatedReviews.reduce((sum, r) => sum + r.rating, 0);
                const newAverageRating = totalRating / updatedReviews.length;

                return {
                    ...p,
                    reviews: updatedReviews,
                    rating: parseFloat(newAverageRating.toFixed(1)),
                    reviewsCount: updatedReviews.length
                };
            }
            return p;
        });
        setProducts(updatedProducts);
    }, [products]);


    const updateSellerProfile = useCallback(async (updatedInfo: Partial<Seller>): Promise<{ success: boolean; error?: string }> => {
        if (!currentSeller) return { success: false, error: 'Not logged in' };
        
        try {
            const sellersJSON = localStorage.getItem(LOCAL_STORAGE_KEYS.SELLERS);
            let sellers: Seller[] = sellersJSON ? JSON.parse(sellersJSON) : [];

            if (updatedInfo.email && updatedInfo.email.toLowerCase() !== currentSeller.email) {
                if (sellers.some(s => s.email.toLowerCase() === updatedInfo.email!.toLowerCase())) {
                    return { success: false, error: 'email_in_use_error' };
                }
            }
            
            const updatedSeller = { ...currentSeller, ...updatedInfo };
            
            const updatedSellers = sellers.map(s => s.id === currentSeller.id ? updatedSeller : s);
            localStorage.setItem(LOCAL_STORAGE_KEYS.SELLERS, JSON.stringify(updatedSellers));

            setCurrentSeller(updatedSeller);
            
            if (updatedInfo.storeName && updatedInfo.storeName !== currentSeller.storeName) {
                const newProducts = products.map(p => 
                    p.sellerId === currentSeller.id ? { ...p, vendor: updatedInfo.storeName! } : p
                );
                setProducts(newProducts);

                const sellerProductsJSON = localStorage.getItem(LOCAL_STORAGE_KEYS.PRODUCTS);
                const localProducts: Product[] = sellerProductsJSON ? JSON.parse(sellerProductsJSON) : [];
                const updatedLocalProducts = localProducts.map(p =>
                    p.sellerId === currentSeller.id ? { ...p, vendor: updatedInfo.storeName! } : p
                );
                localStorage.setItem(LOCAL_STORAGE_KEYS.PRODUCTS, JSON.stringify(updatedLocalProducts));
            }

            return { success: true };
        } catch (error) {
            console.error("Failed to update seller profile", error);
            return { success: false, error: 'auth_storage_error' };
        }
    }, [currentSeller, products]);

    const updateBuyerProfile = useCallback(async (updatedInfo: Partial<Buyer>): Promise<{ success: boolean; error?: string }> => {
        if (!currentBuyer) return { success: false, error: 'Not logged in' };
        
        try {
            const buyersJSON = localStorage.getItem(LOCAL_STORAGE_KEYS.BUYERS);
            let buyers: Buyer[] = buyersJSON ? JSON.parse(buyersJSON) : [];

            if (updatedInfo.email && updatedInfo.email.toLowerCase() !== currentBuyer.email) {
                if (buyers.some(b => b.email.toLowerCase() === updatedInfo.email!.toLowerCase())) {
                    return { success: false, error: 'email_in_use_error' };
                }
            }
            
            const updatedBuyer = { ...currentBuyer, ...updatedInfo };
            
            const updatedBuyers = buyers.map(b => b.id === currentBuyer.id ? updatedBuyer : b);
            localStorage.setItem(LOCAL_STORAGE_KEYS.BUYERS, JSON.stringify(updatedBuyers));

            setCurrentBuyer(updatedBuyer);
            return { success: true };

        } catch (error) {
            console.error("Failed to update buyer profile", error);
            return { success: false, error: 'auth_storage_error' };
        }
    }, [currentBuyer]);


    const addToCart = useCallback((product: Product, quantity: number = 1, variant?: { [key: string]: string }) => {
        setCart(prevCart => {
            const variantString = variant ? Object.entries(variant).sort().join('-') : 'none';
            const cartItemId = `${product.id}-${variantString}`;
            
            const existingItem = prevCart.find(item => item.cartItemId === cartItemId);
            if (existingItem) {
                return prevCart.map(item =>
                    item.cartItemId === cartItemId
                        ? { ...item, quantity: item.quantity + quantity }
                        : item
                );
            }
            return [...prevCart, { product, quantity, variant, cartItemId }];
        });
    }, []);

    const removeFromCart = useCallback((cartItemId: string) => {
        setCart(prevCart => prevCart.filter(item => item.cartItemId !== cartItemId));
    }, []);

    const updateQuantity = useCallback((cartItemId: string, quantity: number) => {
        if (quantity <= 0) {
            removeFromCart(cartItemId);
        } else {
            setCart(prevCart =>
                prevCart.map(item =>
                    item.cartItemId === cartItemId ? { ...item, quantity } : item
                )
            );
        }
    }, [removeFromCart]);

    const handleCheckout = () => {
        setIsCartOpen(false);
        setIsCheckoutOpen(true);
    };

    const markOrdersAsSeen = useCallback(() => {
        if (!currentSeller || unseenOrderIds.length === 0) return;
        try {
            localStorage.removeItem(`unseen_orders_${currentSeller.id}`);
            setUnseenOrderIds([]);
        } catch (error) {
            console.error("Failed to mark orders as seen", error);
        }
    }, [currentSeller, unseenOrderIds]);
    
    const handlePlaceOrder = (buyerInfo: BuyerInfo) => {
        if (cart.length === 0) return;

        const newOrder: Order = {
            id: `SK-${Date.now()}`,
            date: new Date().toISOString(),
            buyerInfo,
            items: cart,
            total: cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0),
            buyerId: currentBuyer ? currentBuyer.id : undefined,
        };

        const updatedOrders = [...orders, newOrder];
        setOrders(updatedOrders);
        
        try {
            localStorage.setItem(LOCAL_STORAGE_KEYS.ORDERS, JSON.stringify(updatedOrders));

            const sellerIdsInOrder = [...new Set(cart.map(item => item.product.sellerId))];
            sellerIdsInOrder.forEach(sellerId => {
                if (sellerId === 'system') return;
                try {
                    const unseenKey = `unseen_orders_${sellerId}`;
                    const existingUnseenJSON = localStorage.getItem(unseenKey);
                    const existingUnseen: string[] = existingUnseenJSON ? JSON.parse(existingUnseenJSON) : [];
                    const updatedUnseen = [...new Set([...existingUnseen, newOrder.id])];
                    localStorage.setItem(unseenKey, JSON.stringify(updatedUnseen));

                    if (currentSeller && currentSeller.id === sellerId) {
                        setUnseenOrderIds(updatedUnseen);
                    }
                } catch (error) {
                    console.error("Failed to update unseen orders in localStorage", error);
                }
            });

        } catch (error) {
            console.error("Failed to save order to localStorage", error);
        }

        alert('Order placed successfully! (This is a demo)');
        setCart([]);
        setIsCheckoutOpen(false);
    };

    const toggleTheme = () => {
        setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
    };

    const toggleCompare = useCallback((product: Product) => {
        setComparisonList(prev => {
            const isInList = prev.some(p => p.id === product.id);
            if (isInList) {
                return prev.filter(p => p.id !== product.id);
            } else {
                if (prev.length < 4) {
                    return [...prev, product];
                }
                alert(TRANSLATIONS[language].comparison_limit_error);
                return prev;
            }
        });
    }, [language]);
    
    const toggleWishlist = useCallback((productId: number) => {
        if (!currentBuyer) {
            handleNavigation('auth');
            return;
        }
        setWishlist(prev => {
            const newWishlist = prev.includes(productId)
                ? prev.filter(id => id !== productId)
                : [...prev, productId];
            
            // In a real app, this would be an API call. Here we update mock state and localStorage.
            const updatedBuyer = { ...currentBuyer, wishlist: newWishlist };
            setCurrentBuyer(updatedBuyer);
            try {
                const buyersJSON = localStorage.getItem(LOCAL_STORAGE_KEYS.BUYERS);
                let buyers: Buyer[] = buyersJSON ? JSON.parse(buyersJSON) : [];
                const updatedBuyers = buyers.map(b => b.id === currentBuyer.id ? updatedBuyer : b);
                localStorage.setItem(LOCAL_STORAGE_KEYS.BUYERS, JSON.stringify(updatedBuyers));
            } catch(e) { console.error(e); }

            return newWishlist;
        });
    }, [currentBuyer]);

    const clearCompareList = useCallback(() => {
        setComparisonList([]);
    }, []);

    const renderContent = () => {
        switch (view) {
            case 'auth':
                return <Auth onSellerLoginSuccess={handleSellerLoginSuccess} onBuyerLoginSuccess={handleBuyerLoginSuccess} />;
            case 'seller':
                if (currentSeller) {
                    return <SellerDashboard
                        sellerProducts={products.filter(p => p.sellerId === currentSeller.id)}
                        sellerOrders={sellerOrders}
                        onAddProduct={addProduct}
                        onUpdateProduct={updateProduct}
                        currentSeller={currentSeller}
                        onUpdateProfile={updateSellerProfile}
                        unseenOrderIds={unseenOrderIds}
                        onViewOrders={markOrdersAsSeen}
                    />;
                }
                return null;
            case 'buyer-dashboard':
                if (currentBuyer) {
                     return <BuyerDashboard />;
                }
                return null;
            case 'wishlist':
                return <Wishlist products={wishlistedProducts} onOpenProductModal={handleOpenProductModal} />;
            case 'about-us': return <AboutUs />;
            case 'careers': return <Careers />;
            case 'help-center': return <HelpCenter />;
            case 'how-to-buy': return <HowToBuy />;
            case 'privacy-policy': return <PrivacyPolicy />;
            case 'returns-refunds': return <ReturnsRefunds />;
            case 'success-stories': return <SuccessStories />;
            case 'terms-conditions': return <TermsConditions />;
            case 'track-order': return <TrackOrder prefilledOrderId={prefilledOrderId} />;
            case 'vendor-hub':
                if (currentSeller) {
                    return <VendorHub
                                seller={currentSeller}
                                products={products.filter(p => p.sellerId === currentSeller.id)}
                                orders={sellerOrders}
                            />;
                }
                return null;
            case 'shop':
            default:
                 const categoriesWithProducts = useMemo(() => {
                    const productCategories = new Set(products.map(p => p.category));
                    return CATEGORIES.filter(c => c !== 'All' && productCategories.has(c));
                }, [products]);

                return (
                    <>
                        {flashDealProducts.length > 0 && 
                            <ProductShelf 
                                title="⚡️ Lightning Deals"
                                products={flashDealProducts} 
                                onOpenProductModal={handleOpenProductModal} 
                            />
                        }
                        <main className="container mx-auto">
                            <div className="lg:col-span-3">
                                <div className="hidden lg:block px-4">
                                  <VendorAIAssistant />
                                </div>
                                {categoriesWithProducts.map(category => {
                                    const categoryProducts = products.filter(p => 
                                        p.category === category && 
                                        p.name.toLowerCase().includes(searchTerm.toLowerCase())
                                    );
                                    if (categoryProducts.length === 0) return null;
                                    return (
                                        <ProductShelf
                                            key={category}
                                            title={category}
                                            products={categoryProducts}
                                            onOpenProductModal={handleOpenProductModal}
                                        />
                                    );
                                })}
                            </div>
                        </main>
                    </>
                );
        }
    };
    
    const appContextValue = {
        language,
        translations: TRANSLATIONS[language],
        setLanguage,
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        currentSeller,
        currentBuyer,
        logout: handleLogout,
        updateSellerProfile,
        updateBuyerProfile,
        handleNavigation,
        orders,
        theme,
        toggleTheme,
        comparisonList,
        toggleCompare,
        clearCompareList,
        openCart: () => setIsCartOpen(true),
        view,
        wishlist,
        toggleWishlist,
    };

    return (
        <AppContext.Provider value={appContextValue}>
            <div className="bg-base-100 dark:bg-gray-900 text-base-content dark:text-gray-200 min-h-screen font-sans flex flex-col">
                <Header 
                    onSearch={setSearchTerm}
                />
                <div className="flex-grow pb-16 lg:pb-0">
                    {renderContent()}
                </div>
                <Footer />
                <MobileBottomNav />
                <CartModal 
                    isOpen={isCartOpen} 
                    onClose={() => setIsCartOpen(false)}
                    onCheckout={handleCheckout}
                />
                <CheckoutModal
                    isOpen={isCheckoutOpen}
                    onClose={() => setIsCheckoutOpen(false)}
                    onPlaceOrder={handlePlaceOrder}
                />
                 <ProductModal
                    isOpen={productModal.isOpen}
                    product={productModal.product}
                    onClose={handleCloseProductModal}
                    onAddReview={addProductReview}
                    allProducts={products}
                />
                <ChatbotWidget onClick={() => setIsChatbotOpen(true)} />
                <ChatbotModal
                    isOpen={isChatbotOpen}
                    onClose={() => setIsChatbotOpen(false)}
                    messages={chatMessages}
                    onSendMessage={handleSendChatMessage}
                    isTyping={isBotTyping}
                />
                <ComparisonTray onOpen={() => setIsCompareModalOpen(true)} />
                <ComparisonModal 
                    isOpen={isCompareModalOpen}
                    onClose={() => setIsCompareModalOpen(false)}
                />
            </div>
        </AppContext.Provider>
    );
};

export default App;