# GDC Takeaway

GDC Takeaway is an online food order management system with separate dashboards for Admin, Chef, and Counter staff. It streamlines order processing, kitchen management, and delivery tracking while integrating WhatsApp notifications for real-time order updates.

## Features

### 1. **Admin Dashboard**
- Manage menu items (add, update, delete)
- Manage staff (admin, chef, counter)
- View order statistics

### 2. **Chef Dashboard**
- View new orders
- Move orders to 'Cooking' status
- Mark orders as 'Ready'

### 3. **Counter Dashboard**
- View ready orders
- Mark orders as 'Completed'
- Manage cash orders

### 4. **WhatsApp Notifications (Twilio Integration)**
- Customers receive order updates via WhatsApp
- Notifications for order status changes (Received, Cooking, Ready, Completed)

### 5. **Backend (Vercel Serverless Functions)**
- Uses **Vercel Serverless Functions** as the backend for all pages
- Manages order data, authentication, and real-time updates
- Scales automatically with no need for server management

## Tech Stack
- **Frontend:** HTML, CSS, JavaScript
- **Backend:** Vercel Serverless Functions (API folder)
- **Database:** Firestore
- **Hosting:** Vercel
- **Notifications:** Twilio API (WhatsApp Integration)

## Installation & Setup
1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/GDC-Takeaway.git
   ```
2. Navigate to the project directory:
   ```bash
   cd GDC-Takeaway
   ```
3. Set up environment variables (Twilio API, Firestore, etc.).
4. Deploy the project to Vercel:
   ```bash
   vercel deploy
   ```
5. Open the project in the browser.

## Demo Credentials
Use the following dummy accounts to log in:

| Role     | Email               | Password  |
|----------|---------------------|-----------|
| Admin    | admin@gmail.com     | admin123  |
| Chef     | chef@gmail.com      | chef123   |
| Counter  | delivery@gmail.com  | delivery123 |

## Deployment
The project is deployed on **Vercel**. You can access it at:
```
https://takeaway-restaurant-selforder-workflow.vercel.app/
```

## Contributing
Feel free to contribute by creating a pull request.

![Screenshot_20250315-224802](https://github.com/user-attachments/assets/9aa9e972-68c1-4d31-a978-19a3670bce7d)
![Screenshot_20250315-224825](https://github.com/user-attachments/assets/80825b75-915e-4a3e-963b-1e6f5ce6c2e5)
![Screenshot_20250315-224838](https://github.com/user-attachments/assets/13ac59c5-37ff-4986-8223-6d8db50ed2d2)
![Screenshot_20250315-224859](https://github.com/user-attachments/assets/b3065135-23e9-4d7f-b6d3-6864f746a4fc)
![Screenshot_20250315-224914](https://github.com/user-attachments/assets/3eb1408b-350d-46b3-8e19-ce95977319c7)
![Screenshot_20250315-224956](https://github.com/user-attachments/assets/c5e92ff0-7248-4cd5-a8fb-203ea1c12299)


