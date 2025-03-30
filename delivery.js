import { initializeApp } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-app.js";
import { getFirestore, collection, getDocs,getDoc,setDoc, addDoc, doc, updateDoc, onSnapshot, serverTimestamp } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-firestore.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-auth.js";

// Firebase Setup
let app, db, auth;
let isLoggingOut = false;
let cart = [];

// Firebase Configuration
async function getFirebaseConfig() {
    try {
        const response = await fetch("/api/getFirebaseConfig");
        if (!response.ok) {
            throw new Error("Failed to fetch Firebase configuration");
        }
        return await response.json();
    } catch (error) {
        console.error("❌ Error fetching Firebase config:", error);
        alert("❌ Error fetching Firebase config:");
        return null;
    }
}
async function getTwilioConfig() {
    try {
        const response = await fetch("/api/getTwilioConfig");
        if (!response.ok) {
            throw new Error("Failed to fetch Twilio configuration");
        }
        return await response.json();
    } catch (error) {
        console.error("❌ Error fetching Twilio config:", error);
        alert("❌ Error fetching Twilio config:");
        return null;
    }
}


function fetchOrders() {
    const ordersRef = collection(db, "orders");

    onSnapshot(ordersRef, (querySnapshot) => {
        document.getElementById("ready-orders-list").innerHTML = "";
        document.getElementById("completed-orders-list").innerHTML = "";

        querySnapshot.forEach((docSnap) => {
            const order = docSnap.data();
            const orderId = order.orderId || docSnap.id;
            const status = order.status || "Unknown";

            const orderDiv = document.createElement("div");
            orderDiv.classList.add("order");
            orderDiv.innerHTML = `<strong>Order ID:</strong> ${orderId}<br><strong>Status:</strong> ${status}`;

            if (status === "Ready") {
                const completeBtn = document.createElement("button");
                completeBtn.textContent = "Mark as Completed";
                completeBtn.classList.add("complete-btn");
                completeBtn.onclick = () => updateOrderStatus(docSnap.id, "Completed");
                orderDiv.appendChild(completeBtn);
                document.getElementById("ready-orders-list").appendChild(orderDiv);
            } else if (status === "Completed") {
                document.getElementById("completed-orders-list").appendChild(orderDiv);
            }
        });
    }, (error) => {
        console.error("Error fetching orders:", error);
    });
}

// 🔹 Update Order Status
// 🔹 Update Order Status and Send WhatsApp Notification
async function updateOrderStatus(docId, newStatus) {
    try {
        const orderRef = doc(db, "orders", docId);

        // ✅ Update Firestore with new status
        await updateDoc(orderRef, { status: newStatus });

        // ✅ Get the customer's phone number
        const orderSnap = await getDoc(orderRef);
        if (orderSnap.exists()) {
            const orderData = orderSnap.data();
            let customerPhone = orderData.phone;

            // ✅ Send WhatsApp message if phone number is available
            if (customerPhone) {
                // Add +91 for Indian numbers if not already present
                if (!customerPhone.startsWith('+')) {
                    customerPhone = `+91${customerPhone}`;
                }
                await sendOrderStatusUpdate(orderData.orderId, newStatus, customerPhone);
            } else {
                console.error('❌ Customer phone number not found.');
            }
        } else {
            console.error('❌ Order document not found.');
        }
    } catch (error) {
        console.error("❌ Error updating order status:", error);
        alert("Failed to update order status.");
    }
}



// 🔹 Load menu from Firestore
window.menuItems = []; 

// 🔹 Load menu from Firestore
// 🔹 Load Menu from Firestore
async function loadMenu() {
    const menuContainer = document.getElementById("menu");
    menuContainer.innerHTML = "";

    const menuCollection = collection(db, "menu");
    const menuSnapshot = await getDocs(menuCollection);
    
    window.menuItems = []; // Store menu for filtering

    menuSnapshot.forEach(doc => {
        const item = doc.data();
        if (!item.category) item.category = "Uncategorized"; // Default category if missing
        window.menuItems.push(item);
    });

    displayMenu(window.menuItems);
}


