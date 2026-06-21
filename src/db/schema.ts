import { relations } from 'drizzle-orm';
import { pgTable, text, timestamp, integer, numeric, jsonb, uuid } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  uid: text('uid').notNull().unique(), // Firebase Auth UID
  email: text('email').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const meals = pgTable('meals', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  description: text('description').notNull(),
  calories: integer('calories').notNull(),
  protein: integer('protein').notNull(),
  carbs: integer('carbs').notNull(),
  fats: integer('fats').notNull(),
  price: numeric('price').notNull(),
  imageUrl: text('image_url').notNull(),
  category: text('category'),
  ingredients: jsonb('ingredients'),
  allergens: jsonb('allergens'),
  preparationTime: integer('preparation_time'),
  dietaryTags: jsonb('dietary_tags'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const orders = pgTable('orders', {
  id: uuid('id').defaultRandom().primaryKey(),
  customerName: text('customer_name').notNull(),
  email: text('email').notNull(),
  items: jsonb('items').notNull(), // Stores array of { mealId, quantity, price }
  totalPrice: numeric('total_price').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const reviews = pgTable('reviews', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  text: text('text').notNull(),
  stars: integer('stars').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});
