import React, { useContext } from 'react';
import { AppContext } from '../App';

export const Footer: React.FC = () => {
    const context = useContext(AppContext);
    if (!context) return null;

    const { translations, handleNavigation } = context;

    const FooterLink: React.FC<{view: any, children: React.ReactNode}> = ({ view, children }) => (
        <li>
            <button onClick={() => handleNavigation(view)} className="hover:text-white text-left transition-colors">
                {children}
            </button>
        </li>
    );

    return (
        <footer className="bg-gray-800 text-white mt-12">
            <div className="container mx-auto px-4 py-8">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                    <div>
                        <h3 className="font-bold text-lg mb-3">{translations.customer_service}</h3>
                        <ul className="space-y-2 text-gray-400 text-sm">
                           <FooterLink view="help-center">{translations.help_center}</FooterLink>
                           <FooterLink view="how-to-buy">{translations.how_to_buy}</FooterLink>
                           <FooterLink view="track-order">{translations.track_your_order}</FooterLink>
                           <FooterLink view="returns-refunds">{translations.returns_refunds}</FooterLink>
                        </ul>
                    </div>
                    <div>
                        <h3 className="font-bold text-lg mb-3">{translations.about_salonekart}</h3>
                        <ul className="space-y-2 text-gray-400 text-sm">
                            <FooterLink view="about-us">{translations.about_us}</FooterLink>
                            <FooterLink view="careers">{translations.careers}</FooterLink>
                            <FooterLink view="terms-conditions">{translations.terms_conditions}</FooterLink>
                            <FooterLink view="privacy-policy">{translations.privacy_policy}</FooterLink>
                        </ul>
                    </div>
                    <div>
                        <h3 className="font-bold text-lg mb-3">{translations.sell_on_salonekart}</h3>
                        <ul className="space-y-2 text-gray-400 text-sm">
                            <FooterLink view="auth">{translations.start_selling}</FooterLink>
                            <FooterLink view="vendor-hub">{translations.vendor_hub}</FooterLink>
                            <FooterLink view="success-stories">{translations.success_stories}</FooterLink>
                        </ul>
                    </div>
                    <div>
                        <h3 className="font-bold text-lg mb-3">{translations.connect_with_us}</h3>
                        <ul className="space-y-2 text-gray-400 text-sm">
                            <li><a href="#" className="hover:text-white">Facebook</a></li>
                            <li><a href="#" className="hover:text-white">Twitter</a></li>
                            <li><a href="#" className="hover:text-white">Instagram</a></li>
                        </ul>
                    </div>
                </div>
                <div className="mt-8 pt-8 border-t border-gray-700 text-center text-gray-500 dark:text-gray-400">
                    <p className="text-sm">&copy; {new Date().getFullYear()} SaloneKart. All Rights Reserved.</p>
                    <p className="text-sm">Made with ❤️ in Sierra Leone</p>
                </div>
            </div>
        </footer>
    );
};