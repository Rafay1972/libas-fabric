let adminToken = localStorage.getItem('adminToken') || '';

document.addEventListener('DOMContentLoaded', () => {
    if(adminToken) {
        verifyAdmin();
    }
});

async function verifyAdmin() {
    try {
        const res = await fetch('/api/auth/me', {
            headers: { 'Authorization': 'Bearer ' + adminToken }
        });
        const data = await res.json();
        
        if(data.success && data.user.role === 'admin') {
            showAdminLayout();
            loadAllData();
        } else {
            logout();
        }
    } catch (err) {
        logout();
    }
}

async function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    const errDiv = document.getElementById('loginError');
    const btn = document.getElementById('loginBtn');
    
    btn.disabled = true;
    errDiv.style.display = 'none';
    
    try {
        const res = await fetch('/api/auth/admin-login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        const data = await res.json();
        
        if(data.success) {
            adminToken = data.token;
            localStorage.setItem('adminToken', adminToken);
            showAdminLayout();
            loadAllData();
        } else {
            errDiv.textContent = data.error || 'Login failed';
            errDiv.style.display = 'block';
        }
    } catch (err) {
        errDiv.textContent = 'Network error';
        errDiv.style.display = 'block';
    } finally {
        btn.disabled = false;
    }
}

function logout() {
    adminToken = '';
    localStorage.removeItem('adminToken');
    document.getElementById('adminLayout').style.display = 'none';
    document.getElementById('loginOverlay').style.display = 'flex';
}

function showAdminLayout() {
    document.getElementById('loginOverlay').style.display = 'none';
    document.getElementById('adminLayout').style.display = 'flex';
}

function switchSection(sectionId, btn) {
    document.querySelectorAll('.admin-section').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.admin-nav-item').forEach(b => b.classList.remove('active'));
    
    document.getElementById('section-' + sectionId).classList.add('active');
    if(btn) btn.classList.add('active');
}

async function fetchWithAuth(url, options = {}) {
    if(!options.headers) options.headers = {};
    if(!(options.body instanceof FormData)) {
        options.headers['Content-Type'] = 'application/json';
    }
    options.headers['Authorization'] = 'Bearer ' + adminToken;
    
    const res = await fetch(url, options);
    if(res.status === 401 || res.status === 403) {
        logout();
        throw new Error('Unauthorized');
    }
    return res.json();
}

function loadAllData() {
    loadStats();
    loadOrders();
    loadProducts();
    loadCategories();
    loadSlides();
}

// Stats
async function loadStats() {
    try {
        const data = await fetchWithAuth('/api/orders/stats');
        if(data.success) {
            const s = data.stats;
            document.getElementById('statsGrid').innerHTML = `
                <div class="stat-card"><h3>Total Revenue</h3><div class="value">Rs. ${s.revenue.toLocaleString()}</div></div>
                <div class="stat-card"><h3>Pending Orders</h3><div class="value">${s.pending}</div></div>
                <div class="stat-card"><h3>Delivered</h3><div class="value">${s.delivered}</div></div>
                <div class="stat-card"><h3>Total Orders</h3><div class="value">${s.total}</div></div>
            `;
        }
    } catch (err) { console.error(err); }
}

// Orders
async function loadOrders() {
    try {
        const data = await fetchWithAuth('/api/orders');
        if(data.success) {
            const tbody = document.querySelector('#ordersTable tbody');
            if(data.orders.length === 0) {
                tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;">No orders found</td></tr>';
                return;
            }
            tbody.innerHTML = data.orders.map(o => `
                <tr>
                    <td>${o.orderNumber}</td>
                    <td>${new Date(o.createdAt).toLocaleDateString()}</td>
                    <td>${o.customer.name}<br><small>${o.customer.phone}</small></td>
                    <td>Rs. ${o.totalAmount.toLocaleString()}</td>
                    <td>
                        <select onchange="updateOrderStatus('${o._id}', this.value)" style="background:var(--bg2); color:#fff; padding:4px; border-radius:4px; border:1px solid var(--border);">
                            <option value="pending" ${o.status==='pending'?'selected':''}>Pending</option>
                            <option value="confirmed" ${o.status==='confirmed'?'selected':''}>Confirmed</option>
                            <option value="shipped" ${o.status==='shipped'?'selected':''}>Shipped</option>
                            <option value="delivered" ${o.status==='delivered'?'selected':''}>Delivered</option>
                            <option value="cancelled" ${o.status==='cancelled'?'selected':''}>Cancelled</option>
                        </select>
                    </td>
                    <td>
                        <button class="btn-sm btn-edit" onclick="alert('Order details\\n\\nItems:\\n${o.items.map(i => i.quantity + 'x ' + i.name).join('\\n')}\\n\\nAddress: ${o.customer.address}, ${o.customer.city}')">View</button>
                    </td>
                </tr>
            `).join('');
        }
    } catch (err) { console.error(err); }
}

