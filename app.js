/**
 * Bazaar.eth - Core Logic & Farcaster SDK Integration
 */

class BazaarApp {
  constructor() {
    this.sdk = null;
    this.user = null;
    
    // Uygulama Kazanç Ayarları
    this.TREASURY_ADDRESS = "0x48D1c58D663D19a7c8bA7393Edc32a4A5FFCA91D"; // Senin Hazinen (Buraya Komisyon Gelecek)
    this.COMMISSION_RATE = 0.025; // %2.5 Komisyon
    
    this.products = [
      {
        id: 1,
        name: "Base Neon Hoodie",
        price: "0.02 ETH",
        value: "20000000000000000",
        address: "0x1234567890123456789012345678901234567890", // Örnek Satıcı
        seller: "base.eth",
        fid: 1,
        image: "https://images.ctfassets.net/sygt3q11s4a9/5kbm9b5W1gYOdCZpkb8nAV/e4d87acb605b07c9fb8b8ce094e067b4/Base_Blog_header.png",
        trust: 99
      },
      {
        id: 2,
        name: "Farcaster Purple Cap",
        price: "15 DEGEN",
        value: "15000000000000000000",
        address: "0x9876543210987654321098765432109876543210",
        seller: "dwr.eth",
        fid: 3,
        image: "https://storage.googleapis.com/papyrus_images/92fca84b479c314123bc945f095cd849c81c69890ee7f9bc2e77f5ce594ac244.png",
        trust: 98
      },
      {
        id: 3,
        name: "Onchain Coffee Mug",
        price: "0.005 ETH",
        value: "5000000000000000",
        address: "0x5555555555555555555555555555555555555555",
        seller: "clanker.eth",
        fid: 121,
        image: "https://images.ctfassets.net/sygt3q11s4a9/5kbm9b5W1gYOdCZpkb8nAV/e4d87acb605b07c9fb8b8ce094e067b4/Base_Blog_header.png",
        trust: 95
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
      <div class="product-card" onclick="window.app.buyProduct(${p.id})">
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

  async buyProduct(id) {
    const product = this.products.find(p => p.id === id);
    if (!product) return;

    this.sdk?.actions?.vibrate?.();

    // Komisyon Hesaplama (Marketplace Fee)
    const totalWei = BigInt(product.value);
    const commissionWei = (totalWei * BigInt(Math.floor(this.COMMISSION_RATE * 1000))) / BigInt(1000);
    const sellerWei = totalWei - commissionWei;

    console.log(`Purchase: ${product.name} | Total: ${totalWei} | Seller: ${sellerWei} | Bazaar Fee: ${commissionWei}`);

    if (this.sdk) {
      try {
        // Not: Gerçek bir Pazar Yerinde bu işlem bir 'Marketplace Contract' üzerinden tek seferde split edilir.
        // Mini App SDK ile şimdilik doğrudan satıcıya gönderim simüle edilir.
        const result = await this.sdk.actions.sendTransaction({
          chainId: "eip155:8453", 
          abi: [], 
          to: product.address,
          value: totalWei.toString(),
        });
        
        console.log("Transaction Success:", result);
        alert(`Success! Purchase of ${product.name} confirmed. Bazaar Protocol Fee applied.`);
      } catch (e) {
        console.error("User rejected or transaction failed:", e);
      }
    } else {
      alert(`Bazaar.eth Checkout (Web Demo): \n\nProduct: ${product.name}\nPrice: ${product.price}\n\nRevenue Model:\n- Seller Gets: ${sellerWei} wei\n- Bazaar Treasury Gets (2.5%): ${commissionWei} wei\n\nFinal Price: ${totalWei} wei`);
    }
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
