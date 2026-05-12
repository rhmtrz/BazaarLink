I am planning to build a B2B trade platform focused on Afghan carpets and rugs.

The platform’s goal is to connect Afghan producers/factories directly with international wholesale buyers from countries such as China, Europe, UAE, USA, and Japan.

This is not a simple eCommerce store. The platform should also handle:

* quotation-based sales,
* fixed-price sales,
* buyer/seller communication,
* commission tracking,
* quality verification,
* shipment coordination,
* and transaction trust.

The business model is similar to a managed B2B sourcing marketplace.

Key ideas:

* Mostly ready inventory (not made-to-order initially)
* Multi-vendor system with producers/suppliers
* Buyer and seller accounts
* Internal chat/negotiation system with message history stored in database
* RFQ (request for quotation) workflow
* Platform commission from both buyer and seller
* Inspection/verification workflow before shipment
* Shipment status tracking
* Potential future escrow or payment-holding mechanism
* Mobile-first experience for suppliers, but desktop support too
* Multilingual support in the future

I am currently considering building the platform using:

* SvelteKit for frontend and backend
* PostgreSQL
* Prisma ORM
* Realtime chat using WebSockets/Socket.IO or Supabase Realtime

I would like guidance on:

1. Whether full custom architecture with SvelteKit is a good choice for this type of platform
2. Whether I should instead use a commerce framework such as MedusaJS or Saleor
3. Recommended backend architecture and system design
4. Marketplace workflow/state-machine design
5. Multi-vendor and commission architecture
6. Realtime chat architecture
7. Escrow/payment-holding considerations and risks
8. MVP scope and development phases
9. Scalability and long-term maintainability
10. Recommended team structure and development priorities

I want to build the platform correctly from the beginning, especially regarding workflow architecture, trust systems, and scalability.

