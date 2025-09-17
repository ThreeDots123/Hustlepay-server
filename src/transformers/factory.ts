import { InternalServerErrorException } from "@nestjs/common";
import { ClassConstructor, plainToInstance } from "class-transformer";
import { validateSync, ValidationError } from "class-validator";

function transformerFactory<T, U extends ClassConstructor<any>>(
  data: T,
  dto: U,
) {
  //** Convert plain object to DTO instance for validation
  const dtoInstance = plainToInstance(dto, data, {
    excludeExtraneousValues: true,
  });

  //* Validate the DTO instance without throwing errors
  const errors: ValidationError[] = validateSync(dtoInstance, {
    skipMissingProperties: false,
  });

  //* Check if there are any validation errors for required fields
  const missingRequiredFields = errors.filter((error) => {
    //* Check if the error has any "isNotEmpty" or other validation constraints
    return error.constraints && error.constraints.isNotEmpty;
  });

  // If there are missing required fields, throw an exception
  if (missingRequiredFields.length > 0) {
    const errorMessages = missingRequiredFields.map(
      (err) => `${err.property} is required and missing`,
    );
    throw new InternalServerErrorException(
      `Transformer Validation failed: ${errorMessages.join(", ")}`,
    );
  }

  //* Extract the list of valid properties from the DTO class
  const validProperties = Object.keys(dtoInstance).filter((key) => {
    return data[key] !== undefined; // Only include properties that exist in the input object
  });

  //* Remove all non-valid properties from the input object
  const transformedObject: Partial<T> = {};
  validProperties.forEach((prop) => {
    if (data[prop] !== undefined) {
      transformedObject[prop] = dtoInstance[prop];
    }
  });

  return transformedObject;
}

export default transformerFactory;
