/**
 * Service Layer: Handles all data fetching.
 * Currently fetches from local JSON, ready to switch to REST API.
 */
const ApiService = {
    baseUrl: './data',

    async fetchInventory() {
        try {
            // Simulate network delay for realism (optional)
            // await new Promise(resolve => setTimeout(resolve, 300));
            
            const response = await fetch(`${this.baseUrl}/inventory.json`);
            if (!response.ok) throw new Error('Failed to fetch inventory');
            return await response.json();
        } catch (error) {
            console.error("API Error:", error);
            return [];
        }
    },

    async fetchReviews() {
        try {
            const response = await fetch(`${this.baseUrl}/reviews.json`);
            if (!response.ok) throw new Error('Failed to fetch reviews');
            return await response.json();
        } catch (error) {
            console.error("API Error:", error);
            return [];
        }
    }
};

export default ApiService;