import { db } from './index.ts';
import { meals, reviews } from './schema.ts';
import { sql } from 'drizzle-orm';

const mockReviews = [
  {
    name: "John D.",
    text: "The meals are absolutely fantastic! The high protein options helped me hit my macros perfectly.",
    stars: 5,
  },
  {
    name: "Sarah M.",
    text: "Very convenient and tasty. The delivery was slightly late but the food makes up for it.",
    stars: 4,
  },
  {
    name: "Mike T.",
    text: "Best meal prep service I've tried. The Grilled Chicken Quinoa is my favorite.",
    stars: 5,
  }
];

const mockMeals = [

  {
    name: "Grilled Chicken Quinoa Power Bowl",
    category: "High Protein Meals",
    description: "Tender grilled chicken served over fluffy quinoa with fresh vegetables and a light lemon dressing.",
    calories: 520,
    protein: 45,
    carbs: 40,
    fats: 18,
    price: "9.90",
    imageUrl: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=800",
    ingredients: ["chicken breast", "quinoa", "spinach", "cherry tomatoes", "olive oil", "lemon juice"],
    allergens: [],
    preparationTime: 3,
    dietaryTags: ["high-protein", "balanced", "fitness"]
  },
  {
    name: "Herb-Crusted Salmon with Asparagus",
    category: "High Protein Meals",
    description: "Premium Atlantic salmon baked with herbs, served alongside roasted asparagus and wild rice.",
    calories: 580,
    protein: 42,
    carbs: 35,
    fats: 28,
    price: "13.50",
    imageUrl: "https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&q=80&w=800",
    ingredients: ["salmon fillet", "asparagus", "wild rice", "dill", "olive oil", "garlic"],
    allergens: ["fish"],
    preparationTime: 3,
    dietaryTags: ["high-protein", "omega-3", "pescatarian"]
  },
  {
    name: "Lean Beef Teriyaki with Broccoli",
    category: "High Protein Meals",
    description: "Thinly sliced lean grass-fed beef in a light teriyaki glaze, paired with steamed broccoli and brown rice.",
    calories: 610,
    protein: 48,
    carbs: 55,
    fats: 20,
    price: "12.90",
    imageUrl: "https://images.unsplash.com/photo-1529042410759-befb1204b468?auto=format&fit=crop&q=80&w=800",
    ingredients: ["flank steak", "broccoli", "brown rice", "soy sauce", "ginger", "sesame seeds"],
    allergens: ["soy", "sesame"],
    preparationTime: 3,
    dietaryTags: ["high-protein", "muscle-building"]
  },
  {
    name: "Zucchini Noodle Turkey Meatballs",
    category: "Low Calorie Meals",
    description: "Light and fresh zucchini noodles topped with savory turkey meatballs and an aromatic marinara sauce.",
    calories: 320,
    protein: 36,
    carbs: 18,
    fats: 12,
    price: "10.50",
    imageUrl: "https://images.unsplash.com/photo-1564834724105-918b73d1b9e0?auto=format&fit=crop&q=80&w=800",
    ingredients: ["zucchini", "ground turkey", "crushed tomatoes", "garlic", "oregano", "onion"],
    allergens: [],
    preparationTime: 2,
    dietaryTags: ["low-calorie", "low-carb", "high-protein"]
  },
  {
    name: "Citrus Shrimp Salad Bowl",
    category: "Low Calorie Meals",
    description: "Grilled shrimp on a bed of mixed greens with grapefruit segments, avocado, and a citrus vinaigrette.",
    calories: 280,
    protein: 26,
    carbs: 15,
    fats: 14,
    price: "11.90",
    imageUrl: "https://images.unsplash.com/photo-1551248429-40975aa4de74?auto=format&fit=crop&q=80&w=800",
    ingredients: ["shrimp", "mixed greens", "grapefruit", "avocado", "orange juice", "olive oil"],
    allergens: ["shellfish"],
    preparationTime: 0,
    dietaryTags: ["low-calorie", "keto-friendly", "pescatarian"]
  },
  {
    name: "Cauliflower Fried Rice with Tofu",
    category: "Low Calorie Meals",
    description: "A low-carb twist on a classic, featuring riced cauliflower, diced vegetables, and scrambled egg whites.",
    calories: 250,
    protein: 18,
    carbs: 24,
    fats: 10,
    price: "8.50",
    imageUrl: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&q=80&w=800",
    ingredients: ["cauliflower", "tofu", "egg whites", "peas", "carrots", "low sodium soy sauce"],
    allergens: ["soy", "eggs"],
    preparationTime: 2,
    dietaryTags: ["low-calorie", "vegetarian", "low-carb"]
  },
  {
    name: "Sweet Potato & Black Bean Bowl",
    category: "Balanced Nutrition Meals",
    description: "A comforting mix of roasted sweet potatoes, spiced black beans, corn, and a mild enchilada sauce over rice.",
    calories: 480,
    protein: 16,
    carbs: 75,
    fats: 12,
    price: "9.50",
    imageUrl: "https://images.unsplash.com/photo-1543339308-43e59d6b73a6?auto=format&fit=crop&q=80&w=800",
    ingredients: ["sweet potatoes", "black beans", "corn", "brown rice", "enchilada sauce", "cilantro"],
    allergens: [],
    preparationTime: 3,
    dietaryTags: ["balanced", "vegan", "high-fiber"]
  },
  {
    name: "Mediterranean Chicken & Couscous",
    category: "Balanced Nutrition Meals",
    description: "Tender lemon-herb chicken with pearl couscous, cucumber, kalamata olives, and a touch of feta cheese.",
    calories: 510,
    protein: 40,
    carbs: 48,
    fats: 16,
    price: "10.90",
    imageUrl: "https://images.unsplash.com/photo-1598514982205-f36b96d1e8d4?auto=format&fit=crop&q=80&w=800",
    ingredients: ["chicken breast", "pearl couscous", "cucumber", "olives", "feta cheese", "lemon"],
    allergens: ["dairy", "gluten"],
    preparationTime: 2,
    dietaryTags: ["balanced", "mediterranean"]
  },
  {
    name: "Classic Turkey Chili",
    category: "Balanced Nutrition Meals",
    description: "A hearty, slow-cooked turkey chili packed with kidney beans, bell peppers, and tomatoes. Rich in fiber.",
    calories: 420,
    protein: 35,
    carbs: 45,
    fats: 12,
    price: "8.90",
    imageUrl: "https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&q=80&w=800",
    ingredients: ["ground turkey", "kidney beans", "diced tomatoes", "bell peppers", "onions", "chili powder"],
    allergens: [],
    preparationTime: 3,
    dietaryTags: ["balanced", "high-protein", "high-fiber"]
  },
  {
    name: "Roasted Butternut & Lentil Curry",
    category: "Vegetarian Meals",
    description: "A warming, fragrant coconut curry loaded with red lentils, roasted butternut squash, and fresh spinach.",
    calories: 450,
    protein: 18,
    carbs: 62,
    fats: 16,
    price: "9.90",
    imageUrl: "https://images.unsplash.com/photo-1565557623262-b51c2513a641?auto=format&fit=crop&q=80&w=800",
    ingredients: ["red lentils", "butternut squash", "spinach", "coconut milk", "curry spices", "basmati rice"],
    allergens: ["coconut"],
    preparationTime: 3,
    dietaryTags: ["vegetarian", "vegan", "dairy-free"]
  },
  {
    name: "Mushroom & Snap Pea Stir-fry",
    category: "Vegetarian Meals",
    description: "A crisp, savory stir-fry featuring portobello mushrooms, sugar snap peas, and bell peppers over soba noodles.",
    calories: 390,
    protein: 14,
    carbs: 65,
    fats: 10,
    price: "9.50",
    imageUrl: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=800",
    ingredients: ["portobello mushrooms", "snap peas", "red bell pepper", "soba noodles", "sesame oil", "ginger"],
    allergens: ["gluten", "soy", "sesame"],
    preparationTime: 2,
    dietaryTags: ["vegetarian", "vegan"]
  },
  {
    name: "Caprese Quinoa Salad",
    category: "Vegetarian Meals",
    description: "A fresh Italian-inspired bowl with cherry tomatoes, fresh mozzarella pearls, basil, and a balsamic glaze over quinoa.",
    calories: 410,
    protein: 16,
    carbs: 42,
    fats: 20,
    price: "9.20",
    imageUrl: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&q=80&w=800",
    ingredients: ["quinoa", "cherry tomatoes", "mozzarella pearls", "fresh basil", "balsamic glaze", "olive oil"],
    allergens: ["dairy"],
    preparationTime: 0,
    dietaryTags: ["vegetarian", "gluten-free"]
  }
];

async function seed() {
  console.log("Emptying tables...");
  await db.delete(meals);
  await db.delete(reviews);
  
  console.log(`Inserting ${mockMeals.length} meals...`);
  await db.insert(meals).values(mockMeals);
  
  console.log(`Inserting ${mockReviews.length} reviews...`);
  await db.insert(reviews).values(mockReviews);
  
  console.log("Seeding complete!");
  process.exit(0);
}

seed().catch(e => {
  console.error("Seeding failed:");
  console.error(e);
  process.exit(1);
});