async function updateOrderStatus(id, status) {
    try {
        await fetchWithAuth('/api/orders/' + id + '/status', {
            method: 'PUT',
            body: JSON.stringify({ status })
        });
        loadStats(); // refresh stats
    } catch (err) { alert('Failed to update status'); }
}

// Categories
let allCategories = [];
async function loadCategories() {
    try {
        const data = await fetch('/api/categories').then(r => r.json());
        if(data.success) {
            allCategories = data.categories;
            const tbody = document.querySelector('#categoriesTable tbody');
            tbody.innerHTML = allCategories.map(c => `
                <tr>
                    <td>${c.name}</td>
                    <td>${c.order}</td>
                    <td><span class="status-badge ${c.isActive?'status-delivered':'status-cancelled'}">${c.isActive?'Active':'Inactive'}</span></td>
                    <td>
                        <button class="btn-sm btn-del" onclick="deleteCategory('${c._id}')">Delete</button>
                    </td>
                </tr>
            `).join('');
        }
    } catch (err) { console.error(err); }
}

function openCategoryModal() {
    const name = prompt('Enter new category name:');
    if(name) {
        fetchWithAuth('/api/categories', {
            method: 'POST',
            body: JSON.stringify({ name })
        }).then(res => {
            if(res.success) loadCategories();
            else alert(res.error || 'Failed to create');
        });
    }
}

async function deleteCategory(id) {
    if(confirm('Delete this category?')) {
        await fetchWithAuth('/api/categories/' + id, { method: 'DELETE' });
        loadCategories();
    }
}

// Products
async function loadProducts() {
    try {
        const data = await fetchWithAuth('/api/products/all');
        if(data.success) {
            const tbody = document.querySelector('#productsTable tbody');
            tbody.innerHTML = data.products.map(p => {
                const img = p.images && p.images.length ? p.images[0] : '';
                return `
                <tr>
                    <td><img src="${img}" style="width:40px; height:40px; object-fit:cover; border-radius:4px;"></td>
                    <td>${p.name}</td>
                    <td>${p.category}</td>
                    <td>Rs. ${p.price}</td>
                    <td><span class="status-badge ${p.isActive?'status-delivered':'status-cancelled'}">${p.isActive?'Active':'Inactive'}</span></td>
                    <td>
                        <button class="btn-sm btn-del" onclick="deleteProduct('${p._id}')">Delete</button>
                    </td>
                </tr>
            `}).join('');
        }
    } catch (err) { console.error(err); }
}

function openProductModal() {
    if(allCategories.length === 0) {
        alert('Please create a category first.');
        return;
    }
    
    document.getElementById('modalsContainer').innerHTML = `
        <div class="modal-overlay">
            <div class="modal" style="max-width:500px;">
                <h3 style="color:#fff; margin-bottom:20px;">Add Product</h3>
                <form id="productForm" onsubmit="submitProduct(event)">
                    <div class="form-group">
                        <input type="text" id="pName" placeholder="Product Name" required>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <select id="pCat" required>
                                ${allCategories.map(c => `<option value="${c.name}">${c.name}</option>`).join('')}
                            </select>
                        </div>
                        <div class="form-group">
                            <input type="number" id="pPrice" placeholder="Price" required>
                        </div>
                    </div>
                    <div class="form-group">
                        <input type="number" id="pOldPrice" placeholder="Old Price (Optional)">
                    </div>
                    <div class="form-group">
                        <textarea id="pDesc" placeholder="Description" rows="3"></textarea>
                    </div>
                    <div class="form-group" style="text-align:left; color:#ccc;">
                        <label>Images</label>
                        <input type="file" id="pImages" multiple accept="image/*">
                    </div>
                    <div style="display:flex; gap:10px; margin-top:20px;">
                        <button type="button" class="btn-primary" style="background:#555;" onclick="closeModal()">Cancel</button>
                        <button type="submit" class="btn-primary">Save Product</button>
                    </div>
                </form>
            </div>
        </div>
    `;
}

