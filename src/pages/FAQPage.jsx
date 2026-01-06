import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

const FAQItem = ({ question, answer }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border border-gray-200 rounded-lg">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition"
      >
        <span className="text-left font-semibold text-gray-900">{question}</span>
        {isOpen ? (
          <ChevronUp className="w-5 h-5 text-blue-600 flex-shrink-0" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />
        )}
      </button>
      {isOpen && (
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <p className="text-gray-600 leading-relaxed">{answer}</p>
        </div>
      )}
    </div>
  );
};

export default function FAQPage() {
  const faqs = [
    {
      question: 'How do I place an order?',
      answer: 'Simply browse our products, add items to your cart, and proceed to checkout. You can pay using M-Pesa, bank transfer, credit/debit card, or PayPal. Your order will be confirmed immediately after payment.'
    },
    {
      question: 'What are your delivery times?',
      answer: 'We deliver within 2-5 business days for most locations in Kenya. Delivery times may vary based on location and current order volume. You will receive a tracking number via email once your order ships.'
    },
    {
      question: 'Can I return or exchange a product?',
      answer: 'Yes! We offer a 30-day return policy for most products. Items must be in original condition with all packaging. To initiate a return, contact our support team with your order number.'
    },
    {
      question: 'How do I track my order?',
      answer: 'Once your order ships, you will receive an email with a tracking number. You can use this number to track your package in real-time on our website or the courier\'s platform.'
    },
    {
      question: 'What payment methods do you accept?',
      answer: 'We accept M-Pesa, bank transfers, credit cards (Visa/Mastercard), debit cards, and PayPal. All transactions are secure and encrypted.'
    },
    {
      question: 'Is my personal information safe?',
      answer: 'Yes! We use industry-standard encryption and comply with data protection regulations. Your payment information is never stored on our servers - it is processed securely through our payment partners.'
    },
    {
      question: 'How can I become a vendor?',
      answer: 'Click on "Become a Vendor" in the footer or visit our vendor signup page. Fill out the application form with your business details. Our team will review your application and contact you within 5 business days.'
    },
    {
      question: 'What should I do if my order hasn\'t arrived?',
      answer: 'First, check your email for tracking information. If you don\'t see it, contact our support team with your order number. We\'ll investigate immediately and provide you with an update or a replacement.'
    },
    {
      question: 'Can I cancel my order?',
      answer: 'Orders can be cancelled within 2 hours of placement if payment has been confirmed. After that, you can arrange a return once the item arrives. Contact support for assistance.'
    },
    {
      question: 'Do you offer discounts or promotions?',
      answer: 'Yes! We regularly offer special promotions, seasonal sales, and discounts on selected items. Subscribe to our newsletter to stay updated on the latest deals.'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-16 md:py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">Frequently Asked Questions</h1>
          <p className="text-xl md:text-2xl text-blue-100">
            Find answers to common questions about shopping, delivery, returns, and more.
          </p>
        </div>
      </section>

      {/* FAQ Items */}
      <section className="py-16 md:py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <FAQItem
                key={index}
                question={faq.question}
                answer={faq.answer}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Still Have Questions Section */}
      <section className="bg-blue-50 py-16 md:py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">Still have questions?</h2>
          <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
            Can't find the answer you're looking for? Our support team is here to help.
          </p>
          <a
            href="/contact"
            className="inline-block bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            Contact Support
          </a>
        </div>
      </section>
    </div>
  );
}
