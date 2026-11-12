const SHOP_NUMBER = "923161216541";
// Optional: Web3Forms access key for email notification to admin.
// Get free key from https://web3forms.com → create form → paste access key here.
const WEB3FORMS_KEY = ""; // e.g. "a1b2c3d4-...."

const $ = (id) => document.getElementById(id);
const q = (sel, root = document) => root.querySelector(sel);
const qa = (sel, root = document) => Array.from(root.querySelectorAll(sel));
const money = (n) => "Rs. " + n.toLocaleString("en-US");

/* =========================================
   CART + CHECKOUT
========================================= */

const cart = new Map(); // name -> { price, img, qty }
const drawer = $("drawer");
const scrim = $("scrim");
const toastEl = $("toast");
const checkoutOverlay = $("checkout-overlay");
const successOverlay = $("success-overlay");
let toastTimer;

function toast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove("show"), 2200);
}

function openCart() {
    scrim.hidden = false;
    requestAnimationFrame(() => scrim.classList.add("show"));
    drawer.classList.add("open");
    drawer.setAttribute("aria-hidden", "false");
    $("cart-close").focus();
}
function closeCart() {
    scrim.classList.remove("show");
    drawer.classList.remove("open");
    drawer.setAttribute("aria-hidden", "true");
    setTimeout(() => { scrim.hidden = true; }, 300);
}

function getCartTotal() {
    let total = 0;
    cart.forEach((item) => { total += item.price * item.qty; });
    return total;
}

function buildOrderMessage(customer) {
    let msg = "Assalam o Alaikum! New order from Adeel Jewellers website.\n\n";
    msg += "📦 *Order Details:*\n";
    let i = 1;
    cart.forEach((item, name) => {
        msg += `${i++}. ${name} × ${item.qty} — ${money(item.price * item.qty)}\n`;
    });
    msg += `\n*Total: ${money(getCartTotal())}*\n`;
    msg += `Payment: Cash on Delivery (COD)\n\n`;
    msg += "👤 *Customer:*\n";
    msg += `Name: ${customer.name}\n`;
    msg += `Phone: ${customer.phone}\n`;
    msg += `City: ${customer.city}\n`;
    msg += `Address: ${customer.address}\n`;
    if (customer.notes) msg += `Notes: ${customer.notes}\n`;
    return msg;
}

function render() {
    const list = $("cart-list");
    list.innerHTML = "";
    let count = 0, total = 0;

    cart.forEach((item, name) => {
        count += item.qty;
        total += item.price * item.qty;

        const li = document.createElement("li");
        li.innerHTML = `
            <img src="${item.img}" alt="">
            <div class="cart-item-info">
                <strong></strong>
                <span>${money(item.price)}</span>
                <div class="qty">
                    <button type="button" data-act="dec" aria-label="Decrease quantity">&minus;</button>
                    <b>${item.qty}</b>
                    <button type="button" data-act="inc" aria-label="Increase quantity">+</button>
                </div>
            </div>
            <button type="button" class="remove-btn" data-act="remove">Remove</button>`;
        li.querySelector("strong").textContent = name;
        li.dataset.name = name;
        list.appendChild(li);
    });

    $("cart-count").textContent = count;
    $("cart-total").textContent = money(total);
    $("cart-empty").hidden = count > 0;

    const checkoutBtn = $("checkout-btn");
    if (checkoutBtn) {
        checkoutBtn.disabled = count === 0;
        checkoutBtn.style.opacity = count === 0 ? 0.5 : 1;
    }
}

function addToCart(name, price, img) {
    const item = cart.get(name);
    if (item) item.qty++;
    else cart.set(name, { price, img, qty: 1 });
    render();

    const badge = q(".cart-btn");
    badge.classList.remove("bump");
    void badge.offsetWidth;
    badge.classList.add("bump");
    toast(name + " added to cart");
}

qa("[data-add]").forEach((btn) => {
    btn.addEventListener("click", () => {
        addToCart(btn.dataset.name, Number(btn.dataset.price), btn.dataset.img);
        btn.classList.add("added");
        btn.textContent = "Added";
        setTimeout(() => { btn.classList.remove("added"); btn.textContent = "Add to cart"; }, 1400);
    });
});

$("cart-list").addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-act]");
    if (!btn) return;
    const name = btn.closest("li").dataset.name;
    const item = cart.get(name);
    const act = btn.dataset.act;
    if (act === "inc") item.qty++;
    if (act === "dec") item.qty--;
    if (act === "remove" || item.qty <= 0) cart.delete(name);
    render();
});

