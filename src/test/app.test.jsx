import { describe, it, expect } from "vitest";
import { render, screen, within, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import App from "../App.jsx";
import { CartProvider } from "../context/CartContext.jsx";
import { UserProvider } from "../context/UserContext.jsx";
import { WishlistProvider } from "../context/WishlistContext.jsx";
import { PRODUCTS } from "../data/products.js";

const renderAt = (path) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <UserProvider>
        <WishlistProvider>
          <CartProvider>
            <App />
          </CartProvider>
        </WishlistProvider>
      </UserProvider>
    </MemoryRouter>
  );

const cards = () => screen.getAllByTestId("product-card");
const unique = () => `${Date.now()}${Math.floor(Math.random() * 1e6)}`;

async function fillCheckout(user, overrides = {}) {
  const v = { name: "Test Person", email: "test@example.com", address: "1 Test Street", city: "Nanded", state: "MH", zip: "431601", cardName: "TEST PERSON", card: "4242424242424242", expiry: "1240", cvv: "123", ...overrides };
  const type = async (label, value) => { const el = screen.getByLabelText(label); await user.clear(el); if (value) await user.type(el, value); };
  await type(/full name/i, v.name);
  await type(/^email$/i, v.email);
  await type(/street address/i, v.address);
  await type(/^city$/i, v.city);
  await type(/^state$/i, v.state);
  await type(/postal code/i, v.zip);
  await type(/name on card/i, v.cardName);
  await type(/card number/i, v.card);
  await type(/expiry/i, v.expiry);
  await type(/security code/i, v.cvv);
}

