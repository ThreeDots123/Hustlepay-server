import { IsString, IsOptional, IsArray, IsUrl } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";
import { Type, Transform } from "class-transformer";

export class SubmitMilestoneDto {
  @ApiProperty({
    description: "Submission description or notes (optional)",
    example: "Completed all design mockups as requested. Please review.",
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description:
      "Array of links related to the submission (optional). Can be sent as JSON string or array.",
    example: ["https://example.com/project", "https://github.com/repo"],
    type: [String],
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => {
    // Handle both JSON string and array formats
    if (typeof value === "string") {
      try {
        return JSON.parse(value);
      } catch {
        // If not valid JSON, treat as single link in array
        return [value];
      }
    }
    return Array.isArray(value) ? value : [value];
  })
  @IsArray()
  @IsUrl({}, { each: true })
  links?: string[];

  // Note: Files are handled via multipart/form-data and are not part of the DTO
  // They are processed separately in the controller using @UploadedFiles()
}