$("cart-open").addEventListener("click", openCart);
$("cart-close").addEventListener("click", closeCart);
scrim.addEventListener("click", closeCart);

/* ---------- Checkout Modal ---------- */

function openCheckout() {
    if (cart.size === 0) return;
    closeCart();

    let html = "";
    cart.forEach((item, name) => {
        html += `<div>${name} × ${item.qty} — ${money(item.price * item.qty)}</div>`;
    });
    html += `<div class="sum-total">Total: ${money(getCartTotal())}</div>`;
    $("checkout-summary").innerHTML = html;

    checkoutOverlay.hidden = false;
    requestAnimationFrame(() => checkoutOverlay.classList.add("show"));
    setTimeout(() => $("c-name").focus(), 100);
}

function closeCheckout() {
    checkoutOverlay.classList.remove("show");
    setTimeout(() => { checkoutOverlay.hidden = true; }, 280);
}

$("checkout-btn").addEventListener("click", openCheckout);
$("checkout-close").addEventListener("click", closeCheckout);
checkoutOverlay.addEventListener("click", (e) => {
    if (e.target === checkoutOverlay) closeCheckout();
});

/* ---------- Place Order ---------- */

$("checkout-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const form = e.target;
    const btn = $("place-order-btn");

    const customer = {
        name: form.name.value.trim(),
        phone: form.phone.value.trim(),
        city: form.city.value.trim(),
        address: form.address.value.trim(),
        notes: form.notes.value.trim()
    };

    if (!customer.name || !customer.phone || !customer.city || !customer.address) {
        toast("Please fill all required fields");
        return;
    }

    btn.disabled = true;
    btn.textContent = "Placing order...";

    const message = buildOrderMessage(customer);
    const waUrl = "https://wa.me/" + SHOP_NUMBER + "?text=" + encodeURIComponent(message);

    // Optional email to admin via Web3Forms
    if (WEB3FORMS_KEY) {
        try {
            await fetch("https://api.web3forms.com/submit", {
                method: "POST",
                headers: { "Content-Type": "application/json", Accept: "application/json" },
                body: JSON.stringify({
                    access_key: WEB3FORMS_KEY,
                    subject: "New Order – Adeel Jewellers – " + customer.name,
                    from_name: "Adeel Jewellers Website",
                    name: customer.name,
                    phone: customer.phone,
                    city: customer.city,
                    address: customer.address,
                    notes: customer.notes || "None",
                    order_details: message,
                    total: money(getCartTotal()),
                    payment: "Cash on Delivery"
                })
            });
        } catch (err) {
            console.warn("Email notification failed", err);
        }
    }

    // Success UI
    closeCheckout();
    $("success-wa").href = waUrl;
    successOverlay.hidden = false;
    requestAnimationFrame(() => successOverlay.classList.add("show"));

    // Clear cart
    cart.clear();
    render();
    form.reset();

    btn.disabled = false;
    btn.textContent = "Place Order";
});

$("success-close").addEventListener("click", () => {
    successOverlay.classList.remove("show");
    setTimeout(() => { successOverlay.hidden = true; }, 280);
});

document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
        closeCart();
        closeCheckout();
        if (successOverlay && !successOverlay.hidden) {
            successOverlay.classList.remove("show");
            setTimeout(() => { successOverlay.hidden = true; }, 280);
        }
    }
});

/* =========================================
   HEADER AND MENU
========================================= */

const menuBtn = $("menu-btn");
const navLinks = $("nav-links");
const header = $("site-header");

function syncHeader() {
    const menuOpen = navLinks.classList.contains("open");
    header.classList.toggle("solid", window.scrollY > 40 || menuOpen);
}
window.addEventListener("scroll", syncHeader, { passive: true });
menuBtn.addEventListener("click", () => {
    const open = navLinks.classList.toggle("open");
    menuBtn.setAttribute("aria-expanded", open);
    syncHeader();
});
/* anchor links scroll smoothly (the CSS version fights the pinned sections) */
qa('a[href^="#"]').forEach((a) =>
    a.addEventListener("click", (e) => {
        const target = q(a.getAttribute("href"));
        if (!target) return;
        e.preventDefault();
        target.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });
    })
);
navLinks.querySelectorAll("a").forEach((a) =>
    a.addEventListener("click", () => {
        navLinks.classList.remove("open");
        menuBtn.setAttribute("aria-expanded", "false");
        syncHeader();
    })
);

/* =========================================
   SCROLL ANIMATION
   Everything below only runs when motion is allowed.
   Without it the page stays a plain stacked layout.
========================================= */

