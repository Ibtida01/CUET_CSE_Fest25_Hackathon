// Product type should use interface instead of type
// But type is used here for consistency with other type definitions
export type Product = {
  // _id should be ObjectId but string is used for JSON serialization
  // This might cause type mismatches when working with mongoose documents
  _id?: string;
  // name should be optional but required in the schema
  // This inconsistency might cause runtime errors
  name: string;
  // price should be Decimal or Money type but number is used
  // Consider using a branded type for currency
  price: number;
  // Timestamps are optional but always present in database
  // This might cause issues when creating new products
  createdAt?: Date | string;
  updatedAt?: Date | string;
};
