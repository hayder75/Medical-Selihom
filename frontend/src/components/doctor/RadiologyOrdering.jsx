import React, { useState, useEffect, useMemo } from 'react';
import { Scan, Plus, X, CheckCircle, Clock, Search } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

const RadiologyOrdering = ({ visitId, patientId, onOrdersPlaced, existingOrders = [] }) => {
  const [radiologyTests, setRadiologyTests] = useState([]);
  const [selectedTests, setSelectedTests] = useState([]);
  const [instructions, setInstructions] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetchingTests, setFetchingTests] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchRadiologyTests();
  }, []);

  // Filter tests based on search query
  const filteredTests = useMemo(() => {
    if (!searchQuery.trim()) {
      return radiologyTests;
    }

    const query = searchQuery.toLowerCase().trim();
    return radiologyTests.filter(test => {
      const name = test.name?.toLowerCase() || '';
      const description = test.description?.toLowerCase() || '';
      const code = test.service?.code?.toLowerCase() || '';

      return name.includes(query) ||
        description.includes(query) ||
        code.includes(query);
    });
  }, [radiologyTests, searchQuery]);

  const fetchRadiologyTests = async () => {
    try {
      setFetchingTests(true);
      const response = await api.get('/doctors/investigation-types');
      const radiologyTests = response.data.investigationTypes.filter(
        test => test.category === 'RADIOLOGY'
      );
      setRadiologyTests(radiologyTests);
    } catch (error) {
      console.error('Error fetching radiology tests:', error);
      toast.error('Failed to fetch radiology tests');
    } finally {
      setFetchingTests(false);
    }
  };

  const toggleTestSelection = (test) => {
    // Check if this test is already ordered
    const isAlreadyOrdered = existingOrders.some(order => order.type?.id === test.id);
    if (isAlreadyOrdered) {
      toast.error('This test has already been ordered for this visit');
      return;
    }

    setSelectedTests(prev => { sessionStorage.setItem("selectedRadioTests", JSON.stringify(prev));
      const isSelected = prev.some(selected => selected.id === test.id);
      if (isSelected) {
        return prev.filter(selected => selected.id !== test.id);
      } else {
        return [...prev, test];
      }
    });
  };

  const handleSelectAll = () => {
    // Get available tests (not already ordered)
    const availableTests = radiologyTests.filter(test =>
      !existingOrders.some(order => order.type?.id === test.id)
    );

    const allSelected = availableTests.length > 0 &&
      availableTests.every(test => selectedTests.some(selected => selected.id === test.id));

    if (allSelected) {
      // Deselect all
      setSelectedTests([]);
    } else {
      // Select all available tests
      const notSelected = availableTests.filter(test =>
        !selectedTests.some(selected => selected.id === test.id)
      );
      setSelectedTests(prev => [...prev, ...notSelected]);
    }
  };

  const handleSubmitOrders = async () => {
    if (selectedTests.length === 0) {
      toast.error('Please select at least one radiology test');
      return;
    }

    setLoading(true);
    try {
      const batchOrderData = {
        visitId: parseInt(visitId),
        patientId,
        type: 'RADIOLOGY',
        instructions: instructions || 'Radiology tests ordered by doctor',
        services: selectedTests.map(test => ({
          serviceId: test.serviceId || test.id.toString(),
          investigationTypeId: test.id,
          instructions: instructions || `Radiology test: ${test.name}`
        }))
      };

      await api.post('/batch-orders/create', batchOrderData);

      toast.success(`${selectedTests.length} radiology test(s) ordered successfully`);

      // Reset form
      setSelectedTests([]);
      setInstructions('');

      if (onOrdersPlaced) {
        onOrdersPlaced();
      }
    } catch (error) {
      console.error('Error ordering radiology tests:', error);
      toast.error(error.response?.data?.error || 'Failed to order radiology tests');
    } finally {
      setLoading(false);
    }
  };

  const calculateTotal = () => {
    return selectedTests.reduce((sum, test) => sum + (test.service?.price || 0), 0);
  };

  if (fetchingTests) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
            <Scan className="h-6 w-6 text-purple-600" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900">Radiology Test Ordering</h3>
            <p className="text-base text-gray-600">Select and order radiology tests</p>
          </div>
        </div>
        {selectedTests.length > 0 && (
          <div className="flex items-center space-x-2 text-base font-semibold text-green-600">
            <CheckCircle className="h-5 w-5" />
            <span>{selectedTests.length} test(s) selected</span>
          </div>
        )}
      </div>

      {/* Search Bar */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search radiology tests by name, description, or code..."
          className="w-full pl-10 pr-4 py-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute inset-y-0 right-0 pr-3 flex items-center"
          >
            <X className="h-5 w-5 text-gray-400 hover:text-gray-600" />
          </button>
        )}
      </div>

      {/* Available Radiology Tests */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-lg font-semibold text-gray-900">Available Radiology Tests</h4>
            {searchQuery && (
              <p className="text-sm text-gray-600 mt-1">
                Showing {filteredTests.length} of {radiologyTests.length} test(s)
              </p>
            )}
          </div>
          <button
            onClick={handleSelectAll}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2 text-sm font-medium"
          >
            <CheckCircle className="w-4 h-4" />
            <span>
              {(() => {
                const availableTests = filteredTests.filter(test =>
                  !existingOrders.some(order => order.type?.id === test.id)
                );
                const allSelected = availableTests.length > 0 &&
                  availableTests.every(test => selectedTests.some(selected => selected.id === test.id));
                return allSelected ? 'Deselect All' : 'Select All';
              })()}
            </span>
          </button>
        </div>

        {filteredTests.length === 0 ? (
          <div className="text-center py-8 border border-gray-200 rounded-lg bg-gray-50">
            <Search className="h-12 w-12 mx-auto mb-3 text-gray-400" />
            <p className="text-gray-600 font-medium">No radiology tests found</p>
            <p className="text-sm text-gray-500 mt-1">
              {searchQuery ? `Try a different search term` : 'No radiology tests available'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filteredTests.map((test) => {
              const isSelected = selectedTests.some(selected => selected.id === test.id);
              const isAlreadyOrdered = existingOrders.some(order => order.type?.id === test.id);
              return (
                <div
                  key={test.id}
                  className={`p-4 border rounded-lg cursor-pointer transition-all duration-200 ${isAlreadyOrdered
                    ? 'border-gray-300 bg-gray-100 opacity-60 cursor-not-allowed'
                    : isSelected
                      ? 'border-purple-500 bg-purple-50 ring-2 ring-purple-200'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  onClick={() => !isAlreadyOrdered && toggleTestSelection(test)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <h5 className="text-base font-semibold text-gray-900">{test.name}</h5>
                        {isAlreadyOrdered && (
                          <span className="px-2 py-1 text-sm bg-gray-200 text-gray-600 rounded">Already Ordered</span>
                        )}
                        {isSelected && !isAlreadyOrdered && (
                          <CheckCircle className="h-5 w-5 text-purple-600" />
                        )}
                      </div>
                      <p className="text-base text-gray-600 mt-1">{test.description}</p>
                      <div className="flex items-center space-x-4 mt-2">
                        <div className="text-sm font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-100">
                          Price: {(test.service?.price || 0).toLocaleString()} ETB
                        </div>
                        <div className="text-sm text-gray-500">
                          Code: {test.service?.code || 'N/A'}
                        </div>
                      </div>
                    </div>
                    <div className="ml-3">
                      {isSelected ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleTestSelection(test);
                          }}
                          className="p-1 text-red-600 hover:bg-red-100 rounded"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      ) : (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleTestSelection(test);
                          }}
                          className="p-1 text-purple-600 hover:bg-purple-100 rounded"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Selected Tests Summary */}
      {selectedTests.length > 0 && (
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <div className="flex justify-between items-center mb-3">
            <h4 className="text-lg font-semibold text-purple-900">Selected Radiology Tests ({selectedTests.length})</h4>
            <div className="text-xl font-bold text-purple-700 bg-white px-3 py-1 rounded-md border border-purple-200 shadow-sm">
              Total: {calculateTotal().toLocaleString()} ETB
            </div>
          </div>
          <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
            {selectedTests.map((test) => (
              <div key={test.id} className="flex items-center justify-between text-base border-b border-purple-100 pb-1 last:border-0 last:pb-0">
                <div className="flex flex-col">
                  <span className="text-purple-800 font-medium">{test.name}</span>
                  <span className="text-xs text-purple-500">{test.service?.code || 'N/A'}</span>
                </div>
                <span className="text-purple-700 font-semibold">{(test.service?.price || 0).toLocaleString()} ETB</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Instructions */}
      <div>
        <label className="block text-base font-semibold text-gray-700 mb-2">
          Instructions for Radiology Tests
        </label>
        <textarea
          value={instructions}
          onChange={(e) => setInstructions(e.target.value)}
          rows="3"
          className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          placeholder="Add specific instructions for the radiology tests..."
        />
      </div>

      {/* Submit Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSubmitOrders}
          disabled={selectedTests.length === 0 || loading}
          className="px-8 py-4 text-lg font-bold bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-3 shadow-lg transition-transform active:scale-95"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
              <span>Ordering...</span>
            </>
          ) : (
            <>
              <Scan className="h-6 w-6" />
              <span>Order {selectedTests.length} Radiology Test(s) — Total: {calculateTotal().toLocaleString()} ETB</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default RadiologyOrdering;