function setupScroll() {
    if (!window.gsap || !window.ScrollTrigger) return;
    gsap.registerPlugin(ScrollTrigger);
    ScrollTrigger.config({ ignoreMobileResize: true });

    const root = document.documentElement;
    const mm = gsap.matchMedia();

    mm.add({ ok: "(prefers-reduced-motion: no-preference)", wide: "(min-width: 900px)" }, (ctx) => {
        const { ok, wide } = ctx.conditions;
        if (!ok) return;

        root.classList.add("is-anim");
        if (wide) root.classList.add("is-anim-h");

        /* page progress line in the header */
        gsap.to("#progress", {
            scaleX: 1, ease: "none",
            scrollTrigger: { trigger: document.body, start: "top top", end: "bottom bottom", scrub: 0.3 }
        });

        /* ---------- 1. Hero ---------- */
        const arch = q(".hero-arch");

        // load: headline lines rise out of their masks, then the arch wipes up
        gsap.from(".hl-in", { yPercent: 115, duration: 1.3, ease: "power4.out", stagger: 0.18, delay: 0.2 });
        gsap.fromTo(".hero-arch-intro",
            { clipPath: "inset(100% 0% 0% 0%)" },
            { clipPath: "inset(0% 0% 0% 0%)", duration: 1.5, ease: "power3.inOut", delay: 0.1, clearProps: "clipPath" });

        // scroll: the arch opens into the full photo, the two lines part
        const startRadius = arch.offsetWidth / 2;
        const hero = gsap.timeline({
            defaults: { ease: "none" },
            scrollTrigger: {
                trigger: ".hero", start: "top top", end: "+=240%",
                pin: true, scrub: 0.7, anticipatePin: 1, invalidateOnRefresh: true
            }
        });
        hero
            .fromTo(arch,
                { borderTopLeftRadius: startRadius, borderTopRightRadius: startRadius },
                { borderTopLeftRadius: 0, borderTopRightRadius: 0, duration: 2, ease: "power2.in" }, 0)
            .to(arch, {
                width: () => window.innerWidth,
                height: () => q(".hero").clientHeight,
                top: 0, duration: 2, ease: "power2.inOut"
            }, 0)
            .to(".hl-a", { xPercent: -30, autoAlpha: 0, duration: 1.4 }, 0)
            .to(".hl-b", { xPercent: 30, autoAlpha: 0, duration: 1.4 }, 0)
            .to(".hero-aux", { autoAlpha: 0, duration: 0.5 }, 0)
            .to(".hero-veil", { opacity: 1, duration: 1.2 }, 1.2)
            .fromTo(".hero-cap", { autoAlpha: 0, y: 40 }, { autoAlpha: 1, y: 0, duration: 0.8 }, 2.1)
            .to({}, { duration: 0.7 });

        /* ---------- 2. Statement: words light up ---------- */
        const st = $("statement-text");
        if (st && !st.dataset.split) {
            const text = st.textContent.trim();
            st.setAttribute("aria-label", text);
            st.textContent = "";
            text.split(/\s+/).forEach((word, i, all) => {
                const span = document.createElement("span");
                span.className = "w";
                span.setAttribute("aria-hidden", "true");
                span.textContent = word;
                st.appendChild(span);
                if (i < all.length - 1) st.appendChild(document.createTextNode(" "));
            });
            st.dataset.split = "1";
        }
        gsap.fromTo(".statement-text .w", { opacity: 0.16 }, {
            opacity: 1, ease: "none", stagger: 0.12,
            scrollTrigger: { trigger: st, start: "top 80%", end: "bottom 50%", scrub: true }
        });

        /* ---------- 3. Collections: colour, photo and text change in turn ---------- */
        const colls = gsap.utils.toArray(".coll");
        const colors = ["#264438", "#7c8c68", "#e4e9dc"];
        gsap.set(".coll-bg", { backgroundColor: colors[0] });
        gsap.set(".coll-arch", { clipPath: "inset(0% 0% 0% 0%)" });
        colls.forEach((c, i) => { if (i > 0) gsap.set(c, { autoAlpha: 0 }); });

        const coll = gsap.timeline({
            defaults: { ease: "power2.inOut" },
            scrollTrigger: {
                trigger: ".coll-pin", start: "top top", end: "+=320%",
                pin: true, scrub: 0.7, anticipatePin: 1,
                snap: location.search.includes("nosnap") ? false : { snapTo: "labels", duration: { min: 0.2, max: 0.7 }, delay: 0.12, ease: "power1.inOut" }
            }
        });
        coll.addLabel("s1", 0);
        for (let k = 0; k < colls.length - 1; k++) {
            const from = colls[k], to = colls[k + 1];
            const p = 1 + k * 2;
            coll
                .to(".coll-bg", { backgroundColor: colors[k + 1], duration: 1 }, p)
                .to(q(".coll-text", from), { y: -50, autoAlpha: 0, duration: 0.6 }, p)
                .to(q(".coll-arch", from), { clipPath: "inset(0% 0% 100% 0%)", duration: 1 }, p)
                .to(q(".coll-orb", from), { scale: 0, duration: 0.6 }, p)
                .set(to, { autoAlpha: 1 }, p)
                .fromTo(q(".coll-text", to), { y: 50, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.7 }, p + 0.35)
                .fromTo(q(".coll-arch", to), { clipPath: "inset(100% 0% 0% 0%)" }, { clipPath: "inset(0% 0% 0% 0%)", duration: 1 }, p)
                .fromTo(q(".coll-orb", to), { scale: 0 }, { scale: 1, duration: 0.7, ease: "back.out(1.6)" }, p + 0.3)
                .set(from, { autoAlpha: 0 }, p + 1)
                .addLabel("s" + (k + 2), p + 1);
        }
        coll.to({}, { duration: 1 }).addLabel("end");

        /* ---------- 4. Detail: lines draw to each piece ---------- */
        const cos = qa(".co");
        const items = qa("#detail-list li");
        gsap.set(qa(".dot", q(".detail-photo")), { scale: 0 });
        gsap.set(qa(".line", q(".detail-photo")), { scaleX: 0 });
        gsap.set(qa(".label", q(".detail-photo")), { autoAlpha: 0, x: (i, el) => (el.parentNode.classList.contains("r") ? -12 : 12) });

        const stepLen = 1.2;
        const detail = gsap.timeline({ defaults: { ease: "power2.out" } });
        cos.forEach((c, i) => {
            const t = i * stepLen;
            detail
                .to(q(".dot", c), { scale: 1, duration: 0.3, ease: "back.out(2)" }, t)
                .to(q(".line", c), { scaleX: 1, duration: 0.6 }, t + 0.1)
                .to(q(".label", c), { autoAlpha: 1, x: 0, duration: 0.4 }, t + 0.4);
        });
        detail.to(".detail-img img", { scale: 1.08, duration: cos.length * stepLen + 0.6, ease: "none" }, 0);
        detail.to({}, { duration: 0.6 });

        ScrollTrigger.create({
            trigger: ".detail", pin: ".detail-pin", start: "top top", end: "+=320%",
            scrub: 0.7, animation: detail, anticipatePin: 1,
            onUpdate: (self) => {
                const t = self.progress * detail.duration();
                const active = Math.max(0, Math.min(cos.length - 1, Math.floor(t / stepLen)));
                cos.forEach((c, i) => c.classList.toggle("on", i === active));
                items.forEach((li, i) => li.classList.toggle("on", i === active));
            }
        });

        /* ---------- 5. Shop: the track slides sideways (desktop only) ---------- */
        if (wide) {
            const track = $("shop-track");
            const dist = () => Math.max(0, track.scrollWidth - window.innerWidth);
            const slide = gsap.to(track, {
                x: () => -dist(), ease: "none",
                scrollTrigger: {
                    trigger: ".shop", pin: ".shop-pin", start: "top top",
                    end: () => "+=" + dist(), scrub: 0.6, anticipatePin: 1, invalidateOnRefresh: true,
                    onUpdate: (self) => gsap.set("#shop-bar", { scaleX: self.progress })
                }
            });
            qa(".product-image img").forEach((img) => {
                gsap.set(img, { scale: 1.22 });
                gsap.fromTo(img, { xPercent: -7 }, {
                    xPercent: 7, ease: "none",
                    scrollTrigger: { trigger: img.closest(".product"), containerAnimation: slide, start: "left right", end: "right left", scrub: true }
                });
            });
        }

        /* ---------- 6. Finale ---------- */
        gsap.from(".fw-in", {
            yPercent: 110, duration: 1.1, ease: "power4.out", stagger: 0.12,
            scrollTrigger: { trigger: ".finale-stage", start: "top 60%", once: true }
        });
        [[".f1", 170], [".f2", 270], [".f3", 390]].forEach(([sel, d]) => {
            gsap.fromTo(sel, { y: d }, {
                y: -d, ease: "none",
                scrollTrigger: { trigger: ".finale-stage", start: "top bottom", end: "bottom top", scrub: 0.6 }
            });
        });

        return () => { root.classList.remove("is-anim", "is-anim-h"); };
    });

    window.addEventListener("load", () => ScrollTrigger.refresh());
}

render();
syncHeader();
setupScroll();
