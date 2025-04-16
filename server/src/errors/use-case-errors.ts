export class UseCaseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UseCaseError";
    // To make sure it's really an Error instance.
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class ObjectNotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ObjectNotFoundError";
  }
}

export class InvalidQueryError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidQueryError";
  }
}
