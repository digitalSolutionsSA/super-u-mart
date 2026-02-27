export const getProducts = () => {
  const data = localStorage.getItem("admin_products");
  return data ? JSON.parse(data) : [];
};

export const saveProducts = (products: any[]) => {
  localStorage.setItem("admin_products", JSON.stringify(products));
};