// Start the app when the HTML is ready
document.addEventListener('DOMContentLoaded', initApp);
/* ===========================
   1. GLOBAL STATE & DATA FETCHING
   =========================== */
// Define laptops globally so both renderInventory and openModal can access it
let laptops = []; 
const API_BASE = 'http://localhost:3000/api'; // Point to your backend



const grid = document.getElementById('laptop-grid');

// Function to fetch JSON data
async function initApp() {
    await fetchInventory();
    fetchReviews(); // Run simultaneously
}

/* ===========================
   DATA FETCHING (UPDATED)
   =========================== */

// 1. Fetch Inventory from Server
async function fetchInventory() {
    const grid = document.getElementById('laptop-grid');
    try {
        // CHANGED: fetching from localhost API instead of file
        const response = await fetch(`${API_BASE}/laptops`);
        if (!response.ok) throw new Error('Failed to connect to backend');
        
        laptops = await response.json();
        renderInventory(); // Call your existing render function
    } catch (error) {
        console.error('Error loading inventory:', error);
        if(grid) grid.innerHTML = '<p class="text-red-500 text-center col-span-full">Server is down. Please run "node server.js"</p>';
    }
}

// 2. Fetch Reviews from Server

async function fetchReviews() {
    const container = document.getElementById('reviews-container');
    if(!container) return;

    try {
        // CHANGED: fetching from localhost API
        const response = await fetch(`${API_BASE}/reviews`);
        if (!response.ok) throw new Error('Failed to load reviews');
        
        const allReviews = await response.json();
        
        // FILTER: Only show reviews where approved === true or approved is undefined (for old data)
        const visibleReviews = allReviews.filter(r => r.approved !== false);
        
        renderReviews(visibleReviews); // Call your existing render function
    } catch (error) {
        console.error('Error loading reviews:', error);
    }
}




async function submitReview() {
    const text = document.getElementById('review-text').value;
    const rating = document.getElementById('review-rating').value;

    await fetch('http://localhost:3000/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            name: currentUser.username, // Use the logged-in name
            role: "Verified Customer",
            rating: parseInt(rating),
            text: text,
            approved: false // Must be approved by admin
        })
    });

    document.getElementById('review-modal').classList.add('hidden');
    alert("Review submitted! It will appear after Admin approval.");
}


/* ===========================
   2. RENDER GRID (Your existing logic)
   =========================== */
function renderInventory() {
    grid.innerHTML = laptops.map(laptop => {
        // Status Badge Logic (Matches your JSON status values)
        let badge = '';
        
        // Note: Ensure your JSON uses "sold", "offer", or "in-stock"
        if (laptop.status === 'sold' || laptop.status === 'sold-out') {
            badge = `<span class="absolute top-3 left-3 bg-red-600 text-white text-xs font-bold px-3 py-1 rounded shadow-md z-10">SOLD OUT</span>`;
        } else if (laptop.status === 'offer') {
            badge = `<span class="absolute top-3 left-3 bg-orange-500 text-white text-xs font-bold px-3 py-1 rounded shadow-md z-10 animate-pulse">SPECIAL OFFER</span>`;
        } else {
            badge = `<span class="absolute top-3 left-3 bg-green-600 text-white text-xs font-bold px-3 py-1 rounded shadow-md z-10">IN STOCK</span>`;
        }

        // WhatsApp Link Generator
        const waMsg = `Hi, I'm interested in the ${laptop.model} (₹${laptop.price}).`;
        const waLink = `https://wa.me/919876543210?text=${encodeURIComponent(waMsg)}`;

        // Card HTML
        return `
        <div class="bg-white rounded-xl shadow-md overflow-hidden group relative flex flex-col h-full border border-slate-100">
            
            <!-- Image Area -->
            <div class="relative h-56 overflow-hidden bg-gray-100">
                ${badge}
                <img src="${laptop.image}" alt="${laptop.model}" class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105">
            </div>

            <!-- Card Body -->
            <div class="p-5 flex-grow flex flex-col relative">
                <h3 class="text-xl font-bold text-slate-800 mb-2">${laptop.model}</h3>
                
                <ul class="text-sm text-slate-500 space-y-1 mb-4">
                    <li><i class="fas fa-microchip w-5 text-blue-500"></i> ${laptop.processor}</li>
                    <li><i class="fas fa-memory w-5 text-blue-500"></i> ${laptop.ram} | ${laptop.storage}</li>
                </ul>

                <!-- "View Details" Button (Always Visible) -->
                <div class="mt-auto mb-10"> 
                    <button onclick="openModal(${laptop.id})" class="text-blue-600 font-semibold text-sm hover:text-blue-800 flex items-center gap-1 transition-colors">
                        View Full Details <i class="fas fa-arrow-right text-xs"></i>
                    </button>
                </div>

                <!-- PRICE & BUY SLIDER (Hidden by default, slides in from LEFT on hover) -->
                <div class="absolute bottom-0 left-0 right-0 bg-slate-900 p-1 transform -translate-x-full group-hover:translate-x-0 transition-transform duration-300 ease-out flex items-center justify-between z-20">
                    
                    ${(laptop.status === 'sold' || laptop.status === 'sold-out') ? 
                        `<span class="text-white font-bold tracking-wider mx-auto">CURRENTLY OUT OF STOCK</span>` 
                        : 
                        `<div class="flex flex-col">
                            <span class="text-slate-400 text-xs">Price</span>
                            <span class="text-white font-bold text-lg">₹${laptop.price.toLocaleString()}</span>
                        </div>
                        <a href="${waLink}" target="_blank" class="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 shadow-lg transition-colors">
                            <i class="fab fa-whatsapp"></i> Buy Now
                        </a>`
                    }
                </div>
            </div>
        </div>
        `;
    }).join('');
}