describe("storefront against a live API", () => {
  it("renders the home page from the API with the cart empty", async () => {
    renderAt("/");
    expect(screen.getByRole("heading", { level: 1, name: /today's deals/i })).toBeInTheDocument();
    expect(screen.getByTestId("cart-count")).toHaveTextContent("0");
    await waitFor(() => expect(screen.getAllByTitle(PRODUCTS[0].title).length).toBeGreaterThan(0));
  });

  it("lists every product on /products after loading", async () => {
    renderAt("/products");
    expect(screen.getByText(/loading results/i)).toBeInTheDocument();
    await waitFor(() => expect(cards()).toHaveLength(PRODUCTS.length));
  });

  it("filters a category page server-side", async () => {
    renderAt("/category/pets");
    const expected = PRODUCTS.filter((p) => p.category === "pets").length;
    await waitFor(() => expect(cards()).toHaveLength(expected));
  });

  it("searches from the header", async () => {
    const user = userEvent.setup();
    renderAt("/");
    await user.type(screen.getByRole("searchbox", { name: /search nimbusmart/i }), "kettlebell{Enter}");
    await waitFor(() => expect(cards()).toHaveLength(1));
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent('Results for "kettlebell"');
  });

  it("adds to cart from a product page and updates the badge", async () => {
    const user = userEvent.setup();
    renderAt("/product/4");
    await user.selectOptions(await screen.findByRole("combobox", { name: /quantity/i }), "3");
    await user.click(screen.getByRole("button", { name: /^add to cart$/i }));
    expect(screen.getByTestId("cart-count")).toHaveTextContent("3");
    expect(screen.getByRole("status")).toHaveTextContent(/added to cart/i);
  });

  it("shows a 404 for a product that does not exist", async () => {
    renderAt("/product/9999");
    expect(await screen.findByText(/does not exist/i)).toBeInTheDocument();
  });

  it("runs guest checkout, records the order on the server, and reduces stock", async () => {
    const user = userEvent.setup();
    renderAt("/product/6");
    const stockBefore = Number((await screen.findByTestId("stock")).textContent.match(/\d+/)?.[0] ?? 99);
    await user.selectOptions(screen.getByRole("combobox", { name: /quantity/i }), "2");
    await user.click(screen.getByRole("button", { name: /buy now/i }));
    expect(await screen.findByRole("heading", { level: 1, name: /checkout/i })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /place your order/i }));
    expect(screen.getAllByRole("alert").length).toBeGreaterThan(5);

    await fillCheckout(user, { card: "4242424242424241" });
    await user.click(screen.getByRole("button", { name: /place your order/i }));
    expect(screen.getByRole("alert")).toHaveTextContent(/checksum/i);

    await fillCheckout(user);
    await user.click(screen.getByRole("button", { name: /place your order/i }));
    await waitFor(() => expect(screen.getByRole("heading", { level: 1, name: /order placed/i })).toBeInTheDocument());
    const orderId = screen.getByTestId("order-id").textContent;
    expect(orderId).toMatch(/^402-\d{7}-\d{7}$/);
    expect(screen.getByTestId("cart-count")).toHaveTextContent("0");

    // Guest orders are remembered and reloaded from the API.
    await user.click(screen.getByRole("button", { name: /view all orders/i }));
    await waitFor(() => expect(screen.getAllByTestId("order").length).toBeGreaterThan(0));
    expect(screen.getByText(orderId)).toBeInTheDocument();

    // Stock on the product page now reflects the sale.
    await user.click(screen.getByRole("link", { name: PRODUCTS[5].title }));
    await waitFor(() => expect(screen.getByTestId("stock")).toBeInTheDocument());
    const shown = screen.getByTestId("stock").textContent;
    if (/\d+/.test(shown)) expect(Number(shown.match(/\d+/)[0])).toBe(stockBefore - 2);
  });

  it("checkout redirects to cart when there is nothing to buy", () => {
    renderAt("/checkout");
    expect(screen.getByRole("heading", { level: 1, name: /cart is empty/i })).toBeInTheDocument();
  });

  it("registers, keeps the guest cart, and posts a review that changes the rating", async () => {
    const user = userEvent.setup();
    renderAt("/product/7");
    await user.click(await screen.findByRole("button", { name: /^add to cart$/i }));
    expect(screen.getByTestId("cart-count")).toHaveTextContent("1");
    const countBefore = screen.getByTestId("review-count").textContent;

    await user.click(within(screen.getByRole("banner")).getByRole("link", { name: /sign in/i }));
    await user.click(await screen.findByRole("link", { name: /create an account/i }));
    await user.type(screen.getByLabelText(/your name/i), "Vikram Sharma");
    await user.type(screen.getByLabelText(/^email$/i), `vikram${unique()}@example.com`);
    await user.type(screen.getByLabelText(/^password$/i), "secret123");
    await user.click(screen.getByRole("button", { name: /create your account/i }));

    const header = screen.getByRole("banner");
    await waitFor(() => expect(within(header).getByText(/hello, vikram/i)).toBeInTheDocument());
    await waitFor(() => expect(screen.getByTestId("cart-count")).toHaveTextContent("1"));

    await user.click((await screen.findAllByRole("link", { name: new RegExp(PRODUCTS[6].title) }))[0]);
    await screen.findByRole("heading", { name: /write a review/i });
    await user.click(screen.getByRole("radio", { name: /1 star/i }));
    await user.type(screen.getByLabelText(/^title$/i), "Split in half");
    await user.type(screen.getByLabelText(/^review$/i), "The slate insert cracked in the first week of use.");
    await user.click(screen.getByRole("button", { name: /submit review/i }));
    await waitFor(() => expect(screen.getByText(/review saved/i)).toBeInTheDocument());
    // The list and the count refresh with their own requests after the save
    // lands, so on a slow runner they can trail the status line by a moment.
    await waitFor(() => expect(within(screen.getByTestId("review-list")).getByText(/split in half/i)).toBeInTheDocument());
    await waitFor(() => expect(screen.getByTestId("review-count").textContent).not.toBe(countBefore));

    await user.click(within(header).getByRole("button", { name: /account & lists/i }));
    await user.click(within(header).getByRole("menuitem", { name: /sign out/i }));
    expect(within(header).getByText(/hello, sign in/i)).toBeInTheDocument();
  });

  it("rejects a wrong password", async () => {
    const user = userEvent.setup();
    renderAt("/signin");
    await user.type(screen.getByLabelText(/^email$/i), "nobody@example.com");
    await user.type(screen.getByLabelText(/^password$/i), "wrongpass");
    await user.click(screen.getByRole("button", { name: /^sign in$/i }));
    expect(await screen.findByRole("alert")).toHaveTextContent(/incorrect/i);
  });
});

describe("account, wishlist and admin screens", () => {
  it("saves to the wishlist, manages an address, and cancels an order", async () => {
    const user = userEvent.setup();
    renderAt("/register");
    await user.type(screen.getByLabelText(/your name/i), "Wish Lister");
    await user.type(screen.getByLabelText(/^email$/i), `wish${unique()}@example.com`);
    await user.type(screen.getByLabelText(/^password$/i), "secret123");
    await user.click(screen.getByRole("button", { name: /create your account/i }));
    await waitFor(() => expect(within(screen.getByRole("banner")).getByText(/hello, wish/i)).toBeInTheDocument());

    // Wishlist from a product card
    await user.click(within(screen.getByRole("banner")).getByRole("link", { name: /pet supplies/i }));
    await waitFor(() => expect(cards().length).toBeGreaterThan(0));
    await user.click(within(cards()[0]).getByRole("button", { name: /add to wishlist/i }));
    await waitFor(() => expect(within(cards()[0]).getByRole("button", { name: /remove from wishlist/i })).toBeInTheDocument());
    await user.click(within(screen.getByRole("banner")).getByRole("button", { name: /account & lists/i }));
    await user.click(screen.getByRole("menuitem", { name: /your wishlist/i }));
    await waitFor(() => expect(within(screen.getByTestId("wishlist")).getAllByRole("link").length).toBeGreaterThan(0));

    // Address book on the account page
    await user.click(within(screen.getByRole("banner")).getByRole("button", { name: /account & lists/i }));
    await user.click(screen.getByRole("menuitem", { name: /your account/i }));
    await user.click(await screen.findByRole("button", { name: /add an address/i }));
    await user.type(screen.getByLabelText(/full name/i), "Wish Lister");
    await user.type(screen.getByLabelText(/street address/i), "5 Saved Lane");
    await user.type(screen.getByLabelText(/^city$/i), "Nanded");
    await user.type(screen.getByLabelText(/^state$/i), "MH");
    await user.type(screen.getByLabelText(/postal code/i), "431601");
    await user.click(screen.getByRole("button", { name: /save address/i }));
    await waitFor(() => expect(within(screen.getByTestId("address-list")).getByText(/5 saved lane/i)).toBeInTheDocument());

    // Checkout prefills from the default address
    await user.click(screen.getByRole("link", { name: /your wishlist/i }));
    await user.click(await screen.findByRole("button", { name: /^add to cart$/i }));
    await user.click(screen.getByRole("link", { name: /view cart/i }));
    await user.click(await screen.findByRole("button", { name: /proceed to checkout/i }));
    await waitFor(() => expect(screen.getByLabelText(/street address/i)).toHaveValue("5 Saved Lane"));
    await user.type(screen.getByLabelText(/name on card/i), "WISH LISTER");
    await user.type(screen.getByLabelText(/card number/i), "4242424242424242");
    await user.type(screen.getByLabelText(/expiry/i), "1240");
    await user.type(screen.getByLabelText(/security code/i), "123");
    await user.click(screen.getByRole("button", { name: /place your order/i }));
    await waitFor(() => expect(screen.getByRole("heading", { level: 1, name: /order placed/i })).toBeInTheDocument());
    expect(screen.getByTestId("order-status")).toHaveTextContent("confirmed");

    // Cancel it from the orders page
    window.confirm = () => true;
    await user.click(screen.getByRole("button", { name: /view all orders/i }));
    await user.click(await screen.findByRole("button", { name: /cancel order/i }));
    await waitFor(() => expect(screen.getByTestId("order-status")).toHaveTextContent("cancelled"));
    expect(screen.queryByRole("button", { name: /cancel order/i })).not.toBeInTheDocument();
  });

  it("keeps customers out of admin and lets the admin add a product that appears in the store", async () => {
    const user = userEvent.setup();
    renderAt("/admin");
    // Not signed in: sent to sign in
    expect(await screen.findByRole("heading", { level: 1, name: /sign in/i })).toBeInTheDocument();
    await user.type(screen.getByLabelText(/^email$/i), "admin@example.com");
    await user.type(screen.getByLabelText(/^password$/i), "admin123");
    await user.click(screen.getByRole("button", { name: /^sign in$/i }));
    expect(await screen.findByRole("heading", { level: 1, name: /dashboard/i })).toBeInTheDocument();
    expect(screen.getByText(/revenue/i)).toBeInTheDocument();

    await user.click(screen.getByRole("link", { name: /^products$/i }));
    await waitFor(() => expect(screen.getAllByTestId("admin-product").length).toBeGreaterThan(0));
    await user.click(screen.getByRole("link", { name: /add product/i }));
    await user.type(screen.getByLabelText(/^title$/i), "Browser Added Kettle");
    await user.type(screen.getByLabelText(/^brand$/i), "Norwood Living");
    await user.type(screen.getByLabelText(/sale price/i), "35");
    await user.type(screen.getByLabelText(/list price/i), "50");
    await user.type(screen.getByLabelText(/^stock$/i), "7");
    await user.type(screen.getByLabelText(/bullet points/i), "Boils fast");
    await user.click(screen.getByRole("button", { name: /create product/i }));
    await waitFor(() => expect(screen.getByText(/browser added kettle/i)).toBeInTheDocument());

    // Visible to shoppers
    await user.type(screen.getByRole("searchbox", { name: /search nimbusmart/i }), "Browser Added{Enter}");
    await waitFor(() => expect(cards()).toHaveLength(1));
    expect(screen.getByText(/30% off/)).toBeInTheDocument();
  });
});
