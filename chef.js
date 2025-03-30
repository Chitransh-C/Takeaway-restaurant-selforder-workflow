import { initializeApp } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-app.js";

import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-auth.js";
import { getFirestore, collection, getDocs, doc, updateDoc, onSnapshot, getDoc } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-firestore.js";

let app, db, auth;
let isLoggingOut = false;
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
        return null;
    }
}




function fetchOrders() {
    const ordersRef = collection(db, "orders");

    onSnapshot(ordersRef, (querySnapshot) => {
        // Clear existing order lists
        document.getElementById("new-orders-list").innerHTML = "";
        document.getElementById("cooking-orders-list").innerHTML = "";
        document.getElementById("ready-orders-list").innerHTML = "";

        querySnapshot.forEach((docSnap) => {
            const order = docSnap.data();
            const orderId = order.orderId || docSnap.id;
            const items = order.items ? order.items.map(item => `${item.name} (x${item.quantity})`).join(", ") : "No items";
            const status = order.status || "New";

            const orderDiv = document.createElement("div");
            orderDiv.classList.add("order");
            orderDiv.innerHTML = `
                <strong>Order ID:</strong> ${orderId}<br>
                <strong>Items:</strong> ${items}<br>
                <strong>Status:</strong> ${status}
            `;

            if (status.toLowerCase() === "new") {
                const cookingBtn = document.createElement("button");
                cookingBtn.textContent = "Mark as Cooking";
                cookingBtn.classList.add("cooking-btn");
                cookingBtn.onclick = () => updateOrderStatus(docSnap.id, "Cooking");
                orderDiv.appendChild(cookingBtn);
                document.getElementById("new-orders-list").appendChild(orderDiv);
            } else if (status.toLowerCase() === "cooking") {
                const readyBtn = document.createElement("button");
                readyBtn.textContent = "Mark as Ready";
                readyBtn.classList.add("ready-btn");
                readyBtn.onclick = () => updateOrderStatus(docSnap.id, "Ready");
                orderDiv.appendChild(readyBtn);
                document.getElementById("cooking-orders-list").appendChild(orderDiv);
            } else if (status.toLowerCase() === "ready") {
                document.getElementById("ready-orders-list").appendChild(orderDiv);
            }
        });
    }, (error) => {
        console.error("❌ Error fetching real-time updates:", error);
        alert("Failed to fetch real-time updates");
    });
}

// Function to update order status in Firestore
// Function to update order status in Firestore and notify customer
async function updateOrderStatus(docId, newStatus) {
    try {
        const orderRef = doc(db, "orders", docId);

        // ✅ Update Firestore with new status
        await updateDoc(orderRef, { status: newStatus });

        // ✅ Get the customer's phone number
        const orderSnap = await getDoc(orderRef);
        if (orderSnap.exists()) {
            const orderData = orderSnap.data();
            const customerPhone = orderData.phone;

            // ✅ Send WhatsApp message if phone number is available
            if (customerPhone) {
                // Add +91 for Indian numbers
                const formattedPhone = `+91${customerPhone}`;
                await sendOrderStatusUpdate(orderData.orderId, newStatus, formattedPhone);
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




// ✅ Show "New Orders" section by default
function showSection(sectionId) {
    // Hide all sections
    document.querySelectorAll('.section').forEach(section => {
        section.style.display = "none"; // Hide all sections
    });

    // Show the selected section
    const selectedSection = document.getElementById(sectionId);
    if (selectedSection) {
        selectedSection.style.display = "block"; // Show the selected section
    } else {
        console.error("❌ Section not found:", sectionId);
    }
}
window.showSection = showSection;


 document.addEventListener("DOMContentLoaded", async () => {
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

    onAuthStateChanged(auth, async (user) => {
        if (!user) {
            if (isLoggingOut) {
                isLoggingOut = false; // Reset flag after logout
            } else {
                alert("Unauthorized access!");
                window.location.href = "staff-login.html";
            }
            return;
        }

        console.log("✅ User authenticated:", user.email);
        showSection("new-orders"); // ✅ Show New Orders on page load
        fetchOrders(); // ✅ Fetch Orders after showing sections
    });

    // Logout Button Handling (Moved Inside DOMContentLoaded)
    const logoutBtn = document.getElementById("logout-btn");
    if (logoutBtn) {
        logoutBtn.addEventListener("click", async () => {
            console.log("Logout button clicked.");
            try {
                isLoggingOut = true;
                alert("Logging Out...");
                await signOut(auth);
                console.log("User successfully signed out.");
                window.location.href = "index.html"; // Redirect to login page
            } catch (error) {
                console.error("❌ Error during logout:", error.message);
                alert("Logout failed. Please try again.");
            }
        });
    } else {
        console.error("Logout button not found in DOM.");
    }
});

// ✅ Send WhatsApp Notification After Status Update
// ✅ Send WhatsApp Notification After Status Update
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
