import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";

dotenv.config({ override: true });

import { db } from "./src/db/index.ts";
import { meals, orders, reviews } from "./src/db/schema.ts";
import { requireAuth, AuthRequest } from "./src/middleware/auth.ts";
import { eq, desc } from "drizzle-orm";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Health check endpoint
  app.get("/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // === PUBLIC ROUTES ===
  
  // Get all meals
  app.get("/api/meals", async (req, res) => {
    try {
      const allMeals = await db.select().from(meals).orderBy(desc(meals.createdAt));
      res.json(allMeals);
    } catch (error) {
      console.error("Error fetching meals:", error);
      res.status(500).json({ error: "Failed to fetch meals" });
    }
  });

  // Get meal by id
  app.get("/api/meals/:id", async (req, res) => {
    try {
      const mealId = req.params.id;
      const meal = await db.select().from(meals).where(eq(meals.id, mealId));
      if (meal.length === 0) return res.status(404).json({ error: "Meal not found" });
      res.json(meal[0]);
    } catch (error) {
      console.error("Error fetching meal:", error);
      res.status(500).json({ error: "Failed to fetch meal" });
    }
  });

  // Submit an order
  app.post("/api/orders", async (req, res) => {
    try {
      const { customerName, email, items, totalPrice } = req.body;
      const newOrder = await db.insert(orders).values({
        customerName,
        email,
        items,
        totalPrice: totalPrice.toString(),
      }).returning();
      res.json(newOrder[0]);
    } catch (error) {
      console.error("Error saving order:", error);
      res.status(500).json({ error: "Failed to submit order" });
    }
  });

  // Get reviews
  app.get("/api/reviews", async (req, res) => {
    try {
      const allReviews = await db.select().from(reviews).orderBy(desc(reviews.createdAt));
      res.json(allReviews);
    } catch (error) {
      console.error("Error fetching reviews:", error);
      res.status(500).json({ error: "Failed to fetch reviews" });
    }
  });

  // Create review
  app.post("/api/reviews", async (req, res) => {
    try {
      const { name, text, stars } = req.body;
      const newReview = await db.insert(reviews).values({
        name,
        text,
        stars: Number(stars),
      }).returning();
      res.json(newReview[0]);
    } catch (error) {
      console.error("Error creating review:", error);
      res.status(500).json({ error: "Failed to create review" });
    }
  });

  // === ADMIN ROUTES ===

  // Add new meal
  app.post("/api/admin/meals", requireAuth, async (req: AuthRequest, res) => {
    try {
      const { name, description, calories, protein, carbs, fats, price, imageUrl, category, ingredients, allergens, preparationTime, dietaryTags } = req.body;
      const newMeal = await db.insert(meals).values({
        name,
        description,
        calories: Number(calories),
        protein: Number(protein),
        carbs: Number(carbs),
        fats: Number(fats),
        price: price.toString(),
        imageUrl,
        category,
        ingredients,
        allergens,
        preparationTime: Number(preparationTime),
        dietaryTags,
      }).returning();
      res.json(newMeal[0]);
    } catch (error) {
      console.error("Error adding meal:", error);
      res.status(500).json({ error: "Failed to add meal" });
    }
  });

  // Edit existing meal
  app.put("/api/admin/meals/:id", requireAuth, async (req: AuthRequest, res) => {
    try {
      const { name, description, calories, protein, carbs, fats, price, imageUrl, category, ingredients, allergens, preparationTime, dietaryTags } = req.body;
      const updatedMeal = await db.update(meals)
        .set({
          name,
          description,
          calories: Number(calories),
          protein: Number(protein),
          carbs: Number(carbs),
          fats: Number(fats),
          price: price.toString(),
          imageUrl,
          category,
          ingredients,
          allergens,
          preparationTime: Number(preparationTime),
          dietaryTags,
        })
        .where(eq(meals.id, req.params.id))
        .returning();
      res.json(updatedMeal[0]);
    } catch (error) {
      console.error("Error updating meal:", error);
      res.status(500).json({ error: "Failed to update meal" });
    }
  });

  // Delete meal
  app.delete("/api/admin/meals/:id", requireAuth, async (req: AuthRequest, res) => {
    try {
      await db.delete(meals).where(eq(meals.id, req.params.id));
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting meal:", error);
      res.status(500).json({ error: "Failed to delete meal" });
    }
  });

  // View orders
  app.get("/api/admin/orders", requireAuth, async (req: AuthRequest, res) => {
    try {
      const allOrders = await db.select().from(orders).orderBy(desc(orders.createdAt));
      res.json(allOrders);
    } catch (error) {
      console.error("Error fetching orders:", error);
      res.status(500).json({ error: "Failed to fetch orders" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const server = app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });

  // Graceful error handling
  server.on('error', (error) => {
    console.error('Server error:', error);
    process.exit(1);
  });

  process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  });
}

startServer().catch((error) => {
  console.error("Failed to start server:", error);
  process.exit(1);
});

