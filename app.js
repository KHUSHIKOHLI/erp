// Main application JavaScript
document.addEventListener('DOMContentLoaded', function() {
  // DOM Elements
  const app = document.getElementById('app');
  const sidebar = document.getElementById('sidebar');
  const sidebarToggle = document.getElementById('sidebar-toggle');
  const contentTitle = document.getElementById('content-title');
  const content = document.getElementById('content');
  const loginContainer = document.getElementById('login-container');
  const loginForm = document.getElementById('login-form');
  const loginError = document.getElementById('login-error');
  const logoutBtn = document.getElementById('logout-btn');
  const modal = document.getElementById('modal');
  const modalTitle = document.getElementById('modal-title');
  const modalContent = document.getElementById('modal-content');
  const modalClose = document.getElementById('modal-close');
  const modalSave = document.getElementById('modal-save');

  // Navigation links
  const dashboardLink = document.querySelector('.dashboard-link');
  const productsLink = document.querySelector('.products-link');
  const customersLink = document.querySelector('.customers-link');
  const ordersLink = document.querySelector('.orders-link');
  const employeesLink = document.querySelector('.employees-link');
  const suppliersLink = document.querySelector('.suppliers-link');
  const productionLink = document.querySelector('.production-link');
  const paymentsLink = document.querySelector('.payments-link');
  const invoicesLink = document.querySelector('.invoices-link');

  // State
  let currentModule = 'dashboard';
  let token = localStorage.getItem('token');
  let user = JSON.parse(localStorage.getItem('user'));
  let modalAction = null;
  let currentRecord = null;

  // Check if user is logged in
  function checkAuth() {
    if (token) {
      loginContainer.classList.add('hidden');
      loadModule(currentModule);
    } else {
      loginContainer.classList.remove('hidden');
    }
  }

  // Login function
  async function login(username, password) {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password })
      });

      const data = await response.json();

      if (data.status === 'success') {
        token = data.token;
        user = data.user;
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        
        loginError.classList.add('hidden');
        loginContainer.classList.add('hidden');
        
        loadModule('dashboard');
      } else {
        loginError.textContent = data.message || 'Invalid username or password';
        loginError.classList.remove('hidden');
      }
    } catch (error) {
      console.error('Login error:', error);
      loginError.textContent = 'An error occurred during login. Please try again.';
      loginError.classList.remove('hidden');
    }
  }

  // Logout function
  function logout() {
    fetch('/api/auth/logout', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    .then(() => {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      token = null;
      user = null;
      loginContainer.classList.remove('hidden');
    })
    .catch(error => {
      console.error('Logout error:', error);
    });
  }

  // Load module content
  async function loadModule(module) {
    if (!token) {
      return;
    }

    currentModule = module;
    setActiveNavItem(module);
    contentTitle.textContent = capitalizeFirstLetter(module);
    showLoading();

    switch (module) {
      case 'dashboard':
        loadDashboard();
        break;
      case 'products':
        loadProducts();
        break;
      case 'customers':
        loadCustomers();
        break;
      case 'orders':
        loadOrders();
        break;
      case 'employees':
        loadEmployees();
        break;
      case 'suppliers':
        loadSuppliers();
        break;
      case 'production':
        loadProduction();
        break;
      case 'payments':
        loadPayments();
        break;
      case 'invoices':
        loadInvoices();
        break;
      default:
        content.innerHTML = `<div class="bg-white rounded-lg shadow p-6">Module not found</div>`;
    }
  }

  // Set active navigation item
  function setActiveNavItem(module) {
    // Remove active class from all nav links
    document.querySelectorAll('nav a').forEach(link => {
      link.classList.remove('nav-active');
    });

    // Add active class to current module link
    const activeLink = document.querySelector(`.${module}-link`);
    if (activeLink) {
      activeLink.classList.add('nav-active');
    }
  }

  // Show loading spinner
  function showLoading() {
    content.innerHTML = `
      <div class="flex items-center justify-center h-64">
        <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    `;
  }

  // Show error message
  function showError(message) {
    content.innerHTML = `
      <div class="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4 mb-4">
        <div class="flex">
          <div class="flex-shrink-0">
            <svg class="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
            </svg>
          </div>
          <div class="ml-3">
            <p class="text-sm font-medium">${message}</p>
          </div>
        </div>
      </div>
    `;
  }

  // Modal functions
  function openModal(title, contentHTML, saveCallback = null) {
    modalTitle.textContent = title;
    modalContent.innerHTML = contentHTML;
    modalAction = saveCallback;
    
    if (saveCallback) {
      modalSave.classList.remove('hidden');
    } else {
      modalSave.classList.add('hidden');
    }
    
    modal.classList.remove('hidden');

    // Initialize any form elements in the modal
    const form = modalContent.querySelector('form');
    if (form) {
      form.addEventListener('submit', function(e) {
        e.preventDefault();
        if (modalAction) {
          modalAction();
        }
      });
    }
  }

  function closeModal() {
    modal.classList.add('hidden');
    modalAction = null;
    currentRecord = null;
  }

  // Fetch API wrapper with auth token
  async function fetchAPI(endpoint, options = {}) {
    if (!token) {
      throw new Error('No authentication token');
    }

    const defaultOptions = {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    };

    const mergedOptions = { ...defaultOptions, ...options };
    
    if (options.body && typeof options.body === 'object') {
      mergedOptions.body = JSON.stringify(options.body);
    }

    try {
      const response = await fetch(`/api/${endpoint}`, mergedOptions);
      
      if (!response.ok) {
        if (response.status === 401) {
          // Token expired or invalid
          logout();
          throw new Error('Authentication expired. Please log in again.');
        }
        
        const errorData = await response.json();
        throw new Error(errorData.message || 'API request failed');
      }
      
      return await response.json();
    } catch (error) {
      console.error(`API Error (${endpoint}):`, error);
      throw error;
    }
  }

  // Dashboard
  async function loadDashboard() {
    try {
      const response = await fetchAPI('dashboard');
      
      if (response.status === 'success') {
        const { data } = response;
        
        let html = `
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-6">
            <!-- Summary Cards -->
            <div class="dashboard-card bg-white rounded-lg shadow p-6 border-l-4 border-primary-500">
              <div class="flex items-center">
                <div class="p-3 rounded-full bg-primary-100 mr-4">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                </div>
                <div>
                  <p class="text-sm text-gray-500 font-medium">Total Orders</p>
                  <p class="text-2xl font-bold text-gray-800">${data.counts.orders}</p>
                </div>
              </div>
            </div>
            
            <div class="dashboard-card bg-white rounded-lg shadow p-6 border-l-4 border-secondary-500">
              <div class="flex items-center">
                <div class="p-3 rounded-full bg-secondary-100 mr-4">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-secondary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <div>
                  <p class="text-sm text-gray-500 font-medium">Customers</p>
                  <p class="text-2xl font-bold text-gray-800">${data.counts.customers}</p>
                </div>
              </div>
            </div>
            
            <div class="dashboard-card bg-white rounded-lg shadow p-6 border-l-4 border-accent-500">
              <div class="flex items-center">
                <div class="p-3 rounded-full bg-accent-100 mr-4">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-accent-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
                <div>
                  <p class="text-sm text-gray-500 font-medium">Products</p>
                  <p class="text-2xl font-bold text-gray-800">${data.counts.products}</p>
                </div>
              </div>
            </div>
            
            <div class="dashboard-card bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
              <div class="flex items-center">
                <div class="p-3 rounded-full bg-green-100 mr-4">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p class="text-sm text-gray-500 font-medium">Total Revenue</p>
                  <p class="text-2xl font-bold text-gray-800">$${formatCurrency(data.revenue)}</p>
                </div>
              </div>
            </div>
          </div>

          <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            <!-- Charts -->
            <div class="bg-white rounded-lg shadow col-span-2">
              <div class="p-4 border-b border-gray-200">
                <h2 class="font-semibold text-lg text-gray-800">Monthly Revenue</h2>
              </div>
              <div class="p-4">
                <canvas id="revenue-chart" height="300"></canvas>
              </div>
            </div>
            
            <div class="bg-white rounded-lg shadow">
              <div class="p-4 border-b border-gray-200">
                <h2 class="font-semibold text-lg text-gray-800">Products by Category</h2>
              </div>
              <div class="p-4">
                <canvas id="category-chart" height="300"></canvas>
              </div>
            </div>
          </div>

          <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <!-- Recent Orders -->
            <div class="bg-white rounded-lg shadow col-span-2">
              <div class="p-4 border-b border-gray-200 flex justify-between items-center">
                <h2 class="font-semibold text-lg text-gray-800">Recent Orders</h2>
                <a href="#" class="text-sm text-primary-600 hover:text-primary-800 orders-link">View All</a>
              </div>
              <div class="p-4 overflow-x-auto">
                <table class="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-gray-200">
        `;

        if (data.recentOrders && data.recentOrders.length > 0) {
          data.recentOrders.forEach(order => {
            html += `
              <tr>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">#${order.order_id}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${order.first_name} ${order.last_name}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${formatDate(order.order_date)}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">$${formatCurrency(order.amount)}</td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                    ${order.status.replace(/['"]+/g, '')}
                  </span>
                </td>
              </tr>
            `;
          });
        } else {
          html += `
            <tr>
              <td colspan="5" class="px-6 py-4 text-center text-sm text-gray-500">No orders found</td>
            </tr>
          `;
        }

        html += `
                  </tbody>
                </table>
              </div>
            </div>
            
            <!-- Low Stock Products -->
            <div class="bg-white rounded-lg shadow">
              <div class="p-4 border-b border-gray-200 flex justify-between items-center">
                <h2 class="font-semibold text-lg text-gray-800">Low Stock Alert</h2>
                <span class="text-sm px-2 py-1 bg-red-100 text-red-800 rounded-full">${data.counts.lowStock} items</span>
              </div>
              <div class="p-4">
                <a href="#" class="products-link block text-center py-3 px-4 bg-primary-50 text-primary-700 rounded-md hover:bg-primary-100 transition-colors">
                  View Low Stock Products
                </a>
              </div>
            </div>
          </div>
        `;

        content.innerHTML = html;

        // Initialize charts
        if (data.monthlyRevenue && data.monthlyRevenue.length > 0) {
          initRevenueChart(data.monthlyRevenue);
        }

        if (data.productsByCategory && data.productsByCategory.length > 0) {
          initCategoryChart(data.productsByCategory);
        }
        
        // Add event listeners for links
        document.querySelectorAll('.orders-link').forEach(link => {
          link.addEventListener('click', function(e) {
            e.preventDefault();
            loadModule('orders');
          });
        });
        
        document.querySelectorAll('.products-link').forEach(link => {
          link.addEventListener('click', function(e) {
            e.preventDefault();
            loadModule('products');
          });
        });
      } else {
        showError('Failed to load dashboard data');
      }
    } catch (error) {
      showError('An error occurred while loading the dashboard');
      console.error('Dashboard loading error:', error);
    }
  }

  // Products
  async function loadProducts() {
    try {
      const response = await fetchAPI('products');
      
      if (response.status === 'success') {
        const { data } = response;
        
        let html = `
          <div class="mb-6 flex flex-col md:flex-row md:items-center md:justify-between">
            <h1 class="text-2xl font-semibold text-gray-800">Products</h1>
            <div class="mt-4 md:mt-0">
              <button id="add-product-btn" class="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors">
                Add New Product
              </button>
            </div>
          </div>

          <div class="bg-white rounded-lg shadow overflow-hidden">
            <div class="p-4 sm:p-6 border-b border-gray-200">
              <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div class="flex items-center">
                  <input type="text" id="product-search" placeholder="Search products..." class="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500">
                  <div class="ml-2">
                    <select id="product-category-filter" class="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500">
                      <option value="">All Categories</option>
                      ${getUniqueCategories(data).map(category => 
                        `<option value="${category}">${category}</option>`
                      ).join('')}
                    </select>
                  </div>
                </div>
                <div class="mt-4 sm:mt-0">
                  <span class="text-sm text-gray-600">Total: ${data.length} products</span>
                </div>
              </div>
            </div>
            <div class="overflow-x-auto">
              <table class="min-w-full divide-y divide-gray-200">
                <thead class="bg-gray-50">
                  <tr>
                    <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                    <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                    <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                    <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                    <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
                    <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody class="bg-white divide-y divide-gray-200" id="products-table-body">
        `;

        if (data && data.length > 0) {
          data.forEach(product => {
            const stockClass = product.stock_quantity < 10 
              ? 'text-red-600 font-medium' 
              : 'text-gray-500';
              
            html += `
              <tr data-product-id="${product.product_id}" class="hover:bg-gray-50">
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${product.product_id}</td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="font-medium text-gray-900">${product.product_name}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${product.category}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">$${formatCurrency(product.price)}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm ${stockClass}">${product.stock_quantity}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button class="text-primary-600 hover:text-primary-900 mr-4 edit-product-btn">Edit</button>
                  <button class="text-red-600 hover:text-red-900 delete-product-btn">Delete</button>
                </td>
              </tr>
            `;
          });
        } else {
          html += `
            <tr>
              <td colspan="6" class="px-6 py-4 text-center text-sm text-gray-500">No products found</td>
            </tr>
          `;
        }

        html += `
                </tbody>
              </table>
            </div>
          </div>
        `;

        content.innerHTML = html;

        // Add event listeners
        document.getElementById('add-product-btn').addEventListener('click', showAddProductModal);
        
        document.querySelectorAll('.edit-product-btn').forEach(btn => {
          btn.addEventListener('click', function() {
            const productId = this.closest('tr').getAttribute('data-product-id');
            showEditProductModal(productId);
          });
        });
        
        document.querySelectorAll('.delete-product-btn').forEach(btn => {
          btn.addEventListener('click', function() {
            const productId = this.closest('tr').getAttribute('data-product-id');
            showDeleteProductModal(productId);
          });
        });
        
        // Search functionality
        document.getElementById('product-search').addEventListener('input', function() {
          filterProducts();
        });
        
        // Category filter
        document.getElementById('product-category-filter').addEventListener('change', function() {
          filterProducts();
        });
      } else {
        showError('Failed to load products data');
      }
    } catch (error) {
      showError('An error occurred while loading products');
      console.error('Products loading error:', error);
    }
  }

  // Customers
  async function loadCustomers() {
    try {
      const response = await fetchAPI('customers');
      
      if (response.status === 'success') {
        const { data } = response;
        
        let html = `
          <div class="mb-6 flex flex-col md:flex-row md:items-center md:justify-between">
            <h1 class="text-2xl font-semibold text-gray-800">Customers</h1>
            <div class="mt-4 md:mt-0">
              <button id="add-customer-btn" class="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors">
                Add New Customer
              </button>
            </div>
          </div>

          <div class="bg-white rounded-lg shadow overflow-hidden">
            <div class="p-4 sm:p-6 border-b border-gray-200">
              <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div class="flex items-center">
                  <input type="text" id="customer-search" placeholder="Search customers..." class="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500">
                </div>
                <div class="mt-4 sm:mt-0">
                  <span class="text-sm text-gray-600">Total: ${data.length} customers</span>
                </div>
              </div>
            </div>
            <div class="overflow-x-auto">
              <table class="min-w-full divide-y divide-gray-200">
                <thead class="bg-gray-50">
                  <tr>
                    <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                    <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                    <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                    <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody class="bg-white divide-y divide-gray-200" id="customers-table-body">
        `;

        if (data && data.length > 0) {
          data.forEach(customer => {
            html += `
              <tr data-customer-id="${customer.customer_id}" class="hover:bg-gray-50">
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${customer.customer_id}</td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="font-medium text-gray-900">${customer.first_name} ${customer.last_name}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${customer.email}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${customer.phone}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button class="text-primary-600 hover:text-primary-900 mr-2 view-orders-btn">Orders</button>
                  <button class="text-primary-600 hover:text-primary-900 mr-2 edit-customer-btn">Edit</button>
                  <button class="text-red-600 hover:text-red-900 delete-customer-btn">Delete</button>
                </td>
              </tr>
            `;
          });
        } else {
          html += `
            <tr>
              <td colspan="5" class="px-6 py-4 text-center text-sm text-gray-500">No customers found</td>
            </tr>
          `;
        }

        html += `
                </tbody>
              </table>
            </div>
          </div>
        `;

        content.innerHTML = html;

        // Add event listeners
        document.getElementById('add-customer-btn').addEventListener('click', showAddCustomerModal);
        
        document.querySelectorAll('.view-orders-btn').forEach(btn => {
          btn.addEventListener('click', function() {
            const customerId = this.closest('tr').getAttribute('data-customer-id');
            showCustomerOrdersModal(customerId);
          });
        });
        
        document.querySelectorAll('.edit-customer-btn').forEach(btn => {
          btn.addEventListener('click', function() {
            const customerId = this.closest('tr').getAttribute('data-customer-id');
            showEditCustomerModal(customerId);
          });
        });
        
        document.querySelectorAll('.delete-customer-btn').forEach(btn => {
          btn.addEventListener('click', function() {
            const customerId = this.closest('tr').getAttribute('data-customer-id');
            showDeleteCustomerModal(customerId);
          });
        });
        
        // Search functionality
        document.getElementById('customer-search').addEventListener('input', function() {
          filterCustomers();
        });
      } else {
        showError('Failed to load customers data');
      }
    } catch (error) {
      showError('An error occurred while loading customers');
      console.error('Customers loading error:', error);
    }
  }

  // Orders
  async function loadOrders() {
    try {
      const response = await fetchAPI('orders');
      
      if (response.status === 'success') {
        const { data } = response;
        
        let html = `
          <div class="mb-6 flex flex-col md:flex-row md:items-center md:justify-between">
            <h1 class="text-2xl font-semibold text-gray-800">Orders</h1>
            <div class="mt-4 md:mt-0">
              <button id="add-order-btn" class="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors">
                Create New Order
              </button>
            </div>
          </div>

          <div class="bg-white rounded-lg shadow overflow-hidden">
            <div class="p-4 sm:p-6 border-b border-gray-200">
              <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div class="flex items-center">
                  <input type="text" id="order-search" placeholder="Search orders..." class="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500">
                  <div class="ml-2">
                    <select id="order-status-filter" class="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500">
                      <option value="">All Statuses</option>
                      <option value="Pending">Pending</option>
                      <option value="Processing">Processing</option>
                      <option value="Shipped">Shipped</option>
                      <option value="Delivered">Delivered</option>
                      <option value="Canceled">Canceled</option>
                    </select>
                  </div>
                </div>
                <div class="mt-4 sm:mt-0">
                  <span class="text-sm text-gray-600">Total: ${data.length} orders</span>
                </div>
              </div>
            </div>
            <div class="overflow-x-auto">
              <table class="min-w-full divide-y divide-gray-200">
                <thead class="bg-gray-50">
                  <tr>
                    <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
                    <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                    <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                    <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Items</th>
                    <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody class="bg-white divide-y divide-gray-200" id="orders-table-body">
        `;

        if (data && data.length > 0) {
          data.forEach(order => {
            const status = order.status.replace(/['"]+/g, '');
            const statusClass = getStatusClass(status);
            
            html += `
              <tr data-order-id="${order.order_id}" class="hover:bg-gray-50">
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">#${order.order_id}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${order.first_name} ${order.last_name}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${formatDate(order.order_date)}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">$${formatCurrency(order.amount)}</td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span class="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${statusClass}">
                    ${status}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${order.item_count}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button class="text-primary-600 hover:text-primary-900 mr-2 view-order-btn">View</button>
                  <button class="text-red-600 hover:text-red-900 delete-order-btn">Delete</button>
                </td>
              </tr>
            `;
          });
        } else {
          html += `
            <tr>
              <td colspan="7" class="px-6 py-4 text-center text-sm text-gray-500">No orders found</td>
            </tr>
          `;
        }

        html += `
                </tbody>
              </table>
            </div>
          </div>
        `;

        content.innerHTML = html;

        // Add event listeners
        document.getElementById('add-order-btn').addEventListener('click', showAddOrderModal);
        
        document.querySelectorAll('.view-order-btn').forEach(btn => {
          btn.addEventListener('click', function() {
            const orderId = this.closest('tr').getAttribute('data-order-id');
            showViewOrderModal(orderId);
          });
        });
        
        document.querySelectorAll('.delete-order-btn').forEach(btn => {
          btn.addEventListener('click', function() {
            const orderId = this.closest('tr').getAttribute('data-order-id');
            showDeleteOrderModal(orderId);
          });
        });
        
        // Search functionality
        document.getElementById('order-search').addEventListener('input', function() {
          filterOrders();
        });
        
        // Status filter
        document.getElementById('order-status-filter').addEventListener('change', function() {
          filterOrders();
        });
      } else {
        showError('Failed to load orders data');
      }
    } catch (error) {
      showError('An error occurred while loading orders');
      console.error('Orders loading error:', error);
    }
  }

  // Employees
  async function loadEmployees() {
    try {
      const response = await fetchAPI('employees');
      
      if (response.status === 'success') {
        const { data } = response;
        
        let html = `
          <div class="mb-6 flex flex-col md:flex-row md:items-center md:justify-between">
            <h1 class="text-2xl font-semibold text-gray-800">Employees</h1>
            <div class="mt-4 md:mt-0">
              <button id="add-employee-btn" class="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors">
                Add New Employee
              </button>
            </div>
          </div>

          <div class="bg-white rounded-lg shadow overflow-hidden">
            <div class="p-4 sm:p-6 border-b border-gray-200">
              <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div class="flex items-center">
                  <input type="text" id="employee-search" placeholder="Search employees..." class="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500">
                  <div class="ml-2">
                    <select id="department-filter" class="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500">
                      <option value="">All Departments</option>
                      ${getUniqueDepartments(data).map(dept => 
                        `<option value="${dept}">${dept}</option>`
                      ).join('')}
                    </select>
                  </div>
                </div>
                <div class="mt-4 sm:mt-0">
                  <span class="text-sm text-gray-600">Total: ${data.length} employees</span>
                </div>
              </div>
            </div>
            <div class="overflow-x-auto">
              <table class="min-w-full divide-y divide-gray-200">
                <thead class="bg-gray-50">
                  <tr>
                    <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                    <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                    <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Salary</th>
                    <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hire Date</th>
                    <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody class="bg-white divide-y divide-gray-200" id="employees-table-body">
        `;

        if (data && data.length > 0) {
          data.forEach(employee => {
            html += `
              <tr data-employee-id="${employee.employee_id}" class="hover:bg-gray-50">
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${employee.employee_id}</td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="font-medium text-gray-900">${employee.first_name} ${employee.last_name}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${employee.department}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">$${formatCurrency(employee.salaray)}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${formatDate(employee.hire_data)}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button class="text-primary-600 hover:text-primary-900 mr-2 edit-employee-btn">Edit</button>
                  <button class="text-red-600 hover:text-red-900 delete-employee-btn">Delete</button>
                </td>
              </tr>
            `;
          });
        } else {
          html += `
            <tr>
              <td colspan="6" class="px-6 py-4 text-center text-sm text-gray-500">No employees found</td>
            </tr>
          `;
        }

        html += `
                </tbody>
              </table>
            </div>
          </div>
        `;

        content.innerHTML = html;

        // Add event listeners
        document.getElementById('add-employee-btn').addEventListener('click', showAddEmployeeModal);
        
        document.querySelectorAll('.edit-employee-btn').forEach(btn => {
          btn.addEventListener('click', function() {
            const employeeId = this.closest('tr').getAttribute('data-employee-id');
            showEditEmployeeModal(employeeId);
          });
        });
        
        document.querySelectorAll('.delete-employee-btn').forEach(btn => {
          btn.addEventListener('click', function() {
            const employeeId = this.closest('tr').getAttribute('data-employee-id');
            showDeleteEmployeeModal(employeeId);
          });
        });
        
        // Search functionality
        document.getElementById('employee-search').addEventListener('input', function() {
          filterEmployees();
        });
        
        // Department filter
        document.getElementById('department-filter').addEventListener('change', function() {
          filterEmployees();
        });
      } else {
        showError('Failed to load employees data');
      }
    } catch (error) {
      showError('An error occurred while loading employees');
      console.error('Employees loading error:', error);
    }
  }

  // Suppliers
  async function loadSuppliers() {
    try {
      const response = await fetchAPI('suppliers');
      
      if (response.status === 'success') {
        const { data } = response;
        
        let html = `
          <div class="mb-6 flex flex-col md:flex-row md:items-center md:justify-between">
            <h1 class="text-2xl font-semibold text-gray-800">Suppliers</h1>
            <div class="mt-4 md:mt-0">
              <button id="add-supplier-btn" class="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors">
                Add New Supplier
              </button>
            </div>
          </div>

          <div class="bg-white rounded-lg shadow overflow-hidden">
            <div class="p-4 sm:p-6 border-b border-gray-200">
              <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div class="flex items-center">
                  <input type="text" id="supplier-search" placeholder="Search suppliers..." class="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500">
                </div>
                <div class="mt-4 sm:mt-0">
                  <span class="text-sm text-gray-600">Total: ${data.length} suppliers</span>
                </div>
              </div>
            </div>
            <div class="overflow-x-auto">
              <table class="min-w-full divide-y divide-gray-200">
                <thead class="bg-gray-50">
                  <tr>
                    <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                    <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Supplier Name</th>
                    <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact Name</th>
                    <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                    <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                    <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody class="bg-white divide-y divide-gray-200" id="suppliers-table-body">
        `;

        if (data && data.length > 0) {
          data.forEach(supplier => {
            html += `
              <tr data-supplier-id="${supplier.supplier_id}" class="hover:bg-gray-50">
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${supplier.supplier_id}</td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="font-medium text-gray-900">${supplier.supplier_name}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${supplier.contact_name}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${supplier.email}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${supplier.phone}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button class="text-primary-600 hover:text-primary-900 mr-2 edit-supplier-btn">Edit</button>
                  <button class="text-red-600 hover:text-red-900 delete-supplier-btn">Delete</button>
                </td>
              </tr>
            `;
          });
        } else {
          html += `
            <tr>
              <td colspan="6" class="px-6 py-4 text-center text-sm text-gray-500">No suppliers found</td>
            </tr>
          `;
        }

        html += `
                </tbody>
              </table>
            </div>
          </div>
        `;

        content.innerHTML = html;

        // Add event listeners
        document.getElementById('add-supplier-btn').addEventListener('click', showAddSupplierModal);
        
        document.querySelectorAll('.edit-supplier-btn').forEach(btn => {
          btn.addEventListener('click', function() {
            const supplierId = this.closest('tr').getAttribute('data-supplier-id');
            showEditSupplierModal(supplierId);
          });
        });
        
        document.querySelectorAll('.delete-supplier-btn').forEach(btn => {
          btn.addEventListener('click', function() {
            const supplierId = this.closest('tr').getAttribute('data-supplier-id');
            showDeleteSupplierModal(supplierId);
          });
        });
        
        // Search functionality
        document.getElementById('supplier-search').addEventListener('input', function() {
          filterSuppliers();
        });
      } else {
        showError('Failed to load suppliers data');
      }
    } catch (error) {
      showError('An error occurred while loading suppliers');
      console.error('Suppliers loading error:', error);
    }
  }

  // Production
  async function loadProduction() {
    try {
      const response = await fetchAPI('production');
      
      if (response.status === 'success') {
        const { data } = response;
        
        let html = `
          <div class="mb-6 flex flex-col md:flex-row md:items-center md:justify-between">
            <h1 class="text-2xl font-semibold text-gray-800">Production</h1>
            <div class="mt-4 md:mt-0">
              <button id="add-production-btn" class="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors">
                Add New Production
              </button>
            </div>
          </div>

          <div class="bg-white rounded-lg shadow overflow-hidden">
            <div class="p-4 sm:p-6 border-b border-gray-200">
              <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div class="flex items-center">
                  <input type="text" id="production-search" placeholder="Search by product..." class="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500">
                  <div class="ml-2">
                    <select id="production-status-filter" class="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500">
                      <option value="">All Statuses</option>
                      <option value="Pending">Pending</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Completed">Completed</option>
                    </select>
                  </div>
                </div>
                <div class="mt-4 sm:mt-0">
                  <span class="text-sm text-gray-600">Total: ${data.length} production records</span>
                </div>
              </div>
            </div>
            <div class="overflow-x-auto">
              <table class="min-w-full divide-y divide-gray-200">
                <thead class="bg-gray-50">
                  <tr>
                    <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                    <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                    <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                    <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                    <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody class="bg-white divide-y divide-gray-200" id="production-table-body">
        `;

        if (data && data.length > 0) {
          data.forEach(prod => {
            const statusClass = getProductionStatusClass(prod.status);
            
            html += `
              <tr data-production-id="${prod.production_id}" class="hover:bg-gray-50">
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${prod.production_id}</td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="font-medium text-gray-900">${prod.product_name}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${prod.category}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${formatDate(prod.production_date)}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${prod.quantity_produced}</td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span class="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${statusClass}">
                    ${prod.status}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button class="text-primary-600 hover:text-primary-900 mr-2 edit-production-btn">Edit</button>
                  <button class="text-red-600 hover:text-red-900 delete-production-btn">Delete</button>
                </td>
              </tr>
            `;
          });
        } else {
          html += `
            <tr>
              <td colspan="7" class="px-6 py-4 text-center text-sm text-gray-500">No production records found</td>
            </tr>
          `;
        }

        html += `
                </tbody>
              </table>
            </div>
          </div>
        `;

        content.innerHTML = html;

        // Add event listeners
        document.getElementById('add-production-btn').addEventListener('click', showAddProductionModal);
        
        document.querySelectorAll('.edit-production-btn').forEach(btn => {
          btn.addEventListener('click', function() {
            const productionId = this.closest('tr').getAttribute('data-production-id');
            showEditProductionModal(productionId);
          });
        });
        
        document.querySelectorAll('.delete-production-btn').forEach(btn => {
          btn.addEventListener('click', function() {
            const productionId = this.closest('tr').getAttribute('data-production-id');
            showDeleteProductionModal(productionId);
          });
        });
        
        // Search functionality
        document.getElementById('production-search').addEventListener('input', function() {
          filterProduction();
        });
        
        // Status filter
        document.getElementById('production-status-filter').addEventListener('change', function() {
          filterProduction();
        });
      } else {
        showError('Failed to load production data');
      }
    } catch (error) {
      showError('An error occurred while loading production data');
      console.error('Production loading error:', error);
    }
  }

  // Payments
  async function loadPayments() {
    try {
      const response = await fetchAPI('payments');
      
      if (response.status === 'success') {
        const { data } = response;
        
        let html = `
          <div class="mb-6 flex flex-col md:flex-row md:items-center md:justify-between">
            <h1 class="text-2xl font-semibold text-gray-800">Payments</h1>
            <div class="mt-4 md:mt-0">
              <button id="add-payment-btn" class="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors">
                Record New Payment
              </button>
            </div>
          </div>

          <div class="bg-white rounded-lg shadow overflow-hidden">
            <div class="p-4 sm:p-6 border-b border-gray-200">
              <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div class="flex items-center">
                  <input type="text" id="payment-search" placeholder="Search payments..." class="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500">
                  <div class="ml-2">
                    <select id="payment-method-filter" class="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500">
                      <option value="">All Payment Methods</option>
                      <option value="Credit Card">Credit Card</option>
                      <option value="Debit Card">Debit Card</option>
                      <option value="PayPal">PayPal</option>
                      <option value="Bank Transfer">Bank Transfer</option>
                      <option value="Cash">Cash</option>
                    </select>
                  </div>
                </div>
                <div class="mt-4 sm:mt-0">
                  <span class="text-sm text-gray-600">Total: ${data.length} payments</span>
                </div>
              </div>
            </div>
            <div class="overflow-x-auto">
              <table class="min-w-full divide-y divide-gray-200">
                <thead class="bg-gray-50">
                  <tr>
                    <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                    <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
                    <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                    <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                    <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Method</th>
                    <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody class="bg-white divide-y divide-gray-200" id="payments-table-body">
        `;

        if (data && data.length > 0) {
          data.forEach(payment => {
            html += `
              <tr data-payment-id="${payment.payment_id}" class="hover:bg-gray-50">
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${payment.payment_id}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-primary-600 cursor-pointer view-order-btn" data-order-id="${payment.order_id}">
                  #${payment.order_id}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${payment.first_name} ${payment.last_name}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${formatDate(payment.payment_date)}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">$${formatCurrency(payment.amount)}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${payment.payment_method}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button class="text-primary-600 hover:text-primary-900 mr-2 edit-payment-btn">Edit</button>
                  <button class="text-red-600 hover:text-red-900 delete-payment-btn">Delete</button>
                </td>
              </tr>
            `;
          });
        } else {
          html += `
            <tr>
              <td colspan="7" class="px-6 py-4 text-center text-sm text-gray-500">No payments found</td>
            </tr>
          `;
        }

        html += `
                </tbody>
              </table>
            </div>
          </div>
        `;

        content.innerHTML = html;

        // Add event listeners
        document.getElementById('add-payment-btn').addEventListener('click', showAddPaymentModal);
        
        document.querySelectorAll('.view-order-btn').forEach(btn => {
          btn.addEventListener('click', function() {
            const orderId = this.getAttribute('data-order-id');
            showViewOrderModal(orderId);
          });
        });
        
        document.querySelectorAll('.edit-payment-btn').forEach(btn => {
          btn.addEventListener('click', function() {
            const paymentId = this.closest('tr').getAttribute('data-payment-id');
            showEditPaymentModal(paymentId);
          });
        });
        
        document.querySelectorAll('.delete-payment-btn').forEach(btn => {
          btn.addEventListener('click', function() {
            const paymentId = this.closest('tr').getAttribute('data-payment-id');
            showDeletePaymentModal(paymentId);
          });
        });
        
        // Search functionality
        document.getElementById('payment-search').addEventListener('input', function() {
          filterPayments();
        });
        
        // Payment method filter
        document.getElementById('payment-method-filter').addEventListener('change', function() {
          filterPayments();
        });
      } else {
        showError('Failed to load payments data');
      }
    } catch (error) {
      showError('An error occurred while loading payments');
      console.error('Payments loading error:', error);
    }
  }

  // Invoices
  async function loadInvoices() {
    try {
      const response = await fetchAPI('invoices');
      
      if (response.status === 'success') {
        const { data } = response;
        
        let html = `
          <div class="mb-6 flex flex-col md:flex-row md:items-center md:justify-between">
            <h1 class="text-2xl font-semibold text-gray-800">Invoices</h1>
            <div class="mt-4 md:mt-0">
              <button id="generate-invoice-btn" class="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors">
                Generate New Invoice
              </button>
            </div>
          </div>

          <div class="bg-white rounded-lg shadow overflow-hidden">
            <div class="p-4 sm:p-6 border-b border-gray-200">
              <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div class="flex items-center">
                  <input type="text" id="invoice-search" placeholder="Search invoices..." class="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500">
                  <div class="ml-2">
                    <select id="invoice-status-filter" class="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500">
                      <option value="">All Statuses</option>
                      <option value="generated">Generated</option>
                      <option value="paid">Paid</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                </div>
                <div class="mt-4 sm:mt-0">
                  <span class="text-sm text-gray-600">Total: ${data.length} invoices</span>
                </div>
              </div>
            </div>
            <div class="overflow-x-auto">
              <table class="min-w-full divide-y divide-gray-200">
                <thead class="bg-gray-50">
                  <tr>
                    <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Invoice ID</th>
                    <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
                    <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                    <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                    <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody class="bg-white divide-y divide-gray-200" id="invoices-table-body">
        `;

        if (data && data.length > 0) {
          data.forEach(invoice => {
            const statusClass = getInvoiceStatusClass(invoice.status);
            
            html += `
              <tr data-invoice-id="${invoice.invoice_id}" class="hover:bg-gray-50">
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">#INV-${invoice.invoice_id}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-primary-600 cursor-pointer view-order-btn" data-order-id="${invoice.order_id}">
                  #${invoice.order_id}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${invoice.first_name} ${invoice.last_name}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${formatDate(invoice.invoice_date)}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">$${formatCurrency(invoice.amount)}</td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span class="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${statusClass}">
                    ${invoice.status}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button class="text-primary-600 hover:text-primary-900 mr-2 view-invoice-btn">View</button>
                  <button class="text-primary-600 hover:text-primary-900 mr-2 update-status-btn">Update Status</button>
                  <button class="text-red-600 hover:text-red-900 delete-invoice-btn">Delete</button>
                </td>
              </tr>
            `;
          });
        } else {
          html += `
            <tr>
              <td colspan="7" class="px-6 py-4 text-center text-sm text-gray-500">No invoices found</td>
            </tr>
          `;
        }

        html += `
                </tbody>
              </table>
            </div>
          </div>
        `;

        content.innerHTML = html;

        // Add event listeners
        document.getElementById('generate-invoice-btn').addEventListener('click', showGenerateInvoiceModal);
        
        document.querySelectorAll('.view-order-btn').forEach(btn => {
          btn.addEventListener('click', function() {
            const orderId = this.getAttribute('data-order-id');
            showViewOrderModal(orderId);
          });
        });
        
        document.querySelectorAll('.view-invoice-btn').forEach(btn => {
          btn.addEventListener('click', function() {
            const invoiceId = this.closest('tr').getAttribute('data-invoice-id');
            showViewInvoiceModal(invoiceId);
          });
        });
        
        document.querySelectorAll('.update-status-btn').forEach(btn => {
          btn.addEventListener('click', function() {
            const invoiceId = this.closest('tr').getAttribute('data-invoice-id');
            showUpdateInvoiceStatusModal(invoiceId);
          });
        });
        
        document.querySelectorAll('.delete-invoice-btn').forEach(btn => {
          btn.addEventListener('click', function() {
            const invoiceId = this.closest('tr').getAttribute('data-invoice-id');
            showDeleteInvoiceModal(invoiceId);
          });
        });
        
        // Search functionality
        document.getElementById('invoice-search').addEventListener('input', function() {
          filterInvoices();
        });
        
        // Status filter
        document.getElementById('invoice-status-filter').addEventListener('change', function() {
          filterInvoices();
        });
      } else {
        showError('Failed to load invoices data');
      }
    } catch (error) {
      showError('An error occurred while loading invoices');
      console.error('Invoices loading error:', error);
    }
  }

  // Module-specific functions
  
  // Products functions
  function showAddProductModal() {
    const modalHTML = `
      <form id="add-product-form" class="space-y-4">
        <div class="form-group">
          <label for="product-name" class="form-label">Product Name</label>
          <input type="text" id="product-name" class="form-input" required>
        </div>
        <div class="form-group">
          <label for="product-category" class="form-label">Category</label>
          <input type="text" id="product-category" class="form-input" required>
        </div>
        <div class="form-group">
          <label for="product-price" class="form-label">Price</label>
          <input type="number" id="product-price" class="form-input" min="0" step="0.01" required>
        </div>
        <div class="form-group">
          <label for="product-stock" class="form-label">Stock Quantity</label>
          <input type="number" id="product-stock" class="form-input" min="0" required>
        </div>
      </form>
    `;

    openModal('Add New Product', modalHTML, addProduct);
  }

  async function addProduct() {
    try {
      const productName = document.getElementById('product-name').value;
      const category = document.getElementById('product-category').value;
      const price = document.getElementById('product-price').value;
      const stockQuantity = document.getElementById('product-stock').value;

      const productData = {
        product_name: productName,
        category,
        price: parseFloat(price),
        stock_quantity: parseInt(stockQuantity)
      };

      const response = await fetchAPI('products', {
        method: 'POST',
        body: productData
      });

      if (response.status === 'success') {
        closeModal();
        loadModule('products');
      } else {
        alert('Failed to add product: ' + response.message);
      }
    } catch (error) {
      console.error('Add product error:', error);
      alert('An error occurred while adding the product');
    }
  }

  async function showEditProductModal(productId) {
    try {
      const response = await fetchAPI(`products/${productId}`);
      
      if (response.status === 'success') {
        const product = response.data;
        
        const modalHTML = `
          <form id="edit-product-form" class="space-y-4">
            <div class="form-group">
              <label for="product-name" class="form-label">Product Name</label>
              <input type="text" id="product-name" class="form-input" value="${product.product_name}" required>
            </div>
            <div class="form-group">
              <label for="product-category" class="form-label">Category</label>
              <input type="text" id="product-category" class="form-input" value="${product.category}" required>
            </div>
            <div class="form-group">
              <label for="product-price" class="form-label">Price</label>
              <input type="number" id="product-price" class="form-input" min="0" step="0.01" value="${product.price}" required>
            </div>
            <div class="form-group">
              <label for="product-stock" class="form-label">Stock Quantity</label>
              <input type="number" id="product-stock" class="form-input" min="0" value="${product.stock_quantity}" required>
            </div>
          </form>
        `;

        currentRecord = product;
        openModal('Edit Product', modalHTML, () => updateProduct(productId));
      } else {
        alert('Failed to load product details: ' + response.message);
      }
    } catch (error) {
      console.error('Error loading product details:', error);
      alert('An error occurred while loading product details');
    }
  }

  async function updateProduct(productId) {
    try {
      const productName = document.getElementById('product-name').value;
      const category = document.getElementById('product-category').value;
      const price = document.getElementById('product-price').value;
      const stockQuantity = document.getElementById('product-stock').value;

      const productData = {
        product_name: productName,
        category,
        price: parseFloat(price),
        stock_quantity: parseInt(stockQuantity)
      };

      const response = await fetchAPI(`products/${productId}`, {
        method: 'PUT',
        body: productData
      });

      if (response.status === 'success') {
        closeModal();
        loadModule('products');
      } else {
        alert('Failed to update product: ' + response.message);
      }
    } catch (error) {
      console.error('Update product error:', error);
      alert('An error occurred while updating the product');
    }
  }

  function showDeleteProductModal(productId) {
    const modalHTML = `
      <div class="text-center">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 text-red-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <p class="text-lg font-semibold mb-2">Are you sure you want to delete this product?</p>
        <p class="text-gray-600 mb-6">This action cannot be undone.</p>
      </div>
    `;

    openModal('Delete Product', modalHTML, () => deleteProduct(productId));
  }

  async function deleteProduct(productId) {
    try {
      const response = await fetchAPI(`products/${productId}`, {
        method: 'DELETE'
      });

      if (response.status === 'success') {
        closeModal();
        loadModule('products');
      } else {
        alert('Failed to delete product: ' + response.message);
      }
    } catch (error) {
      console.error('Delete product error:', error);
      alert('An error occurred while deleting the product');
    }
  }

  function filterProducts() {
    const searchTerm = document.getElementById('product-search').value.toLowerCase();
    const categoryFilter = document.getElementById('product-category-filter').value.toLowerCase();
    const tableRows = document.querySelectorAll('#products-table-body tr');
    
    tableRows.forEach(row => {
      const productName = row.querySelector('td:nth-child(2) div').textContent.toLowerCase();
      const category = row.querySelector('td:nth-child(3)').textContent.toLowerCase();
      
      const matchesSearch = productName.includes(searchTerm);
      const matchesCategory = !categoryFilter || category === categoryFilter;
      
      if (matchesSearch && matchesCategory) {
        row.style.display = '';
      } else {
        row.style.display = 'none';
      }
    });
  }

  // Customers functions
  function showAddCustomerModal() {
    const modalHTML = `
      <form id="add-customer-form" class="space-y-4">
        <div class="form-group">
          <label for="first-name" class="form-label">First Name</label>
          <input type="text" id="first-name" class="form-input" required>
        </div>
        <div class="form-group">
          <label for="last-name" class="form-label">Last Name</label>
          <input type="text" id="last-name" class="form-input" required>
        </div>
        <div class="form-group">
          <label for="email" class="form-label">Email</label>
          <input type="email" id="email" class="form-input" required>
        </div>
        <div class="form-group">
          <label for="phone" class="form-label">Phone</label>
          <input type="tel" id="phone" class="form-input" required>
        </div>
      </form>
    `;

    openModal('Add New Customer', modalHTML, addCustomer);
  }

  async function addCustomer() {
    try {
      const firstName = document.getElementById('first-name').value;
      const lastName = document.getElementById('last-name').value;
      const email = document.getElementById('email').value;
      const phone = document.getElementById('phone').value;

      const customerData = {
        first_name: firstName,
        last_name: lastName,
        email,
        phone
      };

      const response = await fetchAPI('customers', {
        method: 'POST',
        body: customerData
      });

      if (response.status === 'success') {
        closeModal();
        loadModule('customers');
      } else {
        alert('Failed to add customer: ' + response.message);
      }
    } catch (error) {
      console.error('Add customer error:', error);
      alert('An error occurred while adding the customer');
    }
  }

  async function showEditCustomerModal(customerId) {
    try {
      const response = await fetchAPI(`customers/${customerId}`);
      
      if (response.status === 'success') {
        const customer = response.data;
        
        const modalHTML = `
          <form id="edit-customer-form" class="space-y-4">
            <div class="form-group">
              <label for="first-name" class="form-label">First Name</label>
              <input type="text" id="first-name" class="form-input" value="${customer.first_name}" required>
            </div>
            <div class="form-group">
              <label for="last-name" class="form-label">Last Name</label>
              <input type="text" id="last-name" class="form-input" value="${customer.last_name}" required>
            </div>
            <div class="form-group">
              <label for="email" class="form-label">Email</label>
              <input type="email" id="email" class="form-input" value="${customer.email}" required>
            </div>
            <div class="form-group">
              <label for="phone" class="form-label">Phone</label>
              <input type="tel" id="phone" class="form-input" value="${customer.phone}" required>
            </div>
          </form>
        `;

        currentRecord = customer;
        openModal('Edit Customer', modalHTML, () => updateCustomer(customerId));
      } else {
        alert('Failed to load customer details: ' + response.message);
      }
    } catch (error) {
      console.error('Error loading customer details:', error);
      alert('An error occurred while loading customer details');
    }
  }

  async function updateCustomer(customerId) {
    try {
      const firstName = document.getElementById('first-name').value;
      const lastName = document.getElementById('last-name').value;
      const email = document.getElementById('email').value;
      const phone = document.getElementById('phone').value;

      const customerData = {
        first_name: firstName,
        last_name: lastName,
        email,
        phone
      };

      const response = await fetchAPI(`customers/${customerId}`, {
        method: 'PUT',
        body: customerData
      });

      if (response.status === 'success') {
        closeModal();
        loadModule('customers');
      } else {
        alert('Failed to update customer: ' + response.message);
      }
    } catch (error) {
      console.error('Update customer error:', error);
      alert('An error occurred while updating the customer');
    }
  }

  async function showCustomerOrdersModal(customerId) {
    try {
      const customerResponse = await fetchAPI(`customers/${customerId}`);
      const ordersResponse = await fetchAPI(`customers/${customerId}/orders`);
      
      if (customerResponse.status === 'success' && ordersResponse.status === 'success') {
        const customer = customerResponse.data;
        const orders = ordersResponse.data;
        
        let ordersHTML = '';
        
        if (orders.length > 0) {
          ordersHTML = `
            <table class="min-w-full divide-y divide-gray-200 mt-4">
              <thead class="bg-gray-50">
                <tr>
                  <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
                  <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                  <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
          `;
          
          orders.forEach(order => {
            const status = order.status.replace(/['"]+/g, '');
            const statusClass = getStatusClass(status);
            
            ordersHTML += `
              <tr>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">#${order.order_id}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${formatDate(order.order_date)}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">$${formatCurrency(order.amount)}</td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span class="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${statusClass}">
                    ${status}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button class="text-primary-600 hover:text-primary-900 view-customer-order-btn" data-order-id="${order.order_id}">View</button>
                </td>
              </tr>
            `;
          });
          
          ordersHTML += `
              </tbody>
            </table>
          `;
        } else {
          ordersHTML = `
            <div class="text-center py-4 text-gray-600">
              No orders found for this customer.
            </div>
          `;
        }
        
        const modalHTML = `
          <div>
            <div class="bg-gray-50 p-4 rounded-md mb-4">
              <h3 class="text-lg font-medium text-gray-900 mb-2">${customer.first_name} ${customer.last_name}</h3>
              <p class="text-sm text-gray-600"><strong>Email:</strong> ${customer.email}</p>
              <p class="text-sm text-gray-600"><strong>Phone:</strong> ${customer.phone}</p>
            </div>
            
            <h3 class="text-lg font-medium text-gray-900 mb-2">Orders</h3>
            ${ordersHTML}
          </div>
        `;

        openModal(`Customer Orders`, modalHTML);
        
        // Add event listeners for view order buttons
        document.querySelectorAll('.view-customer-order-btn').forEach(btn => {
          btn.addEventListener('click', function() {
            const orderId = this.getAttribute('data-order-id');
            closeModal();
            showViewOrderModal(orderId);
          });
        });
      } else {
        alert('Failed to load customer orders');
      }
    } catch (error) {
      console.error('Error loading customer orders:', error);
      alert('An error occurred while loading customer orders');
    }
  }

  function showDeleteCustomerModal(customerId) {
    const modalHTML = `
      <div class="text-center">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 text-red-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <p class="text-lg font-semibold mb-2">Are you sure you want to delete this customer?</p>
        <p class="text-gray-600 mb-6">This action cannot be undone. Note that customers with existing orders cannot be deleted.</p>
      </div>
    `;

    openModal('Delete Customer', modalHTML, () => deleteCustomer(customerId));
  }

  async function deleteCustomer(customerId) {
    try {
      const response = await fetchAPI(`customers/${customerId}`, {
        method: 'DELETE'
      });

      if (response.status === 'success') {
        closeModal();
        loadModule('customers');
      } else {
        alert('Failed to delete customer: ' + response.message);
      }
    } catch (error) {
      console.error('Delete customer error:', error);
      alert('An error occurred while deleting the customer');
    }
  }

  function filterCustomers() {
    const searchTerm = document.getElementById('customer-search').value.toLowerCase();
    const tableRows = document.querySelectorAll('#customers-table-body tr');
    
    tableRows.forEach(row => {
      const customerName = row.querySelector('td:nth-child(2) div').textContent.toLowerCase();
      const email = row.querySelector('td:nth-child(3)').textContent.toLowerCase();
      const phone = row.querySelector('td:nth-child(4)').textContent.toLowerCase();
      
      if (customerName.includes(searchTerm) || email.includes(searchTerm) || phone.includes(searchTerm)) {
        row.style.display = '';
      } else {
        row.style.display = 'none';
      }
    });
  }

  // Orders functions
  async function showAddOrderModal() {
    try {
      const customersResponse = await fetchAPI('customers');
      const productsResponse = await fetchAPI('products');
      
      if (customersResponse.status === 'success' && productsResponse.status === 'success') {
        const customers = customersResponse.data;
        const products = productsResponse.data;
        
        let customersOptions = '';
        let productsOptions = '';
        
        if (customers && customers.length > 0) {
          customers.forEach(customer => {
            customersOptions += `<option value="${customer.customer_id}">${customer.first_name} ${customer.last_name}</option>`;
          });
        }
        
        if (products && products.length > 0) {
          products.forEach(product => {
            productsOptions += `<option value="${product.product_id}" data-price="${product.price}" data-stock="${product.stock_quantity}">${product.product_name} - $${formatCurrency(product.price)} (${product.stock_quantity} in stock)</option>`;
          });
        }
        
        const modalHTML = `
          <form id="add-order-form" class="space-y-4">
            <div class="form-group">
              <label for="customer-id" class="form-label">Customer</label>
              <select id="customer-id" class="form-input" required>
                <option value="">Select a customer</option>
                ${customersOptions}
              </select>
            </div>
            
            <div class="mt-6 mb-2">
              <h3 class="text-lg font-medium text-gray-900">Order Items</h3>
            </div>
            
            <div id="order-items">
              <div class="order-item bg-gray-50 p-3 rounded-md mb-3">
                <div class="grid grid-cols-12 gap-2">
                  <div class="col-span-6">
                    <label class="form-label">Product</label>
                    <select class="product-select form-input" required>
                      <option value="">Select a product</option>
                      ${productsOptions}
                    </select>
                  </div>
                  <div class="col-span-3">
                    <label class="form-label">Quantity</label>
                    <input type="number" class="quantity-input form-input" min="1" value="1" required>
                  </div>
                  <div class="col-span-3 flex items-end">
                    <button type="button" class="remove-item-btn px-3 py-2 bg-red-100 text-red-600 rounded-md hover:bg-red-200 transition-colors w-full">
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            </div>
            
            <div class="mt-2">
              <button type="button" id="add-item-btn" class="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 focus:outline-none w-full">
                + Add Another Item
              </button>
            </div>
            
            <div class="mt-4 p-3 bg-gray-50 rounded-md">
              <div class="text-right">
                <span class="text-sm text-gray-500">Total Items: <span id="total-items">1</span></span>
                <p class="text-lg font-bold mt-1">Total: $<span id="order-total">0.00</span></p>
              </div>
            </div>
          </form>
        `;

        openModal('Create New Order', modalHTML, createOrder);
        
        // Add event listeners
        document.getElementById('add-item-btn').addEventListener('click', addOrderItem);
        
        // Setup initial order item
        setupOrderItemListeners();
        
        // Calculate initial total
        calculateOrderTotal();
      } else {
        alert('Failed to load customers or products data');
      }
    } catch (error) {
      console.error('Error preparing order form:', error);
      alert('An error occurred while preparing the order form');
    }
  }

  function addOrderItem() {
    const orderItems = document.getElementById('order-items');
    const productsOptions = document.querySelector('.product-select').innerHTML;
    
    const newItem = document.createElement('div');
    newItem.className = 'order-item bg-gray-50 p-3 rounded-md mb-3';
    newItem.innerHTML = `
      <div class="grid grid-cols-12 gap-2">
        <div class="col-span-6">
          <label class="form-label">Product</label>
          <select class="product-select form-input" required>
            ${productsOptions}
          </select>
        </div>
        <div class="col-span-3">
          <label class="form-label">Quantity</label>
          <input type="number" class="quantity-input form-input" min="1" value="1" required>
        </div>
        <div class="col-span-3 flex items-end">
          <button type="button" class="remove-item-btn px-3 py-2 bg-red-100 text-red-600 rounded-md hover:bg-red-200 transition-colors w-full">
            Remove
          </button>
        </div>
      </div>
    `;
    
    orderItems.appendChild(newItem);
    
    // Update setup for the new item
    setupOrderItemListeners();
    
    // Update total items count
    document.getElementById('total-items').textContent = document.querySelectorAll('.order-item').length;
    
    // Calculate total
    calculateOrderTotal();
  }

  function setupOrderItemListeners() {
    // Product selection change
    document.querySelectorAll('.product-select').forEach(select => {
      select.addEventListener('change', function() {
        calculateOrderTotal();
      });
    });
    
    // Quantity change
    document.querySelectorAll('.quantity-input').forEach(input => {
      input.addEventListener('input', function() {
        calculateOrderTotal();
      });
    });
    
    // Remove item
    document.querySelectorAll('.remove-item-btn').forEach(btn => {
      btn.addEventListener('click', function() {
        if (document.querySelectorAll('.order-item').length > 1) {
          this.closest('.order-item').remove();
          document.getElementById('total-items').textContent = document.querySelectorAll('.order-item').length;
          calculateOrderTotal();
        } else {
          alert('Order must have at least one item');
        }
      });
    });
  }

  function calculateOrderTotal() {
    let total = 0;
    
    document.querySelectorAll('.order-item').forEach(item => {
      const productSelect = item.querySelector('.product-select');
      const quantityInput = item.querySelector('.quantity-input');
      
      if (productSelect.value) {
        const selectedOption = productSelect.options[productSelect.selectedIndex];
        const price = parseFloat(selectedOption.getAttribute('data-price'));
        const quantity = parseInt(quantityInput.value) || 0;
        
        total += price * quantity;
      }
    });
    
    document.getElementById('order-total').textContent = formatCurrency(total);
  }

  async function createOrder() {
    try {
      const customerId = document.getElementById('customer-id').value;
      
      if (!customerId) {
        alert('Please select a customer');
        return;
      }
      
      const items = [];
      let valid = true;
      
      document.querySelectorAll('.order-item').forEach(item => {
        const productSelect = item.querySelector('.product-select');
        const quantityInput = item.querySelector('.quantity-input');
        
        if (!productSelect.value) {
          alert('Please select a product for all items');
          valid = false;
          return;
        }
        
        const quantity = parseInt(quantityInput.value);
        
        if (!quantity || quantity < 1) {
          alert('Quantity must be at least 1 for all items');
          valid = false;
          return;
        }
        
        const selectedOption = productSelect.options[productSelect.selectedIndex];
        const stock = parseInt(selectedOption.getAttribute('data-stock'));
        
        if (quantity > stock) {
          alert(`Not enough stock for selected product. Available: ${stock}`);
          valid = false;
          return;
        }
        
        items.push({
          product_id: productSelect.value,
          quantity
        });
      });
      
      if (!valid) return;
      
      const orderData = {
        customer_id: customerId,
        items
      };

      const response = await fetchAPI('orders', {
        method: 'POST',
        body: orderData
      });

      if (response.status === 'success') {
        closeModal();
        loadModule('orders');
      } else {
        alert('Failed to create order: ' + response.message);
      }
    } catch (error) {
      console.error('Create order error:', error);
      alert('An error occurred while creating the order');
    }
  }

  async function showViewOrderModal(orderId) {
    try {
      const response = await fetchAPI(`orders/${orderId}`);
      
      if (response.status === 'success') {
        const { order, items, payments } = response.data;
        
        // Format status
        const status = order.status.replace(/['"]+/g, '');
        const statusClass = getStatusClass(status);
        
        let itemsHTML = '';
        let totalAmount = 0;
        
        if (items && items.length > 0) {
          itemsHTML = `
            <table class="min-w-full divide-y divide-gray-200 mt-2">
              <thead class="bg-gray-50">
                <tr>
                  <th scope="col" class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                  <th scope="col" class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                  <th scope="col" class="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                  <th scope="col" class="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Subtotal</th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
          `;
          
          items.forEach(item => {
            const subtotal = item.price * item.quantity;
            totalAmount += subtotal;
            
            itemsHTML += `
              <tr>
                <td class="px-3 py-2 whitespace-nowrap text-sm font-medium text-gray-900">${item.product_name}</td>
                <td class="px-3 py-2 whitespace-nowrap text-sm text-gray-500">$${formatCurrency(item.price)}</td>
                <td class="px-3 py-2 whitespace-nowrap text-sm text-gray-500 text-right">${item.quantity}</td>
                <td class="px-3 py-2 whitespace-nowrap text-sm text-gray-900 font-medium text-right">$${formatCurrency(subtotal)}</td>
              </tr>
            `;
          });
          
          itemsHTML += `
                <tr class="bg-gray-50">
                  <td colspan="3" class="px-3 py-2 whitespace-nowrap text-sm font-bold text-gray-900 text-right">Total:</td>
                  <td class="px-3 py-2 whitespace-nowrap text-sm font-bold text-gray-900 text-right">$${formatCurrency(totalAmount)}</td>
                </tr>
              </tbody>
            </table>
          `;
        } else {
          itemsHTML = `
            <div class="text-center py-3 text-gray-600">
              No items found for this order.
            </div>
          `;
        }
        
        let paymentsHTML = '';
        let totalPaid = 0;
        
        if (payments && payments.length > 0) {
          paymentsHTML = `
            <table class="min-w-full divide-y divide-gray-200 mt-2">
              <thead class="bg-gray-50">
                <tr>
                  <th scope="col" class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th scope="col" class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Method</th>
                  <th scope="col" class="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
          `;
          
          payments.forEach(payment => {
            totalPaid += payment.amount;
            
            paymentsHTML += `
              <tr>
                <td class="px-3 py-2 whitespace-nowrap text-sm text-gray-500">${formatDate(payment.payment_date)}</td>
                <td class="px-3 py-2 whitespace-nowrap text-sm text-gray-900">${payment.payment_method}</td>
                <td class="px-3 py-2 whitespace-nowrap text-sm text-gray-900 font-medium text-right">$${formatCurrency(payment.amount)}</td>
              </tr>
            `;
          });
          
          paymentsHTML += `
              </tbody>
            </table>
          `;
        } else {
          paymentsHTML = `
            <div class="text-center py-3 text-gray-600">
              No payments recorded for this order.
            </div>
          `;
        }
        
        const balanceDue = totalAmount - totalPaid;
        
        const modalHTML = `
          <div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div class="bg-gray-50 p-3 rounded-md">
                <h3 class="text-sm font-medium text-gray-500 mb-1">Order Information</h3>
                <p class="font-medium">Order #${order.order_id}</p>
                <p class="text-sm text-gray-600">Date: ${formatDate(order.order_date)}</p>
                <p class="text-sm text-gray-600">
                  Status: 
                  <span class="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${statusClass}">
                    ${status}
                  </span>
                </p>
              </div>
              
              <div class="bg-gray-50 p-3 rounded-md">
                <h3 class="text-sm font-medium text-gray-500 mb-1">Customer Information</h3>
                <p class="font-medium">${order.first_name} ${order.last_name}</p>
                <p class="text-sm text-gray-600">Email: ${order.email}</p>
                <p class="text-sm text-gray-600">Phone: ${order.phone}</p>
              </div>
            </div>
            
            <div class="mb-4">
              <h3 class="text-md font-medium text-gray-900 mb-2">Order Items</h3>
              <div class="overflow-x-auto">
                ${itemsHTML}
              </div>
            </div>
            
            <div class="mb-4">
              <h3 class="text-md font-medium text-gray-900 mb-2">Payments</h3>
              <div class="overflow-x-auto">
                ${paymentsHTML}
              </div>
            </div>
            
            <div class="bg-gray-50 p-3 rounded-md">
              <div class="flex justify-between items-center">
                <span class="font-medium">Balance Due:</span>
                <span class="text-lg font-bold ${balanceDue <= 0 ? 'text-green-600' : 'text-red-600'}">
                  $${formatCurrency(balanceDue)}
                </span>
              </div>
            </div>
            
            <div class="mt-4 flex space-x-2">
              <button id="update-status-btn" class="px-3 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 text-sm">
                Update Status
              </button>
              ${balanceDue > 0 ? `
                <button id="add-payment-btn" class="px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm">
                  Record Payment
                </button>
              ` : ''}
              <button id="view-invoice-btn" class="px-3 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 text-sm">
                View/Generate Invoice
              </button>
            </div>
          </div>
        `;

        openModal(`Order #${order.order_id}`, modalHTML);
        
        // Add event listeners
        document.getElementById('update-status-btn').addEventListener('click', function() {
          closeModal();
          showUpdateOrderStatusModal(order.order_id, status);
        });
        
        if (balanceDue > 0) {
          document.getElementById('add-payment-btn').addEventListener('click', function() {
            closeModal();
            showAddPaymentForOrderModal(order.order_id, balanceDue);
          });
        }
        
        document.getElementById('view-invoice-btn').addEventListener('click', function() {
          closeModal();
          checkAndShowInvoiceModal(order.order_id);
        });
      } else {
        alert('Failed to load order details: ' + response.message);
      }
    } catch (error) {
      console.error('Error loading order details:', error);
      alert('An error occurred while loading order details');
    }
  }

  async function showUpdateOrderStatusModal(orderId, currentStatus) {
    const modalHTML = `
      <form id="update-status-form" class="space-y-4">
        <div class="form-group">
          <label for="status" class="form-label">Order Status</label>
          <select id="status" class="form-input" required>
            <option value="Pending" ${currentStatus === 'Pending' ? 'selected' : ''}>Pending</option>
            <option value="Processing" ${currentStatus === 'Processing' ? 'selected' : ''}>Processing</option>
            <option value="Shipped" ${currentStatus === 'Shipped' ? 'selected' : ''}>Shipped</option>
            <option value="Delivered" ${currentStatus === 'Delivered' ? 'selected' : ''}>Delivered</option>
            <option value="Canceled" ${currentStatus === 'Canceled' ? 'selected' : ''}>Canceled</option>
          </select>
        </div>
      </form>
    `;

    openModal('Update Order Status', modalHTML, () => updateOrderStatus(orderId));
  }

  async function updateOrderStatus(orderId) {
    try {
      const status = document.getElementById('status').value;

      const response = await fetchAPI(`orders/${orderId}/status`, {
        method: 'PATCH',
        body: { status }
      });

      if (response.status === 'success') {
        closeModal();
        loadModule('orders');
      } else {
        alert('Failed to update order status: ' + response.message);
      }
    } catch (error) {
      console.error('Update order status error:', error);
      alert('An error occurred while updating the order status');
    }
  }

  function showDeleteOrderModal(orderId) {
    const modalHTML = `
      <div class="text-center">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 text-red-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <p class="text-lg font-semibold mb-2">Are you sure you want to delete this order?</p>
        <p class="text-gray-600 mb-6">This action cannot be undone. Note that only pending orders can be deleted.</p>
      </div>
    `;

    openModal('Delete Order', modalHTML, () => deleteOrder(orderId));
  }

  async function deleteOrder(orderId) {
    try {
      const response = await fetchAPI(`orders/${orderId}`, {
        method: 'DELETE'
      });

      if (response.status === 'success') {
        closeModal();
        loadModule('orders');
      } else {
        alert('Failed to delete order: ' + response.message);
      }
    } catch (error) {
      console.error('Delete order error:', error);
      alert('An error occurred while deleting the order');
    }
  }

  function filterOrders() {
    const searchTerm = document.getElementById('order-search').value.toLowerCase();
    const statusFilter = document.getElementById('order-status-filter').value;
    const tableRows = document.querySelectorAll('#orders-table-body tr');
    
    tableRows.forEach(row => {
      const orderId = row.querySelector('td:nth-child(1)').textContent.toLowerCase();
      const customerName = row.querySelector('td:nth-child(2)').textContent.toLowerCase();
      const status = row.querySelector('td:nth-child(5) span').textContent.trim();
      
      const matchesSearch = orderId.includes(searchTerm) || customerName.includes(searchTerm);
      const matchesStatus = !statusFilter || status === statusFilter;
      
      if (matchesSearch && matchesStatus) {
        row.style.display = '';
      } else {
        row.style.display = 'none';
      }
    });
  }

  // Employees functions
  function showAddEmployeeModal() {
    const modalHTML = `
      <form id="add-employee-form" class="space-y-4">
        <div class="form-group">
          <label for="first-name" class="form-label">First Name</label>
          <input type="text" id="first-name" class="form-input" required>
        </div>
        <div class="form-group">
          <label for="last-name" class="form-label">Last Name</label>
          <input type="text" id="last-name" class="form-input" required>
        </div>
        <div class="form-group">
          <label for="department" class="form-label">Department</label>
          <input type="text" id="department" class="form-input" required>
        </div>
        <div class="form-group">
          <label for="salary" class="form-label">Salary</label>
          <input type="number" id="salary" class="form-input" min="0" step="0.01" required>
        </div>
        <div class="form-group">
          <label for="hire-date" class="form-label">Hire Date</label>
          <input type="date" id="hire-date" class="form-input" required>
        </div>
      </form>
    `;

    openModal('Add New Employee', modalHTML, addEmployee);
  }

  async function addEmployee() {
    try {
      const firstName = document.getElementById('first-name').value;
      const lastName = document.getElementById('last-name').value;
      const department = document.getElementById('department').value;
      const salary = document.getElementById('salary').value;
      const hireDate = document.getElementById('hire-date').value;

      const employeeData = {
        first_name: firstName,
        last_name: lastName,
        department,
        salaray: parseFloat(salary),
        hire_data: hireDate
      };

      const response = await fetchAPI('employees', {
        method: 'POST',
        body: employeeData
      });

      if (response.status === 'success') {
        closeModal();
        loadModule('employees');
      } else {
        alert('Failed to add employee: ' + response.message);
      }
    } catch (error) {
      console.error('Add employee error:', error);
      alert('An error occurred while adding the employee');
    }
  }

  async function showEditEmployeeModal(employeeId) {
    try {
      const response = await fetchAPI(`employees/${employeeId}`);
      
      if (response.status === 'success') {
        const employee = response.data;
        
        const modalHTML = `
          <form id="edit-employee-form" class="space-y-4">
            <div class="form-group">
              <label for="first-name" class="form-label">First Name</label>
              <input type="text" id="first-name" class="form-input" value="${employee.first_name}" required>
            </div>
            <div class="form-group">
              <label for="last-name" class="form-label">Last Name</label>
              <input type="text" id="last-name" class="form-input" value="${employee.last_name}" required>
            </div>
            <div class="form-group">
              <label for="department" class="form-label">Department</label>
              <input type="text" id="department" class="form-input" value="${employee.department}" required>
            </div>
            <div class="form-group">
              <label for="salary" class="form-label">Salary</label>
              <input type="number" id="salary" class="form-input" min="0" step="0.01" value="${employee.salaray}" required>
            </div>
            <div class="form-group">
              <label for="hire-date" class="form-label">Hire Date</label>
              <input type="date" id="hire-date" class="form-input" value="${formatDateForInput(employee.hire_data)}" required>
            </div>
          </form>
        `;

        currentRecord = employee;
        openModal('Edit Employee', modalHTML, () => updateEmployee(employeeId));
      } else {
        alert('Failed to load employee details: ' + response.message);
      }
    } catch (error) {
      console.error('Error loading employee details:', error);
      alert('An error occurred while loading employee details');
    }
  }

  async function updateEmployee(employeeId) {
    try {
      const firstName = document.getElementById('first-name').value;
      const lastName = document.getElementById('last-name').value;
      const department = document.getElementById('department').value;
      const salary = document.getElementById('salary').value;
      const hireDate = document.getElementById('hire-date').value;

      const employeeData = {
        first_name: firstName,
        last_name: lastName,
        department,
        salaray: parseFloat(salary),
        hire_data: hireDate
      };

      const response = await fetchAPI(`employees/${employeeId}`, {
        method: 'PUT',
        body: employeeData
      });

      if (response.status === 'success') {
        closeModal();
        loadModule('employees');
      } else {
        alert('Failed to update employee: ' + response.message);
      }
    } catch (error) {
      console.error('Update employee error:', error);
      alert('An error occurred while updating the employee');
    }
  }

  function showDeleteEmployeeModal(employeeId) {
    const modalHTML = `
      <div class="text-center">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 text-red-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <p class="text-lg font-semibold mb-2">Are you sure you want to delete this employee?</p>
        <p class="text-gray-600 mb-6">This action cannot be undone.</p>
      </div>
    `;

    openModal('Delete Employee', modalHTML, () => deleteEmployee(employeeId));
  }

  async function deleteEmployee(employeeId) {
    try {
      const response = await fetchAPI(`employees/${employeeId}`, {
        method: 'DELETE'
      });

      if (response.status === 'success') {
        closeModal();
        loadModule('employees');
      } else {
        alert('Failed to delete employee: ' + response.message);
      }
    } catch (error) {
      console.error('Delete employee error:', error);
      alert('An error occurred while deleting the employee');
    }
  }

  function filterEmployees() {
    const searchTerm = document.getElementById('employee-search').value.toLowerCase();
    const departmentFilter = document.getElementById('department-filter').value;
    const tableRows = document.querySelectorAll('#employees-table-body tr');
    
    tableRows.forEach(row => {
      const employeeName = row.querySelector('td:nth-child(2) div').textContent.toLowerCase();
      const department = row.querySelector('td:nth-child(3)').textContent.toLowerCase();
      
      const matchesSearch = employeeName.includes(searchTerm);
      const matchesDepartment = !departmentFilter || department === departmentFilter.toLowerCase();
      
      if (matchesSearch && matchesDepartment) {
        row.style.display = '';
      } else {
        row.style.display = 'none';
      }
    });
  }

  // Suppliers functions
  function showAddSupplierModal() {
    const modalHTML = `
      <form id="add-supplier-form" class="space-y-4">
        <div class="form-group">
          <label for="supplier-name" class="form-label">Supplier Name</label>
          <input type="text" id="supplier-name" class="form-input" required>
        </div>
        <div class="form-group">
          <label for="contact-name" class="form-label">Contact Name</label>
          <input type="text" id="contact-name" class="form-input" required>
        </div>
        <div class="form-group">
          <label for="phone" class="form-label">Phone</label>
          <input type="tel" id="phone" class="form-input" required>
        </div>
        <div class="form-group">
          <label for="email" class="form-label">Email</label>
          <input type="email" id="email" class="form-input" required>
        </div>
      </form>
    `;

    openModal('Add New Supplier', modalHTML, addSupplier);
  }

  async function addSupplier() {
    try {
      const supplierName = document.getElementById('supplier-name').value;
      const contactName = document.getElementById('contact-name').value;
      const phone = document.getElementById('phone').value;
      const email = document.getElementById('email').value;

      const supplierData = {
        supplier_name: supplierName,
        contact_name: contactName,
        phone,
        email
      };

      const response = await fetchAPI('suppliers', {
        method: 'POST',
        body: supplierData
      });

      if (response.status === 'success') {
        closeModal();
        loadModule('suppliers');
      } else {
        alert('Failed to add supplier: ' + response.message);
      }
    } catch (error) {
      console.error('Add supplier error:', error);
      alert('An error occurred while adding the supplier');
    }
  }

  async function showEditSupplierModal(supplierId) {
    try {
      const response = await fetchAPI(`suppliers/${supplierId}`);
      
      if (response.status === 'success') {
        const supplier = response.data;
        
        const modalHTML = `
          <form id="edit-supplier-form" class="space-y-4">
            <div class="form-group">
              <label for="supplier-name" class="form-label">Supplier Name</label>
              <input type="text" id="supplier-name" class="form-input" value="${supplier.supplier_name}" required>
            </div>
            <div class="form-group">
              <label for="contact-name" class="form-label">Contact Name</label>
              <input type="text" id="contact-name" class="form-input" value="${supplier.contact_name}" required>
            </div>
            <div class="form-group">
              <label for="phone" class="form-label">Phone</label>
              <input type="tel" id="phone" class="form-input" value="${supplier.phone}" required>
            </div>
            <div class="form-group">
              <label for="email" class="form-label">Email</label>
              <input type="email" id="email" class="form-input" value="${supplier.email}" required>
            </div>
          </form>
        `;

        currentRecord = supplier;
        openModal('Edit Supplier', modalHTML, () => updateSupplier(supplierId));
      } else {
        alert('Failed to load supplier details: ' + response.message);
      }
    } catch (error) {
      console.error('Error loading supplier details:', error);
      alert('An error occurred while loading supplier details');
    }
  }

  async function updateSupplier(supplierId) {
    try {
      const supplierName = document.getElementById('supplier-name').value;
      const contactName = document.getElementById('contact-name').value;
      const phone = document.getElementById('phone').value;
      const email = document.getElementById('email').value;

      const supplierData = {
        supplier_name: supplierName,
        contact_name: contactName,
        phone,
        email
      };

      const response = await fetchAPI(`suppliers/${supplierId}`, {
        method: 'PUT',
        body: supplierData
      });

      if (response.status === 'success') {
        closeModal();
        loadModule('suppliers');
      } else {
        alert('Failed to update supplier: ' + response.message);
      }
    } catch (error) {
      console.error('Update supplier error:', error);
      alert('An error occurred while updating the supplier');
    }
  }

  function showDeleteSupplierModal(supplierId) {
    const modalHTML = `
      <div class="text-center">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 text-red-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <p class="text-lg font-semibold mb-2">Are you sure you want to delete this supplier?</p>
        <p class="text-gray-600 mb-6">This action cannot be undone.</p>
      </div>
    `;

    openModal('Delete Supplier', modalHTML, () => deleteSupplier(supplierId));
  }

  async function deleteSupplier(supplierId) {
    try {
      const response = await fetchAPI(`suppliers/${supplierId}`, {
        method: 'DELETE'
      });

      if (response.status === 'success') {
        closeModal();
        loadModule('suppliers');
      } else {
        alert('Failed to delete supplier: ' + response.message);
      }
    } catch (error) {
      console.error('Delete supplier error:', error);
      alert('An error occurred while deleting the supplier');
    }
  }

  function filterSuppliers() {
    const searchTerm = document.getElementById('supplier-search').value.toLowerCase();
    const tableRows = document.querySelectorAll('#suppliers-table-body tr');
    
    tableRows.forEach(row => {
      const supplierName = row.querySelector('td:nth-child(2) div').textContent.toLowerCase();
      const contactName = row.querySelector('td:nth-child(3)').textContent.toLowerCase();
      const email = row.querySelector('td:nth-child(4)').textContent.toLowerCase();
      const phone = row.querySelector('td:nth-child(5)').textContent.toLowerCase();
      
      if (supplierName.includes(searchTerm) || contactName.includes(searchTerm) || 
          email.includes(searchTerm) || phone.includes(searchTerm)) {
        row.style.display = '';
      } else {
        row.style.display = 'none';
      }
    });
  }

  // Production functions
  async function showAddProductionModal() {
    try {
      const productsResponse = await fetchAPI('products');
      
      if (productsResponse.status === 'success') {
        const products = productsResponse.data;
        
        let productsOptions = '';
        
        if (products && products.length > 0) {
          products.forEach(product => {
            productsOptions += `<option value="${product.product_id}">${product.product_name}</option>`;
          });
        }
        
        const modalHTML = `
          <form id="add-production-form" class="space-y-4">
            <div class="form-group">
              <label for="product-id" class="form-label">Product</label>
              <select id="product-id" class="form-input" required>
                <option value="">Select a product</option>
                ${productsOptions}
              </select>
            </div>
            <div class="form-group">
              <label for="production-date" class="form-label">Production Date</label>
              <input type="date" id="production-date" class="form-input" value="${new Date().toISOString().split('T')[0]}" required>
            </div>
            <div class="form-group">
              <label for="quantity" class="form-label">Quantity Produced</label>
              <input type="number" id="quantity" class="form-input" min="1" required>
            </div>
            <div class="form-group">
              <label for="status" class="form-label">Status</label>
              <select id="status" class="form-input" required>
                <option value="Pending">Pending</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
              </select>
            </div>
          </form>
        `;

        openModal('Add New Production Record', modalHTML, addProduction);
      } else {
        alert('Failed to load products data');
      }
    } catch (error) {
      console.error('Error preparing production form:', error);
      alert('An error occurred while preparing the production form');
    }
  }

  async function addProduction() {
    try {
      const productId = document.getElementById('product-id').value;
      const productionDate = document.getElementById('production-date').value;
      const quantityProduced = document.getElementById('quantity').value;
      const status = document.getElementById('status').value;

      if (!productId) {
        alert('Please select a product');
        return;
      }

      const productionData = {
        product_id: productId,
        production_date: productionDate,
        quantity_produced: parseInt(quantityProduced),
        status
      };

      const response = await fetchAPI('production', {
        method: 'POST',
        body: productionData
      });

      if (response.status === 'success') {
        closeModal();
        loadModule('production');
      } else {
        alert('Failed to add production record: ' + response.message);
      }
    } catch (error) {
      console.error('Add production error:', error);
      alert('An error occurred while adding the production record');
    }
  }

  async function showEditProductionModal(productionId) {
    try {
      const response = await fetchAPI(`production/${productionId}`);
      
      if (response.status === 'success') {
        const production = response.data;
        
        const modalHTML = `
          <form id="edit-production-form" class="space-y-4">
            <div class="form-group">
              <label for="product-name" class="form-label">Product</label>
              <input type="text" id="product-name" class="form-input" value="${production.product_name}" disabled>
            </div>
            <div class="form-group">
              <label for="production-date" class="form-label">Production Date</label>
              <input type="date" id="production-date" class="form-input" value="${formatDateForInput(production.production_date)}" required>
            </div>
            <div class="form-group">
              <label for="quantity" class="form-label">Quantity Produced</label>
              <input type="number" id="quantity" class="form-input" min="1" value="${production.quantity_produced}" required>
            </div>
            <div class="form-group">
              <label for="status" class="form-label">Status</label>
              <select id="status" class="form-input" required>
                <option value="Pending" ${production.status === 'Pending' ? 'selected' : ''}>Pending</option>
                <option value="In Progress" ${production.status === 'In Progress' ? 'selected' : ''}>In Progress</option>
                <option value="Completed" ${production.status === 'Completed' ? 'selected' : ''}>Completed</option>
              </select>
            </div>
          </form>
        `;

        currentRecord = production;
        openModal('Edit Production Record', modalHTML, () => updateProduction(productionId));
      } else {
        alert('Failed to load production record details: ' + response.message);
      }
    } catch (error) {
      console.error('Error loading production record details:', error);
      alert('An error occurred while loading production record details');
    }
  }

  async function updateProduction(productionId) {
    try {
      const productionDate = document.getElementById('production-date').value;
      const quantityProduced = document.getElementById('quantity').value;
      const status = document.getElementById('status').value;

      const productionData = {
        production_date: productionDate,
        quantity_produced: parseInt(quantityProduced),
        status
      };

      const response = await fetchAPI(`production/${productionId}`, {
        method: 'PUT',
        body: productionData
      });

      if (response.status === 'success') {
        closeModal();
        loadModule('production');
      } else {
        alert('Failed to update production record: ' + response.message);
      }
    } catch (error) {
      console.error('Update production error:', error);
      alert('An error occurred while updating the production record');
    }
  }

  function showDeleteProductionModal(productionId) {
    const modalHTML = `
      <div class="text-center">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 text-red-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <p class="text-lg font-semibold mb-2">Are you sure you want to delete this production record?</p>
        <p class="text-gray-600 mb-6">This action cannot be undone. If the status is 'Completed', the product stock will be reduced.</p>
      </div>
    `;

    openModal('Delete Production Record', modalHTML, () => deleteProduction(productionId));
  }

  async function deleteProduction(productionId) {
    try {
      const response = await fetchAPI(`production/${productionId}`, {
        method: 'DELETE'
      });

      if (response.status === 'success') {
        closeModal();
        loadModule('production');
      } else {
        alert('Failed to delete production record: ' + response.message);
      }
    } catch (error) {
      console.error('Delete production error:', error);
      alert('An error occurred while deleting the production record');
    }
  }

  function filterProduction() {
    const searchTerm = document.getElementById('production-search').value.toLowerCase();
    const statusFilter = document.getElementById('production-status-filter').value;
    const tableRows = document.querySelectorAll('#production-table-body tr');
    
    tableRows.forEach(row => {
      const productName = row.querySelector('td:nth-child(2) div').textContent.toLowerCase();
      const status = row.querySelector('td:nth-child(6) span').textContent.trim();
      
      const matchesSearch = productName.includes(searchTerm);
      const matchesStatus = !statusFilter || status === statusFilter;
      
      if (matchesSearch && matchesStatus) {
        row.style.display = '';
      } else {
        row.style.display = 'none';
      }
    });
  }

  // Payments functions
  async function showAddPaymentModal() {
    try {
      const ordersResponse = await fetchAPI('orders');
      
      if (ordersResponse.status === 'success') {
        const orders = ordersResponse.data;
        
        let ordersOptions = '';
        
        if (orders && orders.length > 0) {
          orders.forEach(order => {
            ordersOptions += `<option value="${order.order_id}">#${order.order_id} - ${order.first_name} ${order.last_name} - $${formatCurrency(order.amount)}</option>`;
          });
        }
        
        const modalHTML = `
          <form id="add-payment-form" class="space-y-4">
            <div class="form-group">
              <label for="order-id" class="form-label">Order</label>
              <select id="order-id" class="form-input" required>
                <option value="">Select an order</option>
                ${ordersOptions}
              </select>
            </div>
            <div class="form-group">
              <label for="payment-date" class="form-label">Payment Date</label>
              <input type="date" id="payment-date" class="form-input" value="${new Date().toISOString().split('T')[0]}" required>
            </div>
            <div class="form-group">
              <label for="payment-method" class="form-label">Payment Method</label>
              <select id="payment-method" class="form-input" required>
                <option value="Credit Card">Credit Card</option>
                <option value="Debit Card">Debit Card</option>
                <option value="PayPal">PayPal</option>
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="Cash">Cash</option>
              </select>
            </div>
            <div class="form-group">
              <label for="amount" class="form-label">Amount</label>
              <input type="number" id="amount" class="form-input" min="0.01" step="0.01" required>
            </div>
          </form>
        `;

        openModal('Record New Payment', modalHTML, addPayment);
      } else {
        alert('Failed to load orders data');
      }
    } catch (error) {
      console.error('Error preparing payment form:', error);
      alert('An error occurred while preparing the payment form');
    }
  }

  function showAddPaymentForOrderModal(orderId, balanceDue) {
    const modalHTML = `
      <form id="add-payment-form" class="space-y-4">
        <div class="form-group">
          <label for="order-id" class="form-label">Order ID</label>
          <input type="text" id="order-id" class="form-input" value="#${orderId}" disabled>
          <input type="hidden" id="hidden-order-id" value="${orderId}">
        </div>
        <div class="form-group">
          <label for="payment-date" class="form-label">Payment Date</label>
          <input type="date" id="payment-date" class="form-input" value="${new Date().toISOString().split('T')[0]}" required>
        </div>
        <div class="form-group">
          <label for="payment-method" class="form-label">Payment Method</label>
          <select id="payment-method" class="form-input" required>
            <option value="Credit Card">Credit Card</option>
            <option value="Debit Card">Debit Card</option>
            <option value="PayPal">PayPal</option>
            <option value="Bank Transfer">Bank Transfer</option>
            <option value="Cash">Cash</option>
          </select>
        </div>
        <div class="form-group">
          <label for="amount" class="form-label">Amount</label>
          <input type="number" id="amount" class="form-input" min="0.01" step="0.01" value="${balanceDue.toFixed(2)}" max="${balanceDue.toFixed(2)}" required>
          <small class="text-gray-500">Balance due: $${formatCurrency(balanceDue)}</small>
        </div>
      </form>
    `;

    openModal('Record Payment', modalHTML, addPaymentForOrder);
  }

  async function addPayment() {
    try {
      const orderId = document.getElementById('order-id').value;
      const paymentDate = document.getElementById('payment-date').value;
      const paymentMethod = document.getElementById('payment-method').value;
      const amount = document.getElementById('amount').value;

      if (!orderId) {
        alert('Please select an order');
        return;
      }

      const paymentData = {
        order_id: orderId,
        payment_date: paymentDate,
        payment_method: paymentMethod,
        amount: parseFloat(amount)
      };

      const response = await fetchAPI('payments', {
        method: 'POST',
        body: paymentData
      });

      if (response.status === 'success') {
        closeModal();
        loadModule('payments');
      } else {
        alert('Failed to record payment: ' + response.message);
      }
    } catch (error) {
      console.error('Add payment error:', error);
      alert('An error occurred while recording the payment');
    }
  }

  async function addPaymentForOrder() {
    try {
      const orderId = document.getElementById('hidden-order-id').value;
      const paymentDate = document.getElementById('payment-date').value;
      const paymentMethod = document.getElementById('payment-method').value;
      const amount = document.getElementById('amount').value;

      const paymentData = {
        order_id: orderId,
        payment_date: paymentDate,
        payment_method: paymentMethod,
        amount: parseFloat(amount)
      };

      const response = await fetchAPI('payments', {
        method: 'POST',
        body: paymentData
      });

      if (response.status === 'success') {
        closeModal();
        showViewOrderModal(orderId);
      } else {
        alert('Failed to record payment: ' + response.message);
      }
    } catch (error) {
      console.error('Add payment error:', error);
      alert('An error occurred while recording the payment');
    }
  }

  async function showEditPaymentModal(paymentId) {
    try {
      const response = await fetchAPI(`payments/${paymentId}`);
      
      if (response.status === 'success') {
        const payment = response.data;
        
        const modalHTML = `
          <form id="edit-payment-form" class="space-y-4">
            <div class="form-group">
              <label for="order-id" class="form-label">Order ID</label>
              <input type="text" id="order-id" class="form-input" value="#${payment.order_id}" disabled>
            </div>
            <div class="form-group">
              <label for="payment-date" class="form-label">Payment Date</label>
              <input type="date" id="payment-date" class="form-input" value="${formatDateForInput(payment.payment_date)}" required>
            </div>
            <div class="form-group">
              <label for="payment-method" class="form-label">Payment Method</label>
              <select id="payment-method" class="form-input" required>
                <option value="Credit Card" ${payment.payment_method === 'Credit Card' ? 'selected' : ''}>Credit Card</option>
                <option value="Debit Card" ${payment.payment_method === 'Debit Card' ? 'selected' : ''}>Debit Card</option>
                <option value="PayPal" ${payment.payment_method === 'PayPal' ? 'selected' : ''}>PayPal</option>
                <option value="Bank Transfer" ${payment.payment_method === 'Bank Transfer' ? 'selected' : ''}>Bank Transfer</option>
                <option value="Cash" ${payment.payment_method === 'Cash' ? 'selected' : ''}>Cash</option>
              </select>
            </div>
            <div class="form-group">
              <label for="amount" class="form-label">Amount</label>
              <input type="number" id="amount" class="form-input" min="0.01" step="0.01" value="${payment.amount}" required>
            </div>
          </form>
        `;

        currentRecord = payment;
        openModal('Edit Payment', modalHTML, () => updatePayment(paymentId));
      } else {
        alert('Failed to load payment details: ' + response.message);
      }
    } catch (error) {
      console.error('Error loading payment details:', error);
      alert('An error occurred while loading payment details');
    }
  }

  async function updatePayment(paymentId) {
    try {
      const paymentDate = document.getElementById('payment-date').value;
      const paymentMethod = document.getElementById('payment-method').value;
      const amount = document.getElementById('amount').value;

      const paymentData = {
        payment_date: paymentDate,
        payment_method: paymentMethod,
        amount: parseFloat(amount)
      };

      const response = await fetchAPI(`payments/${paymentId}`, {
        method: 'PUT',
        body: paymentData
      });

      if (response.status === 'success') {
        closeModal();
        loadModule('payments');
      } else {
        alert('Failed to update payment: ' + response.message);
      }
    } catch (error) {
      console.error('Update payment error:', error);
      alert('An error occurred while updating the payment');
    }
  }

  function showDeletePaymentModal(paymentId) {
    const modalHTML = `
      <div class="text-center">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 text-red-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <p class="text-lg font-semibold mb-2">Are you sure you want to delete this payment record?</p>
        <p class="text-gray-600 mb-6">This action cannot be undone.</p>
      </div>
    `;

    openModal('Delete Payment', modalHTML, () => deletePayment(paymentId));
  }

  async function deletePayment(paymentId) {
    try {
      const response = await fetchAPI(`payments/${paymentId}`, {
        method: 'DELETE'
      });

      if (response.status === 'success') {
        closeModal();
        loadModule('payments');
      } else {
        alert('Failed to delete payment: ' + response.message);
      }
    } catch (error) {
      console.error('Delete payment error:', error);
      alert('An error occurred while deleting the payment');
    }
  }

  function filterPayments() {
    const searchTerm = document.getElementById('payment-search').value.toLowerCase();
    const methodFilter = document.getElementById('payment-method-filter').value;
    const tableRows = document.querySelectorAll('#payments-table-body tr');
    
    tableRows.forEach(row => {
      const orderId = row.querySelector('td:nth-child(2)').textContent.toLowerCase();
      const customerName = row.querySelector('td:nth-child(3)').textContent.toLowerCase();
      const method = row.querySelector('td:nth-child(6)').textContent;
      
      const matchesSearch = orderId.includes(searchTerm) || customerName.includes(searchTerm);
      const matchesMethod = !methodFilter || method === methodFilter;
      
      if (matchesSearch && matchesMethod) {
        row.style.display = '';
      } else {
        row.style.display = 'none';
      }
    });
  }

  // Invoices functions
  async function showGenerateInvoiceModal() {
    try {
      const ordersResponse = await fetchAPI('orders');
      
      if (ordersResponse.status === 'success') {
        const orders = ordersResponse.data;
        
        // Filter out orders that already have invoices
        const eligibleOrders = orders.filter(order => !order.has_invoice);
        
        let ordersOptions = '';
        
        if (eligibleOrders && eligibleOrders.length > 0) {
          eligibleOrders.forEach(order => {
            ordersOptions += `<option value="${order.order_id}">#${order.order_id} - ${order.first_name} ${order.last_name} - $${formatCurrency(order.amount)}</option>`;
          });
        }
        
        const modalHTML = `
          <form id="generate-invoice-form" class="space-y-4">
            <div class="form-group">
              <label for="order-id" class="form-label">Order</label>
              <select id="order-id" class="form-input" required>
                <option value="">Select an order</option>
                ${ordersOptions}
              </select>
            </div>
          </form>
        `;

        openModal('Generate New Invoice', modalHTML, generateInvoice);
      } else {
        alert('Failed to load orders data');
      }
    } catch (error) {
      console.error('Error preparing invoice form:', error);
      alert('An error occurred while preparing the invoice form');
    }
  }

  async function generateInvoice() {
    try {
      const orderId = document.getElementById('order-id').value;

      if (!orderId) {
        alert('Please select an order');
        return;
      }

      const invoiceData = {
        order_id: orderId
      };

      const response = await fetchAPI('invoices', {
        method: 'POST',
        body: invoiceData
      });

      if (response.status === 'success') {
        closeModal();
        loadModule('invoices');
      } else {
        alert('Failed to generate invoice: ' + response.message);
      }
    } catch (error) {
      console.error('Generate invoice error:', error);
      alert('An error occurred while generating the invoice');
    }
  }

  async function checkAndShowInvoiceModal(orderId) {
    try {
      // Check if invoice exists for this order
      const response = await fetchAPI('invoices');
      
      if (response.status === 'success') {
        const invoices = response.data;
        const existingInvoice = invoices.find(invoice => invoice.order_id === parseInt(orderId));
        
        if (existingInvoice) {
          // If invoice exists, show it
          showViewInvoiceModal(existingInvoice.invoice_id);
        } else {
          // If no invoice, prompt to generate one
          const confirmGenerate = confirm('No invoice exists for this order. Would you like to generate one?');
          
          if (confirmGenerate) {
            const invoiceData = {
              order_id: orderId
            };

            const response = await fetchAPI('invoices', {
              method: 'POST',
              body: invoiceData
            });

            if (response.status === 'success') {
              showViewInvoiceModal(response.data.invoice_id);
            } else {
              alert('Failed to generate invoice: ' + response.message);
            }
          }
        }
      } else {
        alert('Failed to check for existing invoices');
      }
    } catch (error) {
      console.error('Error checking invoice existence:', error);
      alert('An error occurred while checking for existing invoices');
    }
  }

  async function showViewInvoiceModal(invoiceId) {
    try {
      const response = await fetchAPI(`invoices/${invoiceId}`);
      
      if (response.status === 'success') {
        const { invoice, items, payments } = response.data;
        
        let itemsHTML = '';
        let totalAmount = 0;
        
        if (items && items.length > 0) {
          itemsHTML = `
            <table class="min-w-full divide-y divide-gray-200 mt-2">
              <thead class="bg-gray-50">
                <tr>
                  <th scope="col" class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                  <th scope="col" class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                  <th scope="col" class="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                  <th scope="col" class="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Subtotal</th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
          `;
          
          items.forEach(item => {
            const subtotal = item.price * item.quantity;
            totalAmount += subtotal;
            
            itemsHTML += `
              <tr>
                <td class="px-3 py-2 whitespace-nowrap text-sm font-medium text-gray-900">${item.product_name}</td>
                <td class="px-3 py-2 whitespace-nowrap text-sm text-gray-500">$${formatCurrency(item.price)}</td>
                <td class="px-3 py-2 whitespace-nowrap text-sm text-gray-500 text-right">${item.quantity}</td>
                <td class="px-3 py-2 whitespace-nowrap text-sm text-gray-900 font-medium text-right">$${formatCurrency(subtotal)}</td>
              </tr>
            `;
          });
          
          itemsHTML += `
                <tr class="bg-gray-50">
                  <td colspan="3" class="px-3 py-2 whitespace-nowrap text-sm font-bold text-gray-900 text-right">Total:</td>
                  <td class="px-3 py-2 whitespace-nowrap text-sm font-bold text-gray-900 text-right">$${formatCurrency(totalAmount)}</td>
                </tr>
              </tbody>
            </table>
          `;
        }
        
        let paymentsHTML = '';
        let totalPaid = 0;
        
        if (payments && payments.length > 0) {
          paymentsHTML = `
            <table class="min-w-full divide-y divide-gray-200 mt-2">
              <thead class="bg-gray-50">
                <tr>
                  <th scope="col" class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th scope="col" class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Method</th>
                  <th scope="col" class="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
          `;
          
          payments.forEach(payment => {
            totalPaid += payment.amount;
            
            paymentsHTML += `
              <tr>
                <td class="px-3 py-2 whitespace-nowrap text-sm text-gray-500">${formatDate(payment.payment_date)}</td>
                <td class="px-3 py-2 whitespace-nowrap text-sm text-gray-900">${payment.payment_method}</td>
                <td class="px-3 py-2 whitespace-nowrap text-sm text-gray-900 font-medium text-right">$${formatCurrency(payment.amount)}</td>
              </tr>
            `;
          });
          
          paymentsHTML += `
              </tbody>
            </table>
          `;
        } else {
          paymentsHTML = `
            <div class="text-center py-3 text-gray-600">
              No payments recorded.
            </div>
          `;
        }
        
        const balanceDue = totalAmount - totalPaid;
        const statusClass = getInvoiceStatusClass(invoice.status);
        
        const modalHTML = `
          <div class="p-4 border border-gray-200 rounded-md">
            <div class="flex justify-between items-start">
              <div>
                <h2 class="text-xl font-bold text-gray-800">INVOICE</h2>
                <p class="text-sm text-gray-600">Invoice #INV-${invoice.invoice_id}</p>
                <p class="text-sm text-gray-600">Date: ${formatDate(invoice.invoice_date)}</p>
              </div>
              <div class="text-right">
                <p class="text-sm font-medium">Status:</p>
                <span class="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${statusClass}">
                  ${invoice.status}
                </span>
              </div>
            </div>
            
            <div class="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 class="text-sm font-medium text-gray-500 mb-1">From:</h3>
                <p class="font-medium">Your Company Name</p>
                <p class="text-sm text-gray-600">123 Business Street</p>
                <p class="text-sm text-gray-600">City, State 12345</p>
                <p class="text-sm text-gray-600">Phone: (123) 456-7890</p>
                <p class="text-sm text-gray-600">Email: info@yourcompany.com</p>
              </div>
              
              <div>
                <h3 class="text-sm font-medium text-gray-500 mb-1">Bill To:</h3>
                <p class="font-medium">${invoice.first_name} ${invoice.last_name}</p>
                <p class="text-sm text-gray-600">Email: ${invoice.email}</p>
                <p class="text-sm text-gray-600">Phone: ${invoice.phone}</p>
              </div>
            </div>
            
            <div class="mt-6">
              <h3 class="text-sm font-medium text-gray-500 mb-2">Order #${invoice.order_id} (${formatDate(invoice.order_date)})</h3>
              <div class="overflow-x-auto">
                ${itemsHTML}
              </div>
            </div>
            
            <div class="mt-6">
              <h3 class="text-sm font-medium text-gray-500 mb-2">Payments</h3>
              <div class="overflow-x-auto">
                ${paymentsHTML}
              </div>
            </div>
            
            <div class="mt-6 border-t border-gray-200 pt-4 flex justify-between">
              <div></div>
              <div class="text-right">
                <div class="flex justify-between w-48 mb-1">
                  <span class="font-medium">Subtotal:</span>
                  <span>$${formatCurrency(totalAmount)}</span>
                </div>
                <div class="flex justify-between w-48 mb-1">
                  <span class="font-medium">Paid:</span>
                  <span>$${formatCurrency(totalPaid)}</span>
                </div>
                <div class="flex justify-between w-48 text-lg font-bold border-t border-gray-200 pt-1">
                  <span>Balance Due:</span>
                  <span class="${balanceDue <= 0 ? 'text-green-600' : 'text-red-600'}">$${formatCurrency(balanceDue)}</span>
                </div>
              </div>
            </div>
            
            <div class="mt-6 text-center text-sm text-gray-600">
              <p>Thank you for your business!</p>
            </div>
          </div>
          
          <div class="mt-4 flex space-x-2 justify-end">
            <button id="print-invoice-btn" class="px-3 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 text-sm">
              Print Invoice
            </button>
            ${balanceDue > 0 ? `
              <button id="modal-add-payment-btn" class="px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm">
                Record Payment
              </button>
            ` : ''}
            <button id="modal-update-status-btn" class="px-3 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 text-sm">
              Update Status
            </button>
          </div>
        `;

        openModal(`Invoice #INV-${invoice.invoice_id}`, modalHTML);
        
        // Add event listeners
        document.getElementById('print-invoice-btn').addEventListener('click', function() {
          alert('Print functionality would be implemented here');
        });
        
        if (balanceDue > 0) {
          document.getElementById('modal-add-payment-btn').addEventListener('click', function() {
            closeModal();
            showAddPaymentForOrderModal(invoice.order_id, balanceDue);
          });
        }
        
        document.getElementById('modal-update-status-btn').addEventListener('click', function() {
          closeModal();
          showUpdateInvoiceStatusModal(invoice.invoice_id);
        });
      } else {
        alert('Failed to load invoice details: ' + response.message);
      }
    } catch (error) {
      console.error('Error loading invoice details:', error);
      alert('An error occurred while loading invoice details');
    }
  }

  async function showUpdateInvoiceStatusModal(invoiceId) {
    try {
      const response = await fetchAPI(`invoices/${invoiceId}`);
      
      if (response.status === 'success') {
        const invoice = response.data.invoice;
        
        const modalHTML = `
          <form id="update-invoice-status-form" class="space-y-4">
            <div class="form-group">
              <label for="status" class="form-label">Invoice Status</label>
              <select id="status" class="form-input" required>
                <option value="generated" ${invoice.status === 'generated' ? 'selected' : ''}>Generated</option>
                <option value="paid" ${invoice.status === 'paid' ? 'selected' : ''}>Paid</option>
                <option value="cancelled" ${invoice.status === 'cancelled' ? 'selected' : ''}>Cancelled</option>
              </select>
            </div>
          </form>
        `;

        openModal('Update Invoice Status', modalHTML, () => updateInvoiceStatus(invoiceId));
      } else {
        alert('Failed to load invoice details: ' + response.message);
      }
    } catch (error) {
      console.error('Error loading invoice details:', error);
      alert('An error occurred while loading invoice details');
    }
  }

  async function updateInvoiceStatus(invoiceId) {
    try {
      const status = document.getElementById('status').value;

      const response = await fetchAPI(`invoices/${invoiceId}/status`, {
        method: 'PATCH',
        body: { status }
      });

      if (response.status === 'success') {
        closeModal();
        loadModule('invoices');
      } else {
        alert('Failed to update invoice status: ' + response.message);
      }
    } catch (error) {
      console.error('Update invoice status error:', error);
      alert('An error occurred while updating the invoice status');
    }
  }

  function showDeleteInvoiceModal(invoiceId) {
    const modalHTML = `
      <div class="text-center">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 text-red-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <p class="text-lg font-semibold mb-2">Are you sure you want to delete this invoice?</p>
        <p class="text-gray-600 mb-6">This action cannot be undone.</p>
      </div>
    `;

    openModal('Delete Invoice', modalHTML, () => deleteInvoice(invoiceId));
  }

  async function deleteInvoice(invoiceId) {
    try {
      const response = await fetchAPI(`invoices/${invoiceId}`, {
        method: 'DELETE'
      });

      if (response.status === 'success') {
        closeModal();
        loadModule('invoices');
      } else {
        alert('Failed to delete invoice: ' + response.message);
      }
    } catch (error) {
      console.error('Delete invoice error:', error);
      alert('An error occurred while deleting the invoice');
    }
  }

  function filterInvoices() {
    const searchTerm = document.getElementById('invoice-search').value.toLowerCase();
    const statusFilter = document.getElementById('invoice-status-filter').value;
    const tableRows = document.querySelectorAll('#invoices-table-body tr');
    
    tableRows.forEach(row => {
      const invoiceId = row.querySelector('td:nth-child(1)').textContent.toLowerCase();
      const orderId = row.querySelector('td:nth-child(2)').textContent.toLowerCase();
      const customerName = row.querySelector('td:nth-child(3)').textContent.toLowerCase();
      const status = row.querySelector('td:nth-child(6) span').textContent.trim();
      
      const matchesSearch = invoiceId.includes(searchTerm) || orderId.includes(searchTerm) || customerName.includes(searchTerm);
      const matchesStatus = !statusFilter || status === statusFilter;
      
      if (matchesSearch && matchesStatus) {
        row.style.display = '';
      } else {
        row.style.display = 'none';
      }
    });
  }

  // Charts
  function initRevenueChart(data) {
    const ctx = document.getElementById('revenue-chart').getContext('2d');
    
    // Format data for Chart.js
    const months = [];
    const revenue = [];
    
    data.forEach(item => {
      const date = new Date(item.month + '-01');
      months.push(date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }));
      revenue.push(item.total);
    });
    
    new Chart(ctx, {
      type: 'line',
      data: {
        labels: months,
        datasets: [{
          label: 'Monthly Revenue',
          data: revenue,
          backgroundColor: 'rgba(14, 165, 233, 0.2)',
          borderColor: 'rgba(14, 165, 233, 1)',
          borderWidth: 2,
          tension: 0.3,
          pointBackgroundColor: 'rgba(14, 165, 233, 1)',
          pointRadius: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: function(value) {
                return '$' + value;
              }
            }
          }
        },
        plugins: {
          tooltip: {
            callbacks: {
              label: function(context) {
                return 'Revenue: $' + formatCurrency(context.raw);
              }
            }
          }
        }
      }
    });
  }

  function initCategoryChart(data) {
    const ctx = document.getElementById('category-chart').getContext('2d');
    
    // Format data for Chart.js
    const categories = [];
    const counts = [];
    const backgroundColors = [
      'rgba(14, 165, 233, 0.7)',
      'rgba(20, 184, 166, 0.7)',
      'rgba(245, 158, 11, 0.7)',
      'rgba(99, 102, 241, 0.7)',
      'rgba(236, 72, 153, 0.7)',
      'rgba(249, 115, 22, 0.7)',
      'rgba(132, 204, 22, 0.7)'
    ];
    
    data.forEach((item, index) => {
      categories.push(item.category);
      counts.push(item.count);
    });
    
    new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: categories,
        datasets: [{
          data: counts,
          backgroundColor: backgroundColors,
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              padding: 20,
              boxWidth: 10
            }
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                return context.label + ': ' + context.raw + ' products';
              }
            }
          }
        }
      }
    });
  }

  // Utility functions
  function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
  }

  function formatDate(dateString) {
    if (!dateString) return 'N/A';
    
    // Handle different date formats
    let date;
    if (dateString.includes('T')) {
      // ISO format
      date = new Date(dateString);
    } else {
      // Different format, try to parse
      const parts = dateString.split(/[-/]/);
      if (parts.length === 3) {
        if (parts[0].length === 4) {
          // yyyy-mm-dd format
          date = new Date(parts[0], parts[1] - 1, parts[2]);
        } else {
          // dd-mm-yyyy or mm-dd-yyyy format
          date = new Date(parts[2], parts[1] - 1, parts[0]);
        }
      } else {
        return dateString; // Return as is if can't parse
      }
    }
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      return dateString; // Return as is if invalid
    }
    
    // Format the date
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  function formatDateForInput(dateString) {
    if (!dateString) return '';
    
    // Parse the date
    let date;
    if (dateString.includes('T')) {
      // ISO format
      date = new Date(dateString);
    } else {
      // Different format, try to parse
      const parts = dateString.split(/[-/]/);
      if (parts.length === 3) {
        if (parts[0].length === 4) {
          // yyyy-mm-dd format
          date = new Date(parts[0], parts[1] - 1, parts[2]);
        } else {
          // dd-mm-yyyy or mm-dd-yyyy format
          date = new Date(parts[2], parts[1] - 1, parts[0]);
        }
      } else {
        return ''; // Return empty if can't parse
      }
    }
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      return ''; // Return empty if invalid
    }
    
    // Format for input
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
  }

  function formatCurrency(value) {
    if (value === null || value === undefined) return '0.00';
    
    // Convert to number if it's a string
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    
    // Check if it's a valid number
    if (isNaN(numValue)) return '0.00';
    
    // Format with 2 decimal places
    return numValue.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,');
  }

  function getStatusClass(status) {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'shipped':
        return 'bg-indigo-100 text-indigo-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'canceled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  function getProductionStatusClass(status) {
    switch (status) {
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'In Progress':
        return 'bg-blue-100 text-blue-800';
      case 'Completed':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  function getInvoiceStatusClass(status) {
    switch (status) {
      case 'generated':
        return 'bg-blue-100 text-blue-800';
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  function getUniqueCategories(products) {
    if (!products || !Array.isArray(products)) return [];
    
    const categories = new Set();
    products.forEach(product => {
      if (product.category) {
        categories.add(product.category);
      }
    });
    
    return Array.from(categories).sort();
  }

  function getUniqueDepartments(employees) {
    if (!employees || !Array.isArray(employees)) return [];
    
    const departments = new Set();
    employees.forEach(employee => {
      if (employee.department) {
        departments.add(employee.department);
      }
    });
    
    return Array.from(departments).sort();
  }

  // Event Listeners
  loginForm.addEventListener('submit', function(e) {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    login(username, password);
  });

  logoutBtn.addEventListener('click', logout);

  modalClose.addEventListener('click', closeModal);

  modalSave.addEventListener('click', function() {
    if (modalAction) {
      modalAction();
    }
  });

  // Mobile sidebar toggle
  sidebarToggle.addEventListener('click', function() {
    sidebar.classList.toggle('open');
    sidebar.classList.toggle('transform-none');
  });

  // Navigation links
  dashboardLink.addEventListener('click', function(e) {
    e.preventDefault();
    sidebar.classList.remove('open');
    loadModule('dashboard');
  });

  productsLink.addEventListener('click', function(e) {
    e.preventDefault();
    sidebar.classList.remove('open');
    loadModule('products');
  });

  customersLink.addEventListener('click', function(e) {
    e.preventDefault();
    sidebar.classList.remove('open');
    loadModule('customers');
  });

  ordersLink.addEventListener('click', function(e) {
    e.preventDefault();
    sidebar.classList.remove('open');
    loadModule('orders');
  });

  employeesLink.addEventListener('click', function(e) {
    e.preventDefault();
    sidebar.classList.remove('open');
    loadModule('employees');
  });

  suppliersLink.addEventListener('click', function(e) {
    e.preventDefault();
    sidebar.classList.remove('open');
    loadModule('suppliers');
  });

  productionLink.addEventListener('click', function(e) {
    e.preventDefault();
    sidebar.classList.remove('open');
    loadModule('production');
  });

  paymentsLink.addEventListener('click', function(e) {
    e.preventDefault();
    sidebar.classList.remove('open');
    loadModule('payments');
  });

  invoicesLink.addEventListener('click', function(e) {
    e.preventDefault();
    sidebar.classList.remove('open');
    loadModule('invoices');
  });

  // Initialize the app
  checkAuth();
});