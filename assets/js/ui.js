import { formatCurrency } from './utils.js';

const UI = {
    elements: {
        grid: document.getElementById('product-grid'),
        modal: document.getElementById('product-modal'),
        modalContent: document.getElementById('modal-body'),
        compareBar: document.getElementById('compare-bar'),
        compareCount: document.getElementById('compare-count')
    },

    renderProducts(products) {
        this.elements.grid.innerHTML = products.map(product => {
            const statusLabel = product.status.replace('-', ' ').toUpperCase();
            const isSoldOut = product.status === 'sold-out';
            
            return `
            <article class="card product-card" data-id="${product.id}">
                <div class="card-image-wrapper">
                    <span class="badge badge-${product.status}">${statusLabel}</span>
                    <img src="${product.image}" alt="${product.model}" loading="lazy">
                </div>
                <div class="card-content">
                    <h3 class="product-title">${product.brand} ${product.model}</h3>
                    <ul class="specs-list">
                        <li>${product.processor}</li>
                        <li>${product.ram} / ${product.storage}</li>
                        <li>${product.condition}</li>
                    </ul>
                    
                    <!-- Mobile: Tap to reveal | Desktop: Hover -->
                    <div class="price-container" onclick="this.classList.toggle('active')">
                        <span class="price-mask">View Price</span>
                        <span class="price-actual">${formatCurrency(product.price)}</span>
                    </div>

                    <div class="card-actions">
                        <button class="btn btn-primary" onclick="window.triggerModal(${product.id})">Details</button>
                        ${!isSoldOut ? `<button class="btn btn-outline" onclick="window.toggleCompare(${product.id})">Compare</button>` : ''}
                    </div>
                </div>
            </article>
            `;
        }).join('');
    },

    openModal(product, waLink) {
        this.elements.modalContent.innerHTML = `
            <div class="modal-grid">
                <div class="modal-img">
                    <img src="${product.image}" alt="${product.model}">
                </div>
                <div class="modal-details">
                    <h2>${product.brand} ${product.model}</h2>
                    <h3 class="text-primary">${formatCurrency(product.price)}</h3>
                    <p class="status-text ${product.status}">Currently: ${product.status.replace('-', ' ')}</p>
                    
                    <div class="specs-full">
                        <p><strong>Processor:</strong> ${product.processor}</p>
                        <p><strong>RAM:</strong> ${product.ram}</p>
                        <p><strong>Storage:</strong> ${product.storage}</p>
                        <p><strong>Display:</strong> ${product.display}</p>
                        <p><strong>Condition:</strong> ${product.condition}</p>
                    </div>

                    <a href="${waLink}" target="_blank" class="btn btn-whatsapp">
                        <i class="fab fa-whatsapp"></i> Inquiry via WhatsApp
                    </a>
                </div>
            </div>
        `;
        this.elements.modal.classList.add('open');
    },

    updateCompareBar(count) {
        this.elements.compareCount.textContent = count;
        if(count > 0) this.elements.compareBar.classList.add('visible');
        else this.elements.compareBar.classList.remove('visible');
    }
};

export default UI;