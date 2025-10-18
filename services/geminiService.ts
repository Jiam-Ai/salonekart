// Import the functions you need from the SDKs you need
import {
  GoogleGenAI,
  Type,
  Chat,
  FunctionDeclaration,
} from '@google/genai';
import type { Product } from '../types';

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  // This is a fallback for the development environment where process.env might not be configured.
  // In a real production build, the key should always be present.
  console.warn('API_KEY is not set. AI features will be disabled.');
}

const ai = new GoogleGenAI({ apiKey: API_KEY! });

// --- Function Declarations for the Chatbot ---

const placeOrderFunction: FunctionDeclaration = {
  name: 'place_order',
  description:
    'Places a new order for a single product. Collect all user details before calling.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      productName: {
        type: Type.STRING,
        description: 'The exact name of the product to order.',
      },
      quantity: {
        type: Type.NUMBER,
        description: 'The number of units of the product to order.',
      },
      fullName: {
        type: Type.STRING,
        description: "The customer's full name for delivery.",
      },
      phoneNumber: {
        type: Type.STRING,
        description: "The customer's phone number for delivery.",
      },
      deliveryAddress: {
        type: Type.STRING,
        description: "The customer's full delivery address.",
      },
    },
    required: [
      'productName',
      'quantity',
      'fullName',
      'phoneNumber',
      'deliveryAddress',
    ],
  },
};

const cancelOrderFunction: FunctionDeclaration = {
  name: 'cancel_order',
  description:
    'Cancels an existing order using its Order ID. The ID must be in the format "SK-..."',
  parameters: {
    type: Type.OBJECT,
    properties: {
      orderId: {
        type: Type.STRING,
        description:
          'The ID of the order to cancel, for example "SK-1700000000000".',
      },
    },
    required: ['orderId'],
  },
};

const findProductsFunction: FunctionDeclaration = {
  name: 'find_products',
  description:
    'Finds products based on various criteria like category, sales, or best-sellers.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      category: {
        type: Type.STRING,
        description:
          'The product category to search in, e.g., "Electronics", "Clothing".',
      },
      onSale: {
        type: Type.BOOLEAN,
        description: 'Set to true to find products that are currently on sale.',
      },
      bestSelling: {
        type: Type.BOOLEAN,
        description: 'Set to true to find the best-selling products.',
      },
      limit: {
        type: Type.NUMBER,
        description: 'The maximum number of products to return. Default is 3.',
      },
    },
  },
};

// --- Exported Service Functions ---

export const generateProductDescription = async (
  keywords: string
): Promise<string> => {
  if (!API_KEY) {
    return Promise.resolve(
      'AI service is currently unavailable. Please try again later.'
    );
  }

  try {
    const prompt = `Generate a compelling and concise e-commerce product description for the Sierra Leone market. Be persuasive and highlight key benefits. The product is: "${keywords}". Do not use markdown or special formatting. Just return plain text.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        temperature: 0.7,
        maxOutputTokens: 100,
        thinkingConfig: { thinkingBudget: 50 },
      },
    });

    return response.text.trim();
  } catch (error) {
    console.error('Error generating description with Gemini:', error);
    return 'Failed to generate AI description. Please check your keywords and try again.';
  }
};

export const getRelatedProductIds = async (
  currentProduct: Product,
  allProducts: Product[]
): Promise<number[]> => {
  if (!API_KEY) return [];

  const otherProducts = allProducts
    .filter((p) => p.id !== currentProduct.id)
    .map((p) => ({
      id: p.id,
      name: p.name,
      category: p.category,
      description: p.description.substring(0, 100),
    }));

  if (otherProducts.length === 0) return [];

  const prompt = `
        You are a product recommendation engine for an e-commerce site in Sierra Leone called SaloneKart.
        Based on the current product, find the 3 most relevantly similar products from the provided list.
        Consider the product name, category, and description for relevance.
        
        Current Product:
        - Name: ${currentProduct.name}
        - Category: ${currentProduct.category}
        - Description: ${currentProduct.description}

        List of Other Products (JSON format):
        ${JSON.stringify(otherProducts, null, 2)}

        Return a JSON object with a single key "related_ids" which is an array of the top 3 most relevant product IDs. For example: {"related_ids": [12, 34, 56]}
    `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            related_ids: {
              type: Type.ARRAY,
              items: { type: Type.NUMBER },
            },
          },
        },
      },
    });

    const jsonString = response.text.trim();
    const result = JSON.parse(jsonString);
    return result.related_ids || [];
  } catch (error) {
    console.error('Error getting related products from Gemini:', error);
    return [];
  }
};

export const createChatSession = (): Chat => {
  const systemInstruction = `You are Kadi, a highly capable and friendly AI shopping assistant for SaloneKart, an e-commerce marketplace in Sierra Leone. You can now perform actions for the user.

    Your capabilities include:
    1.  **Placing Orders**: You can place an order for a customer.
    2.  **Canceling Orders**: You can cancel an existing order if the user provides the Order ID.
    3.  **Finding Products**: You can search for products by category, find items on sale, or list best-sellers.
    4.  **Answering Questions**: You can answer general questions about SaloneKart based on your knowledge base.
    
    **Workflow for Placing an Order:**
    - Step 1: Ask the user what product they want to buy.
    - Step 2: Once they specify a product, confirm it and ask for the quantity.
    - Step 3: After confirming quantity, ask for their full name, phone number, and delivery address all at once.
    - Step 4: Once you have ALL the required information (product name, quantity, full name, phone number, address), call the \`place_order\` function.
    - Step 5: After calling the function, confirm the result to the user.
    
    **Workflow for Canceling an Order:**
    - Step 1: Ask the user for their Order ID (e.g., "SK-123...").
    - Step 2: Once they provide the ID, call the \`cancel_order\` function.
    - Step 3: Report the result (success or failure) back to the user.
    
    **Workflow for Finding Products:**
    - Use the \`find_products\` function when a user asks for recommendations, deals, or best-sellers.
    - After getting the results, present the list of product names and prices to the user in a clear, readable format.
    
    **Knowledge Base for General Questions:**
    - **Payment Methods**: Cash on Delivery, Orange Money, Africell Money.
    - **Delivery**: We deliver nationwide in Sierra Leone. Users can track orders on the 'Track Your Order' page.
    - **Becoming a Seller**: Go to 'Seller Login' and 'Sign Up'. The 'Vendor Hub' has helpful resources.
    - **Return Policy**: 7-day return policy for unused items in original packaging. Contact support via the 'Help Center'.
    
    **Your Persona:**
    - Be conversational, friendly, and use Sierra Leonean greetings like "Kushe!"
    - Always be helpful and proactive. If a user says "I want to buy headphones," start the ordering process.
    - NEVER make up information. If you don't know something or can't do something, say so politely.
    - Keep your answers concise.`;

  return ai.chats.create({
    model: 'gemini-2.5-flash',
    config: {
      systemInstruction,
      temperature: 0.8,
      tools: [
        {
          functionDeclarations: [
            placeOrderFunction,
            cancelOrderFunction,
            findProductsFunction,
          ],
        },
      ],
    },
  });
};
