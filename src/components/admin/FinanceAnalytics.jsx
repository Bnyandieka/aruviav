import React, { useState, useEffect } from 'react';
import { FiTrendingUp, FiDollarSign, FiShoppingCart, FiUsers, FiDownload } from 'react-icons/fi';

const FinanceAnalytics = ({ orders, products }) => {
  const [financialData, setFinancialData] = useState({
    totalRevenue: 0,
    totalCommission: 0,
    totalProfit: 0,
    sellerPayouts: 0,
    monthlyRevenue: [],
    orderStats: {},
    topProducts: []
  });

  const [selectedPeriod, setSelectedPeriod] = useState('all');
  const [currencySymbol] = useState('KES');

  useEffect(() => {
    calculateFinancials();
  }, [orders, products, selectedPeriod]);

  const calculateFinancials = () => {
    // Filter orders by period
    let filteredOrders = orders;
    const now = new Date();

    if (selectedPeriod === 'month') {
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      filteredOrders = orders.filter(order => {
        const orderDate = order.createdAt ? new Date(order.createdAt) : new Date(0);
        return orderDate >= thirtyDaysAgo;
      });
    } else if (selectedPeriod === 'week') {
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      filteredOrders = orders.filter(order => {
        const orderDate = order.createdAt ? new Date(order.createdAt) : new Date(0);
        return orderDate >= sevenDaysAgo;
      });
    }

    // Calculate revenues
    let totalRevenue = 0;
    let completedRevenue = 0;
    const monthlyData = {};
    const productSales = {};

    filteredOrders.forEach(order => {
      const orderAmount = parseFloat(order.totalAmount) || 0;
      totalRevenue += orderAmount;

      if (order.status === 'completed') {
        completedRevenue += orderAmount;
      }

      // Monthly breakdown
      if (order.createdAt) {
        const date = new Date(order.createdAt);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        monthlyData[monthKey] = (monthlyData[monthKey] || 0) + orderAmount;
      }

      // Product sales tracking
      if (order.items && Array.isArray(order.items)) {
        order.items.forEach(item => {
          productSales[item.productId] = (productSales[item.productId] || 0) + (item.quantity || 1);
        });
      }
    });

    // Platform commission (3-5%, using 4% average)
    const commissionRate = 0.04;
    const totalCommission = totalRevenue * commissionRate;

    // Seller payouts (96% of revenue)
    const sellerPayouts = totalRevenue * (1 - commissionRate);

    // Platform profit
    const totalProfit = totalCommission;

    // Order statistics
    const orderStats = {
      total: filteredOrders.length,
      completed: filteredOrders.filter(o => o.status === 'completed').length,
      pending: filteredOrders.filter(o => o.status === 'pending').length,
      processing: filteredOrders.filter(o => o.status === 'processing').length,
      cancelled: filteredOrders.filter(o => o.status === 'cancelled').length,
      returned: filteredOrders.filter(o => o.status === 'returned').length
    };

    // Top products
    const topProducts = Object.entries(productSales)
      .map(([productId, quantity]) => {
        const product = products.find(p => p.id === productId);
        return {
          productId,
          name: product?.name || 'Unknown Product',
          quantity,
          revenue: quantity * (parseFloat(product?.price) || 0)
        };
      })
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);

    // Monthly revenue array
    const monthlyRevenue = Object.entries(monthlyData)
      .sort()
      .map(([month, amount]) => ({
        month: new Date(`${month}-01`).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        amount
      }));

    setFinancialData({
      totalRevenue,
      totalCommission,
      totalProfit,
      sellerPayouts,
      monthlyRevenue,
      orderStats,
      topProducts
    });
  };

  const formatCurrency = (amount) => {
    return `${currencySymbol} ${Number(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const downloadReport = () => {
    const reportData = {
      generatedDate: new Date().toLocaleDateString(),
      period: selectedPeriod,
      totalRevenue: formatCurrency(financialData.totalRevenue),
      totalCommission: formatCurrency(financialData.totalCommission),
      totalProfit: formatCurrency(financialData.totalProfit),
      sellerPayouts: formatCurrency(financialData.sellerPayouts),
      orderStats: financialData.orderStats
    };

    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(JSON.stringify(reportData, null, 2)));
    element.setAttribute('download', `finance-report-${new Date().getTime()}.json`);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="space-y-6">
      {/* Period Selector */}
      <div className="flex gap-4 mb-6">
        <button
          onClick={() => setSelectedPeriod('week')}
          className={`px-4 py-2 rounded-lg font-semibold transition ${
            selectedPeriod === 'week'
              ? 'bg-orange-500 text-white'
              : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
          }`}
        >
          This Week
        </button>
        <button
          onClick={() => setSelectedPeriod('month')}
          className={`px-4 py-2 rounded-lg font-semibold transition ${
            selectedPeriod === 'month'
              ? 'bg-orange-500 text-white'
              : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
          }`}
        >
          This Month
        </button>
        <button
          onClick={() => setSelectedPeriod('all')}
          className={`px-4 py-2 rounded-lg font-semibold transition ${
            selectedPeriod === 'all'
              ? 'bg-orange-500 text-white'
              : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
          }`}
        >
          All Time
        </button>
        <button
          onClick={downloadReport}
          className="ml-auto px-4 py-2 rounded-lg bg-green-500 text-white font-semibold hover:bg-green-600 transition flex items-center gap-2"
        >
          <FiDownload /> Download Report
        </button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-orange-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Total Revenue</p>
              <p className="text-3xl font-bold text-orange-600">{formatCurrency(financialData.totalRevenue)}</p>
            </div>
            <FiDollarSign className="text-orange-500 text-4xl opacity-20" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Platform Profit</p>
              <p className="text-3xl font-bold text-green-600">{formatCurrency(financialData.totalProfit)}</p>
            </div>
            <FiTrendingUp className="text-green-500 text-4xl opacity-20" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Seller Payouts</p>
              <p className="text-3xl font-bold text-blue-600">{formatCurrency(financialData.sellerPayouts)}</p>
            </div>
            <FiUsers className="text-blue-500 text-4xl opacity-20" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Commission (4%)</p>
              <p className="text-3xl font-bold text-purple-600">{formatCurrency(financialData.totalCommission)}</p>
            </div>
            <FiShoppingCart className="text-purple-500 text-4xl opacity-20" />
          </div>
        </div>
      </div>

      {/* Order Statistics */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-xl font-bold mb-4">Order Statistics</h3>
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-gray-600 text-sm">Total</p>
            <p className="text-2xl font-bold text-gray-900">{financialData.orderStats.total}</p>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <p className="text-gray-600 text-sm">Completed</p>
            <p className="text-2xl font-bold text-green-600">{financialData.orderStats.completed}</p>
          </div>
          <div className="text-center p-4 bg-yellow-50 rounded-lg">
            <p className="text-gray-600 text-sm">Pending</p>
            <p className="text-2xl font-bold text-yellow-600">{financialData.orderStats.pending}</p>
          </div>
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <p className="text-gray-600 text-sm">Processing</p>
            <p className="text-2xl font-bold text-blue-600">{financialData.orderStats.processing}</p>
          </div>
          <div className="text-center p-4 bg-red-50 rounded-lg">
            <p className="text-gray-600 text-sm">Cancelled</p>
            <p className="text-2xl font-bold text-red-600">{financialData.orderStats.cancelled}</p>
          </div>
          <div className="text-center p-4 bg-orange-50 rounded-lg">
            <p className="text-gray-600 text-sm">Returned</p>
            <p className="text-2xl font-bold text-orange-600">{financialData.orderStats.returned}</p>
          </div>
        </div>
      </div>

      {/* Monthly Revenue Chart */}
      {financialData.monthlyRevenue.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-bold mb-4">Monthly Revenue</h3>
          <div className="space-y-3">
            {financialData.monthlyRevenue.map((item, index) => (
              <div key={index} className="flex items-center gap-4">
                <div className="w-24 text-sm font-semibold text-gray-600">{item.month}</div>
                <div className="flex-grow bg-gray-200 rounded-full h-8 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-orange-400 to-orange-600 h-full flex items-center justify-end pr-3 text-white text-sm font-semibold"
                    style={{
                      width: `${(item.amount / Math.max(...financialData.monthlyRevenue.map(m => m.amount))) * 100}%`
                    }}
                  >
                    {item.amount > 0 && formatCurrency(item.amount)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top Products */}
      {financialData.topProducts.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-bold mb-4">Top Selling Products</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Product Name</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">Quantity Sold</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {financialData.topProducts.map((product, index) => (
                  <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">{product.name}</td>
                    <td className="py-3 px-4 text-right text-gray-700">{product.quantity}</td>
                    <td className="py-3 px-4 text-right font-semibold text-orange-600">
                      {formatCurrency(product.revenue)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Finance Summary */}
      <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg shadow-md p-6 text-white">
        <h3 className="text-2xl font-bold mb-4">Finance Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <p className="text-orange-100 mb-2">Platform Commission Rate</p>
            <p className="text-4xl font-bold">4%</p>
            <p className="text-orange-100 text-sm mt-2">Per transaction on seller orders</p>
          </div>
          <div>
            <p className="text-orange-100 mb-2">Average Seller Payout</p>
            <p className="text-4xl font-bold">96%</p>
            <p className="text-orange-100 text-sm mt-2">Of total transaction value</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FinanceAnalytics;
