import React, { useState, useEffect } from 'react';
import { FiEdit2, FiTrash2, FiCheck, FiEye, FiEyeOff, FiX } from 'react-icons/fi';
import { toast } from 'react-toastify';
import { getAllServicesAdmin, updateServiceStatus, adminEditService, adminDeleteService } from '../../../services/firebase/firestoreHelpers';
import Loader from '../../common/Loader/Spinner';

const AdminServiceManagement = () => {
  const [services, setServices] = useState([]);
  const [filteredServices, setFilteredServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [editFormData, setEditFormData] = useState({});
  const [statusNotes, setStatusNotes] = useState('');
  const [updatingServiceId, setUpdatingServiceId] = useState(null);

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      setLoading(true);
      const data = await getAllServicesAdmin();
      setServices(data);
    } catch (error) {
      console.error('Error fetching services:', error);
      toast.error('Failed to load services');
    } finally {
      setLoading(false);
    }
  };

  // Filter services
  useEffect(() => {
    let filtered = services;

    // Filter by search term
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(service =>
        service.name?.toLowerCase().includes(searchLower) ||
        service.description?.toLowerCase().includes(searchLower) ||
        service.sellerName?.toLowerCase().includes(searchLower) ||
        service.id?.toLowerCase().includes(searchLower)
      );
    }

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(service => (service.status || 'active') === statusFilter);
    }

    setFilteredServices(filtered);
  }, [services, searchTerm, statusFilter]);

  const handleOpenEditModal = (service) => {
    setEditingService(service);
    setEditFormData({
      name: service.name,
      description: service.description,
      price: service.price,
      category: service.category,
      duration: service.duration
    });
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (!editingService) return;

    try {
      setUpdatingServiceId(editingService.id);
      await adminEditService(editingService.id, editFormData);
      
      // Update local state
      setServices(services.map(s => 
        s.id === editingService.id 
          ? { ...s, ...editFormData, lastEditedByAdmin: true }
          : s
      ));

      toast.success('Service updated successfully');
      setShowEditModal(false);
      setEditingService(null);
    } catch (error) {
      console.error('Error updating service:', error);
      toast.error('Failed to update service');
    } finally {
      setUpdatingServiceId(null);
    }
  };

  const handleStatusChange = async (serviceId, newStatus) => {
    try {
      setUpdatingServiceId(serviceId);
      await updateServiceStatus(serviceId, newStatus, statusNotes);
      
      // Update local state
      setServices(services.map(s => 
        s.id === serviceId 
          ? { ...s, status: newStatus, adminNotes: statusNotes }
          : s
      ));

      toast.success(`Service status updated to ${newStatus}`);
      setStatusNotes('');
    } catch (error) {
      console.error('Error updating service status:', error);
      toast.error('Failed to update service status');
    } finally {
      setUpdatingServiceId(null);
    }
  };

  const handleDelete = async (serviceId) => {
    if (!window.confirm('Are you sure you want to permanently delete this service? This action cannot be undone.')) {
      return;
    }

    try {
      setUpdatingServiceId(serviceId);
      await adminDeleteService(serviceId);
      
      // Update local state
      setServices(services.map(s => 
        s.id === serviceId 
          ? { ...s, status: 'deleted' }
          : s
      ));

      toast.success('Service deleted successfully');
    } catch (error) {
      console.error('Error deleting service:', error);
      toast.error('Failed to delete service');
    } finally {
      setUpdatingServiceId(null);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      active: { bg: 'bg-green-100', text: 'text-green-800', label: 'Active' },
      under_review: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Under Review' },
      rejected: { bg: 'bg-red-100', text: 'text-red-800', label: 'Rejected' },
      deleted: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Deleted' }
    };

    const config = statusConfig[status] || statusConfig.active;
    return (
      <span className={`inline-block px-2 py-1 rounded text-xs font-semibold ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Service Management</h2>
        <button
          onClick={fetchServices}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition text-sm"
        >
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-4 space-y-4">
        {/* Search */}
        <div>
          <label className="block text-sm font-semibold mb-2">Search Services</label>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by name, description, seller, or ID..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Status Filter */}
        <div>
          <label className="block text-sm font-semibold mb-2">Filter by Status</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="under_review">Under Review</option>
            <option value="rejected">Rejected</option>
            <option value="deleted">Deleted</option>
          </select>
        </div>
      </div>

      {/* Services Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {filteredServices.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No services found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-100 border-b">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">Service Name</th>
                  <th className="px-4 py-3 text-left font-semibold">Seller</th>
                  <th className="px-4 py-3 text-left font-semibold">Price</th>
                  <th className="px-4 py-3 text-left font-semibold">Status</th>
                  <th className="px-4 py-3 text-left font-semibold">Created</th>
                  <th className="px-4 py-3 text-left font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredServices.map((service) => (
                  <tr key={service.id} className="border-b hover:bg-gray-50 transition">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-gray-800 truncate max-w-xs">
                        {service.name}
                      </div>
                      <div className="text-xs text-gray-500">{service.id}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm text-gray-700">{service.sellerName}</div>
                      <div className="text-xs text-gray-500">{service.sellerEmail}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-semibold text-orange-600">
                        KES {service.price?.toLocaleString()}
                      </span>
                      <div className="text-xs text-gray-500">/{service.duration}</div>
                    </td>
                    <td className="px-4 py-3">
                      {getStatusBadge(service.status)}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600">
                      {service.createdAt?.toDate?.()?.toLocaleDateString() || 'N/A'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        {/* Edit Button */}
                        <button
                          onClick={() => handleOpenEditModal(service)}
                          disabled={updatingServiceId === service.id}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded transition disabled:opacity-50"
                          title="Edit Service"
                        >
                          <FiEdit2 size={16} />
                        </button>

                        {/* Status Change Dropdown */}
                        {service.status !== 'deleted' && (
                          <div className="relative group">
                            <button
                              className="p-2 text-yellow-600 hover:bg-yellow-50 rounded transition"
                              title="Change Status"
                            >
                              <FiEye size={16} />
                            </button>
                            <div className="hidden group-hover:block absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                              <div className="p-2 space-y-2">
                                {service.status !== 'active' && (
                                  <button
                                    onClick={() => handleStatusChange(service.id, 'active')}
                                    disabled={updatingServiceId === service.id}
                                    className="w-full text-left px-3 py-2 text-sm text-green-600 hover:bg-green-50 rounded transition disabled:opacity-50"
                                  >
                                    Approve (Active)
                                  </button>
                                )}
                                {service.status !== 'under_review' && (
                                  <button
                                    onClick={() => handleStatusChange(service.id, 'under_review')}
                                    disabled={updatingServiceId === service.id}
                                    className="w-full text-left px-3 py-2 text-sm text-yellow-600 hover:bg-yellow-50 rounded transition disabled:opacity-50"
                                  >
                                    Ask for Review
                                  </button>
                                )}
                                {service.status !== 'rejected' && (
                                  <button
                                    onClick={() => handleStatusChange(service.id, 'rejected')}
                                    disabled={updatingServiceId === service.id}
                                    className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded transition disabled:opacity-50"
                                  >
                                    Reject
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Delete Button */}
                        <button
                          onClick={() => handleDelete(service.id)}
                          disabled={updatingServiceId === service.id || service.status === 'deleted'}
                          className="p-2 text-red-600 hover:bg-red-50 rounded transition disabled:opacity-50"
                          title="Delete Service"
                        >
                          <FiTrash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {showEditModal && editingService && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full max-h-96 overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b">
              <h3 className="text-xl font-bold">Edit Service</h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <FiX size={24} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Service Name */}
              <div>
                <label className="block text-sm font-semibold mb-2">Service Name</label>
                <input
                  type="text"
                  value={editFormData.name || ''}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-semibold mb-2">Description</label>
                <textarea
                  value={editFormData.description || ''}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows="4"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Price */}
              <div>
                <label className="block text-sm font-semibold mb-2">Price (KES)</label>
                <input
                  type="number"
                  value={editFormData.price || ''}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, price: parseInt(e.target.value) }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-semibold mb-2">Category</label>
                <input
                  type="text"
                  value={editFormData.category || ''}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Duration */}
              <div>
                <label className="block text-sm font-semibold mb-2">Duration Type</label>
                <select
                  value={editFormData.duration || 'hourly'}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, duration: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="hourly">Hourly</option>
                  <option value="daily">Daily</option>
                  <option value="one-time">One-time</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-4 p-6 border-t">
              <button
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={updatingServiceId === editingService.id}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
              >
                {updatingServiceId === editingService.id ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminServiceManagement;
