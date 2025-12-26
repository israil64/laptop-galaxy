export const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0
    }).format(amount);
};

export const generateWhatsAppLink = (product) => {
    const phone = "919876543210"; // Replace with Shop Owner Number
    const text = `Hi, I am interested in the ${product.brand} ${product.model} priced at ${formatCurrency(product.price)}. Is it available?`;
    return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
};

export const debounce = (func, wait) => {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
};