import { UpdateUserDTO } from "../types/user.type";

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
 * To be used only on controllers or higher API levels of the backend.
 *
 * @typedef {Object} UpdateUserRequestBody
 * @property {UpdateUserDTO} data - Data used to update the user.
 */
export interface UpdateUserRequestBody {
  data: UpdateUserDTO;
}
