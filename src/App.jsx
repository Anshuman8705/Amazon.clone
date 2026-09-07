import { Routes, Route } from "react-router-dom";
import Layout from "./components/Layout.jsx";
import HomePage from "./pages/HomePage.jsx";
import ListingPage from "./pages/ListingPage.jsx";
import ProductPage from "./pages/ProductPage.jsx";
import CartPage from "./pages/CartPage.jsx";
import CheckoutPage from "./pages/CheckoutPage.jsx";
import OrderConfirmationPage from "./pages/OrderConfirmationPage.jsx";
import OrdersPage from "./pages/OrdersPage.jsx";
import SignInPage from "./pages/SignInPage.jsx";
import NotFoundPage from "./pages/NotFoundPage.jsx";
import WishlistPage from "./pages/WishlistPage.jsx";
import AccountPage from "./pages/AccountPage.jsx";
import AdminLayout from "./pages/admin/AdminLayout.jsx";
import AdminDashboard from "./pages/admin/AdminDashboard.jsx";
import AdminOrders from "./pages/admin/AdminOrders.jsx";
import AdminCustomers from "./pages/admin/AdminCustomers.jsx";
import { AdminProductList, AdminProductForm } from "./pages/admin/AdminProducts.jsx";

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="products" element={<ListingPage />} />
        <Route path="category/:slug" element={<ListingPage />} />
        <Route path="deals" element={<ListingPage />} />
        <Route path="product/:id" element={<ProductPage />} />
        <Route path="cart" element={<CartPage />} />
        <Route path="checkout" element={<CheckoutPage />} />
        <Route path="order/:id" element={<OrderConfirmationPage />} />
        <Route path="orders" element={<OrdersPage />} />
        <Route path="signin" element={<SignInPage />} />
        <Route path="register" element={<SignInPage mode="register" />} />
        <Route path="wishlist" element={<WishlistPage />} />
        <Route path="account" element={<AccountPage />} />
        <Route path="admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="products" element={<AdminProductList />} />
          <Route path="products/:id" element={<AdminProductForm />} />
          <Route path="orders" element={<AdminOrders />} />
          <Route path="customers" element={<AdminCustomers />} />
        </Route>
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
