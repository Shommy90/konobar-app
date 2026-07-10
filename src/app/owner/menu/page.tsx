import { redirect } from "next/navigation";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Container from "@mui/material/Container";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";
import ImageOutlinedIcon from "@mui/icons-material/ImageOutlined";
import { getCurrentProfile } from "@/lib/auth/getCurrentProfile";
import { getOwnerCategories, getOwnerProducts } from "@/app/owner/data";
import { CategoryActiveToggleButton } from "@/app/owner/menu/CategoryActiveToggleButton";
import { CreateCategoryDialog } from "@/app/owner/menu/CreateCategoryDialog";
import { CreateProductDialog } from "@/app/owner/menu/CreateProductDialog";
import { DeleteProductButton } from "@/app/owner/menu/DeleteProductButton";
import { EditCategoryDialog } from "@/app/owner/menu/EditCategoryDialog";
import { EditProductDialog } from "@/app/owner/menu/EditProductDialog";
import { ProductAvailableToggleButton } from "@/app/owner/menu/ProductAvailableToggleButton";
import { getProductImageUrl } from "@/lib/productImage";
import type { MenuProduct } from "@/types/database";

function ProductsTable({
  restaurantId,
  products,
  categoryOptions,
}: {
  restaurantId: string;
  products: MenuProduct[];
  categoryOptions: { id: string; name: string }[];
}) {
  if (products.length === 0) {
    return (
      <Typography color="text.secondary" sx={{ px: 2, py: 1.5 }}>
        No products in this category yet.
      </Typography>
    );
  }

  return (
    <TableContainer>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell />
            <TableCell>Name</TableCell>
            <TableCell>Price</TableCell>
            <TableCell>Available</TableCell>
            <TableCell>Popular</TableCell>
            <TableCell align="right">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {products.map((product) => {
            const imageUrl = getProductImageUrl(product.image_path);
            return (
              <TableRow key={product.id}>
                <TableCell sx={{ width: 56 }}>
                  <Box
                    sx={{
                      width: 40,
                      height: 40,
                      borderRadius: 1,
                      overflow: "hidden",
                      bgcolor: "action.hover",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={imageUrl}
                        alt={product.name}
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      />
                    ) : (
                      <ImageOutlinedIcon color="disabled" fontSize="small" />
                    )}
                  </Box>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">{product.name}</Typography>
                  {product.description && (
                    <Typography variant="caption" color="text.secondary">
                      {product.description}
                    </Typography>
                  )}
                </TableCell>
                <TableCell>{product.price.toFixed(2)}</TableCell>
                <TableCell>
                  <Chip
                    size="small"
                    label={product.is_available ? "Available" : "Unavailable"}
                    color={product.is_available ? "success" : "default"}
                  />
                </TableCell>
                <TableCell>
                  {product.is_popular ? <Chip size="small" label="Popular" /> : "—"}
                </TableCell>
                <TableCell align="right">
                  <Stack direction="row" spacing={1} sx={{ justifyContent: "flex-end" }}>
                    <EditProductDialog
                      restaurantId={restaurantId}
                      categories={categoryOptions}
                      initial={{
                        productId: product.id,
                        categoryId: product.category_id ?? "",
                        name: product.name,
                        description: product.description ?? "",
                        price: String(product.price),
                        imagePath: product.image_path,
                        isPopular: product.is_popular,
                        sortOrder: String(product.sort_order),
                      }}
                    />
                    <ProductAvailableToggleButton
                      productId={product.id}
                      isAvailable={product.is_available}
                    />
                    <DeleteProductButton productId={product.id} productName={product.name} />
                  </Stack>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

export default async function OwnerMenuPage() {
  const current = await getCurrentProfile();

  if (!current || current.profile.role !== "OWNER" || !current.profile.restaurant_id) {
    redirect("/login");
  }

  const restaurantId = current.profile.restaurant_id;
  const [categories, products] = await Promise.all([
    getOwnerCategories(restaurantId),
    getOwnerProducts(restaurantId),
  ]);

  const categoryOptions = categories.map((category) => ({
    id: category.id,
    name: category.name,
  }));

  const uncategorized = products.filter((product) => !product.category_id);

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Typography variant="h4" component="h1">
          Menu
        </Typography>
        <Stack direction="row" spacing={1}>
          <CreateProductDialog restaurantId={restaurantId} categories={categoryOptions} />
          <CreateCategoryDialog />
        </Stack>
      </Stack>

      {categories.length === 0 ? (
        <Typography color="text.secondary">
          No categories yet. Create your first category to start adding products.
        </Typography>
      ) : (
        <Stack spacing={3}>
          {categories.map((category) => (
            <Paper key={category.id} variant="outlined">
              <Box sx={{ p: 2 }}>
                <Stack
                  direction="row"
                  sx={{ justifyContent: "space-between", alignItems: "center" }}
                >
                  <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                    <Typography variant="h6">{category.name}</Typography>
                    <Chip
                      size="small"
                      label={category.is_active ? "Active" : "Inactive"}
                      color={category.is_active ? "success" : "default"}
                    />
                  </Stack>
                  <Stack direction="row" spacing={1}>
                    <EditCategoryDialog
                      initial={{
                        categoryId: category.id,
                        name: category.name,
                        description: category.description ?? "",
                        sortOrder: String(category.sort_order),
                      }}
                    />
                    <CategoryActiveToggleButton
                      categoryId={category.id}
                      isActive={category.is_active}
                    />
                  </Stack>
                </Stack>
                {category.description && (
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    {category.description}
                  </Typography>
                )}
              </Box>
              <ProductsTable
                restaurantId={restaurantId}
                products={products.filter((product) => product.category_id === category.id)}
                categoryOptions={categoryOptions}
              />
            </Paper>
          ))}

          {uncategorized.length > 0 && (
            <Paper variant="outlined">
              <Box sx={{ p: 2 }}>
                <Typography variant="h6">Uncategorized</Typography>
              </Box>
              <ProductsTable
                restaurantId={restaurantId}
                products={uncategorized}
                categoryOptions={categoryOptions}
              />
            </Paper>
          )}
        </Stack>
      )}
    </Container>
  );
}