async function submitProduct(e) {
    e.preventDefault();
    const formData = new FormData();
    formData.append('name', document.getElementById('pName').value);
    formData.append('category', document.getElementById('pCat').value);
    formData.append('price', document.getElementById('pPrice').value);
    const oldP = document.getElementById('pOldPrice').value;
    if(oldP) formData.append('oldPrice', oldP);
    formData.append('description', document.getElementById('pDesc').value);
    
    const files = document.getElementById('pImages').files;
    for(let i=0; i<files.length; i++) {
        formData.append('images', files[i]);
    }
    
    try {
        const res = await fetch('/api/products', {
            method: 'POST',
            headers: { 'Authorization': 'Bearer ' + adminToken },
            body: formData
        });
        const data = await res.json();
        if(data.success) {
            closeModal();
            loadProducts();
        } else {
            alert(data.error);
        }
    } catch(err) {
        alert('Failed to save product');
    }
}

async function deleteProduct(id) {
    if(confirm('Delete product?')) {
        await fetchWithAuth('/api/products/' + id, { method: 'DELETE' });
        loadProducts();
    }
}

// Slides
async function loadSlides() {
    try {
        const data = await fetch('/api/slides').then(r => r.json());
        if(data.success) {
            const tbody = document.querySelector('#slidesTable tbody');
            tbody.innerHTML = data.slides.map(s => `
                <tr>
                    <td><img src="${s.image}" style="width:60px; height:30px; object-fit:cover; border-radius:4px;"></td>
                    <td>${s.title}</td>
                    <td>${s.subtitle}</td>
                    <td><button class="btn-sm btn-del" onclick="deleteSlide('${s._id}')">Delete</button></td>
                </tr>
            `).join('');
        }
    } catch(err) { console.error(err); }
}

function openSlideModal() {
    document.getElementById('modalsContainer').innerHTML = `
        <div class="modal-overlay">
            <div class="modal" style="max-width:400px;">
                <h3 style="color:#fff; margin-bottom:20px;">Add Slide</h3>
                <form onsubmit="submitSlide(event)">
                    <div class="form-group"><input type="text" id="sTitle" placeholder="Title" required></div>
                    <div class="form-group"><input type="text" id="sSub" placeholder="Subtitle"></div>
                    <div class="form-group" style="text-align:left; color:#ccc;">
                        <label>Image (Max 5MB)</label>
                        <input type="file" id="sImg" accept="image/*" required>
                    </div>
                    <div style="display:flex; gap:10px; margin-top:20px;">
                        <button type="button" class="btn-primary" style="background:#555;" onclick="closeModal()">Cancel</button>
                        <button type="submit" class="btn-primary">Save Slide</button>
                    </div>
                </form>
            </div>
        </div>
    `;
}

async function submitSlide(e) {
    e.preventDefault();
    const formData = new FormData();
    formData.append('title', document.getElementById('sTitle').value);
    formData.append('subtitle', document.getElementById('sSub').value);
    formData.append('image', document.getElementById('sImg').files[0]);
    
    try {
        const res = await fetch('/api/slides', {
            method: 'POST',
            headers: { 'Authorization': 'Bearer ' + adminToken },
            body: formData
        });
        const data = await res.json();
        if(data.success) {
            closeModal();
            loadSlides();
        } else {
            alert(data.error);
        }
    } catch(err) { alert('Failed to save slide'); }
}

async function deleteSlide(id) {
    if(confirm('Delete slide?')) {
        await fetchWithAuth('/api/slides/' + id, { method: 'DELETE' });
        loadSlides();
    }
}

function closeModal() {
    document.getElementById('modalsContainer').innerHTML = '';
}
