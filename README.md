# ☕ Coffee Oasis - Customer App

**Mobile-first ordering and tracking app for Coffee Oasis**

[![Status](https://img.shields.io/badge/status-development-yellow)]()
[![Version](https://img.shields.io/badge/version-1.0.0-blue)]()
[![Next.js](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org/)

Customer-facing application for browsing menu, placing orders, and tracking delivery.

---

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Development
npm run dev

# Production
npm run build
npm start
```

Visit `http://localhost:3000`

---

## ✨ Features

### For All Users
- 🍵 **Menu browsing** - View products with variants (Hot/Iced, add-ons)
- 🛒 **Shopping cart** - Customize items, apply discounts
- 📦 **Order tracking** - Real-time status in navigation bar
- 🔐 **Smart locker pickup** - QR code-based pickup system
- 📱 **Mobile-first design** - Optimized for phones

### For Members
- ⭐ **Loyalty points** - Earn and redeem points
- 📜 **Order history** - View all past orders
- 💾 **Saved preferences** - Remember customizations

### For Guests
- 🎫 **Guest checkout** - No account required
- 📱 **Session tracking** - Track current orders

---

## 📦 Project Structure

```
app/
  ├── products/          # Menu browsing
  ├── checkout/          # Cart review
  ├── payment/           # Payment selection
  ├── orders/            # Order history & tracking
  ├── settings/          # User settings
  ├── login/             # Member login
  └── api/               # API routes
      ├── orders/        # Order management
      ├── products/      # Product listing
      ├── bundles/       # Bundle expansion
      ├── loyalty/       # Points system
      └── customers/     # Customer data

components/
  ├── HeaderNav.tsx      # Navigation with order tracking
  ├── ProductSelectionModal.tsx
  └── CashPayment.tsx

context/
  └── cartContext.tsx    # Shopping cart state

lib/
  ├── wooClient.ts       # WooCommerce API client
  ├── orderService.ts    # Order operations
  ├── loyaltyService.ts  # Points management
  └── api/
      ├── error-handler.ts
      └── woocommerce-helpers.ts
```

---

## ⚙️ Configuration

### Environment Variables

Create `.env.local`:

```env
# WooCommerce API
NEXT_PUBLIC_WC_API_URL=https://coffee-oasis.com.my
WC_CONSUMER_KEY=ck_xxxxxxxxxxxxx
WC_CONSUMER_SECRET=cs_xxxxxxxxxxxxx

# Optional
NEXT_PUBLIC_SITE_URL=https://coffee-oasis.com.my
```

---

## 🛠️ Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Backend:** WooCommerce REST API
- **Auth:** Cookie-based (userId for members, guestId for guests)

**Note:** This app does **not** use a local database. All data comes from WooCommerce API.

---

## 🔑 Authentication

### Members
- Login sets `userId` cookie (30 days, HTTP-only)
- WooCommerce customer ID used for identity
- Access to order history and loyalty points

### Guests
- `guestId` UUID stored in localStorage
- Session-based (browser-specific)
- Can track current orders only

---

## 📱 Order Tracking

Orders appear in navigation bar when:
- Status is `processing` or `ready-for-pickup`
- Shows countdown timer (2 min per item)
- Dropdown to see all active orders
- Animates when order is ready for pickup

---

## 🚀 Deployment

### Recommended: Vercel

1. Connect repo to Vercel
2. Add environment variables
3. Deploy

### Environment for Production

```env
NEXT_PUBLIC_WC_API_URL=https://coffee-oasis.com.my
WC_CONSUMER_KEY=ck_xxxxxxxxxxxxx
WC_CONSUMER_SECRET=cs_xxxxxxxxxxxxx
NEXT_PUBLIC_SITE_URL=https://coffee-oasis.com.my
```

### Alternative: Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

---

## 🔗 Related Repositories

- **Admin POS:** [ren1](https://github.com/kayuwoody/ren1) (main branch) - Staff-facing POS system (runs locally)
- **Backend:** WooCommerce instance at coffee-oasis.com.my

---

## 🔧 Development Notes

### What This App Does
- Customer menu browsing and ordering
- Order tracking with real-time updates
- Locker pickup coordination
- Member loyalty points

### What This App Does NOT Do
- ❌ Admin features (sales reports, inventory, etc.)
- ❌ Kitchen display
- ❌ Delivery driver interface
- ❌ Local database (all data from WooCommerce)
- ❌ Thermal printing
- ❌ Purchase orders

---

## 📞 Support

**Website:** https://coffee-oasis.com.my
**GitHub:** https://github.com/kayuwoody/coffee-oasis-customer-app

---

## 📄 License

Private - All Rights Reserved

Copyright © 2025 Coffee Oasis

---

**Built for Coffee Oasis customers** ☕
