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
        address: "0x1234567890123456789012345678901234567890",
        seller: "base.eth",
        fid: 1,
        neynar: 95,
        sales: 42,
        links: { warpcast: "base", x: "base" },
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
        neynar: 99,
        sales: 128,
        links: { warpcast: "dwr", x: "dwr" },
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
        neynar: 88,
        sales: 15,
        links: { warpcast: "clanker" },
        image: "https://images.ctfassets.net/sygt3q11s4a9/5kbm9b5W1gYOdCZpkb8nAV/e4d87acb605b07c9fb8b8ce094e067b4/Base_Blog_header.png",
        trust: 95
      }
    ];

    this.init();
  }

  async init() {
    console.log("Bazaar.eth V2+ Initializing...");
    
    // 1. Data Loading (Mock + Persistence)
    this.favs = JSON.parse(localStorage.getItem('bazaar_favs') || '[]');
    this.alerts = JSON.parse(localStorage.getItem('bazaar_alerts') || '[]');
    this.userProducts = JSON.parse(localStorage.getItem('bazaar_user_products') || '[]');
    this.compareList = [];

    // 2. Initialize Farcaster SDK
    try {
      const { sdk } = await import('https://esm.sh/@farcaster/miniapp-sdk@latest');
      this.sdk = sdk;
      await this.sdk.actions.ready();
      this.user = await this.sdk.context.user;
      this.updateUserContext();
    } catch (e) {
      this.updateUserContext({ fid: "Guest" });
    }

    this.renderAll();
    this.setupEventListeners();
  }

  // --- RENDERING ---
  renderAll() {
    this.renderList('product-list', [...this.products, ...this.userProducts]);
    this.renderList('fav-list', [...this.products, ...this.userProducts].filter(p => this.favs.includes(p.id)));
    this.renderCompare();
  }

  renderList(containerId, items) {
    const list = document.getElementById(containerId);
    if (!list) return;

    if (items.length === 0) {
      list.innerHTML = `<p class="empty-state">No items found.</p>`;
      return;
    }

    list.innerHTML = items.map(p => {
      const isFav = this.favs.includes(p.id);
      const isAlert = this.alerts.includes(p.id);
      const links = p.links || {};
      return `
        <div class="product-card">
          <div class="product-img" style="background-image: url('${p.image}')">
            <div class="price-tag">${p.price}</div>
            <div class="card-actions">
              <button class="action-btn ${isFav ? 'active' : ''}" onclick="window.app.toggleFav(${p.id})">♥</button>
              <button class="action-btn ${isAlert ? 'active' : ''}" onclick="window.app.toggleAlert(${p.id})">🔔</button>
              <button class="action-btn" onclick="window.app.addToCompare(${p.id})">⚖️</button>
            </div>
          </div>
          <div class="product-info">
            <div onclick="window.app.buyProduct(${p.id})">
              <h3>${p.name}</h3>
              <div class="seller-line">
                <span class="seller">@${p.seller}</span>
                <span class="trust-mini">
                  <span class="neynar-score">N:${p.neynar || 0}</span> | ${p.trust}%
                </span>
              </div>
              <div class="sales-count">🛍️ ${p.sales || 0} Sales</div>
            </div>
            <div class="seller-socials">
              ${links.warpcast ? `<a href="https://warpcast.com/${links.warpcast}" target="_blank" class="social-link">W</a>` : ''}
              ${links.x ? `<a href="https://x.com/${links.x}" target="_blank" class="social-link">X</a>` : ''}
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  renderCompare() {
    const container = document.getElementById('compare-container');
    if (!container) return;

    if (this.compareList.length === 0) {
      container.innerHTML = `<p class="empty-state">Add items using the ⚖️ icon to compare.</p>`;
      return;
    }

    const items = [...this.products, ...this.userProducts].filter(p => this.compareList.includes(p.id));
    
    container.innerHTML = `
      <div class="compare-grid">
        ${items.map(p => `
          <div class="product-card">
            <div class="product-img" style="background-image: url('${p.image}')">
              <div class="price-tag">${p.price}</div>
            </div>
            <div class="product-info">
              <h3>${p.name}</h3>
              <p style="font-size: 0.7rem; color: var(--text-dim); margin-top: 4px;">Seller: @${p.seller}</p>
              <p style="font-size: 0.7rem; color: #10B981; margin-top: 4px;">Trust: ${p.trust}%</p>
            </div>
            <button class="submit-btn" style="margin: 10px; padding: 8px;" onclick="window.app.removeFromCompare(${p.id})">Remove</button>
          </div>
        `).join('')}
      </div>
    `;
  }

  // --- ACTIONS ---
  switchView(viewId) {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(v => v.classList.remove('active'));
    
    document.getElementById(`view-${viewId}`).classList.add('active');
    const navBtn = Array.from(document.querySelectorAll('.nav-item')).find(b => b.innerText.toLowerCase().includes(viewId === 'fav' ? 'saved' : viewId));
    if (navBtn) navBtn.classList.add('active');
    
    this.sdk?.actions?.vibrate?.();
    this.renderAll();
  }

  sellProduct(e) {
    e.preventDefault();
    const newProduct = {
      id: Date.now(),
      name: document.getElementById('in-name').value,
      price: `${document.getElementById('in-price').value} ${document.getElementById('in-token').value}`,
      value: (parseFloat(document.getElementById('in-price').value) * 1e18).toString(),
      address: this.TREASURY_ADDRESS,
      seller: this.user?.displayName || "framer.eth",
      fid: this.user?.fid || 0,
      image: document.getElementById('in-img').value,
      trust: 100
    };

    this.userProducts.push(newProduct);
    localStorage.setItem('bazaar_user_products', JSON.stringify(this.userProducts));
    
    document.getElementById('sell-form').reset();
    alert("Success! Your product is now listed on Bazaar.eth (Simulated)");
    this.switchView('explore');
  }

  toggleFav(id) {
    const idx = this.favs.indexOf(id);
    if (idx > -1) this.favs.splice(idx, 1);
    else this.favs.push(id);
    localStorage.setItem('bazaar_favs', JSON.stringify(this.favs));
    this.renderAll();
    this.sdk?.actions?.vibrate?.();
  }

  async toggleAlert(id) {
    const idx = this.alerts.indexOf(id);
    if (idx > -1) {
      this.alerts.splice(idx, 1);
      alert("Price alert removed.");
    } else {
      // Use SDK for notifications if in Farcaster
      if (this.sdk?.actions?.requestNotifications) {
        try {
          await this.sdk.actions.requestNotifications();
          this.alerts.push(id);
          alert("Success! You'll be notified when the price changes.");
        } catch (e) {
          alert("Notifications are required for price alerts.");
        }
      } else {
        this.alerts.push(id);
        alert("Alert enabled (Web Demo Mode). In Warpcast, this would enable push notifications.");
      }
    }
    localStorage.setItem('bazaar_alerts', JSON.stringify(this.alerts));
    this.renderAll();
  }

  addToCompare(id) {
    if (this.compareList.includes(id)) return;
    if (this.compareList.length >= 2) {
      alert("You can compare up to 2 items at a time.");
      return;
    }
    this.compareList.push(id);
    this.renderAll();
    alert("Added to comparison! Open 'Compare' tab to view.");
  }

  removeFromCompare(id) {
    this.compareList = this.compareList.filter(i => i !== id);
    this.renderAll();
  }

  async buyProduct(id) {
    const product = [...this.products, ...this.userProducts].find(p => p.id === id);
    if (!product) return;
    this.sdk?.actions?.vibrate?.();
    const totalWei = BigInt(product.value);
    const commissionWei = (totalWei * BigInt(Math.floor(this.COMMISSION_RATE * 1000))) / BigInt(1000);
    const canTransact = this.sdk?.actions?.sendTransaction;
    if (canTransact) {
      try {
        await this.sdk.actions.sendTransaction({
          chainId: "eip155:8453", to: product.address, value: totalWei.toString()
        });
        alert(`Success! Purchase of ${product.name} confirmed.`);
      } catch (e) { console.error(e); }
    } else {
      alert(`Bazaar.eth Checkout (Web Demo): \n\nProduct: ${product.name}\nPrice: ${product.price}\n\nRevenue Model:\n- Commission (2.5%): ${commissionWei} wei\n\n(In Warpcast mobile app, this would open your real wallet)`);
    }
  }

  setupEventListeners() {
    const form = document.getElementById('sell-form');
    if (form) form.onsubmit = (e) => this.sellProduct(e);
  }

  updateUserContext(mockUser = null) {
    const user = this.user || mockUser;
    const badgeText = document.getElementById('score-text');
    if (badgeText && user) {
      const trustScore = user.fid < 5000 ? 99 : 85;
      badgeText.innerText = `FID: ${user.fid || '--'} | Trust: ${trustScore}%`;
    }
  }

  applyTheme(theme) { document.documentElement.className = theme; }
}
window.app = new BazaarApp();
