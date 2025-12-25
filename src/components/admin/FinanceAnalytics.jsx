import React, { useState, useEffect } from 'react';
import { FiTrendingUp, FiDollarSign, FiShoppingCart, FiUsers, FiDownload } from 'react-icons/fi';
import { useNotifications } from '../../context/NotificationContext';

const FinanceAnalytics = ({ orders = [], products = [] }) => {
  const { addNotification } = useNotifications();
  const [financialData, setFinancialData] = useState({
    totalRevenue: 0,
    totalCommission: 0,
    totalProfit: 0,
    sellerPayouts: 0,
    monthlyRevenue: [],
    orderStats: {
      total: 0,
      completed: 0,
      pending: 0,
      processing: 0,
      cancelled: 0,
      returned: 0
    },
    topProducts: []
  });

  const [selectedPeriod, setSelectedPeriod] = useState('all');
  const currencySymbol = 'KES';
  const commissionRate = 0.04;

  useEffect(() => {
    calculateFinancials();
  }, [orders, products, selectedPeriod]);

  const filterOrdersByPeriod = (orders) => {
    if (selectedPeriod === 'all') return orders;

    const now = new Date();
    const daysAgo = selectedPeriod === 'week' ? 7 : 30;
    const cutoffDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);

    return orders.filter(order => {
      const orderDate = order.createdAt ? new Date(order.createdAt) : new Date(0);
      return orderDate >= cutoffDate;
    });
  };

  const calculateFinancials = () => {
    const filteredOrders = filterOrdersByPeriod(orders);

    let totalRevenue = 0;
    const monthlyData = {};
    const productSales = {};

    // Process all orders
    filteredOrders.forEach(order => {
      // Try both 'total' and 'totalAmount' fields
      const orderAmount = parseFloat(order.total || order.totalAmount || 0);
      totalRevenue += orderAmount;

      // Monthly breakdown
      if (order.createdAt) {
        const date = order.createdAt?.toDate?.() || new Date(order.createdAt);
        if (!isNaN(date.getTime())) {
          const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          monthlyData[monthKey] = (monthlyData[monthKey] || 0) + orderAmount;
        }
      }

      // Product sales tracking
      if (order.items && Array.isArray(order.items)) {
        order.items.forEach(item => {
          // Try both 'productId' and 'id' fields
          const productId = item.productId || item.id;
          const quantity = item.quantity || 1;
          productSales[productId] = (productSales[productId] || 0) + quantity;
        });
      }
    });

    // Calculate commissions and payouts
    const totalCommission = totalRevenue * commissionRate;
    const sellerPayouts = totalRevenue * (1 - commissionRate);
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

    // Top products calculation
    const topProducts = Object.entries(productSales)
      .map(([productId, quantity]) => {
        const product = products.find(p => p.id === productId);
        const price = parseFloat(product?.price) || 0;
        return {
          productId,
          name: product?.name || 'Unknown Product',
          quantity,
          revenue: quantity * price
        };
      })
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);

    // Monthly revenue array for chart
    const monthlyRevenue = Object.entries(monthlyData)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, amount]) => ({
        month: new Date(`${month}-01`).toLocaleDateString('en-US', { 
          month: 'short', 
          year: 'numeric' 
        }),
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
    return `${currencySymbol} ${Number(amount).toLocaleString('en-US', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    })}`;
  };

  const getPeriodText = () => {
    switch(selectedPeriod) {
      case 'week': return 'This Week';
      case 'month': return 'This Month';
      default: return 'All Time';
    }
  };

  const downloadReport = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      addNotification({
        type: 'warning',
        title: 'Pop-ups Required',
        message: 'Please allow pop-ups to download the report'
      });
      return;
    }
    
    const periodText = getPeriodText();
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Finance Report - ${periodText}</title>
        <meta charset="utf-8">
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            padding: 40px;
            max-width: 900px;
            margin: 0 auto;
            color: #1f2937;
            line-height: 1.6;
          }
          h1 {
            color: #f97316;
            border-bottom: 4px solid #f97316;
            padding-bottom: 15px;
            margin-bottom: 30px;
            font-size: 32px;
          }
          h2 {
            color: #374151;
            margin-top: 40px;
            margin-bottom: 20px;
            border-bottom: 2px solid #e5e7eb;
            padding-bottom: 10px;
            font-size: 24px;
          }
          .header-info {
            background: #fef3c7;
            padding: 20px;
            border-radius: 10px;
            margin-bottom: 30px;
            border-left: 5px solid #f59e0b;
          }
          .header-info p {
            margin: 5px 0;
            font-size: 14px;
          }
          .metrics-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 20px;
            margin: 25px 0;
          }
          .metric-card {
            border: 2px solid #e5e7eb;
            padding: 20px;
            border-radius: 10px;
            background: #fff;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          }
          .metric-label {
            color: #6b7280;
            font-size: 13px;
            margin-bottom: 8px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .metric-value {
            font-size: 28px;
            font-weight: bold;
            color: #f97316;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
            background: #fff;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          }
          th, td {
            padding: 14px 16px;
            text-align: left;
            border-bottom: 1px solid #e5e7eb;
          }
          th {
            background: #f9fafb;
            font-weight: 600;
            color: #374151;
            font-size: 14px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          tr:hover {
            background: #f9fafb;
          }
          tr:last-child td {
            border-bottom: none;
          }
          .footer {
            margin-top: 50px;
            padding-top: 25px;
            border-top: 3px solid #e5e7eb;
            text-align: center;
            color: #6b7280;
            font-size: 13px;
          }
          .footer p {
            margin: 8px 0;
          }
          .commission-info {
            background: #fef3c7;
            padding: 15px;
            border-radius: 8px;
            margin-top: 15px;
            border-left: 4px solid #f59e0b;
          }
          @media print {
            body { 
              padding: 20px; 
            }
            .metric-card, table {
              box-shadow: none;
              break-inside: avoid;
            }
            h2 {
              page-break-after: avoid;
            }
          }
        </style>
      </head>
      <body>
        <h1>📊 Finance Analytics Report</h1>
        
        <div class="header-info">
          <p><strong>Generated:</strong> ${new Date().toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}</p>
          <p><strong>Period:</strong> ${periodText}</p>
          <p><strong>Total Orders:</strong> ${financialData.orderStats.total}</p>
        </div>

        <h2>💰 Financial Overview</h2>
        <div class="metrics-grid">
          <div class="metric-card">
            <div class="metric-label">Total Revenue</div>
            <div class="metric-value">${formatCurrency(financialData.totalRevenue)}</div>
          </div>
          <div class="metric-card">
            <div class="metric-label">Platform Profit</div>
            <div class="metric-value">${formatCurrency(financialData.totalProfit)}</div>
          </div>
          <div class="metric-card">
            <div class="metric-label">Seller Payouts</div>
            <div class="metric-value">${formatCurrency(financialData.sellerPayouts)}</div>
          </div>
          <div class="metric-card">
            <div class="metric-label">Total Commission</div>
            <div class="metric-value">${formatCurrency(financialData.totalCommission)}</div>
          </div>
        </div>
        
        <div class="commission-info">
          <strong>Commission Structure:</strong> Platform retains 4% commission on all transactions. 
          Sellers receive 96% of the transaction value.
        </div>

        <h2>📦 Order Statistics</h2>
        <table>
          <thead>
            <tr>
              <th>Status</th>
              <th style="text-align: right;">Count</th>
              <th style="text-align: right;">Percentage</th>
            </tr>
          </thead>
          <tbody>
            <tr style="background: #f0fdf4;">
              <td><strong>Total Orders</strong></td>
              <td style="text-align: right;"><strong>${financialData.orderStats.total}</strong></td>
              <td style="text-align: right;"><strong>100%</strong></td>
            </tr>
            <tr>
              <td>✅ Completed</td>
              <td style="text-align: right;">${financialData.orderStats.completed}</td>
              <td style="text-align: right;">${financialData.orderStats.total > 0 ? 
                ((financialData.orderStats.completed / financialData.orderStats.total) * 100).toFixed(1) : 0}%</td>
            </tr>
            <tr>
              <td>🔄 Processing</td>
              <td style="text-align: right;">${financialData.orderStats.processing}</td>
              <td style="text-align: right;">${financialData.orderStats.total > 0 ? 
                ((financialData.orderStats.processing / financialData.orderStats.total) * 100).toFixed(1) : 0}%</td>
            </tr>
            <tr>
              <td>⏳ Pending</td>
              <td style="text-align: right;">${financialData.orderStats.pending}</td>
              <td style="text-align: right;">${financialData.orderStats.total > 0 ? 
                ((financialData.orderStats.pending / financialData.orderStats.total) * 100).toFixed(1) : 0}%</td>
            </tr>
            <tr>
              <td>❌ Cancelled</td>
              <td style="text-align: right;">${financialData.orderStats.cancelled}</td>
              <td style="text-align: right;">${financialData.orderStats.total > 0 ? 
                ((financialData.orderStats.cancelled / financialData.orderStats.total) * 100).toFixed(1) : 0}%</td>
            </tr>
            <tr>
              <td>↩️ Returned</td>
              <td style="text-align: right;">${financialData.orderStats.returned}</td>
              <td style="text-align: right;">${financialData.orderStats.total > 0 ? 
                ((financialData.orderStats.returned / financialData.orderStats.total) * 100).toFixed(1) : 0}%</td>
            </tr>
          </tbody>
        </table>

        ${financialData.topProducts.length > 0 ? `
          <h2>🏆 Top Selling Products</h2>
          <table>
            <thead>
              <tr>
                <th>Rank</th>
                <th>Product Name</th>
                <th style="text-align: right;">Quantity Sold</th>
                <th style="text-align: right;">Revenue</th>
              </tr>
            </thead>
            <tbody>
              ${financialData.topProducts.map((product, index) => `
                <tr>
                  <td><strong>#${index + 1}</strong></td>
                  <td>${product.name}</td>
                  <td style="text-align: right;">${product.quantity}</td>
                  <td style="text-align: right; color: #f97316; font-weight: 600;">${formatCurrency(product.revenue)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        ` : '<p style="color: #6b7280; font-style: italic;">No product sales data available for this period.</p>'}

        ${financialData.monthlyRevenue.length > 0 ? `
          <h2>📈 Monthly Revenue Breakdown</h2>
          <table>
            <thead>
              <tr>
                <th>Month</th>
                <th style="text-align: right;">Revenue</th>
                <th style="text-align: right;">% of Total</th>
              </tr>
            </thead>
            <tbody>
              ${financialData.monthlyRevenue.map(item => `
                <tr>
                  <td>${item.month}</td>
                  <td style="text-align: right; font-weight: 600;">${formatCurrency(item.amount)}</td>
                  <td style="text-align: right;">${financialData.totalRevenue > 0 ? 
                    ((item.amount / financialData.totalRevenue) * 100).toFixed(1) : 0}%</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        ` : ''}

        <div class="footer">
          <p><strong>Finance Analytics System</strong></p>
          <p>This report was automatically generated and contains confidential financial information.</p>
          <p>Platform Commission Rate: 4% | Seller Payout Rate: 96%</p>
          <p style="margin-top: 15px; font-size: 11px;">© ${new Date().getFullYear()} All rights reserved.</p>
        </div>
      </body>
      </html>
    `;
    
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    
    printWindow.onload = function() {
      setTimeout(() => {
        printWindow.print();
      }, 250);
    };
  };

  const MetricCard = ({ icon: Icon, label, value, color }) => (
    <div className={`bg-white rounded-lg shadow-md p-6 border-l-4 border-${color}-500`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-600 text-sm">{label}</p>
          <p className={`text-3xl font-bold text-${color}-600`}>{value}</p>
        </div>
        <Icon className={`text-${color}-500 text-4xl opacity-20`} />
      </div>
    </div>
  );

  const OrderStatCard = ({ label, count, bgColor, textColor }) => (
    <div className={`text-center p-4 ${bgColor} rounded-lg`}>
      <p className="text-gray-600 text-sm">{label}</p>
      <p className={`text-2xl font-bold ${textColor}`}>{count}</p>
    </div>
  );

  return (
    <div className="space-y-6 p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Finance Analytics</h1>
      </div>

      {/* Period Selector */}
      <div className="flex gap-4 mb-6 flex-wrap">
        <button
          onClick={() => setSelectedPeriod('week')}
          className={`px-6 py-2 rounded-lg font-semibold transition-all ${
            selectedPeriod === 'week'
              ? 'bg-orange-500 text-white shadow-lg'
              : 'bg-white text-gray-800 hover:bg-gray-100 shadow'
          }`}
        >
          This Week
        </button>
        <button
          onClick={() => setSelectedPeriod('month')}
          className={`px-6 py-2 rounded-lg font-semibold transition-all ${
            selectedPeriod === 'month'
              ? 'bg-orange-500 text-white shadow-lg'
              : 'bg-white text-gray-800 hover:bg-gray-100 shadow'
          }`}
        >
          This Month
        </button>
        <button
          onClick={() => setSelectedPeriod('all')}
          className={`px-6 py-2 rounded-lg font-semibold transition-all ${
            selectedPeriod === 'all'
              ? 'bg-orange-500 text-white shadow-lg'
              : 'bg-white text-gray-800 hover:bg-gray-100 shadow'
          }`}
        >
          All Time
        </button>
        <button
          onClick={downloadReport}
          className="ml-auto px-6 py-2 rounded-lg bg-green-500 text-white font-semibold hover:bg-green-600 transition-all shadow-lg flex items-center gap-2"
        >
          <FiDownload /> Download PDF Report
        </button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard 
          icon={FiDollarSign}
          label="Total Revenue"
          value={formatCurrency(financialData.totalRevenue)}
          color="orange"
        />
        <MetricCard 
          icon={FiTrendingUp}
          label="Platform Profit"
          value={formatCurrency(financialData.totalProfit)}
          color="green"
        />
        <MetricCard 
          icon={FiUsers}
          label="Seller Payouts"
          value={formatCurrency(financialData.sellerPayouts)}
          color="blue"
        />
        <MetricCard 
          icon={FiShoppingCart}
          label="Commission (4%)"
          value={formatCurrency(financialData.totalCommission)}
          color="purple"
        />
      </div>

      {/* Order Statistics */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-xl font-bold mb-4">Order Statistics</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <OrderStatCard label="Total" count={financialData.orderStats.total} bgColor="bg-gray-50" textColor="text-gray-900" />
          <OrderStatCard label="Completed" count={financialData.orderStats.completed} bgColor="bg-green-50" textColor="text-green-600" />
          <OrderStatCard label="Pending" count={financialData.orderStats.pending} bgColor="bg-yellow-50" textColor="text-yellow-600" />
          <OrderStatCard label="Processing" count={financialData.orderStats.processing} bgColor="bg-blue-50" textColor="text-blue-600" />
          <OrderStatCard label="Cancelled" count={financialData.orderStats.cancelled} bgColor="bg-red-50" textColor="text-red-600" />
          <OrderStatCard label="Returned" count={financialData.orderStats.returned} bgColor="bg-orange-50" textColor="text-orange-600" />
        </div>
      </div>

      {/* Monthly Revenue Chart */}
      {financialData.monthlyRevenue.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-bold mb-4">Monthly Revenue</h3>
          <div className="space-y-3">
            {financialData.monthlyRevenue.map((item, index) => {
              const maxRevenue = Math.max(...financialData.monthlyRevenue.map(m => m.amount));
              const percentage = maxRevenue > 0 ? (item.amount / maxRevenue) * 100 : 0;
              return (
                <div key={index} className="flex items-center gap-4">
                  <div className="w-28 text-sm font-semibold text-gray-600">{item.month}</div>
                  <div className="flex-grow bg-gray-200 rounded-full h-10 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-orange-400 to-orange-600 h-full flex items-center justify-end pr-3 text-white text-sm font-semibold transition-all duration-500"
                      style={{ width: `${percentage}%` }}
                    >
                      {item.amount > 0 && formatCurrency(item.amount)}
                    </div>
                  </div>
                </div>
              );
            })}
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
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Rank</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Product Name</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">Quantity Sold</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {financialData.topProducts.map((product, index) => (
                  <tr key={index} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-4 font-bold text-gray-600">#{index + 1}</td>
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
      <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg shadow-md p-8 text-white">
        <h3 className="text-2xl font-bold mb-6">Finance Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <p className="text-orange-100 mb-2">Platform Commission Rate</p>
            <p className="text-5xl font-bold">4%</p>
            <p className="text-orange-100 text-sm mt-2">Per transaction on seller orders</p>
          </div>
          <div>
            <p className="text-orange-100 mb-2">Average Seller Payout</p>
            <p className="text-5xl font-bold">96%</p>
            <p className="text-orange-100 text-sm mt-2">Of total transaction value</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FinanceAnalytics;