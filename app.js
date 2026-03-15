/**
 * Bazaar.eth - Core Logic & Farcaster SDK Integration
 */

class BazaarApp {
  constructor() {
    this.sdk = null;
    this.user = null;
    this.products = [
      {
        id: 1,
        name: "Base Neon Hoodie",
        price: "0.02 ETH",
        seller: "base.eth",
        fid: 1,
        image: "https://images.ctfassets.net/sygt3q11s4a9/5kbm9b5W1gYOdCZpkb8nAV/e4d87acb605b07c9fb8b8ce094e067b4/Base_Blog_header.png",
        trust: 99
      },
      {
        id: 2,
        name: "Farcaster Purple Cap",
        price: "15 DEGEN",
        seller: "dwr.eth",
        fid: 3,
        image: "https://storage.googleapis.com/papyrus_images/92fca84b479c314123bc945f095cd849c81c69890ee7f9bc2e77f5ce594ac244.png",
        trust: 98
      },
      {
        id: 3,
        name: "Onchain Coffee Mug",
        price: "0.005 ETH",
        seller: "clanker.eth",
        fid: 121,
        image: "https://images.ctfassets.net/sygt3q11s4a9/5kbm9b5W1gYOdCZpkb8nAV/e4d87acb605b07c9fb8b8ce094e067b4/Base_Blog_header.png",
        trust: 95
      },
      {
        id: 4,
        name: "Developer Alpha Access",
        price: "100 DEGEN",
        seller: "v.eth",
        fid: 2,
        image: "https://storage.googleapis.com/papyrus_images/92fca84b479c314123bc945f095cd849c81c69890ee7f9bc2e77f5ce594ac244.png",
        trust: 99
      }
    ];

    this.init();
  }

  async init() {
    console.log("Bazaar.eth Initializing...");
    
    // 1. Initialize Farcaster SDK
    try {
      const { sdk } = await import('https://esm.sh/@farcaster/miniapp-sdk@latest');
      this.sdk = sdk;
      await this.sdk.actions.ready();
      
      this.user = await this.sdk.context.user;
      this.updateUserContext();
      
      // Handle SDK events (Theme, etc)
      this.sdk.on('themeChanged', (theme) => this.applyTheme(theme));
      
    } catch (e) {
      console.warn("Farcaster SDK not found, running in web mode.");
      this.updateUserContext({ fid: "Guest", displayName: "Framer" });
    }

    // 2. Render Products
    this.renderProducts();
    this.setupEventListeners();
  }

  updateUserContext(mockUser = null) {
    const user = this.user || mockUser;
    const badgeText = document.getElementById('score-text');
    if (badgeText && user) {
      // Mock trust score calculation based on FID (lower is usually better in Farcaster history)
      const trustScore = user.fid < 5000 ? 99 : 85;
      badgeText.innerText = `FID: ${user.fid} | Trust: ${trustScore}%`;
    }
  }

  renderProducts() {
    const list = document.getElementById('product-list');
    if (!list) return;

    list.innerHTML = this.products.map(p => `
      <div class="product-card" onclick="window.app.showDetails(${p.id})">
        <div class="product-img" style="background-image: url('${p.image}')">
          <div class="price-tag">${p.price}</div>
        </div>
        <div class="product-info">
          <h3>${p.name}</h3>
          <div class="seller-line">
            <span class="seller">@${p.seller}</span>
            <span class="trust-mini">${p.trust}%</span>
          </div>
        </div>
      </div>
    `).join('');
  }

  showDetails(id) {
    const product = this.products.find(p => p.id === id);
    if (!product) return;

    // Use Farcaster SDK to vibrate or show a custom UI
    this.sdk?.actions?.vibrate?.();
    
    alert(`Bazaar.eth Checkout Logic: \n\nProduct: ${product.name}\nPrice: ${product.price}\n\nFarcaster v2 Wallet payment will be triggered here.`);
  }

  setupEventListeners() {
    // Nav item switching
    document.querySelectorAll('.nav-item').forEach(btn => {
      btn.onclick = () => {
        document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
      };
    });
  }

  applyTheme(theme) {
    // Future expansion for light/dark mode handling
    console.log("Applying theme:", theme);
  }
}

// Global instance
window.app = new BazaarApp();