// Render Reviews 
function renderReviews(reviews) {
    const container = document.getElementById('reviews-container');
    
    container.innerHTML = reviews.map(review => {
        // Generate Star Rating HTML
        let starsHtml = '';
        for(let i=0; i<5; i++) {
            if(i < review.rating) starsHtml += '<i class="fas fa-star text-yellow-400 text-sm"></i>';
            else starsHtml += '<i class="far fa-star text-gray-300 text-sm"></i>';
        }

        return `
        <div class="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 flex flex-col relative hover:shadow-md transition-shadow">
            <!-- Returning Customer Badge -->
            ${review.returning ? 
                `<span class="absolute top-4 right-4 bg-blue-50 text-blue-600 text-xs font-bold px-2 py-1 rounded-full border border-blue-100">
                    Returning Customer
                </span>` : ''
            }

            <!-- Header: Image & Name -->
            <div class="flex items-center gap-4 mb-4">
                <img src="${review.image}" alt="${review.name}" class="w-14 h-14 rounded-full object-cover border-2 border-white shadow-sm">
                <div>
                    <h4 class="font-bold text-slate-900">${review.name}</h4>
                    <p class="text-xs text-slate-500">${review.role}</p>
                </div>
            </div>

            <!-- Stars -->
            <div class="mb-3 flex gap-1">
                ${starsHtml}
            </div>

            <!-- Review Text -->
            <p class="text-slate-600 text-sm italic leading-relaxed">
                "${review.text}"
            </p>
            
            <!-- Quote Icon Decoration -->
            <i class="fas fa-quote-right absolute bottom-6 right-6 text-6xl text-slate-50 opacity-50 -z-0"></i>
        </div>
        `;
    }).join('');
}


/* ===========================
   3. MODAL LOGIC (View Details)
   =========================== */
const modal = document.getElementById('product-modal');
const modalContent = document.getElementById('modal-content');

// Open Modal
window.openModal = function(id) {
    // Find the product in the fetched data
    const laptop = laptops.find(p => p.id === id);
    if(!laptop) return;

    modalContent.innerHTML = `
        <div class="flex flex-col md:flex-row h-full">
            <div class="md:w-1/2 h-64 md:h-auto relative">
                <img src="${laptop.image}" class="w-full h-full object-cover">
                <div class="absolute top-0 left-0 w-full h-full bg-gradient-to-t from-black/50 to-transparent flex items-end p-6 md:hidden">
                    <h2 class="text-white text-2xl font-bold">${laptop.model}</h2>
                </div>
            </div>
            <div class="md:w-1/2 p-8 flex flex-col justify-center bg-white relative">
                <button onclick="closeModal()" class="absolute top-4 right-4 text-slate-400 hover:text-slate-800 text-2xl">&times;</button>
                
                <h2 class="text-2xl font-bold text-slate-800 mb-2 hidden md:block">${laptop.model}</h2>
                <div class="inline-block bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm font-bold w-fit mb-6">
                    ${(laptop.status === 'sold' || laptop.status === 'sold-out') ? 'Sold Out' : 'Available in Stock'}
                </div>

                <div class="space-y-3 mb-8">
                    <div class="flex border-b border-gray-100 pb-2">
                        <span class="font-semibold w-24 text-slate-500">Processor</span>
                        <span class="text-slate-800">${laptop.processor}</span>
                    </div>
                    <div class="flex border-b border-gray-100 pb-2">
                        <span class="font-semibold w-24 text-slate-500">RAM</span>
                        <span class="text-slate-800">${laptop.ram}</span>
                    </div>
                    <div class="flex border-b border-gray-100 pb-2">
                        <span class="font-semibold w-24 text-slate-500">Storage</span>
                        <span class="text-slate-800">${laptop.storage}</span>
                    </div>
                    <div class="flex border-b border-gray-100 pb-2">
                        <span class="font-semibold w-24 text-slate-500">Display</span>
                        <span class="text-slate-800">${laptop.display}</span>
                    </div>
                </div>

                <div class="mt-auto flex items-center justify-between">
                    <div>
                        <p class="text-sm text-slate-500">Our Price</p>
                        <p class="text-3xl font-bold text-slate-900">₹${laptop.price.toLocaleString()}</p>
                    </div>
                    ${(laptop.status !== 'sold' && laptop.status !== 'sold-out') ? 
                        `<a href="https://wa.me/919876543210" target="_blank" class="bg-slate-900 hover:bg-slate-800 text-white px-6 py-3 rounded-lg font-bold shadow-lg transition">
                            Buy Now
                        </a>` : ''
                    }
                </div>
            </div>
        </div>
    `;

    // Show modal
    modal.classList.remove('hidden');
    // Small delay to allow fade-in animation
    setTimeout(() => {
        modal.classList.remove('opacity-0');
        document.getElementById('modal-content').classList.remove('scale-95');
    }, 10);
};

