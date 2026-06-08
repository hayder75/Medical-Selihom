import React, { useState, useEffect, useMemo } from 'react';
import { TestTube, Plus, X, CheckCircle, Clock, ChevronDown, ChevronRight, Package, Search, Printer } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

const LabOrdering = ({ visitId, patientId, patient, visit, onOrdersPlaced, existingOrders = [] }) => {
  const [organizedTests, setOrganizedTests] = useState({});
  const [selectedTestIds, setSelectedTestIds] = useState(new Set());
  const [expandedGroups, setExpandedGroups] = useState(new Set());
  const [expandedCategories, setExpandedCategories] = useState(new Set());
  const [instructions, setInstructions] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetchingTests, setFetchingTests] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedGroupId, setSelectedGroupId] = useState(null);

  useEffect(() => {
    fetchLabTests();
    // Start with all categories collapsed
    setExpandedCategories(new Set());
  }, []);

  const fetchLabTests = async () => {
    try {
      setFetchingTests(true);
      console.log('🔍 [Doctor] Fetching lab tests from /doctors/lab-tests/for-ordering...');
      const response = await api.get('/doctors/lab-tests/for-ordering');
      console.log('✅ [Doctor] Response received:', {
        status: response.status,
        hasData: !!response.data,
        hasOrganized: !!response.data?.organized,
        categories: response.data?.organized ? Object.keys(response.data.organized) : []
      });

      if (!response.data?.organized) {
        console.warn('⚠️ [Doctor] Response data missing "organized" field:', response.data);
        toast.error('Invalid response format from server');
        return;
      }

      setOrganizedTests(response.data.organized);
      console.log('✅ [Doctor] Tests loaded successfully:', Object.keys(response.data.organized).length, 'categories');

      // Debug: Log Hematology tests
      if (response.data.organized['Hematology']) {
        console.log('🩸 [LabOrdering] Hematology tests:', {
          standalone: response.data.organized['Hematology'].standalone?.map(t => ({ code: t.code, name: t.name })),
          groups: response.data.organized['Hematology'].groups?.map(g => ({ name: g.name, testCount: g.tests?.length }))
        });
      }

      // Debug: Log Serology tests order
      if (response.data.organized['Serology']) {
        const serologyPanel = response.data.organized['Serology'].groups?.find(g => g.name === 'Serology Panel');
        if (serologyPanel) {
          console.log('🔬 [LabOrdering] Serology Panel Tests Order (from API):', serologyPanel.tests.map(t => ({ code: t.code, name: t.name })));
        }
      }

      // Debug: Log Hematology tests
      if (response.data.organized['Hematology']) {
        console.log('🩸 [LabOrdering] Hematology tests:', {
          standalone: response.data.organized['Hematology'].standalone?.map(t => ({ code: t.code, name: t.name })),
          groups: response.data.organized['Hematology'].groups?.map(g => ({ name: g.name, testCount: g.tests?.length }))
        });
      }

      // Debug: Log Serology tests order
      if (response.data.organized['Serology']) {
        const serologyPanel = response.data.organized['Serology'].groups?.find(g => g.name === 'Serology Panel');
        if (serologyPanel) {
          console.log('🔬 [LabOrdering] Serology Panel Tests Order (from API):', serologyPanel.tests.map(t => ({ code: t.code, name: t.name })));
        }
      }
    } catch (error) {
      console.error('❌ [Doctor] Error fetching lab tests:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        url: error.config?.url,
        method: error.config?.method
      });

      if (error.response?.status === 404) {
        toast.error('Lab tests endpoint not found. Please check server configuration.');
      } else if (error.response?.status === 403) {
        toast.error('Permission denied. Please check your user role.');
      } else {
        toast.error(`Failed to fetch lab tests: ${error.message}`);
      }
    } finally {
      setFetchingTests(false);
    }
  };

  // Toggle category expansion
  const toggleCategory = (category) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(category)) {
        newSet.delete(category);
      } else {
        newSet.add(category);
      }
      return newSet;
    });
  };

  // Toggle group expansion
  const toggleGroup = (groupId) => {
    setExpandedGroups(prev => {
      const newSet = new Set(prev);
      if (newSet.has(groupId)) {
        newSet.delete(groupId);
      } else {
        newSet.add(groupId);
      }
      return newSet;
    });
  };

  // Handle panel selection (select all tests in a group)
  const handlePanelSelect = (group) => {
    const allTestIds = group.tests.map(test => test.id);
    const allSelected = allTestIds.every(id => selectedTestIds.has(id));

    setSelectedTestIds(prev => {
      const newSet = new Set(prev);
      if (allSelected) {
        // Deselect all
        allTestIds.forEach(id => newSet.delete(id));
      } else {
        // Select all
        allTestIds.forEach(id => newSet.add(id));
      }
      return newSet;
    });
  };

  // Select all tests across all categories
  const handleSelectAll = () => {
    const allTestIds = new Set();
    Object.values(organizedTests).forEach(category => {
      category.groups?.forEach(group => {
        group.tests?.forEach(test => {
          if (!isTestOrdered(test.id)) {
            allTestIds.add(test.id);
          }
        });
      });
      category.standalone?.forEach(test => {
        if (!isTestOrdered(test.id)) {
          allTestIds.add(test.id);
        }
      });
    });

    const allCurrentlySelected = Array.from(selectedTestIds).every(id => allTestIds.has(id));
    const allSelected = allTestIds.size > 0 && allCurrentlySelected && selectedTestIds.size === allTestIds.size;

    if (allSelected) {
      // Deselect all
      setSelectedTestIds(new Set());
    } else {
      // Select all available (not already ordered)
      setSelectedTestIds(allTestIds);
    }
  };

  // Check if all available tests are selected
  const areAllTestsSelected = () => {
    const allAvailableTestIds = new Set();
    Object.values(organizedTests).forEach(category => {
      category.groups?.forEach(group => {
        group.tests?.forEach(test => {
          if (!isTestOrdered(test.id)) {
            allAvailableTestIds.add(test.id);
          }
        });
      });
      category.standalone?.forEach(test => {
        if (!isTestOrdered(test.id)) {
          allAvailableTestIds.add(test.id);
        }
      });
    });

    if (allAvailableTestIds.size === 0) return false;
    return allAvailableTestIds.size === selectedTestIds.size &&
      Array.from(selectedTestIds).every(id => allAvailableTestIds.has(id));
  };

  // Handle individual test selection
  const handleTestSelect = (testId) => {
    setSelectedTestIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(testId)) {
        newSet.delete(testId);
      } else {
        newSet.add(testId);
      }
      // Save to session storage for cross-tab warning
      sessionStorage.setItem('selectedLabTests', JSON.stringify(Array.from(newSet)));
      return newSet;
    });
  };

  // Check if panel is fully selected
  const isPanelFullySelected = (group) => {
    if (!group.tests || group.tests.length === 0) return false;
    return group.tests.every(test => selectedTestIds.has(test.id));
  };

  // Check if panel is partially selected
  const isPanelPartiallySelected = (group) => {
    if (!group.tests || group.tests.length === 0) return false;
    const selectedCount = group.tests.filter(test => selectedTestIds.has(test.id)).length;
    return selectedCount > 0 && selectedCount < group.tests.length;
  };

  // Get all selected tests with details
  const getSelectedTests = () => {
    const selected = [];
    Object.values(organizedTests).forEach(category => {
      category.groups?.forEach(group => {
        group.tests?.forEach(test => {
          if (selectedTestIds.has(test.id)) {
            selected.push({ ...test, groupName: group.name });
          }
        });
      });
      category.standalone?.forEach(test => {
        if (selectedTestIds.has(test.id)) {
          selected.push(test);
        }
      });
    });
    return selected;
  };

  // Check if test is already ordered
  const isTestOrdered = (testId) => {
    // Check in existing orders (both old and new system)
    return existingOrders.some(order => {
      // New system: labTestOrders (direct array of orders)
      if (order.labTest) {
        return order.labTest.id === testId;
      }
      // New system: batchOrder with orders array
      if (order.orders) {
        return order.orders.some(o => o.labTest?.id === testId);
      }
      // Old system: batchOrder with services array
      if (order.services) {
        return order.services.some(s => s.service?.id === testId);
      }
      return false;
    });
  };

  const handleSubmit = async () => {
    if (selectedTestIds.size === 0) {
      toast.error('Please select at least one lab test');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/batch-orders/lab-tests', {
        visitId: parseInt(visitId),
        patientId: patientId.toString(),
        labTestIds: Array.from(selectedTestIds),
        instructions: instructions
      });

      toast.success(`Lab orders placed successfully (${selectedTestIds.size} test(s))`);

      if (onOrdersPlaced) {
        onOrdersPlaced(response.data);
      }

      // Reset form
      setSelectedTestIds(new Set());
      setInstructions('');

    } catch (error) {
      console.error('Error placing lab orders:', error);
      const errorMessage = error.response?.data?.error || 'Failed to place lab orders';
      if (errorMessage.includes('inactive') || errorMessage.includes('not found')) {
        toast.error('One or more selected lab tests are inactive or not available. Please refresh and select only active tests.');
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  // Calculate total price
  const calculateTotal = () => {
    return getSelectedTests().reduce((sum, test) => sum + (test.price || 0), 0);
  };

  // Flatten all tests for search - MUST be before early return
  const allTestsFlat = useMemo(() => {
    const tests = [];
    Object.entries(organizedTests).forEach(([category, data]) => {
      // Add groups tests
      data.groups?.forEach(group => {
        group.tests?.forEach(test => {
          tests.push({ ...test, category, groupName: group.name, type: 'group' });
        });
      });
      // Add standalone tests
      data.standalone?.forEach(test => {
        tests.push({ ...test, category, type: 'standalone' });
      });
    });
    return tests;
  }, [organizedTests]);

  // Filter tests based on search query - MUST be before early return
  const filteredTests = useMemo(() => {
    if (!searchQuery.trim()) return null; // null means show categories

    const query = searchQuery.toLowerCase().trim();
    return allTestsFlat.filter(test =>
      test.name.toLowerCase().includes(query) ||
      test.description?.toLowerCase().includes(query) ||
      test.category.toLowerCase().includes(query) ||
      test.groupName?.toLowerCase().includes(query)
    );
  }, [searchQuery, allTestsFlat]);

  // Filter organized tests based on search - MUST be before early return
  const filteredOrganizedTests = useMemo(() => {
    if (!searchQuery.trim()) return organizedTests;

    const query = searchQuery.toLowerCase().trim();
    const filtered = {};

    Object.entries(organizedTests).forEach(([category, data]) => {
      const categoryMatches = category.toLowerCase().includes(query);
      const filteredGroups = [];
      const filteredStandalone = [];

      // Filter groups
      data.groups?.forEach(group => {
        const groupMatches = group.name.toLowerCase().includes(query);
        const filteredGroupTests = group.tests?.filter(test =>
          test.name.toLowerCase().includes(query) ||
          test.description?.toLowerCase().includes(query) ||
          groupMatches ||
          categoryMatches
        ) || [];

        if (filteredGroupTests.length > 0) {
          filteredGroups.push({ ...group, tests: filteredGroupTests });
        }
      });

      // Filter standalone
      data.standalone?.forEach(test => {
        if (
          test.name.toLowerCase().includes(query) ||
          test.description?.toLowerCase().includes(query) ||
          categoryMatches
        ) {
          filteredStandalone.push(test);
        }
      });

      if (categoryMatches || filteredGroups.length > 0 || filteredStandalone.length > 0) {
        filtered[category] = {
          groups: filteredGroups,
          standalone: filteredStandalone
        };
      }
    });

    return filtered;
  }, [searchQuery, organizedTests]);

  // Early return MUST be after all hooks
  if (fetchingTests) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        <span className="ml-2 text-gray-600">Loading lab tests...</span>
      </div>
    );
  }

  const selectedTests = getSelectedTests();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
            <TestTube className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900">Lab Test Ordering</h3>
            <p className="text-base text-gray-600">Select and order lab tests</p>
          </div>
        </div>
        {selectedTests.length > 0 && (
          <div className="flex items-center space-x-2 text-base font-semibold text-green-600">
            <CheckCircle className="h-5 w-5" />
            <span>{selectedTests.length} test(s) selected</span>
          </div>
        )}
      </div>

      {/* Existing Orders Section */}
      {existingOrders && existingOrders.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold text-yellow-800">📋 Previously Ordered Labs ({existingOrders.length})</h4>
            <button
              onClick={() => {
                // Get all tests from all orders
                let allTests = [];
                existingOrders.forEach(order => {
                  if (order.labTest) {
                    allTests.push(order);
                  } else if (order.orders) {
                    allTests = [...allTests, ...order.orders];
                  } else if (order.services) {
                    allTests = [...allTests, ...order.services];
                  }
                });

                const patientInfo = patient || visit?.patient || {};
                const doctorInfo = visit?.createdBy || visit?.doctor || {};
                const doctorName = doctorInfo.fullname || 'N/A';
                
                const printContent = `
                  <!DOCTYPE html>
                  <html>
                    <head>
                      <title>Lab Order Form</title>
                      <style>
                        @media print { @page { size: A4; margin: 15mm; } }
                        * { margin: 0; padding: 0; box-sizing: border-box; }
                        body { font-family: Arial, sans-serif; padding: 20px; color: #333; }
                        .header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #2563eb; padding-bottom: 15px; }
                        .clinic-name { font-size: 22px; font-weight: bold; color: #1e40af; }
                        .clinic-sub { font-size: 14px; color: #666; margin-top: 5px; }
                        .section { margin-bottom: 20px; }
                        .section-title { font-size: 14px; font-weight: bold; margin-bottom: 10px; color: #1e40af; border-bottom: 1px solid #ddd; padding-bottom: 5px; }
                        .info-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; font-size: 12px; margin-bottom: 20px; }
                        .info-item { background: #f8f9fa; padding: 8px; border-radius: 4px; }
                        .info-label { font-weight: bold; color: #666; display: block; font-size: 10px; }
                        .info-value { color: #333; font-size: 13px; }
                        .test-table { width: 100%; border-collapse: collapse; }
                        .test-table th { background: #2563eb; color: white; padding: 10px; text-align: left; font-size: 12px; }
                        .test-table td { border: 1px solid #ddd; padding: 10px; font-size: 12px; }
                        .test-table tr:nth-child(even) { background: #f8f9fa; }
                        .status-completed { background: #dcfce7; color: #166534; padding: 4px 8px; border-radius: 4px; font-size: 11px; font-weight: bold; }
                        .status-pending { background: #fef3c7; color: #92400e; padding: 4px 8px; border-radius: 4px; font-size: 11px; font-weight: bold; }
                        .btn-print { display: none; }
                        @media print { .btn-print { display: none; } }
                        .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; }
                        .footer-row { display: flex; justify-content: space-between; margin-top: 40px; }
                        .signature-box { width: 45%; }
                        .signature-line { border-bottom: 1px solid #333; margin-top: 40px; }
                        .signature-label { font-size: 12px; color: #666; margin-top: 5px; }
                      </style>
                    </head>
                    <body>
                      <div class="header">
                        <div class="clinic-name">Selihom Medical Clinic</div>
                        <div class="clinic-sub">Laboratory Order Form</div>
                      </div>
                      
                      <div class="section">
                        <div class="info-grid">
                          <div class="info-item">
                            <span class="info-label">PATIENT NAME</span>
                            <span class="info-value">${patientInfo.name || 'N/A'}</span>
                          </div>
                          <div class="info-item">
                            <span class="info-label">PATIENT ID</span>
                            <span class="info-value">${patientInfo.id || 'N/A'}</span>
                          </div>
                          <div class="info-item">
                            <span class="info-label">AGE / GENDER</span>
                            <span class="info-value">${patientInfo.age || 'N/A'} / ${patientInfo.gender || 'N/A'}</span>
                          </div>
                          <div class="info-item">
                            <span class="info-label">PHONE</span>
                            <span class="info-value">${patientInfo.mobile || patientInfo.phone || 'N/A'}</span>
                          </div>
                          <div class="info-item">
                            <span class="info-label">ORDER DATE</span>
                            <span class="info-value">${new Date().toLocaleDateString()}</span>
                          </div>
                          <div class="info-item">
                            <span class="info-label">ORDERED BY</span>
                            <span class="info-value">Dr. ${doctorName}</span>
                          </div>
                        </div>
                      </div>

                      <div class="section">
                        <div class="section-title">LABORATORY TESTS ORDERED (${allTests.length})</div>
                        <table class="test-table">
                          <thead>
                            <tr>
                              <th>#</th>
                              <th>Test Name</th>
                              <th>Category</th>
                              <th>Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            ${allTests.map((test, idx) => {
                              const testName = test.labTest?.name || test.investigationType?.name || test.name || 'Unknown Test';
                              const testStatus = test.status || order?.status || 'UNKNOWN';
                              const testCategory = test.labTest?.category || test.investigationType?.category || '-';
                              const isCompleted = testStatus === 'COMPLETED';
                              return `
                                <tr>
                                  <td>${idx + 1}</td>
                                  <td>${testName}</td>
                                  <td>${testCategory}</td>
                                  <td>${isCompleted ? '<span class="status-completed">COMPLETED</span>' : '<span class="status-pending">PENDING</span>'}</td>
                                </tr>
                              `;
                            }).join('')}
                          </tbody>
                        </table>
                      </div>

                      <div class="footer">
                        <div class="footer-row">
                          <div class="signature-box">
                            <div class="signature-line"></div>
                            <div class="signature-label">Doctor's Signature</div>
                          </div>
                          <div class="signature-box">
                            <div class="signature-line"></div>
                            <div class="signature-label">Lab Technician's Signature</div>
                          </div>
                        </div>
                      </div>

                      <div style="text-align: center; margin-top: 30px;" class="btn-print">
                        <button onclick="window.print()" style="padding: 10px 30px; background: #2563eb; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 14px;">Print</button>
                      </div>
                    </body>
                  </html>
                `;
                const printWindow = window.open('', '_blank');
                printWindow.document.write(printContent);
                printWindow.document.close();
                printWindow.print();
              }}
              className="flex items-center gap-1 px-3 py-1.5 text-sm bg-green-100 text-green-700 hover:bg-green-200 rounded"
            >
              <Printer className="h-4 w-4" />
              Print All
            </button>
          </div>
          <div className="space-y-2">
            {existingOrders.map((order, idx) => {
              // Handle both old system (batchOrders) and new system (labTestOrders)
              let tests = [];
              
              // Case 1: Direct labTestOrder (new system)
              if (order.labTest) {
                tests = [order];
              }
              // Case 2: batchOrder with orders array (new system)
              else if (order.orders) {
                tests = order.orders;
              }
              // Case 3: batchOrder with services array (old system)
              else if (order.services) {
                tests = order.services;
              }
              
              return tests.map((test, testIdx) => {
                const testName = test.labTest?.name || test.investigationType?.name || test.name || 'Unknown Test';
                const testStatus = test.status || order.status || 'UNKNOWN';
                const testCategory = test.labTest?.category || test.investigationType?.category || '';
                const orderDate = order.createdAt || test.createdAt;
                
                return (
                  <div key={`${idx}-${testIdx}`} className="flex items-center justify-between bg-white p-3 rounded border border-yellow-100">
                    <div className="flex-1">
                      <p className="font-medium text-gray-800">{testName}</p>
                      <p className="text-sm text-gray-500">
                        {testCategory && <span>Category: {testCategory}</span>}
                      </p>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      testStatus === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                      testStatus === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {testStatus}
                    </span>
                  </div>
                );
              });
            })}
          </div>
        </div>
      )}

      {/* Search Bar */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search lab tests by name, category, or description..."
          className="w-full pl-12 pr-4 py-3 text-lg border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Available Lab Tests - Hierarchical View */}
      <div>
        <div className="mb-4">
          <h4 className="text-lg font-semibold text-gray-900">
            {searchQuery ? `Search Results (${filteredTests?.length || 0})` : 'Available Lab Tests'}
          </h4>
        </div>

        {/* Search Results View */}
        {searchQuery && filteredTests && filteredTests.length > 0 && (
          <div className="space-y-3 max-h-[700px] overflow-y-auto border border-gray-300 rounded-lg p-4 bg-gray-50">
            {filteredTests.map((test) => {
              const isSelected = selectedTestIds.has(test.id);
              const isOrdered = isTestOrdered(test.id);

              return (
                <div
                  key={test.id}
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 ${isOrdered
                      ? 'border-gray-300 bg-gray-100 opacity-60 cursor-not-allowed'
                      : isSelected
                        ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                        : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                    }`}
                  onClick={() => !isOrdered && handleTestSelect(test.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <TestTube className={`w-6 h-6 ${isOrdered ? 'text-gray-400' : isSelected ? 'text-blue-600' : 'text-gray-500'}`} />
                        <div>
                          <h5 className="text-lg font-bold text-gray-900">{test.name}</h5>
                          {test.groupName && (
                            <span className="text-sm text-gray-600">({test.groupName} • {test.category})</span>
                          )}
                          {!test.groupName && (
                            <span className="text-sm text-gray-600">({test.category})</span>
                          )}
                        </div>
                        {isSelected && !isOrdered && (
                          <CheckCircle className="h-6 w-6 text-blue-600" />
                        )}
                      </div>
                      {test.description && (
                        <p className="text-sm text-gray-600 mt-2 ml-9">{test.description}</p>
                      )}
                    </div>
                    <div className="flex items-center space-x-4 ml-4">
                      <span className="text-base font-semibold text-gray-700">
                        {test.price ? `${test.price.toFixed(2)} ETB` : 'N/A'}
                      </span>
                      <label className="flex items-center cursor-pointer" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          disabled={isOrdered}
                          onChange={(e) => {
                            e.stopPropagation();
                            handleTestSelect(test.id);
                          }}
                          className="w-6 h-6 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                      </label>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* No Search Results */}
        {searchQuery && filteredTests && filteredTests.length === 0 && (
          <div className="border-2 border-gray-300 rounded-lg p-8 bg-gray-50 text-center">
            <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-lg text-gray-600">No lab tests found matching "{searchQuery}"</p>
            <button
              onClick={() => setSearchQuery('')}
              className="mt-4 text-blue-600 hover:text-blue-700 font-semibold"
            >
              Clear search
            </button>
          </div>
        )}

        {/* Category View (when not searching) - Button-based UI */}
        {!searchQuery && (
          <div className="space-y-4">
            {/* Main Category Buttons - Uniform styling, smaller */}
            <div className="flex w-full">
              {['Hematology', 'Microbiology', 'Serology', 'Blood Chemistry', 'Standalone Tests'].map((catName, index) => {
                const categoryData = filteredOrganizedTests[catName];
                if (!categoryData) return null;

                const testCount = (categoryData.groups?.reduce((sum, g) => sum + (g.tests?.length || 0), 0) || 0) +
                  (categoryData.standalone?.length || 0);

                const isSelected = selectedCategory === catName;

                return (
                  <button
                    key={catName}
                    onClick={() => {
                      setSelectedCategory(catName);
                      setSelectedGroupId(null);
                    }}
                    className={`flex-1 py-3 px-3 ${isSelected ? 'bg-indigo-600 text-white' : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'} font-semibold transition-all ${index === 0 ? 'rounded-l-lg' : ''} ${index === ['Hematology', 'Microbiology', 'Serology', 'Blood Chemistry', 'Standalone Tests'].length - 1 ? 'rounded-r-lg' : ''} ${index > 0 ? 'border-l border-gray-300' : ''} flex flex-col items-center justify-center`}
                  >
                    <span className="text-base">{catName}</span>
                    <span className={`mt-1 text-xs px-2 py-0.5 rounded-full ${isSelected ? 'bg-white/20' : 'bg-gray-100 text-gray-600'}`}>
                      {testCount}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Selected Category View */}
            {selectedCategory && (
              <div className="space-y-4">
                {/* Remove back button - main buttons stay visible */}

                {/* Hematology - Show directly */}
                {selectedCategory === 'Hematology' && filteredOrganizedTests[selectedCategory]?.standalone && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredOrganizedTests[selectedCategory].standalone.map((test) => {
                      const isSelected = selectedTestIds.has(test.id);
                      const isOrdered = isTestOrdered(test.id);

                      return (
                        <div
                          key={test.id}
                          className={`p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 ${isOrdered
                              ? 'border-gray-300 bg-gray-100 opacity-60 cursor-not-allowed'
                              : isSelected
                                ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                                : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                            }`}
                          onClick={() => !isOrdered && handleTestSelect(test.id)}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <h5 className="text-base font-bold text-gray-900">{test.name}</h5>
                              {test.description && (
                                <p className="text-sm text-gray-600 mt-1">{test.description}</p>
                              )}
                            </div>
                            {isSelected && !isOrdered && (
                              <CheckCircle className="h-5 w-5 text-blue-600 flex-shrink-0 ml-2" />
                            )}
                          </div>
                          <div className="flex items-center justify-between mt-3">
                            <span className="text-sm font-semibold text-gray-700">
                              {test.price ? `${test.price.toFixed(2)} ETB` : 'N/A'}
                            </span>
                            <input
                              type="checkbox"
                              checked={isSelected}
                              disabled={isOrdered}
                              onChange={(e) => {
                                e.stopPropagation();
                                handleTestSelect(test.id);
                              }}
                              className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                              onClick={(e) => e.stopPropagation()}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Microbiology - Show directly */}
                {selectedCategory === 'Microbiology' && filteredOrganizedTests[selectedCategory]?.standalone && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredOrganizedTests[selectedCategory].standalone.map((test) => {
                      const isSelected = selectedTestIds.has(test.id);
                      const isOrdered = isTestOrdered(test.id);

                      return (
                        <div
                          key={test.id}
                          className={`p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 ${isOrdered
                              ? 'border-gray-300 bg-gray-100 opacity-60 cursor-not-allowed'
                              : isSelected
                                ? 'border-teal-500 bg-teal-50 ring-2 ring-teal-200'
                                : 'border-gray-200 hover:border-teal-300 hover:bg-teal-50'
                            }`}
                          onClick={() => !isOrdered && handleTestSelect(test.id)}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <h5 className="text-base font-bold text-gray-900">{test.name}</h5>
                              {test.description && (
                                <p className="text-sm text-gray-600 mt-1">{test.description}</p>
                              )}
                            </div>
                            {isSelected && !isOrdered && (
                              <CheckCircle className="h-5 w-5 text-teal-600 flex-shrink-0 ml-2" />
                            )}
                          </div>
                          <div className="flex items-center justify-between mt-3">
                            <span className="text-sm font-semibold text-gray-700">
                              {test.price ? `${test.price.toFixed(2)} ETB` : 'N/A'}
                            </span>
                            <input
                              type="checkbox"
                              checked={isSelected}
                              disabled={isOrdered}
                              onChange={(e) => {
                                e.stopPropagation();
                                handleTestSelect(test.id);
                              }}
                              className="w-5 h-5 text-teal-600 border-gray-300 rounded focus:ring-teal-500"
                              onClick={(e) => e.stopPropagation()}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Standalone Tests - Show directly */}
                {selectedCategory === 'Standalone Tests' && filteredOrganizedTests[selectedCategory]?.standalone && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredOrganizedTests[selectedCategory].standalone.map((test) => {
                      const isSelected = selectedTestIds.has(test.id);
                      const isOrdered = isTestOrdered(test.id);

                      return (
                        <div
                          key={test.id}
                          className={`p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 ${isOrdered
                              ? 'border-gray-300 bg-gray-100 opacity-60 cursor-not-allowed'
                              : isSelected
                                ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                                : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                            }`}
                          onClick={() => !isOrdered && handleTestSelect(test.id)}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <h5 className="text-base font-bold text-gray-900">{test.name}</h5>
                              {test.description && (
                                <p className="text-sm text-gray-600 mt-1">{test.description}</p>
                              )}
                            </div>
                            {isSelected && !isOrdered && (
                              <CheckCircle className="h-5 w-5 text-blue-600 flex-shrink-0 ml-2" />
                            )}
                          </div>
                          <div className="flex items-center justify-between mt-3">
                            <span className="text-sm font-semibold text-gray-700">
                              {test.price ? `${test.price.toFixed(2)} ETB` : 'N/A'}
                            </span>
                            <input
                              type="checkbox"
                              checked={isSelected}
                              disabled={isOrdered}
                              onChange={(e) => {
                                e.stopPropagation();
                                handleTestSelect(test.id);
                              }}
                              className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                              onClick={(e) => e.stopPropagation()}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Serology - Show group buttons */}
                {selectedCategory === 'Serology' && !selectedGroupId && (
                  <div className="space-y-4">
                    {filteredOrganizedTests[selectedCategory]?.groups && filteredOrganizedTests[selectedCategory].groups.length > 0 && (
                      <div className="flex flex-wrap gap-3">
                        {filteredOrganizedTests[selectedCategory].groups.map((group) => {
                          const allGroupTestsSelected = group.tests?.every(test => selectedTestIds.has(test.id));
                          const someGroupTestsSelected = group.tests?.some(test => selectedTestIds.has(test.id));

                          return (
                            <div key={group.id} className="flex items-center gap-2">
                              <button
                                onClick={() => setSelectedGroupId(group.id)}
                                className="px-6 py-3 bg-green-600 text-white rounded-lg text-base font-semibold hover:bg-green-700 transition-all shadow-md hover:shadow-lg"
                              >
                                {group.name}
                                <span className="ml-2 text-sm bg-green-500 px-2 py-1 rounded">
                                  {group.tests?.length || 0} tests
                                </span>
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handlePanelSelect(group);
                                }}
                                className={`px-4 py-3 rounded-lg text-sm font-semibold transition-all shadow-md hover:shadow-lg ${allGroupTestsSelected
                                    ? 'bg-green-700 text-white hover:bg-green-800'
                                    : someGroupTestsSelected
                                      ? 'bg-green-500 text-white hover:bg-green-600'
                                      : 'bg-green-100 text-green-700 hover:bg-green-200'
                                  }`}
                              >
                                {allGroupTestsSelected ? 'Deselect All' : 'Select All'}
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                    {/* Also show standalone tests in Serology if any */}
                    {filteredOrganizedTests[selectedCategory]?.standalone &&
                      filteredOrganizedTests[selectedCategory].standalone.length > 0 && (
                        <div>
                          <h5 className="text-md font-semibold text-gray-700 mb-2">Other Serology Tests</h5>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {filteredOrganizedTests[selectedCategory].standalone.map((test) => {
                              const isSelected = selectedTestIds.has(test.id);
                              const isOrdered = isTestOrdered(test.id);

                              return (
                                <div
                                  key={test.id}
                                  className={`p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 ${isOrdered
                                      ? 'border-gray-300 bg-gray-100 opacity-60 cursor-not-allowed'
                                      : isSelected
                                        ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                                        : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                                    }`}
                                  onClick={() => !isOrdered && handleTestSelect(test.id)}
                                >
                                  <div className="flex items-start justify-between mb-2">
                                    <div className="flex-1">
                                      <h5 className="text-base font-bold text-gray-900">{test.name}</h5>
                                      {test.description && (
                                        <p className="text-sm text-gray-600 mt-1">{test.description}</p>
                                      )}
                                    </div>
                                    {isSelected && !isOrdered && (
                                      <CheckCircle className="h-5 w-5 text-blue-600 flex-shrink-0 ml-2" />
                                    )}
                                  </div>
                                  <div className="flex items-center justify-between mt-3">
                                    <span className="text-sm font-semibold text-gray-700">
                                      {test.price ? `${test.price.toFixed(2)} ETB` : 'N/A'}
                                    </span>
                                    <input
                                      type="checkbox"
                                      checked={isSelected}
                                      disabled={isOrdered}
                                      onChange={(e) => {
                                        e.stopPropagation();
                                        handleTestSelect(test.id);
                                      }}
                                      className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                      onClick={(e) => e.stopPropagation()}
                                    />
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                  </div>
                )}

                {/* Blood Chemistry - Show group buttons */}
                {selectedCategory === 'Blood Chemistry' && !selectedGroupId && (
                  <div className="space-y-4">
                    {filteredOrganizedTests[selectedCategory]?.groups && filteredOrganizedTests[selectedCategory].groups.length > 0 && (
                      <div className="flex flex-wrap gap-3">
                        {filteredOrganizedTests[selectedCategory].groups.map((group) => {
                          const allGroupTestsSelected = group.tests?.every(test => selectedTestIds.has(test.id));
                          const someGroupTestsSelected = group.tests?.some(test => selectedTestIds.has(test.id));

                          return (
                            <div key={group.id} className="flex items-center gap-2">
                              <button
                                onClick={() => setSelectedGroupId(group.id)}
                                className="px-6 py-3 bg-slate-600 text-white rounded-lg text-base font-semibold hover:bg-slate-700 transition-all shadow-md hover:shadow-lg"
                              >
                                {group.name}
                                <span className="ml-2 text-sm bg-orange-500 px-2 py-1 rounded">
                                  {group.tests?.length || 0} tests
                                </span>
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handlePanelSelect(group);
                                }}
                                className={`px-4 py-3 rounded-lg text-sm font-semibold transition-all shadow-md hover:shadow-lg ${allGroupTestsSelected
                                    ? 'bg-slate-700 text-white hover:bg-slate-800'
                                      : someGroupTestsSelected
                                        ? 'bg-slate-500 text-white hover:bg-slate-600'
                                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                  }`}
                              >
                                {allGroupTestsSelected ? 'Deselect All' : 'Select All'}
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                    {/* Also show standalone tests in Blood Chemistry if any */}
                    {filteredOrganizedTests[selectedCategory]?.standalone &&
                      filteredOrganizedTests[selectedCategory].standalone.length > 0 && (
                        <div>
                          <h5 className="text-md font-semibold text-gray-700 mb-2">Other Blood Chemistry Tests</h5>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {filteredOrganizedTests[selectedCategory].standalone.map((test) => {
                              const isSelected = selectedTestIds.has(test.id);
                              const isOrdered = isTestOrdered(test.id);

                              return (
                                <div
                                  key={test.id}
                                  className={`p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 ${isOrdered
                                      ? 'border-gray-300 bg-gray-100 opacity-60 cursor-not-allowed'
                                      : isSelected
                                        ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                                        : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                                    }`}
                                  onClick={() => !isOrdered && handleTestSelect(test.id)}
                                >
                                  <div className="flex items-start justify-between mb-2">
                                    <div className="flex-1">
                                      <h5 className="text-base font-bold text-gray-900">{test.name}</h5>
                                      {test.description && (
                                        <p className="text-sm text-gray-600 mt-1">{test.description}</p>
                                      )}
                                    </div>
                                    {isSelected && !isOrdered && (
                                      <CheckCircle className="h-5 w-5 text-blue-600 flex-shrink-0 ml-2" />
                                    )}
                                  </div>
                                  <div className="flex items-center justify-between mt-3">
                                    <span className="text-sm font-semibold text-gray-700">
                                      {test.price ? `${test.price.toFixed(2)} ETB` : 'N/A'}
                                    </span>
                                    <input
                                      type="checkbox"
                                      checked={isSelected}
                                      disabled={isOrdered}
                                      onChange={(e) => {
                                        e.stopPropagation();
                                        handleTestSelect(test.id);
                                      }}
                                      className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                      onClick={(e) => e.stopPropagation()}
                                    />
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                  </div>
                )}

                {/* Show tests for selected group */}
                {selectedGroupId && (
                  <div className="space-y-4">
                    {/* Group selection header - show all groups as buttons with Select All */}
                    <div className="flex flex-wrap gap-3">
                      {filteredOrganizedTests[selectedCategory]?.groups?.map((group) => {
                        const allGroupTestsSelected = group.tests?.every(test => selectedTestIds.has(test.id));
                        const someGroupTestsSelected = group.tests?.some(test => selectedTestIds.has(test.id));

                        return (
                          <div key={group.id} className="flex items-center gap-2">
                            <button
                              onClick={() => setSelectedGroupId(group.id)}
                              className={`px-6 py-3 text-white rounded-lg text-base font-semibold transition-all shadow-md hover:shadow-lg ${selectedGroupId === group.id
                                  ? selectedCategory === 'Serology'
                                    ? 'bg-green-700 ring-2 ring-green-300'
                                    : 'bg-slate-700 ring-2 ring-slate-300'
                                  : selectedCategory === 'Serology'
                                    ? 'bg-green-600 hover:bg-green-700'
                                    : 'bg-slate-600 hover:bg-slate-700'
                                }`}
                            >
                              {group.name}
                              <span className="ml-2 text-sm bg-white bg-opacity-30 px-2 py-1 rounded">
                                {group.tests?.length || 0} tests
                              </span>
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handlePanelSelect(group);
                              }}
                              className={`px-4 py-3 rounded-lg text-sm font-semibold transition-all shadow-md hover:shadow-lg ${allGroupTestsSelected
                                  ? selectedCategory === 'Serology'
                                    ? 'bg-green-700 text-white hover:bg-green-800'
                                    : 'bg-slate-700 text-white hover:bg-slate-800'
                                  : someGroupTestsSelected
                                    ? selectedCategory === 'Serology'
                                      ? 'bg-green-500 text-white hover:bg-green-600'
                                      : 'bg-slate-500 text-white hover:bg-slate-600'
                                    : selectedCategory === 'Serology'
                                      ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                              }`}
                            >
                              {allGroupTestsSelected ? 'Deselect All' : 'Select All'}
                            </button>
                          </div>
                        );
                      })}
                    </div>

                    {/* Group tests as cards - Tests are already sorted by backend */}
                    {filteredOrganizedTests[selectedCategory]?.groups?.find(g => g.id === selectedGroupId)?.tests && (() => {
                      let tests = [...filteredOrganizedTests[selectedCategory].groups.find(g => g.id === selectedGroupId).tests];

                      // Tests are already sorted by backend - DO NOT SORT HERE!
                      // Backend provides correct order: 1. Weil-Felix, 2. Widal, 3. HBsAg, 4. HCV, 5. VDRL, then rest

                      // Console log to debug Serology ordering
                      if (selectedCategory === 'Serology' && selectedGroupId) {
                        console.log('🔬 [LabOrdering] Serology Panel Tests Order (from backend):', tests.map(t => ({ code: t.code, name: t.name })));
                      }


                      return (
                        <div className={`grid gap-4 ${selectedCategory === 'Serology' && selectedGroupId
                            ? 'grid-cols-1 md:grid-cols-2' // 2 columns for Serology Panel (side-by-side layout)
                            : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' // 3 columns for others
                          }`}>
                          {tests.map((test) => {
                            const isSelected = selectedTestIds.has(test.id);
                            const isOrdered = isTestOrdered(test.id);

                            return (
                              <div
                                key={test.id}
                                className={`p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 ${isOrdered
                                    ? 'border-gray-300 bg-gray-100 opacity-60 cursor-not-allowed'
                                    : isSelected
                                      ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                                      : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                                  }`}
                                onClick={() => !isOrdered && handleTestSelect(test.id)}
                              >
                                <div className="flex items-start justify-between mb-2">
                                  <div className="flex-1">
                                    <h5 className="text-base font-bold text-gray-900">{test.name}</h5>
                                    {test.description && (
                                      <p className="text-sm text-gray-600 mt-1">{test.description}</p>
                                    )}
                                  </div>
                                  {isSelected && !isOrdered && (
                                    <CheckCircle className="h-5 w-5 text-blue-600 flex-shrink-0 ml-2" />
                                  )}
                                </div>
                                <div className="flex items-center justify-between mt-3">
                                  <span className="text-sm font-semibold text-gray-700">
                                    {test.price ? `${test.price.toFixed(2)} ETB` : 'N/A'}
                                  </span>
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    disabled={isOrdered}
                                    onChange={(e) => {
                                      e.stopPropagation();
                                      handleTestSelect(test.id);
                                    }}
                                    className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                    onClick={(e) => e.stopPropagation()}
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* OLD Category View - REMOVED */}
        {false && Object.entries(filteredOrganizedTests).map(([category, data]) => (
          <div key={category} className="mb-3">
            {/* Category Header - Large button-style */}
            <button
              onClick={() => toggleCategory(category)}
              className={`w-full flex items-center justify-between py-4 px-6 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg ${expandedCategories.has(category)
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-900 border-2 border-gray-300 hover:border-blue-500'
                }`}
            >
              <div className="flex items-center space-x-4">
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${expandedCategories.has(category) ? 'bg-blue-500' : 'bg-gray-100'
                  }`}>
                  <TestTube className={`w-6 h-6 ${expandedCategories.has(category) ? 'text-white' : 'text-gray-600'}`} />
                </div>
                <span className="text-xl font-bold">{category}</span>
                {/* Count badge */}
                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${expandedCategories.has(category)
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 text-gray-700'
                  }`}>
                  {(data.groups?.reduce((sum, g) => sum + (g.tests?.length || 0), 0) || 0) +
                    (data.standalone?.length || 0)} tests
                </span>
              </div>
              <div className="flex items-center space-x-2">
                {expandedCategories.has(category) ? (
                  <>
                    <span className="text-sm font-medium">Hide</span>
                    <ChevronDown className="w-6 h-6" />
                  </>
                ) : (
                  <>
                    <span className="text-sm font-medium">Show</span>
                    <ChevronRight className="w-6 h-6" />
                  </>
                )}
              </div>
            </button>

            {/* Category Content */}
            {expandedCategories.has(category) && (
              <div className="mt-3 ml-2 space-y-3 border-l-4 border-blue-500 pl-4 bg-gray-50 rounded-r-lg p-4">
                {/* For "Standalone Tests" category, show tests directly without groups */}
                {category === 'Standalone Tests' && data.standalone && data.standalone.length > 0 && (
                  <div className="space-y-2">
                    {data.standalone.map((test) => {
                      const isSelected = selectedTestIds.has(test.id);
                      const isOrdered = isTestOrdered(test.id);

                      return (
                        <div
                          key={test.id}
                          className={`p-4 border rounded-lg cursor-pointer transition-all duration-200 ${isOrdered
                              ? 'border-gray-300 bg-gray-100 opacity-60 cursor-not-allowed'
                              : isSelected
                                ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                            }`}
                          onClick={() => !isOrdered && handleTestSelect(test.id)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-3">
                                <TestTube className={`w-6 h-6 ${isOrdered ? 'text-gray-400' : isSelected ? 'text-blue-600' : 'text-gray-500'}`} />
                                <span className={`text-lg font-bold ${isOrdered ? 'text-gray-500' : 'text-gray-900'}`}>
                                  {test.name}
                                </span>
                              </div>
                              {test.description && (
                                <p className="text-sm text-gray-600 mt-1 ml-7">{test.description}</p>
                              )}
                            </div>
                            <div className="flex items-center space-x-3">
                              <span className="text-sm font-semibold text-gray-700">
                                {test.price ? `${test.price.toFixed(2)} ETB` : 'N/A'}
                              </span>
                              <label className="flex items-center cursor-pointer" onClick={(e) => e.stopPropagation()}>
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  disabled={isOrdered}
                                  onChange={(e) => {
                                    e.stopPropagation();
                                    handleTestSelect(test.id);
                                  }}
                                  className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                />
                              </label>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Groups (Panels) - for categories with groups */}
                {category !== 'Standalone Tests' && data.groups && data.groups.map((group) => {
                  const isFullySelected = isPanelFullySelected(group);
                  const isPartiallySelected = isPanelPartiallySelected(group);
                  const isExpanded = expandedGroups.has(group.id);

                  return (
                    <div key={group.id} className="border border-gray-200 rounded-lg bg-white">
                      {/* Panel Header */}
                      <div
                        onClick={() => toggleGroup(group.id)}
                        className="p-3 bg-gray-50 rounded-t-lg cursor-pointer hover:bg-gray-100 transition-colors border-b border-gray-200"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2 flex-1">
                            <div className="flex items-center space-x-2">
                              {isExpanded ? (
                                <ChevronDown className="w-4 h-4 text-gray-600" />
                              ) : (
                                <ChevronRight className="w-4 h-4 text-gray-600" />
                              )}
                              <Package className="w-4 h-4 text-gray-600" />
                              <span className="text-base font-semibold text-gray-900">{group.name}</span>
                              {group.description && (
                                <span className="text-sm text-gray-600 ml-2">({group.description})</span>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center space-x-3" onClick={(e) => e.stopPropagation()}>
                            <span className="text-sm font-medium text-gray-600 bg-gray-200 px-2 py-1 rounded">
                              {group.tests?.length || 0} test(s)
                            </span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handlePanelSelect(group);
                              }}
                              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2 shadow-lg"
                              style={{ fontSize: '16px', fontWeight: 'bold' }}
                            >
                              <input
                                type="checkbox"
                                checked={isFullySelected}
                                ref={(el) => {
                                  if (el) el.indeterminate = isPartiallySelected;
                                }}
                                onChange={(e) => {
                                  e.stopPropagation();
                                  handlePanelSelect(group);
                                }}
                                className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                style={{ pointerEvents: 'none' }}
                              />
                              <span>
                                {isFullySelected ? 'Deselect All' : 'Select All'}
                              </span>
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Panel Children (Tests) */}
                      {isExpanded && group.tests && (
                        <div className="space-y-2">
                          {group.tests.map((test) => {
                            const isSelected = selectedTestIds.has(test.id);
                            const isOrdered = isTestOrdered(test.id);

                            return (
                              <div
                                key={test.id}
                                className={`p-4 border rounded-lg cursor-pointer transition-all duration-200 ${isOrdered
                                    ? 'border-gray-300 bg-gray-100 opacity-60 cursor-not-allowed'
                                    : isSelected
                                      ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                  }`}
                                onClick={() => !isOrdered && handleTestSelect(test.id)}
                              >
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <div className="flex items-center space-x-2">
                                      <h5 className="text-base font-semibold text-gray-900">{test.name}</h5>
                                      {isOrdered && (
                                        <span className="px-2 py-1 text-sm bg-gray-200 text-gray-600 rounded">Already Ordered</span>
                                      )}
                                      {isSelected && !isOrdered && (
                                        <CheckCircle className="h-5 w-5 text-blue-600" />
                                      )}
                                    </div>
                                    {test.description && (
                                      <p className="text-base text-gray-600 mt-1">{test.description}</p>
                                    )}
                                  </div>
                                  <div className="ml-3">
                                    {isSelected ? (
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleTestSelect(test.id);
                                        }}
                                        className="p-1 text-red-600 hover:bg-red-100 rounded"
                                      >
                                        <X className="h-5 w-5" />
                                      </button>
                                    ) : (
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleTestSelect(test.id);
                                        }}
                                        className="p-1 text-blue-600 hover:bg-blue-100 rounded"
                                      >
                                        <Plus className="h-5 w-5" />
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
                  );
                })}

                {/* Standalone Tests - only show for non-Standalone categories */}
                {category !== 'Standalone Tests' && data.standalone && data.standalone.length > 0 && (
                  <div className="space-y-2">
                    {data.standalone.map((test) => {
                      const isSelected = selectedTestIds.has(test.id);
                      const isOrdered = isTestOrdered(test.id);

                      return (
                        <div
                          key={test.id}
                          className={`p-4 border rounded-lg cursor-pointer transition-all duration-200 ${isOrdered
                              ? 'border-gray-300 bg-gray-100 opacity-60 cursor-not-allowed'
                              : isSelected
                                ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                            }`}
                          onClick={() => !isOrdered && handleTestSelect(test.id)}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2">
                                <h5 className="text-base font-semibold text-gray-900">{test.name}</h5>
                                {isOrdered && (
                                  <span className="px-2 py-1 text-sm bg-gray-200 text-gray-600 rounded">Already Ordered</span>
                                )}
                                {isSelected && !isOrdered && (
                                  <CheckCircle className="h-5 w-5 text-blue-600" />
                                )}
                              </div>
                              {test.description && (
                                <p className="text-base text-gray-600 mt-1">{test.description}</p>
                              )}
                            </div>
                            <div className="ml-3">
                              {isSelected ? (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleTestSelect(test.id);
                                  }}
                                  className="p-1 text-red-600 hover:bg-red-100 rounded"
                                >
                                  <X className="h-5 w-5" />
                                </button>
                              ) : (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleTestSelect(test.id);
                                  }}
                                  className="p-1 text-blue-600 hover:bg-blue-100 rounded"
                                >
                                  <Plus className="h-5 w-5" />
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
            )}
          </div>
        ))}
      </div>

      {/* Selected Tests Summary */}
      {selectedTests.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex justify-between items-center mb-3">
            <h4 className="text-lg font-semibold text-blue-900">Selected Lab Tests ({selectedTests.length})</h4>
            <div className="text-xl font-bold text-blue-700 bg-white px-3 py-1 rounded-md border border-blue-200 shadow-sm">
              Total: {calculateTotal().toLocaleString()} ETB
            </div>
          </div>
          <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
            {selectedTests.map((test) => (
              <div key={test.id} className="flex items-center justify-between text-base border-b border-blue-100 pb-1 last:border-0 last:pb-0">
                <div className="flex flex-col">
                  <span className="text-blue-800 font-medium">{test.name}</span>
                  {test.groupName ? (
                    <span className="text-xs text-blue-500">{test.groupName}</span>
                  ) : (
                    <span className="text-xs text-blue-500">{test.category}</span>
                  )}
                </div>
                <span className="text-blue-700 font-semibold">{(test.price || 0).toLocaleString()} ETB</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Instructions */}
      <div>
        <label className="block text-base font-semibold text-gray-700 mb-2">
          Instructions for Lab Tests
        </label>
        <textarea
          value={instructions}
          onChange={(e) => setInstructions(e.target.value)}
          rows="3"
          className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Add specific instructions for the lab tests..."
        />
      </div>

      {/* Submit Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSubmit}
          disabled={selectedTests.length === 0 || loading}
          className="px-8 py-4 text-lg font-bold bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-3 shadow-lg transition-transform active:scale-95"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
              <span>Ordering...</span>
            </>
          ) : (
            <>
              <TestTube className="h-6 w-6" />
              <span>Order {selectedTests.length} Lab Test(s) — Total: {calculateTotal().toLocaleString()} ETB</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default LabOrdering;
