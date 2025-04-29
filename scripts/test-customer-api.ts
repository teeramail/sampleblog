// Script to test the customer API
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import dotenv from "dotenv";
import { customers } from "../src/server/db/schema";
import { eq } from "drizzle-orm";

// Load environment variables
dotenv.config();

async function testCustomerAPI() {
  console.log("Starting Customer API test...");
  
  try {
    // Create a simple connection to the database
    const sql = postgres(process.env.DATABASE_URL!, {
      ssl: true,
      max: 1,
      idle_timeout: 20,
      connect_timeout: 30, // Longer timeout for initial connection
    });

    console.log("Database connection established");
    
    // Create Drizzle instance
    const db = drizzle(sql, { schema: { customers } });
    
    // Test 1: Create a new customer
    console.log("\n--- Test 1: Create a new customer ---");
    const testCustomer = {
      name: `Test Customer ${new Date().toISOString()}`,
      email: `test${Date.now()}@example.com`,
      phone: "123-456-7890",
      thumbnailUrl: null,
      imageUrls: ["https://example.com/image1.jpg", "https://example.com/image2.jpg"],
    };
    
    console.log("Creating customer:", testCustomer);
    const insertResult = await db.insert(customers).values(testCustomer).returning();
    console.log("Insert result:", insertResult);
    
    if (insertResult.length === 0) {
      throw new Error("Failed to create customer");
    }
    
    const newCustomerId = insertResult[0].id;
    console.log(`Customer created with ID: ${newCustomerId}`);
    
    // Test 2: Get the customer by ID
    console.log("\n--- Test 2: Get customer by ID ---");
    const getResult = await db.query.customers.findFirst({
      where: eq(customers.id, newCustomerId),
    });
    console.log("Get result:", getResult);
    
    if (!getResult) {
      throw new Error("Failed to get customer");
    }
    
    // Test 3: Update the customer
    console.log("\n--- Test 3: Update customer ---");
    const updateData = {
      name: `Updated Test Customer ${new Date().toISOString()}`,
      updatedAt: new Date(), // Explicitly set updatedAt
    };
    
    console.log("Updating customer with:", updateData);
    const updateResult = await db.update(customers)
      .set(updateData)
      .where(eq(customers.id, newCustomerId))
      .returning();
    console.log("Update result:", updateResult);
    
    if (updateResult.length === 0) {
      throw new Error("Failed to update customer");
    }
    
    // Test 4: Get all customers
    console.log("\n--- Test 4: Get all customers ---");
    const allCustomers = await db.select()
      .from(customers)
      .orderBy(customers.updatedAt)
      .limit(5);
    console.log(`Found ${allCustomers.length} customers`);
    console.log("First few customers:", allCustomers.map(c => ({ id: c.id, name: c.name, email: c.email })));
    
    // Test 5: Delete the test customer
    console.log("\n--- Test 5: Delete customer ---");
    const deleteResult = await db.delete(customers)
      .where(eq(customers.id, newCustomerId))
      .returning();
    console.log("Delete result:", deleteResult);
    
    if (deleteResult.length === 0) {
      throw new Error("Failed to delete customer");
    }
    
    console.log(`Customer with ID ${newCustomerId} deleted successfully`);
    
    // Close the connection
    await sql.end();
    console.log("\nDatabase connection closed.");
    console.log("\n✅ All tests passed successfully!");
  } catch (error) {
    console.error("\n❌ Test failed:", error);
  }
}

// Run the function
testCustomerAPI().catch(console.error);