// Close Modal Logic
window.closeModal = function() {
    modal.classList.add('opacity-0');
    document.getElementById('modal-content').classList.add('scale-95');
    setTimeout(() => {
        modal.classList.add('hidden');
    }, 300);
};

modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
});



// scroll down and click the logo to go to home page
document.getElementById("logo").addEventListener("click", function() {
    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
});

/* ===========================
   NAVBAR ACTIVE STATE LOGIC
   =========================== */

// 1. Helper to close mobile menu when a link is clicked
function toggleMobileMenu() {
    document.getElementById('mobile-menu').classList.add('hidden');
}

// 2. Active Scroll Logic
document.addEventListener('DOMContentLoaded', () => {
    
    // Select all sections (Ensure your HTML sections have id="home", id="inventory", etc.)
    const sections = document.querySelectorAll('section, header'); 
    const navLinks = document.querySelectorAll('.nav-link');

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                
                // Get the ID of the section currently in the middle of the screen
                const currentId = entry.target.getAttribute('id');

                // Update the links
                navLinks.forEach(link => {
                    // Remove blue from everyone, add slate (gray)
                    link.classList.remove('text-blue-600');
                    link.classList.add('text-slate-600');

                    // If this link matches the current section, make it Blue
                    if (link.getAttribute('href') === `#${currentId}`) {
                        link.classList.add('text-blue-600');
                        link.classList.remove('text-slate-600');
                    }
                });
            }
        });
    }, {
        root: null,
        // This margin creates a line in the middle of the screen (-50% from top, -50% from bottom)
        // The active state changes exactly when a section crosses the middle.
        rootMargin: '-50% 0px -50% 0px', 
        threshold: 0
    });

    // Start watching the sections
    sections.forEach(section => {
        if(section) observer.observe(section);
    });
});


/* ===========================
   NAVBAR & AUTH UI LOGIC
   =========================== */

// 1. Toggle Desktop Dropdown Animation
function toggleAuthMenu() {
    const menu = document.getElementById('auth-menu');
    const arrow = document.getElementById('auth-arrow');
    const container = document.getElementById('auth-dropdown-guest');

    // Logic: If invisible, open it. Else, close it.
    if (menu.classList.contains('invisible')) {
        menu.classList.remove('opacity-0', 'invisible', 'translate-y-2');
        menu.classList.add('opacity-100', 'translate-y-0');
        arrow.style.transform = 'rotate(180deg)';
    } else {
        menu.classList.add('opacity-0', 'invisible', 'translate-y-2');
        menu.classList.remove('opacity-100', 'translate-y-0');
        arrow.style.transform = 'rotate(0deg)';
    }
}

// Close dropdown if clicking outside
document.addEventListener('click', (e) => {
    const container = document.getElementById('auth-dropdown-guest');
    const menu = document.getElementById('auth-menu');
    if (container && !container.contains(e.target) && !menu.classList.contains('invisible')) {
        toggleAuthMenu(); // Close it
    }
});

// 2. Toggle Mobile Menu Helper
function toggleMobileMenu() {
    document.getElementById('mobile-menu').classList.add('hidden');
}

// 3. Update UI based on Login Status (Call this after login/logout/init)
function updateAuthUI() {
    const currentUser = JSON.parse(localStorage.getItem('laptopUser'));

    // Desktop Elements
    const guestDesktop = document.getElementById('auth-dropdown-guest');
    const userDesktop = document.getElementById('user-info-desktop');
    const userNameDesktop = document.getElementById('user-name-desktop');

    // Mobile Elements
    const guestMobile = document.getElementById('mobile-auth-guest');
    const userMobile = document.getElementById('mobile-auth-user');
    const userNameMobile = document.getElementById('user-name-mobile');

    if (currentUser) {
        // SHOW LOGGED IN STATE
        if(guestDesktop) guestDesktop.classList.add('hidden');
        if(userDesktop) userDesktop.classList.remove('hidden');
        if(userNameDesktop) userNameDesktop.textContent = currentUser.username;

        if(guestMobile) guestMobile.classList.add('hidden');
        if(userMobile) userMobile.classList.remove('hidden');
        if(userNameMobile) userNameMobile.textContent = currentUser.username;
    } else {
        // SHOW GUEST STATE
        if(guestDesktop) guestDesktop.classList.remove('hidden');
        if(userDesktop) userDesktop.classList.add('hidden');

        if(guestMobile) guestMobile.classList.remove('hidden');
        if(userMobile) userMobile.classList.add('hidden');
    }
}

// Initial Call
document.addEventListener('DOMContentLoaded', updateAuthUI);