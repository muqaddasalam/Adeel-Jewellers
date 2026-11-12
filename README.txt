ADEEL JEWELLERS – Improved Ecommerce Version
===========================================

Kya improve hua hai:
--------------------
1. Better Cart system
2. Proper Checkout form (Name, Phone, City, Full Address, Notes)
3. Cash on Delivery (COD)
4. Order place karne ke baad WhatsApp message ready hota hai (customer details + products)
5. Optional: Admin ko Email notification (Web3Forms se)

Kaise use karein:
-----------------
1. Is folder ko Netlify, Vercel, GitHub Pages, ya kisi bhi free static hosting pe upload kar do.
2. Website kholo → products add to cart → Proceed to Checkout → form bharo → Place Order.
3. Success screen aayegi + "Open WhatsApp" button se order message open ho jayega.

Admin ko Email chahiye to:
--------------------------
1. https://web3forms.com pe jao
2. Free account banao / form create karo
3. Access Key copy karo
4. script.js file kholo
5. Upar ye line dhoondo:
   const WEB3FORMS_KEY = "";
6. Apni key paste kar do:
   const WEB3FORMS_KEY = "your-access-key-here";
7. Save karo aur website dubara upload kar do.

Ab jab bhi koi order place karega, aapke email pe bhi details aa jayengi + WhatsApp message bhi ready hoga.

WhatsApp number change karna ho to:
-----------------------------------
script.js mein pehli line:
const SHOP_NUMBER = "923161216541";
Yahan apna number dal do (country code ke sath, bina + ke).

Products add/edit karna:
------------------------
Abhi products index.html mein hardcoded hain.
Naya product add karne ke liye shop section mein naya <article class="product"> copy-paste karke details change kar do.