// 🔹 Display Menu Items in Grid
// 🔹 Display Menu Items in Grid
function displayMenu(menuList) {
    const menuContainer = document.getElementById("menu");
    menuContainer.innerHTML = "";

    menuList.forEach(item => {
        let itemElement = document.createElement("div");
        itemElement.classList.add("menu-item");
        itemElement.setAttribute("data-category", item.category);
        itemElement.innerHTML = `
            <h3>${item.name}</h3>
            <p>₹${item.price}</p>
            <button onclick="addToCart('${item.name}', ${item.price})">Add to Cart</button>
        `;
        menuContainer.appendChild(itemElement);
    });
}

// 🔹 Filter Menu by Fixed Categories
function filterCategory(category) {
    if (!Array.isArray(window.menuItems) || window.menuItems.length === 0) {
        console.warn("Menu items are not loaded yet.");
        return; // Prevents errors when menu is empty
    }

    let filteredItems = category === "All" 
        ? window.menuItems 
        : window.menuItems.filter(item => item.category === category);

    displayMenu(filteredItems);
}

function filterMenu() {
    if (!Array.isArray(window.menuItems) || window.menuItems.length === 0) {
        console.warn("Menu items are not loaded yet.");
        return;
    }

    let query = document.getElementById("menu-search").value.toLowerCase();
    let filteredItems = window.menuItems.filter(item => 
        item.name.toLowerCase().includes(query)
    );

    displayMenu(filteredItems);
}


// 🔹 Add item to cart
window.addToCart = function(name, price) {
    let existingItem = cart.find(item => item.name === name);
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({ name, price, quantity: 1 });
    }
    updateCartUI();
};

// 🔹 Update Cart UI
function updateCartUI() {
    let cartItemsList = document.getElementById("cart-items");
    let cartTotal = document.getElementById("cart-total");

    cartItemsList.innerHTML = "";  // ✅ Clear existing list
    let total = 0;

    cart.forEach((item, index) => { // ✅ Add index parameter
        total += item.price * item.quantity;

        let li = document.createElement("li");
        li.innerHTML = `${item.name} (x${item.quantity}) - ₹${item.price * item.quantity} `;

        // ✅ Create Remove Button
        let removeBtn = document.createElement("button");
        removeBtn.textContent = "Remove";
        removeBtn.classList.add("remove-btn"); 
        removeBtn.onclick = function() { removeFromCart(index); }; // ✅ Pass correct index

        li.appendChild(removeBtn);
        cartItemsList.appendChild(li);
    });

    cartTotal.textContent = total.toFixed(2);

    if (cart.length === 0) {
        cartItemsList.innerHTML = "<li>Cart is empty</li>";
    }
}



// 🔹 Place Cash Order


// 🔹 Show selected section
window.showSection = function(sectionId) {
    document.querySelectorAll('.section').forEach(section => section.style.display = "none");
    document.getElementById(sectionId).style.display = "block";
};

// 🔹 Handle Logout
document.getElementById("logout-btn").addEventListener("click", async function() {
    try {
    isLoggingOut = true;
                alert("Logging Out...");
        await signOut(auth);
        window.location.href = "index.html";
    } catch (error) {
        console.error("Logout failed:", error);
    }
});

// 🔹 Function to Generate Correct Order ID
// 🔹 Function to Generate Correct Order ID
async function generateCashOrderId() {
    const now = new Date();
    const months = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
    const month = months[now.getMonth()]; 
    const date = now.getDate().toString().padStart(2, "0"); 
    const year = now.getFullYear().toString().slice(-2); 

    const orderCounterRef = doc(db, "orderCounters", `${month}${date}${year}`);
    const orderCounterSnap = await getDoc(orderCounterRef);

    let lastNumber = orderCounterSnap.exists() ? orderCounterSnap.data().lastUsedNumber : 1000;
    let uniqueNumber = lastNumber + 1;

    if (orderCounterSnap.exists()) {
    await updateDoc(orderCounterRef, { lastUsedNumber: uniqueNumber });
} else {
    await setDoc(orderCounterRef, { lastUsedNumber: uniqueNumber });
}


    return `CASH${month}${date}${year}${uniqueNumber}`;
}

//remove
function removeFromCart(index) {
    cart.splice(index, 1); // Remove the item at the given index
    updateCartUI(); // Refresh cart UI
}

