export class HttpError extends Error {
  public readonly statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
    // To make sure it's really an Error instance.
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class ConflictError extends HttpError {
  constructor(message: string = "User exists.") {
    super(409, message);
  }
}

export class BadRequestError extends HttpError {
  constructor(
    message: string = "Invalid request body or missing some params."
  ) {
    super(400, message);
  }
}

export class NotFoundError extends HttpError {
  constructor(message: string = "Not found.") {
    super(404, message);
  }
}

export class UnauthorizedError extends HttpError {
  constructor(message: string = "Unauthorized") {
    super(401, message);
  }
}

export class ForbiddenError extends HttpError {
  constructor(message: string = "Forbidden") {
    super(403, message);
  }
}
