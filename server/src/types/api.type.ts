/**
 * Represents a standardized structure for API responses.
 *
 * @template DataType - The type of the payload returned in the response.
 * @property {DataType} data - The actual response payload.
 * @property {string} message - A human-readable message describing the result.
 */
export type ResponseBody<DataType> = {
  data: DataType;
  message: string;
};