// 🔹 Handle Cash Order Placement
document.addEventListener("DOMContentLoaded", async function () {
const firebaseConfig = await getFirebaseConfig();
 const twilioConfig = await getTwilioConfig();

    if (!firebaseConfig) {
        alert("Failed to load Firebase.");
        return;
    }
    if (!twilioConfig) {
        alert("Failed to load Twilio.");
        return;
    }
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    auth = getAuth(app);
    console.log("✅ Firebase initialized securely.");
    window.twilioConfig = twilioConfig; 
    // Store Twilio config globally
    onAuthStateChanged(auth, (user) => {
        if (!user) {
        if (isLoggingOut) {
                isLoggingOut = false; // Reset flag after logout
            }else{
            alert("Unauthorized access!");}
            window.location.href = "index.html";
        } else {
            fetchOrders();
            loadMenu();
            showSection("ready-orders");
            document.getElementById("all-btn").addEventListener("click", () => filterCategory("All")); document.getElementById("starters-btn").addEventListener("click", () => filterCategory("Starters")); document.getElementById("main-course-btn").addEventListener("click", () => filterCategory("Main Course")); document.getElementById("desserts-btn").addEventListener("click", () => filterCategory("Desserts")); document.getElementById("beverages-btn").addEventListener("click", () => filterCategory("Beverages")); 
        }
    });

    // ✅ Place Order Event Listener Inside `DOMContentLoaded`
    const placeOrderBtn = document.getElementById("place-order-btn");
    if (placeOrderBtn) {
        placeOrderBtn.addEventListener("click", async function() {
            let customerName = document.getElementById("customer-name")?.value.trim() || "Guest";
            let customerPhone = document.getElementById("customer-phone")?.value.trim();

            if (!customerPhone || !customerPhone.match(/^\d{10}$/)) {
                alert("❌ Please enter a valid 10-digit phone number.");
                return;
            }

            let orderId = await generateCashOrderId();  // ✅ FIXED ORDER ID GENERATION

            await addDoc(collection(db, "orders"), {
                orderId: orderId,
                customer: customerName,
                phone: customerPhone,
                items: cart,
                status: "New",
                timestamp: serverTimestamp()
            });

            alert(`✅ Order Placed! Order ID: ${orderId}`);
            cart = [];
            updateCartUI();
                await sendOrderConfirmation(orderId, customerPhone);

        });
    }
});

// 🔹 Send WhatsApp Notification After Status Update
async function sendOrderStatusUpdate(orderId, status, customerPhone) {
    if (!window.twilioConfig) {
        console.error("❌ Twilio configuration not loaded.");
        alert("Failed to load Twilio configuration.");
        return;
    }

    const { accountSid, authToken, TWILIO_PHONE } = window.twilioConfig;
    
    const message = `Your order (${orderId}) status has been updated to: ${status}`;
    const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
    
    const data = new URLSearchParams({
        From: TWILIO_PHONE,
        To: `whatsapp:${customerPhone}`,
        Body: message
    });

    try {
        const response = await fetch(url, {
            method: "POST",
            headers: {
                Authorization: "Basic " + btoa(`${accountSid}:${authToken}`),
                "Content-Type": "application/x-www-form-urlencoded"
            },
            body: data.toString()
        });

        const result = await response.json();
        console.log("Twilio API Response:", result);

        if (response.ok) {
            console.log("✅ WhatsApp status update sent successfully.");
        } else {
            console.error("❌ Failed to send WhatsApp update:", result);
            alert(`Failed to send WhatsApp update. Error: ${result.message}`);
        }
    } catch (error) {
        console.error("❌ Error sending WhatsApp message:", error);
        alert(`Error sending WhatsApp message: ${error.message}`);
    }
}



// 🔹 Send WhatsApp Confirmation After Order is Placed
async function sendOrderConfirmation(orderId, customerPhone) {
    console.log("✅ Sending WhatsApp confirmation...");

    if (!customerPhone.startsWith("+")) {
        customerPhone = `+91${customerPhone}`;
    }

    try {
        const response = await fetch('/api/sendMessage', {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ orderId, customerPhone })
        });

        const result = await response.json();
        if (!response.ok) throw new Error(result.error || "Unknown error");

        console.log("✅ WhatsApp message sent successfully.");
    } catch (error) {
        console.error("❌ WhatsApp message error:", error);
        alert(`Error sending WhatsApp confirmation: ${error.message}`);
    }
}