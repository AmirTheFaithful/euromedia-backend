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

/**
 * Request body for updating a user.
 * Contains optional nested groups for personal info, authentication, and location.
 *
 * @typedef {Object} UpdateUserRequestBody
 * @property {Object} [meta] - User personal metadata.
 * @property {string} [meta.firstname] - User's first name.
 * @property {string} [meta.lastname] - User's last name.
 * @property {Object} [auth] - User authentication data.
 * @property {string} [auth.password] - User's password.
 * @property {Object} [location] - User location data.
 * @property {string} [location.city] - City of the user.
 * @property {string} [location.country] - Country of the user.
 */
export interface UpdateUserRequestBody {
  meta?: {
    firstname?: string;
    lastname?: string;
  };
  auth?: {
    password?: string;
  };
  location?: {
    city?: string;
    country?: string;
  };
}
