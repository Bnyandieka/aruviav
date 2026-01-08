import React from 'react';
import { FiArrowRight, FiMail, FiPhone, FiMapPin } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import Breadcrumb from '../components/common/Breadcrumb/Breadcrumb';

export const TermsAndConditionsPage = () => {
  const sections = [
    {
      title: '1. INTRODUCTION',
      content: 'Welcome to Aruviah ("we," "us," or "our"). These Terms and Conditions ("Terms") govern your access to and use of the Aruviah e-commerce platform, website, and mobile applications (collectively, the "Platform") operating in Kenya and the East African Community.\n\nBy accessing or using Aruviah, you agree to be bound by these Terms. If you do not agree, please discontinue use immediately.'
    },
    {
      title: '2. DEFINITIONS',
      content: '"Buyer" - Any user purchasing products through the Platform\n"Seller" - Any vendor or merchant listing products on the Platform\n"User" - Both Buyers and Sellers collectively\n"Product" - Any goods or services listed for sale on the Platform\n"Order" - A confirmed purchase transaction between Buyer and Seller'
    },
    {
      title: '3. ELIGIBILITY',
      content: '3.1. You must be at least 18 years old to use Aruviah.\n\n3.2. You must be a resident of Kenya or an East African Community member state (Kenya, Uganda, Tanzania, Rwanda, Burundi, South Sudan, or Democratic Republic of Congo).\n\n3.3. By registering, you represent that all information provided is accurate and complete.\n\n3.4. We reserve the right to verify your identity and suspend accounts that violate these terms.'
    },
    {
      title: '4. ACCOUNT REGISTRATION',
      content: '4.1. You must create an account to access certain features.\n\n4.2. You are responsible for maintaining the confidentiality of your login credentials.\n\n4.3. You agree to notify us immediately of any unauthorized access to your account.\n\n4.4. One person or business may maintain only one account unless authorized by Aruviah.'
    },
    {
      title: '5. USER CONDUCT',
      content: 'You agree NOT to:\n\n5.1. Use the Platform for any illegal or unauthorized purpose\n5.2. Violate any laws of Kenya or your country of residence\n5.3. Post false, misleading, or fraudulent product listings\n5.4. Infringe upon intellectual property rights of others\n5.5. Engage in price manipulation or unfair trade practices\n5.6. Harass, abuse, or harm other users\n5.7. Upload viruses, malware, or harmful code\n5.8. Attempt to circumvent the Platform\'s payment systems'
    },
    {
      title: '6. SELLER OBLIGATIONS',
      content: '6.1. Product Listings: Sellers must provide accurate descriptions, prices, and images of products.\n\n6.2. Prohibited Items: Sellers may not list:\n• Counterfeit or pirated goods\n• Illegal drugs or substances\n• Weapons and explosives\n• Stolen goods\n• Items that violate Kenyan or EAC laws\n\n6.3. Pricing: All prices must be clearly stated in Kenyan Shillings (KES) or local currency, including applicable taxes.\n\n6.4. Fulfillment: Sellers must fulfill orders within the stated delivery timeframe.\n\n6.5. Compliance: Sellers must comply with the Consumer Protection Act (Kenya, 2012), Tax Laws, and all relevant EAC trade regulations.'
    },
    {
      title: '7. BUYER OBLIGATIONS',
      content: '7.1. Buyers must provide accurate delivery information.\n\n7.2. Payment must be made through approved Platform payment methods.\n\n7.3. Buyers should inspect products upon delivery and report issues within the specified timeframe.\n\n7.4. False claims or abuse of the return policy may result in account suspension.'
    },
    {
      title: '8. PAYMENTS AND FEES',
      content: '8.1. Payment Methods: We accept M-Pesa, bank transfers, credit/debit cards, and other approved methods.\n\n8.2. Currency: Transactions are primarily conducted in Kenyan Shillings (KES) but may support other EAC currencies.\n\n8.3. Seller Fees: Aruviah charges a commission on each sale plus applicable payment processing fees.\n\n8.4. Taxes: Sellers are responsible for VAT and other applicable taxes as per Kenyan Tax Laws.\n\n8.5. Payment Processing: Payments are held in escrow and released to Sellers upon successful delivery or after the return period expires.'
    },
    {
      title: '9. SHIPPING AND DELIVERY',
      content: '9.1. Delivery times and costs vary by location within Kenya and East Africa.\n\n9.2. Sellers are responsible for packaging and shipping products securely.\n\n9.3. Aruviah partners with third-party logistics providers but is not liable for shipping delays beyond our control.\n\n9.4. Risk of loss passes to the Buyer upon delivery.'
    },
    {
      title: '10. RETURNS AND REFUNDS',
      content: '10.1. Return Period: Buyers may return products within 14 days of delivery if:\n• Product is defective or damaged\n• Wrong item was delivered\n• Product does not match description\n\n10.2. Non-Returnable Items: Perishable goods, customized products, and intimate items cannot be returned unless defective.\n\n10.3. Refund Process: Approved refunds are processed within 7-14 business days.\n\n10.4. Return Costs: Buyers bear return shipping costs unless the product is defective or incorrect.'
    },
    {
      title: '11. INTELLECTUAL PROPERTY',
      content: '11.1. Aruviah owns all rights to the Platform\'s design, logo, and content.\n\n11.2. Users retain ownership of content they upload but grant Aruviah a license to use it for Platform operations.\n\n11.3. Users must not infringe on trademarks, copyrights, or patents of third parties.'
    },
    {
      title: '12. PRIVACY AND DATA PROTECTION',
      content: '12.1. Your use of the Platform is governed by our Privacy Policy.\n\n12.2. We comply with the Kenya Data Protection Act, 2019.\n\n12.3. We collect, store, and process personal data as outlined in our Privacy Policy.'
    },
    {
      title: '13. DISPUTE RESOLUTION',
      content: '13.1. Negotiation: Users should first attempt to resolve disputes through direct communication.\n\n13.2. Mediation: Unresolved disputes may be mediated by Aruviah\'s customer support team.\n\n13.3. Arbitration: If mediation fails, disputes shall be resolved through arbitration in Nairobi, Kenya, under the Arbitration Act (Cap 49).\n\n13.4. Governing Law: These Terms are governed by the Laws of Kenya.'
    },
    {
      title: '14. LIMITATION OF LIABILITY',
      content: '14.1. Aruviah acts as a marketplace platform connecting Buyers and Sellers.\n\n14.2. We are not responsible for the quality, safety, or legality of products listed.\n\n14.3. We are not liable for disputes between Buyers and Sellers.\n\n14.4. Our total liability shall not exceed the fees paid by you in the last 12 months.\n\n14.5. We are not liable for loss of profits, data, or indirect damages.'
    },
    {
      title: '15. INDEMNIFICATION',
      content: 'You agree to indemnify and hold harmless Aruviah, its officers, employees, and partners from any claims, damages, or losses arising from:\n\n• Your violation of these Terms\n• Your violation of any laws\n• Your infringement of third-party rights\n• Your use of the Platform'
    },
    {
      title: '16. TERMINATION',
      content: '16.1. You may terminate your account at any time by contacting us.\n\n16.2. We may suspend or terminate your account if you violate these Terms.\n\n16.3. Upon termination, outstanding transactions must be completed, and fees settled.'
    },
    {
      title: '17. MODIFICATIONS',
      content: '17.1. We reserve the right to modify these Terms at any time.\n\n17.2. Users will be notified of significant changes via email or Platform notification.\n\n17.3. Continued use after modifications constitutes acceptance of new Terms.'
    },
    {
      title: '18. FORCE MAJEURE',
      content: 'We are not liable for failure to perform obligations due to circumstances beyond our control, including natural disasters, war, strikes, government actions, or internet disruptions.'
    },
    {
      title: '19. CONSUMER PROTECTION',
      content: 'These Terms comply with the Consumer Protection Act (Kenya, 2012), which provides:\n\n• Right to fair value and good quality\n• Right to information\n• Right to safety\n• Right to be heard and seek redress'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumb */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <Breadcrumb items={[{ label: 'Terms and Conditions' }]} />
        </div>
      </div>

      {/* Header */}
      <div className="bg-gradient-to-r from-orange-50 to-orange-100 py-12">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Terms and Conditions</h1>
          <p className="text-gray-600 text-lg">Last Updated: November 30, 2025</p>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar - Table of Contents */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-4">
              <h3 className="text-lg font-bold mb-4">Table of Contents</h3>
              <nav className="space-y-2">
                {sections.map((section, index) => (
                  <a
                    key={index}
                    href={`#section-${index}`}
                    className="block text-sm text-orange-600 hover:text-orange-700 font-medium transition py-1"
                  >
                    {section.title.split('.')[0]}. {section.title.split('.')[1]?.trim().slice(0, 20)}...
                  </a>
                ))}
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow-md p-8">
              {/* Introduction Alert */}
              <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-8">
                <p className="text-blue-800">
                  <strong>Important:</strong> Please read these Terms and Conditions carefully before using Aruviah. By accessing or using the platform, you agree to be bound by all the terms outlined below.
                </p>
              </div>

              {/* Sections */}
              {sections.map((section, index) => (
                <div key={index} id={`section-${index}`} className="mb-8 scroll-mt-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4 pb-3 border-b-2 border-orange-200">
                    {section.title}
                  </h2>
                  <div className="text-gray-700 space-y-3 whitespace-pre-line leading-relaxed">
                    {section.content}
                  </div>
                </div>
              ))}

              {/* Contact Section */}
              <div className="mt-12 pt-8 border-t-2 border-gray-200">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">20. CONTACT INFORMATION</h2>
                <p className="text-gray-700 mb-6">
                  For questions, complaints, or support regarding these Terms and Conditions, please contact us:
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gray-50 p-6 rounded-lg">
                    <div className="flex items-center gap-3 mb-2">
                      <FiMail className="text-orange-600 text-xl" />
                      <h4 className="font-semibold text-gray-900">Email</h4>
                    </div>
                    <p className="text-gray-700">
                      <a href="mailto:support@aruviah.co.ke" className="text-orange-600 hover:underline">
                        support@aruviah.co.ke
                      </a>
                    </p>
                  </div>

                  <div className="bg-gray-50 p-6 rounded-lg">
                    <div className="flex items-center gap-3 mb-2">
                      <FiPhone className="text-orange-600 text-xl" />
                      <h4 className="font-semibold text-gray-900">Phone</h4>
                    </div>
                    <p className="text-gray-700">+254 (0) 700 000 000</p>
                  </div>

                  <div className="bg-gray-50 p-6 rounded-lg md:col-span-2">
                    <div className="flex items-center gap-3 mb-2">
                      <FiMapPin className="text-orange-600 text-xl" />
                      <h4 className="font-semibold text-gray-900">Address</h4>
                    </div>
                    <p className="text-gray-700">
                      Aruviah Headquarters<br />
                      Nairobi, Kenya
                    </p>
                  </div>
                </div>
              </div>

              {/* Related Links */}
              <div className="mt-12 pt-8 border-t-2 border-gray-200">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Related Documents</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Link
                    to="/privacy-policy"
                    className="flex items-center gap-2 p-4 bg-orange-50 rounded-lg hover:bg-orange-100 transition"
                  >
                    <span className="text-orange-600 font-semibold">Privacy Policy</span>
                    <FiArrowRight className="text-orange-600" />
                  </Link>
                  <Link
                    to="/faq"
                    className="flex items-center gap-2 p-4 bg-orange-50 rounded-lg hover:bg-orange-100 transition"
                  >
                    <span className="text-orange-600 font-semibold">Frequently Asked Questions</span>
                    <FiArrowRight className="text-orange-600" />
                  </Link>
                </div>
              </div>

              {/* Acknowledgment */}
              <div className="mt-12 p-6 bg-green-50 border-l-4 border-green-500 rounded">
                <p className="text-green-800">
                  <strong>✓ Acknowledgment:</strong> By using Aruviah, you acknowledge that you have read, understood, and agree to be bound by these Terms and Conditions in their entirety.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsAndConditionsPage;
