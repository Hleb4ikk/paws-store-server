export const openapiDocument = {
  openapi: "3.0.3",
  info: {
    title: "Paws Store API",
    version: "1.0.0",
    description:
      "Backend API for the Paws Store pet shop: JWT auth, product catalog with DB-level search/filter/sort/pagination, Redis-cached catalog, cart and promocodes.",
  },
  servers: [{ url: "/api" }],
  components: {
    securitySchemes: {
      bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" },
    },
    schemas: {
      User: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          email: { type: "string", format: "email" },
          role: { type: "string", enum: ["CUSTOMER", "ADMIN"] },
        },
      },
      Product: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          title: { type: "string" },
          description: { type: "string" },
          price: { type: "number" },
          rating: { type: "number" },
          stock_quantity: { type: "integer" },
          createdAt: { type: "string", format: "date-time" },
          images: {
            type: "array",
            items: {
              type: "object",
              properties: {
                id: { type: "string", format: "uuid" },
                url: { type: "string" },
              },
            },
          },
        },
      },
      CartItem: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          quantity: { type: "integer" },
          product: { $ref: "#/components/schemas/Product" },
        },
      },
      Error: {
        type: "object",
        properties: {
          error: {
            type: "object",
            properties: {
              code: { type: "string" },
              message: { type: "string" },
            },
          },
        },
      },
    },
  },
  paths: {
    "/auth/register": {
      post: {
        tags: ["Auth"],
        summary: "Register a new customer",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email", "password"],
                properties: {
                  email: { type: "string", format: "email" },
                  password: { type: "string", minLength: 6 },
                },
              },
            },
          },
        },
        responses: {
          "201": {
            description: "Registered",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    token: { type: "string" },
                    user: { $ref: "#/components/schemas/User" },
                  },
                },
              },
            },
          },
          "409": { description: "Email already registered" },
        },
      },
    },
    "/auth/login": {
      post: {
        tags: ["Auth"],
        summary: "Log in and receive a JWT",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email", "password"],
                properties: {
                  email: { type: "string", format: "email" },
                  password: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Logged in",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    token: { type: "string" },
                    user: { $ref: "#/components/schemas/User" },
                  },
                },
              },
            },
          },
          "401": { description: "Invalid credentials" },
        },
      },
    },
    "/products": {
      get: {
        tags: ["Products"],
        summary:
          "List products with search, filters, sorting and pagination (executed at the database level)",
        parameters: [
          { name: "page", in: "query", schema: { type: "integer", default: 1 } },
          { name: "limit", in: "query", schema: { type: "integer", default: 12 } },
          { name: "search", in: "query", schema: { type: "string" } },
          { name: "min_price", in: "query", schema: { type: "number" } },
          { name: "max_price", in: "query", schema: { type: "number" } },
          { name: "min_rating", in: "query", schema: { type: "number" } },
          { name: "sort_by", in: "query", schema: { type: "string", enum: ["price", "title"] } },
          { name: "order", in: "query", schema: { type: "string", enum: ["asc", "desc"], default: "asc" } },
        ],
        responses: {
          "200": {
            description: "Paginated product list (cached in Redis)",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    items: {
                      type: "array",
                      items: { $ref: "#/components/schemas/Product" },
                    },
                    meta: {
                      type: "object",
                      properties: {
                        total_items: { type: "integer" },
                        total_pages: { type: "integer" },
                        current_page: { type: "integer" },
                        limit: { type: "integer" },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      post: {
        tags: ["Products"],
        summary: "Create a product (admin only)",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["title", "description", "price", "images"],
                properties: {
                  title: { type: "string" },
                  description: { type: "string" },
                  price: { type: "number" },
                  rating: { type: "number" },
                  stock_quantity: { type: "integer" },
                  images: {
                    type: "array",
                    minItems: 3,
                    items: { type: "string", format: "uri" },
                  },
                },
              },
            },
          },
        },
        responses: {
          "201": { description: "Created" },
          "403": { description: "Admin role required" },
        },
      },
    },
    "/products/{id}": {
      get: {
        tags: ["Products"],
        summary: "Get a product by id",
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } },
        ],
        responses: {
          "200": { description: "Product" },
          "404": { description: "Not found" },
        },
      },
      patch: {
        tags: ["Products"],
        summary: "Update a product (admin only)",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } },
        ],
        responses: {
          "200": { description: "Updated" },
          "403": { description: "Admin role required" },
          "404": { description: "Not found" },
        },
      },
      delete: {
        tags: ["Products"],
        summary: "Delete a product (admin only, invalidates catalog cache)",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } },
        ],
        responses: {
          "204": { description: "Deleted" },
          "403": { description: "Admin role required" },
          "404": { description: "Not found" },
        },
      },
    },
    "/cart": {
      get: {
        tags: ["Cart"],
        summary: "Get current user's cart",
        security: [{ bearerAuth: [] }],
        responses: { "200": { description: "Cart with subtotal" } },
      },
    },
    "/cart/items": {
      post: {
        tags: ["Cart"],
        summary: "Add a product to the cart",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["productId"],
                properties: {
                  productId: { type: "string", format: "uuid" },
                  quantity: { type: "integer", minimum: 1, default: 1 },
                },
              },
            },
          },
        },
        responses: { "201": { description: "Updated cart" } },
      },
    },
    "/cart/items/{id}": {
      patch: {
        tags: ["Cart"],
        summary: "Change cart item quantity",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["quantity"],
                properties: { quantity: { type: "integer", minimum: 1 } },
              },
            },
          },
        },
        responses: { "200": { description: "Updated cart" } },
      },
      delete: {
        tags: ["Cart"],
        summary: "Remove an item from the cart",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } },
        ],
        responses: { "200": { description: "Updated cart" } },
      },
    },
    "/cart/apply-promo": {
      post: {
        tags: ["Cart"],
        summary: "Apply a promocode (e.g. SAVE10) and get the discounted total",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["code"],
                properties: { code: { type: "string", example: "SAVE10" } },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Totals with discount",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    code: { type: "string" },
                    discount_percentage: { type: "integer" },
                    subtotal: { type: "number" },
                    discount_amount: { type: "number" },
                    total: { type: "number" },
                  },
                },
              },
            },
          },
          "400": { description: "Invalid promocode or empty cart" },
        },
      },
    },
  },
} as const;
